import os
import sys
import time
import traceback

import json
import logging
import threading
import itertools
import base64
import requests
import io
import concurrent.futures
from flask import Flask, request, jsonify, render_template
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload size

# ProxyFix: Render's load balancer forwards X-Forwarded-For, X-Forwarded-Proto headers.
# Without this, Flask misidentifies the client IP/scheme behind the proxy.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CALIBRATION_DIR = os.path.join(BASE_DIR, 'data', 'calibration')
CALIBRATION_MAP_PATH = os.path.join(BASE_DIR, 'calibration_map.json')
HISTORY_DIR = os.path.join(BASE_DIR, 'data', 'history')
HISTORY_MAP_PATH = os.path.join(BASE_DIR, 'data', 'history_map.json')

# Create necessary directories
os.makedirs(CALIBRATION_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

# Load environment variables (.env.local in parent folder first, then local .env)
parent_dir = os.path.dirname(BASE_DIR)
env_local_path = os.path.join(parent_dir, '.env.local')

if os.path.exists(env_local_path):
    logger.info(f"Found .env.local in parent directory: {env_local_path}. Loading environment...")
    load_dotenv(env_local_path)
else:
    load_dotenv()

# --- 1. API KEY ROTATION SETUP ---
# Three-key strategy pool: cycles through all three keys in round-robin order
_raw_keys = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3")
]
if os.getenv("GEMINI_API_KEYS"):
    _raw_keys.extend([k.strip() for k in os.getenv("GEMINI_API_KEYS").split(",")])

_valid_keys = [k.strip() for k in _raw_keys if k and k.strip()]
if not _valid_keys:
    # If no numbered keys exist, try fallback to a generic GEMINI_API_KEY
    fallback = os.getenv("GEMINI_API_KEY")
    if fallback and fallback.strip():
        _valid_keys = [fallback.strip()]
    else:
        logger.warning("No valid Gemini API keys found in environment during initialization.")
        _valid_keys = [""] # Will fail gracefully later

_api_rotator = itertools.cycle(_valid_keys)

def get_next_api_key():
    """Returns the next API key from the pre-built itertools.cycle pool."""
    key = next(_api_rotator)
    if not key:
        raise ValueError("No valid Gemini API keys found in the environment pool.")
    return key

client_lock = threading.Lock()

# --- SUPABASE CONFIGURATION ---
def get_supabase_client():
    """Dynamically initializes and returns a Supabase client to avoid module-level global variables."""
    url = (
        os.environ.get("SUPABASE_URL") or 
        os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    )
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or
        os.environ.get("SUPABASE_KEY") or
        os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"CRITICAL ERROR [Supabase Initialization]: {str(e)}")
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

# Path for learned phonetic rules
PHONETIC_RULES_PATH = os.path.join(BASE_DIR, 'data', 'phonetic_rules.txt')

def save_file_nonblocking(file_bytes, file_path):
    """Saves file bytes to disk in a background thread to avoid blocking the main execution thread."""
    def run():
        try:
            with open(file_path, 'wb') as f:
                f.write(file_bytes)
            logger.info(f"Saved file asynchronously: {file_path}")
        except Exception as e:
            print(f"CRITICAL ERROR [File Async Save]: {str(e)}")
    threading.Thread(target=run, daemon=True).start()

