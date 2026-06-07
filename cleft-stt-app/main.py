import os
import time
import json
import logging
import threading
import itertools
import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

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
api_keys_str = (
    os.environ.get("GOOGLE_AI_API_KEYS") or 
    os.environ.get("GEMINI_API_KEYS") or 
    os.environ.get("GOOGLE_AI_API_KEY") or 
    os.environ.get("GEMINI_API_KEY") or 
    os.environ.get("GOOGLE_API_KEY") or ""
)

api_keys = []
if api_keys_str.strip().startswith('['):
    try:
        api_keys = json.loads(api_keys_str)
    except Exception:
        pass

if not api_keys:
    # Split by comma or semicolon
    api_keys = [k.strip() for k in api_keys_str.replace(';', ',').split(',') if k.strip()]

# Check for numbered keys (e.g. GEMINI_API_KEY_1, GEMINI_API_KEY_2...)
idx = 1
while True:
    k = os.environ.get(f"GEMINI_API_KEY_{idx}") or os.environ.get(f"GOOGLE_AI_API_KEY_{idx}")
    if not k:
        break
    if k.strip() not in api_keys:
        api_keys.append(k.strip())
    idx += 1

if not api_keys:
    logger.critical("No Gemini/Google AI API keys found. Please set GEMINI_API_KEYS or GOOGLE_AI_API_KEY.")
else:
    logger.info(f"Initialized API key rotation with {len(api_keys)} keys.")

# Initialize the modern google-genai clients
clients = [genai.Client(api_key=key) for key in api_keys]
clients_cycle = itertools.cycle(clients) if clients else None
client_lock = threading.Lock()

def get_next_client():
    """Thread-safe generator to rotate to the next client / API key on every request."""
    global clients_cycle
    if not clients_cycle:
        return None
    with client_lock:
        return next(clients_cycle)

# --- SUPABASE CONFIGURATION ---
SUPABASE_URL = (
    os.environ.get("SUPABASE_URL") or 
    os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
)
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or
    os.environ.get("SUPABASE_KEY") or
    os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

if SUPABASE_URL and SUPABASE_KEY:
    logger.info("Supabase credentials found. Persistent cloud history enabled.")
else:
    logger.warning("Supabase credentials not fully configured. Using local JSON history backup.")

# --- 2. HARDCODED VOICE LINGUISTIC PROFILE & CALIBRATION SENTENCES ---
VOICE_LINGUISTIC_PROFILE = """
VOICE LINGUISTIC PROFILE & BEHAVIORAL CONTEXT (Cleft Palate Speech):
This assistant serves a user with cleft palate speech. Due to structural/nasal air management challenges, their raw speech input presents predictable phonetic patterns and distortions:
1. Hypernasality & Nasal Emission: Vowels are often nasalized. Plosives (p, b, t, d, k, g) are replaced by nasal consonants (m, n, ng) or glottal stops.
2. Weak/Omitted Consonants: Word-final consonants are frequently dropped. Fricatives (s, z, sh, ch, j) are often replaced by a breathy 'h', pharyngeal fricatives, or omitted entirely.
3. Common phonetic substitutions:
   - "family" may sound like "am-ily", "em-ily", or "ham-ily".
   - "shiny" may sound like "hi-ny" or "i-ny".
   - "fox" may sound like "fo-" or "hock".
   - "meetings" may sound like "mee-ings" or "mee-tings" with nasal tones.
   - "tasks" may sound like "tah-s" or "tah-ks".

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
    """Fetch persistent speech history from Supabase table 'speech_history'."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/speech_history"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        params = {
            "select": "audio_id,raw_text,corrected_text",
            "order": "created_at.asc",
            "limit": "50"
        }
        response = requests.get(url, headers=headers, params=params, timeout=5)
        if response.status_code == 200:
            rows = response.json()
            history_map = {}
            for row in rows:
                audio_id = row.get("audio_id")
                if audio_id:
                    history_map[audio_id] = {
                        "raw_text": row.get("raw_text", ""),
                        "corrected_text": row.get("corrected_text", "")
                    }
            logger.info(f"Loaded {len(history_map)} history entries from Supabase.")
            return history_map
        elif response.status_code == 404:
            logger.warning("speech_history table not found in Supabase. Check DDL script.")
            return None
        else:
            logger.error(f"Supabase REST error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch history from Supabase: {e}")
        return None