# --- 2. HARDCODED VOICE LINGUISTIC PROFILE & CALIBRATION SENTENCES ---
VOICE_LINGUISTIC_PROFILE = """
VOICE LINGUISTIC PROFILE & BEHAVIORAL CONTEXT (Cleft Palate Speech):
This assistant serves a user with cleft palate speech. Due to structural/nasal air management challenges, their raw speech input presents predictable phonetic patterns and distortions:
1. Hypernasality & Nasal Emission: Vowels are often nasalized. Plosives (p, b, t, d, k, g) are replaced by nasal consonants (m, n, ng) or glottal stops.
2. Weak/Omitted Consonants: Word-final consonants are frequently dropped. Fricatives (s, z, sh, ch, j) are often replaced by a breathy 'h', pharyngeal fricatives, or omitted entirely.
3. Common phonetic substitutions:
   - "family" may sound like "am-ily", "em-ily", or "ham-ily".
   - "shiny" may sound like "hi-ny" or "i-ny".
   - "fox" may sound like "fo-" or "hock" or "soff".
   - "meetings" may sound like "mee-ings" or "mee-tings" with nasal tones.
   - "tasks" may sound like "tah-s" or "tah-ks".

KEY STRUCTURAL PHONETIC PATTERN OBSERVATIONS:
These global patterns have been calibrated from multiple recorded audio sessions:
A. The "Th" to "G"/"Ch" Shift: Front dental sounds like "The" or "Through" consistently move toward back-palatal or velar regions, producing sounds like "ga-" or "choo".
B. The "B/Br" Nasal Shift: Initial Br or B sounds soften into nasal/vowel combinations (Bro → Me-aw, Bruh → Me-ah, Birch → Mish, Bend → Men, Background → Me-background).
C. Initial S-Cluster Prefix: Words starting with S + hard consonant trigger a soft initial vowel placeholder (Strikes → Is-arts, Stain → Is-tain, Split → Is-plit, Stars → Es-tas, Sky → Es-kai).
D. Unvoiced Plosive / Dropped Final Consonant: Final trailing hard d, g, x sounds transition to unvoiced t or drop completely (Good → Oot, Dog → Fob, Fox → Soff, Wind → Wine, Jumped → Jam).
E. Sibilant / Friction Reduction: Words starting with an "S" blend use an introductory air vowel (Stars → Es-tas, Sky → Es-kai, Start → Es-tat).
F. Compounding Suffix Rule: Words ending in -thing or -down pick up extra placeholder syllables (Everything → En-thing, Locked down → Lock-rah-own).

PERMANENT TEXT CALIBRATION BENCHMARKS:
Below are the exact phrases the user has recorded for calibration, serving as ground-truth examples of their speech intent:
- "Open the computer and check my tasks for today."
- "Copy this text directly to the system clipboard."
- "Please send a quick message to my family."
- "The quick brown fox jumps over the lazy dog."
- "Please bake a fresh batch of tall pecan pies."
- "Keep the blue shiny keys inside the grey desktop drawer."
- "Start the local backend server on my laptop right now."
- "Many morning meetings make for a very long Monday."
- "Running an online business requires great focus and time."
- "The total amount is exactly one hundred and twenty-five."
- "THE house sat the only one in the entire valley on the crest of a low hill. From this height one could see the river and the field of ripe corn dotted with the flowers that always promised a good harvest. The only thing the earth needed was a downpour or at least a shower Throughout the morning Lencho who knew his fields intimately had done nothing else but see the sky towards the north-east."
- "With a satisfied expression he regarded the field of ripe corn with its flowers, draped in a curtain of rain. But suddenly a strong wind began to blow and along with the rain very large hailstones began to fall. These truly did resemble new silver coins. The boys, exposing themselves to the rain, ran out to collect the frozen pearls."
- "The prompt summer breeze carries a soft whisper through the trees. Every day, a quick brown fox jumps over the lazy dog, while the bright silver stars start to shine across the quiet sky."
- "Bro, see, the app is finally live on Render but it failed again with a 500 error. Mann, I thought we fixed this code. Let me check the logs real quick. Bruh, gotcha, it's just a missing database variable. Now it's working perfectly and translating everything. All good."
- "Bro, I have successfully resolved the issue! The code compiles clean, no errors this time. Mann, look at that, it is working so fast now. All good, everything is locked down. Tell me what you think of this setup, bruh."
- "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it."
- "The birch canoe slid on the smooth planks. Glue the sheet to the dark blue background. A rod is used to catch pink salmon. The ink stain dried on the finished page. Split the log with a quick, sharp blow. The young kid jumped the rusty gate. These thistles bend in a high wind."

CONVERSATIONAL SPEECH TOKEN MAPPINGS (Calibrated from live audio):
These are exact phonetic-to-intent token mappings discovered from real voice recordings:
  "Me-aw, see" → "Bro, see"
  "Me-ah, gotcha" → "Bruh, gotcha"
  "Me-aw, I have" → "Bro, I have"
  "ma it fail again" → "but it failed again"
  "fix-tah-tah-oo code" → "fixed this code"
  "lots on real quick" → "logs real quick"
  "en ant-skating en-thing" → "and translating everything"
  "All oot" → "All good"
  "successfully resolve-tah issue" → "successfully resolved the issue"
  "no eren this time" → "no errors this time"
  "Men, look look at that" → "Mann, look at that"
  "working so fast-nah" → "working so fast now"
  "everything is lock-rah-own" → "everything is locked down"
  "setup, me-ah" → "setup, bruh"

READING PASSAGE TOKEN MAPPINGS (Calibrated from live audio):
  "ga-ong" → "The prompt"
  "sama-nee" → "summer breeze"
  "crees" → "carries"
  "es-hoff" → "a soft"
  "wis-ter" → "whisper"
  "choo" → "through"
  "ga-ring" → "the trees"
  "ghey" → "day"
  "a-wick" → "a quick"
  "me-laung" → "brown"
  "soff" → "fox"
  "fu-gam" → "jumps"
  "o-wa" → "over"
  "ga-le-re" → "the lazy"
  "fob" → "dog"
  "fwa-la" → "while"
  "ga-meh" → "the bright"
  "shil-wa" → "silver"
  "es-tas" → "stars"
  "es-tat" → "start"
  "oo-shai" → "to shine"
  "a-ga-za" → "across"
  "waik" → "quiet"
  "es-kai" → "sky"
  "is-arts for raindrops" → "strikes raindrops"
  "act as a pis-m" → "act as a prism"
  "ka rainbow is a-givision" → "The rainbow is a division"
  "into many mi-fo colors" → "into many beautiful colors"
  "high e-bove" → "high above"
  "ap-per-en-ly beyond" → "apparently beyond"
  "boiling op-pot of gold" → "boiling pot of gold"
  "no one eh-ver finds it" → "no one ever finds it"
  "The mish canoe" → "The birch canoe"
  "sulit over the smooth planks" → "slid on the smooth planks"
  "dark blue me-background" → "dark blue background"
  "A rot is use to catch" → "A rod is used to catch"
  "pink sar-men" → "pink salmon"
  "The ink is-tain dried" → "The ink stain dried"
  "finish peace" → "finished page"
  "Is-plit the log" → "Split the log"
  "quick sharp lo" → "quick, sharp blow"
  "The young-it jam" → "The young kid jumped"
  "the rusty-get" → "the rusty gate"
  "this his-tels men" → "These thistles bend"
  "in the high wine" → "in a high wind"
"""

def get_mime_type(filename):
    """Map common audio extensions to standard MIME types to prevent detection issues on Windows."""
    ext = os.path.splitext(filename)[1].lower()
    if ext == '.wav':
        return 'audio/wav'
    elif ext in ('.mpeg', '.mp3'):
        return 'audio/mpeg'
    elif ext == '.webm':
        return 'audio/webm'
    elif ext == '.ogg':
        return 'audio/ogg'
    elif ext == '.mp4':
        return 'audio/mp4'
    elif ext == '.m4a':
        return 'audio/m4a'
    elif ext == '.flac':
        return 'audio/flac'
    elif ext == '.aac':
        return 'audio/aac'
    return 'application/octet-stream'

# Load calibration map structure
def load_calibration_map():
    if not os.path.exists(CALIBRATION_MAP_PATH):
        logger.error(f"calibration_map.json not found at {CALIBRATION_MAP_PATH}")
        return {}
    try:
        with open(CALIBRATION_MAP_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"CRITICAL ERROR [Load Calibration Map]: {str(e)}")
        logger.error(f"Error reading calibration_map.json: {e}")
        return {}

calibration_map = load_calibration_map()

def check_calibration_files_present():
    """Helper to check which calibration files exist on disk for frontend indicators."""
    present_count = 0
    total_count = len(calibration_map)
    for filename in calibration_map.keys():
        file_path = os.path.join(CALIBRATION_DIR, filename)
        if os.path.exists(file_path):
            present_count += 1
    return present_count, total_count

# --- 4. PERSISTENT HISTORY SYNC BACKEND ---
def fetch_history_from_supabase():
    """Fetch persistent speech history from Supabase table 'speech_history'.
    Uses a thread-based timeout to prevent hanging when Supabase is slow/unreachable."""
    supabase_client = get_supabase_client()
    if not supabase_client:
        return None
    
    def _fetch():
        response = supabase_client.table('speech_history') \
            .select("id,raw_transcript,corrected_text") \
            .order("created_at", desc=False) \
            .limit(50) \
            .execute()
        rows = response.data
        history_map = {}
        for row in rows:
            row_id = row.get("id")
            if row_id is not None:
                history_map[f"db_{row_id}"] = {
                    "raw_text": row.get("raw_transcript", ""),
                    "corrected_text": row.get("corrected_text", "")
                }
        return history_map
    
    try:
        # Timeout after 8 seconds to prevent Supabase hangs from blocking the pipeline
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_fetch)
            history_map = future.result(timeout=8)
        logger.info(f"Loaded {len(history_map)} history entries from Supabase.")
        return history_map
    except concurrent.futures.TimeoutError:
        logger.warning("Supabase fetch timed out after 8s. Falling back to local history.")
        return None
    except Exception as e:
        print(f"CRITICAL ERROR [Supabase Query]: {str(e)}")
        logger.error(f"Failed to fetch history from Supabase: {e}")
        return None