def save_history_to_supabase(audio_id, raw_text, corrected_text):
    """Upsert history record directly to Supabase via its PostgREST API."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    try:
        url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/speech_history"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "on-conflict=audio_id"
        }
        payload = {
            "audio_id": audio_id,
            "raw_text": raw_text,
            "corrected_text": corrected_text
        }
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        if response.status_code in (200, 201):
            logger.info(f"Successfully upserted history record to Supabase: {audio_id}")
            return True
        else:
            # Fallback if Prefer header isn't supported / try POST
            headers.pop("Prefer", None)
            response = requests.post(url, headers=headers, json=payload, timeout=5)
            if response.status_code in (200, 201):
                logger.info(f"Successfully saved history to Supabase (POST): {audio_id}")
                return True
            elif response.status_code == 409: # Conflict
                # Fallback to PATCH update
                patch_url = f"{url}?audio_id=eq.{audio_id}"
                response = requests.patch(patch_url, headers=headers, json={"corrected_text": corrected_text}, timeout=5)
                if response.status_code in (200, 204):
                    logger.info(f"Successfully updated history in Supabase (PATCH): {audio_id}")
                    return True
            logger.error(f"Supabase save failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to save history to Supabase: {e}")
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
        logger.error(f"Error reading history_map.json fallback: {e}")
        return {}

def save_history_entry(audio_id, raw_text, corrected_text):
    """Save history entry both to Supabase (if configured) and local json backup."""
    # 1. Save to Supabase (fails gracefully if DB not set or table doesn't exist)
    save_history_to_supabase(audio_id, raw_text, corrected_text)

    # 2. Local fallback backup
    try:
        local_map = {}
        if os.path.exists(HISTORY_MAP_PATH):
            try:
                with open(HISTORY_MAP_PATH, 'r', encoding='utf-8') as f:
                    local_map = json.load(f)
            except Exception:
                pass
        
        local_map[audio_id] = {
            "raw_text": raw_text,
            "corrected_text": corrected_text
        }
        
        with open(HISTORY_MAP_PATH, 'w', encoding='utf-8') as f:
            json.dump(local_map, f, indent=2, ensure_ascii=False)
        logger.info(f"Successfully saved backup history entry locally: {audio_id}")
    except Exception as e:
        logger.error(f"Error writing backup history entry: {e}")

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
        audio_file.save(file_path)
        logger.info(f"Saved calibration file locally: {file_path}")
        # Gemini API cloud upload is skipped since we use the text-based profile instead
        return jsonify({"success": True, "filename": filename})
    except Exception as e:
        logger.error(f"Error saving calibration file {filename}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# --- 3. TWO-STAGE CORRECTION PIPELINE ---
@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Endpoint to receive recording, run Step A (raw STT) and Step B (Gemini 1.5 Flash correction)."""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided in request."}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "Empty audio file."}), 400

    temp_local_path = None
    try:
        # Save incoming audio blob locally for physical record
        suffix = os.path.splitext(audio_file.filename)[1] or '.webm'
        timestamp = int(time.time() * 1000)
        history_filename = f"history_{timestamp}{suffix}"
        temp_local_path = os.path.join(HISTORY_DIR, history_filename)
        audio_file.save(temp_local_path)
        logger.info(f"Saved incoming audio directly to history: {temp_local_path}")

        # Read the raw audio bytes for inline API transfer
        with open(temp_local_path, "rb") as f:
            audio_bytes = f.read()

        mime_type = get_mime_type(temp_local_path)

        # --- STEP A: High-Speed Raw STT Layer ---
        stt_client = get_next_client()
        if not stt_client:
            return jsonify({"error": "Google GenAI Client is not configured on the server."}), 500

        logger.info("Step A: Running high-speed raw STT...")
        stt_prompt = (
            "You are a rapid speech-to-text transcriber. Transcribe the following audio file exactly as it sounds, "
            "capturing the raw phonetics, even if there are speech distortions, cleft palate nasalizations, or unclear words. "
            "Do not attempt to fix grammar, spelling, or meaning. Return ONLY the raw transcribed text. "
            "No conversational filler, no introductory text."
        )

        stt_response = stt_client.models.generate_content(
            model='gemini-3.5-flash',
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                stt_prompt
            ]
        )
        raw_phonetic_text = stt_response.text.strip()
        logger.info(f"Step A Raw phonetic text: '{raw_phonetic_text}'")

        # --- STEP B: Text Correction Pipeline using Gemini 1.5 Flash ---
        correction_client = get_next_client()
        if not correction_client:
            return jsonify({"error": "Google GenAI Client is not configured on the server."}), 500

        logger.info("Step B: Running text correction pipeline...")
        
        # Load recent history (up to 5 most recent corrections) to teach the model on-the-fly
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

        prompt_content = f"""
{VOICE_LINGUISTIC_PROFILE}

RECENT CORRECTION HISTORY (Examples of successful corrections):
{recent_history_str}

INPUT RAW PHONETIC TEXT TO CORRECT:
"{raw_phonetic_text}"

CORRECTED TEXT:
"""

        # Generate corrected text
        correction_response = correction_client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt_content,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.0
            )
        )
        transcription = correction_response.text.strip()
        logger.info(f"Step B Corrected transcription: '{transcription}'")

        # Save record of both raw phonetic and corrected texts to sync history backend
        save_history_entry(history_filename, raw_phonetic_text, transcription)

        return jsonify({
            "raw_transcription": raw_phonetic_text,
            "transcription": transcription,
            "audio_id": history_filename
        })

    except errors.APIError as gae:
        logger.error(f"Google Generative AI API Error: {gae}")
        return jsonify({"error": f"Gemini API Error: {str(gae)}"}), 502
    except Exception as e:
        logger.error(f"Unexpected error during transcription process: {e}", exc_info=True)
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

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
            except Exception:
                pass
        
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
        logger.error(f"Error saving correction for {audio_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Resonate cleft-stt-app server...")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