def save_history_to_supabase(audio_id, raw_text, corrected_text):
    """Save history record to Supabase, wrapping insert in try-except for diagnostics."""
    supabase_client = get_supabase_client()
    if not supabase_client:
        logger.warning("Supabase client not initialized. Cannot save history.")
        return False
        
    # Check if this is an update to an existing database row
    if isinstance(audio_id, str) and audio_id.startswith("db_"):
        try:
            db_id = int(audio_id.split("_")[1])
            logger.info(f"Updating existing record in Supabase with id: {db_id}")
            supabase_client.table('speech_history') \
                .update({"corrected_text": corrected_text}) \
                .eq("id", db_id) \
                .execute()
            logger.info(f"Successfully updated record in Supabase: {audio_id}")
            return True
        except Exception as e:
            print(f"CRITICAL ERROR [Supabase Update]: {str(e)}")
            logger.error(f"Failed to update history record in Supabase: {e}")
            return False

    try:
        # Wrap the supabase.table('speech_history').insert() query block in a dedicated try-except container.
        response = supabase_client.table('speech_history').insert({
            "raw_transcript": raw_text,
            "corrected_text": corrected_text
        }).execute()
        logger.info(f"Successfully inserted history record to Supabase: {audio_id}")
        return True
    except Exception as e:
        # Catch and print the exact raw response body error directly to the terminal standard output
        print(f"CRITICAL ERROR [Supabase Insert]: {str(e)}")
        print("\n--- RAW SUPABASE RESPONSE ERROR ---", flush=True)
        print(f"Error during insert: {e}", flush=True)
        if hasattr(e, 'message'):
            print(f"Message: {e.message}", flush=True)
        if hasattr(e, 'details'):
            print(f"Details: {e.details}", flush=True)
        if hasattr(e, 'code'):
            print(f"Code: {e.code}", flush=True)
            
        # Inspect for raw response attributes
        for attr in ['body', 'response', 'text']:
            if hasattr(e, attr):
                val = getattr(e, attr)
                print(f"Raw {attr}: {val}", flush=True)
        if hasattr(e, 'response') and e.response is not None:
            if hasattr(e.response, 'text'):
                print(f"HTTP Response Text: {e.response.text}", flush=True)
            if hasattr(e.response, 'status_code'):
                print(f"HTTP Status Code: {e.response.status_code}", flush=True)
        print("------------------------------------\n", flush=True)
        return False

def load_history_map():
    """Retrieve full history, checking Supabase first and falling back to local storage."""
    supabase_data = fetch_history_from_supabase()
    if supabase_data is not None:
        return supabase_data

    # Local fallback
    if not os.path.exists(HISTORY_MAP_PATH):
        return {}
    try:
        with open(HISTORY_MAP_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            formatted = {}
            for k, v in data.items():
                if isinstance(v, dict):
                    formatted[k] = v
                else:
                    formatted[k] = {"raw_text": "", "corrected_text": v}
            return formatted
    except Exception as e:
        print(f"CRITICAL ERROR [Local History LoadFallback]: {str(e)}")
        logger.error(f"Error reading history_map.json fallback: {e}")
        return {}

def save_history_entry(audio_id, raw_text, corrected_text):
    """Save history entry both to Supabase (if configured) and local json backup asynchronously."""
    def run_save():
        # 1. Save to Supabase (fails gracefully if DB not set or table doesn't exist)
        save_history_to_supabase(audio_id, raw_text, corrected_text)

        # 2. Local fallback backup
        try:
            local_map = {}
            if os.path.exists(HISTORY_MAP_PATH):
                try:
                    with open(HISTORY_MAP_PATH, 'r', encoding='utf-8') as f:
                        local_map = json.load(f)
                except Exception as e:
                    print(f"CRITICAL ERROR [Local History Load]: {str(e)}")
            
            local_map[audio_id] = {
                "raw_text": raw_text,
                "corrected_text": corrected_text
            }
            
            # Serialize map to JSON string before writing, keeping IO inside background thread
            json_str = json.dumps(local_map, indent=2, ensure_ascii=False)
            with open(HISTORY_MAP_PATH, 'w', encoding='utf-8') as f:
                f.write(json_str)
            logger.info(f"Successfully saved backup history entry locally: {audio_id}")
        except Exception as e:
            print(f"CRITICAL ERROR [Local History Save]: {str(e)}")
            logger.error(f"Error writing backup history entry: {e}")

    threading.Thread(target=run_save, daemon=True).start()

# --- API ENDPOINTS ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calibration-status', methods=['GET'])
def get_calibration_status():
    """Check how many calibration files exist locally (UI displays presence of physical recordings)."""
    present_count, total_count = check_calibration_files_present()

    status = "uncalibrated"
    if present_count == total_count and total_count > 0:
        status = "calibrated"
    elif present_count > 0:
        status = "partially_calibrated"

    files_state = {}
    for filename, script in calibration_map.items():
        file_path = os.path.join(CALIBRATION_DIR, filename)
        files_state[filename] = {
            "exists": os.path.exists(file_path),
            "script": script
        }

    return jsonify({
        "status": status,
        "count": present_count,
        "total": total_count,
        "cached": present_count,  # Stuffed to align with present_count
        "files": files_state
    })

@app.route('/upload-calibration', methods=['POST'])
def upload_calibration():
    """Endpoint to save a specific calibration recording locally (skipped Gemini upload to avoid latency)."""
    if 'audio' not in request.files or 'filename' not in request.form:
        return jsonify({"error": "Missing audio file or target filename."}), 400

    audio_file = request.files['audio']
    filename = request.form['filename']

    if filename not in calibration_map:
        return jsonify({"error": "Invalid calibration filename."}), 400

    file_path = os.path.join(CALIBRATION_DIR, filename)
    try:
        # Avoid blocking the main execution thread by writing file asynchronously
        audio_bytes = audio_file.read()
        save_file_nonblocking(audio_bytes, file_path)
        logger.info(f"Saved calibration file locally: {file_path}")
        return jsonify({"success": True, "filename": filename})
    except Exception as e:
        print(f"CRITICAL ERROR [Upload Calibration]: {str(e)}")
        logger.error(f"Error saving calibration file {filename}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

def generate_content_with_backoff(model, contents, generation_config=None):
    """
    Generate content with explicit, bounded try-except loop and disabled safety filters.
    """
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    max_retries = 3
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Calling Gemini API (model=gemini-2.5-flash, attempt={attempt + 1}/{max_retries + 1})...")
            if generation_config:
                return model.generate_content(contents, generation_config=generation_config, safety_settings=safety_settings)
            return model.generate_content(contents, safety_settings=safety_settings)
        except Exception as e:
            print(f"CRITICAL ERROR [Gemini API Request]: {str(e)}")

            # Check if this is one of the target 5xx status codes
            code = getattr(e, 'code', None) or getattr(e, 'status_code', None)
            err_str = str(e)

            is_target_error = False
            target_codes = [429, 500, 501, 502, 503, 504, 506]
            if code in target_codes or str(code) in [str(c) for c in target_codes]:
                is_target_error = True
            else:
                for tc in target_codes:
                    if str(tc) in err_str:
                        is_target_error = True
                        break

            if is_target_error:
                if attempt < max_retries:
                    logger.warning(
                        f"Gemini API returned 5xx status error: {e}. "
                        f"Rotating key and re-instantiating model. Retry {attempt + 1}/{max_retries}..."
                    )
                    # Rotate to next key and re-instantiate model with gemini-2.5-flash
                    with client_lock:
                        active_key = next(_api_rotator)
                        genai.configure(api_key=active_key)
                        sys_inst = model.system_instruction if hasattr(model, 'system_instruction') else None
                        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=sys_inst)
                    time.sleep(2)
                    continue
                else:
                    logger.error(f"Max retries reached ({max_retries}) for Gemini API call. Failing.")
                    raise e
            else:
                # Non-5xx error: raise immediately without retry
                raise e

# --- 3. TWO-STAGE CORRECTION PIPELINE ---

# Background task storage for async transcription (mobile-friendly)
_transcription_tasks = {}
_task_lock = threading.Lock()

def _cleanup_stale_tasks():
    """Remove tasks older than 5 minutes to prevent memory leaks on Render's 512MB RAM."""
    cutoff = int((time.time() - 300) * 1000)  # 5 minutes ago in ms
    with _task_lock:
        stale_keys = [
            k for k in _transcription_tasks
            if k.startswith('task_') and int(k.split('_')[1]) < cutoff
        ]
        for k in stale_keys:
            _transcription_tasks.pop(k, None)
        if stale_keys:
            logger.info(f"Cleaned up {len(stale_keys)} stale transcription tasks from memory.")

def _run_transcription_pipeline(task_id, audio_bytes, mime_type, history_filename, temp_local_path):
    """Run the full STT + Correction pipeline in a background thread.
    This prevents Render's 30s request timeout from killing mobile requests."""
    try:
        with _task_lock:
            _transcription_tasks[task_id] = {"status": "processing", "stage": "stt"}

        # --- STEP A: High-Speed Raw STT Layer ---
        logger.info(f"[{task_id}] Step A: Running high-speed raw STT...")
        stt_prompt = (
            "You are a rapid speech-to-text transcriber. Transcribe the following audio file exactly as it sounds, "
            "capturing the raw phonetics, even if there are speech distortions, cleft palate nasalizations, or unclear words. "
            "CRITICAL: You must capture every single word, even if the user speaks in a very low volume or a very high volume. Do not drop quiet words. "
            "Do not attempt to fix grammar, spelling, or meaning. Return ONLY the raw transcribed text. "
            "No conversational filler, no introductory text."
        )

        with client_lock:
            genai.configure(api_key=get_next_api_key())
        model = genai.GenerativeModel('gemini-2.5-flash')
        contents = [
            {"mime_type": mime_type, "data": audio_bytes},
            stt_prompt
        ]
        stt_response = generate_content_with_backoff(
            model=model,
            contents=contents,
            generation_config={'temperature': 0.0}
        )
        
        # Free audio bytes from RAM immediately after STT completes
        # This is critical on Render free tier (512MB RAM)
        del audio_bytes
        del contents

        try:
            raw_phonetic_text = stt_response.text.strip()
        except ValueError:
            raw_phonetic_text = "[Transcription blocked or failed]"
            logger.warning(f"[{task_id}] Step A STT failed to return valid text.")

        logger.info(f"[{task_id}] Step A Raw phonetic text: '{raw_phonetic_text}'")

        with _task_lock:
            _transcription_tasks[task_id]["stage"] = "correction"

        # --- STEP B: Text Correction Pipeline ---
        logger.info(f"[{task_id}] Step B: Running text correction pipeline...")

        history_map = load_history_map()
        recent_history = list(history_map.values())[-5:]
        recent_history_str = ""
        if recent_history:
            recent_history_str = "\n".join([
                f"Raw Phonetic: \"{item.get('raw_text', '')}\" -> Corrected Intent: \"{item.get('corrected_text', '')}\""
                for item in recent_history if item.get('corrected_text')
            ])
        else:
            recent_history_str = "No recent history available."

        system_instruction = (
            "You are an expert assistive cleft palate speech correction assistant operating under strict protocols.\n"
            "Your task is to take a raw, phonetic transcription and output the corrected, intended text.\n"
            "You have a strict SOP (Standard Operating Procedure) for phonetic mapping in front of you. "
            "You MUST apply this SOP strictly, mapping the phonetic distortions back to the correct English phrase word-by-word.\n"
            "Return ONLY the completely corrected text. Do not include any explanations, preamble, or formatting."
        )

        learned_rules = ""
        if os.path.exists(PHONETIC_RULES_PATH):
            try:
                with open(PHONETIC_RULES_PATH, 'r', encoding='utf-8') as f:
                    learned_rules = f.read().strip()
            except Exception as e:
                print(f"CRITICAL ERROR [Phonetic Rules Dynamic Read]: {str(e)}")
                logger.error(f"Error loading phonetic rules file dynamically: {e}")

        sop_content = ""
        if learned_rules:
            sop_content = f"\n=== STRICT STANDARD OPERATING PROCEDURE (SOP) FOR PHONETIC MAPPING ===\nYou MUST keep this SOP in front of you and apply it word-by-word to the input text:\n{learned_rules}\n======================================================================\n"

        prompt_content = f"""
{VOICE_LINGUISTIC_PROFILE}
{sop_content}
RECENT CORRECTION HISTORY (Examples of successful corrections):
{recent_history_str}

INPUT RAW PHONETIC TEXT TO CORRECT (Translate this word-by-word using the SOP):
"{raw_phonetic_text}"

CORRECTED TEXT:
"""

        with client_lock:
            genai.configure(api_key=get_next_api_key())
        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

        correction_response = generate_content_with_backoff(
            model=model,
            contents=prompt_content,
            generation_config={'temperature': 0.0}
        )
        try:
            transcription = correction_response.text.strip()
        except ValueError:
            transcription = "I'm sorry, the audio could not be properly transcribed due to unclear phonetics or safety constraints."
            logger.warning(f"[{task_id}] Step B Correction failed to return valid text.")

        logger.info(f"[{task_id}] Step B Corrected transcription: '{transcription}'")

        save_history_entry(history_filename, raw_phonetic_text, transcription)

        with _task_lock:
            _transcription_tasks[task_id] = {
                "status": "done",
                "raw_transcription": raw_phonetic_text,
                "transcription": transcription,
                "audio_id": history_filename
            }

    except Exception as e:
        logger.error(f"[{task_id}] CRITICAL ERROR [Background Pipeline]: {type(e).__name__}: {str(e)}", exc_info=True)
        with _task_lock:
            _transcription_tasks[task_id] = {
                "status": "error",
                "error": f"{type(e).__name__}: {str(e)}"
            }
    finally:
        # Clean up temp audio file from ephemeral disk to free space
        try:
            if temp_local_path and os.path.exists(temp_local_path):
                os.remove(temp_local_path)
                logger.info(f"[{task_id}] Cleaned up temp audio file: {temp_local_path}")
        except Exception:
            pass


@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Endpoint to receive recording, run Step A (raw STT) and Step B (Gemini 2.5 Flash correction).
    Supports two modes:
    - mode=async (default on mobile): Returns a task_id immediately, client polls /transcribe-status
    - mode=sync: Runs the full pipeline synchronously (legacy behavior for fast connections)
    """
    # Cleanup stale tasks on every request to prevent memory leaks
    _cleanup_stale_tasks()
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided in request."}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "Empty audio file."}), 400

    # Detect if client wants async mode (mobile sends this)
    async_mode = request.form.get('mode', 'sync') == 'async'

    try:
        content_type_header = audio_file.content_type or ''
        if content_type_header and content_type_header != 'application/octet-stream':
            mime_type = content_type_header.split(';')[0].strip()
        else:
            raw_name = audio_file.filename or ''
            ext = os.path.splitext(raw_name.split('?')[0])[1].lower()
            mime_type = get_mime_type(f'audio{ext}') if ext else 'audio/webm'

        mime_to_ext = {
            'audio/webm': '.webm', 'audio/wav': '.wav', 'audio/mpeg': '.mp3',
            'audio/mp4': '.mp4', 'audio/ogg': '.ogg', 'audio/flac': '.flac',
            'audio/aac': '.aac', 'audio/m4a': '.m4a',
        }
        suffix = mime_to_ext.get(mime_type, '.webm')
        timestamp = int(time.time() * 1000)
        history_filename = f"history_{timestamp}{suffix}"
        temp_local_path = os.path.join(HISTORY_DIR, history_filename)

        audio_stream = io.BytesIO()
        audio_file.save(audio_stream)
        audio_bytes = audio_stream.getvalue()

        # Reject extremely small audio (likely empty/corrupt)
        if len(audio_bytes) < 1000:
            return jsonify({"error": "Audio file too small. Please record for at least 2 seconds."}), 400

        save_file_nonblocking(audio_bytes, temp_local_path)
        logger.info(f"Saved incoming audio to history: {temp_local_path} (mime={mime_type}, size={len(audio_bytes)} bytes, async={async_mode})")

        if async_mode:
            # --- ASYNC MODE: Return task_id immediately, process in background ---
            task_id = f"task_{timestamp}"
            with _task_lock:
                _transcription_tasks[task_id] = {"status": "uploading"}

            thread = threading.Thread(
                target=_run_transcription_pipeline,
                args=(task_id, audio_bytes, mime_type, history_filename, temp_local_path),
                daemon=True
            )
            thread.start()

            return jsonify({"task_id": task_id, "status": "processing"}), 202

        else:
            # --- SYNC MODE: Legacy behavior for fast PC connections ---
            logger.info("Step A: Running high-speed raw STT...")
            stt_prompt = (
                "You are a rapid speech-to-text transcriber. Transcribe the following audio file exactly as it sounds, "
                "capturing the raw phonetics, even if there are speech distortions, cleft palate nasalizations, or unclear words. "
                "Do not attempt to fix grammar, spelling, or meaning. Return ONLY the raw transcribed text. "
                "No conversational filler, no introductory text."
            )

            with client_lock:
                genai.configure(api_key=get_next_api_key())
            model = genai.GenerativeModel('gemini-2.5-flash')
            contents = [
                {"mime_type": mime_type, "data": audio_bytes},
                stt_prompt
            ]
            stt_response = generate_content_with_backoff(
                model=model,
                contents=contents,
                generation_config={'temperature': 0.0}
            )
            try:
                raw_phonetic_text = stt_response.text.strip()
            except ValueError:
                raw_phonetic_text = "[Transcription blocked or failed]"
                logger.warning("Step A STT failed to return valid text. Response may have been blocked.")

            logger.info(f"Step A Raw phonetic text: '{raw_phonetic_text}'")

            logger.info("Step B: Running text correction pipeline...")

            history_map = load_history_map()
            recent_history = list(history_map.values())[-5:]
            recent_history_str = ""
            if recent_history:
                recent_history_str = "\n".join([
                    f"Raw Phonetic: \"{item.get('raw_text', '')}\" -> Corrected Intent: \"{item.get('corrected_text', '')}\""
                    for item in recent_history if item.get('corrected_text')
                ])
            else:
                recent_history_str = "No recent history available."

            system_instruction = (
                "You are an expert assistive cleft palate speech correction assistant.\n"
                "Your task is to take a raw, phonetic transcription (which is distorted due to cleft palate speech patterns) "
                "and output the corrected, intended text.\n"
                "Use the provided voice linguistic profile, calibration text sentences, and recent correction history "
                "to map the phonetic distortions back to the correct English phrase.\n"
                "Return ONLY the completely corrected text. Do not include any explanations, preamble, or formatting."
            )

            learned_rules = ""
            if os.path.exists(PHONETIC_RULES_PATH):
                try:
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(lambda: open(PHONETIC_RULES_PATH, 'r', encoding='utf-8').read())
                        learned_rules = future.result().strip()
                except Exception as e:
                    print(f"CRITICAL ERROR [Phonetic Rules Dynamic Read]: {str(e)}")
                    logger.error(f"Error loading phonetic rules file dynamically: {e}")

            profile_content = VOICE_LINGUISTIC_PROFILE
            if learned_rules:
                profile_content += f"\nLEARNED PHONETIC MAPPING RULES (AUTOMATICALLY DISCOVERED):\n{learned_rules}\n"

            prompt_content = f"""
{profile_content}

RECENT CORRECTION HISTORY (Examples of successful corrections):
{recent_history_str}

INPUT RAW PHONETIC TEXT TO CORRECT:
"{raw_phonetic_text}"

CORRECTED TEXT:
"""

            with client_lock:
                genai.configure(api_key=get_next_api_key())
            model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

            correction_response = generate_content_with_backoff(
                model=model,
                contents=prompt_content,
                generation_config={'temperature': 0.0}
            )
            try:
                transcription = correction_response.text.strip()
            except ValueError:
                transcription = "I'm sorry, the audio could not be properly transcribed due to unclear phonetics or safety constraints."
                logger.warning("Step B Correction failed to return valid text.")

            logger.info(f"Step B Corrected transcription: '{transcription}'")

            save_history_entry(history_filename, raw_phonetic_text, transcription)

            return jsonify({
                "raw_transcription": raw_phonetic_text,
                "transcription": transcription,
                "audio_id": history_filename
            })

    except GoogleAPIError as gae:
        logger.error(f"CRITICAL ERROR [Gemini API Request]: {str(gae)}", exc_info=True)
        return jsonify({"error": f"Gemini API Error: {str(gae)}"}), 502
    except Exception as e:
        logger.error(f"CRITICAL ERROR [Transcription Pipeline]: {type(e).__name__}: {str(e)}", exc_info=True)
        return jsonify({"error": f"{type(e).__name__}: {str(e)}"}), 500


@app.route('/transcribe-status/<task_id>', methods=['GET'])
def transcribe_status(task_id):
    """Poll endpoint for async transcription tasks (mobile-friendly)."""
    with _task_lock:
        task = _transcription_tasks.get(task_id)
    
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    if task["status"] == "done":
        # Clean up completed task after retrieval
        with _task_lock:
            _transcription_tasks.pop(task_id, None)
        return jsonify(task)
    elif task["status"] == "error":
        with _task_lock:
            _transcription_tasks.pop(task_id, None)
        return jsonify(task), 500
    else:
        # Still processing
        return jsonify({"status": task["status"], "stage": task.get("stage", "uploading")})

@app.route('/save-correction', methods=['POST'])
def save_correction():
    """Endpoint for user to submit a manual corrected transcript to update model learning history."""
    data = request.get_json() or {}
    audio_id = data.get('audio_id')
    corrected_text = data.get('corrected_text', '').strip()

    if not audio_id or not corrected_text:
        return jsonify({"error": "Missing audio_id or corrected_text."}), 400

    try:
        # Load local history to find the original raw phonetic text
        local_map = {}
        if os.path.exists(HISTORY_MAP_PATH):
            try:
                with open(HISTORY_MAP_PATH, 'r', encoding='utf-8') as f:
                    local_map = json.load(f)
            except Exception as e:
                print(f"CRITICAL ERROR [Local History Read]: {str(e)}")
                logger.error(f"Failed to read history map: {e}")
        
        raw_text = ""
        if audio_id in local_map:
            entry = local_map[audio_id]
            if isinstance(entry, dict):
                raw_text = entry.get("raw_text", "")
        
        # Save updated correction (updates Supabase and local JSON)
        save_history_entry(audio_id, raw_text, corrected_text)
        logger.info(f"Updated correction for {audio_id}: '{corrected_text}' (raw: '{raw_text}')")

        return jsonify({"success": True, "message": "Model updated with new correction!"})
    except Exception as e:
        print(f"CRITICAL ERROR [Save Correction]: {str(e)}")
        logger.error(f"Error saving correction for {audio_id}: {e}", exc_info=True)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Resonate cleft-stt-app server...")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
