import os
import time
import json
import logging
import tempfile
import threading
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors

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

# Try loading API key from the environment first, then from the parent folder's .env.local if present
parent_dir = os.path.dirname(BASE_DIR)
env_local_path = os.path.join(parent_dir, '.env.local')

if os.path.exists(env_local_path):
    logger.info(f"Found .env.local in parent directory: {env_local_path}. Loading environment...")
    load_dotenv(env_local_path)
else:
    load_dotenv()

# Lookup keys in common variable names
api_key = (
    os.environ.get("GOOGLE_AI_API_KEY") or 
    os.environ.get("GEMINI_API_KEY") or 
    os.environ.get("GOOGLE_API_KEY")
)

client = None
if not api_key:
    logger.warning("Gemini API key not found in environment. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY.")
else:
    # Initialize the modern google-genai client
    client = genai.Client(api_key=api_key)
    logger.info("Google GenAI client successfully configured.")

# Global cache for uploaded calibration files
# Structure: { filename: File_Object }
cached_calibration_files = {}

# Global cache for uploaded corrected history files
cached_history_files = {}

# Thread safety variables for background uploads
is_uploading_calibration = False
calibration_upload_lock = threading.Lock()

def load_history_map():
    if not os.path.exists(HISTORY_MAP_PATH):
        return {}
    try:
        with open(HISTORY_MAP_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading history_map.json: {e}")
        return {}

def save_history_map(h_map):
    try:
        with open(HISTORY_MAP_PATH, 'w', encoding='utf-8') as f:
            json.dump(h_map, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error saving history_map.json: {e}")

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

def wait_for_file_active(file_ref):
    """Wait for an uploaded file to transition to ACTIVE state."""
    global client
    if not client:
        return
    logger.info(f"Waiting for file {file_ref.name} to become ACTIVE...")
    start_time = time.time()
    while True:
        file_info = client.files.get(name=file_ref.name)
        state_name = file_info.state.name
        if state_name == "ACTIVE":
            logger.info(f"File {file_ref.name} is ACTIVE.")
            return
        elif state_name == "FAILED":
            raise Exception(f"File {file_ref.name} processing failed on Gemini API.")
        
        if time.time() - start_time > 30:
            raise TimeoutError(f"Timed out waiting for file {file_ref.name} to become ACTIVE.")
            
        time.sleep(0.5)

def check_calibration_files_present():
    """Helper to check which calibration wav/mpeg files actually exist on disk."""
    present_count = 0
    total_count = len(calibration_map)
    for filename in calibration_map.keys():
        file_path = os.path.join(CALIBRATION_DIR, filename)
        if os.path.exists(file_path):
            present_count += 1
    return present_count, total_count

def upload_calibration_files():
    """Upload calibration files to Google Generative AI File API using Client if they exist and aren't cached."""
    global client, is_uploading_calibration
    if not api_key or not client:
        logger.error("API Key/Client not configured; cannot upload calibration files.")
        return

    with calibration_upload_lock:
        if is_uploading_calibration:
            logger.info("Calibration uploads already running in background.")
            return
        is_uploading_calibration = True

    try:
        logger.info("Starting background calibration uploads...")
        for filename, script in calibration_map.items():
            if filename in cached_calibration_files:
                continue  # Already uploaded and cached
            
            file_path = os.path.join(CALIBRATION_DIR, filename)
            if os.path.exists(file_path):
                try:
                    logger.info(f"Uploading calibration file to Gemini: {filename}...")
                    mime_type = get_mime_type(filename)
                    file_ref = client.files.upload(
                        file=file_path,
                        config=types.UploadFileConfig(mime_type=mime_type)
                    )
                    wait_for_file_active(file_ref)
                    cached_calibration_files[filename] = file_ref
                    logger.info(f"Successfully cached {filename} (URI: {file_ref.uri})")
                except Exception as e:
                    logger.error(f"Failed to upload {filename} to Gemini: {e}")
            else:
                logger.warning(f"Calibration file not found locally: {file_path}")
    finally:
        with calibration_upload_lock:
            is_uploading_calibration = False
        logger.info("Background calibration upload process finished.")

def upload_history_file_background(h_filename, h_path):
    """Upload a history file to Gemini in the background."""
    global client, cached_history_files
    if not api_key or not client:
        return
    
    if h_filename in cached_history_files:
        return
        
    try:
        logger.info(f"Background uploading history file: {h_filename}...")
        h_mime_type = get_mime_type(h_filename)
        h_ref = client.files.upload(
            file=h_path,
            config=types.UploadFileConfig(mime_type=h_mime_type)
        )
        wait_for_file_active(h_ref)
        cached_history_files[h_filename] = h_ref
        logger.info(f"Successfully cached history file in background: {h_filename}")
    except Exception as e:
        logger.error(f"Failed to cache history file in background {h_filename}: {e}")

def start_background_calibration_uploads():
    """Start calibration upload task in a background daemon thread."""
    thread = threading.Thread(target=upload_calibration_files, daemon=True)
    thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calibration-status', methods=['GET'])
def get_calibration_status():
    """Check how many calibration files exist and are uploaded, and return details for the UI."""
    present_count, total_count = check_calibration_files_present()
    
    # Start background upload if they aren't fully uploaded/cached yet
    if present_count > len(cached_calibration_files):
        start_background_calibration_uploads()

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
        "cached": len(cached_calibration_files),
        "files": files_state
    })

@app.route('/upload-calibration', methods=['POST'])
def upload_calibration():
    """Endpoint to upload a specific calibration recording directly from the UI."""
    global client
    if not api_key or not client:
        return jsonify({"error": "Gemini API key is not configured on the server."}), 500

    if 'audio' not in request.files or 'filename' not in request.form:
        return jsonify({"error": "Missing audio file or target filename."}), 400

    audio_file = request.files['audio']
    filename = request.form['filename']

    if filename not in calibration_map:
        return jsonify({"error": "Invalid calibration filename."}), 400

    file_path = os.path.join(CALIBRATION_DIR, filename)
    try:
        # Save file locally (overwrite existing)
        audio_file.save(file_path)
        logger.info(f"Saved calibration file locally: {file_path}")

        # Evict old cached version if present to force refresh
        if filename in cached_calibration_files:
            del cached_calibration_files[filename]

        # Upload to Gemini immediately to warm the cache
        logger.info(f"Uploading new calibration file to Gemini: {filename}...")
        mime_type = get_mime_type(filename)
        file_ref = client.files.upload(
            file=file_path,
            config=types.UploadFileConfig(mime_type=mime_type)
        )
        wait_for_file_active(file_ref)
        cached_calibration_files[filename] = file_ref
        logger.info(f"Successfully cached {filename} on Gemini (URI: {file_ref.uri})")

        return jsonify({"success": True, "filename": filename})
    except Exception as e:
        logger.error(f"Error saving/uploading calibration file {filename}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Endpoint to receive recording, send to Gemini using google-genai, and transcribe."""
    global client
    if not api_key or not client:
        return jsonify({"error": "Gemini API key is not configured on the server."}), 500

    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided in request."}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "Empty audio file."}), 400

    # Ensure calibration files are uploaded/cached
    start_background_calibration_uploads()

    temp_local_path = None
    uploaded_audio = None
    try:
        # 1. Save incoming audio blob directly to the history directory
        suffix = os.path.splitext(audio_file.filename)[1] or '.webm'
        timestamp = int(time.time() * 1000)
        history_filename = f"history_{timestamp}{suffix}"
        temp_local_path = os.path.join(HISTORY_DIR, history_filename)
        audio_file.save(temp_local_path)
        logger.info(f"Saved incoming audio directly to history: {temp_local_path}")

        # 2. Upload the temporary recorded audio to Gemini API using client
        logger.info("Uploading user recorded audio to Gemini API...")
        mime_type = get_mime_type(temp_local_path)
        uploaded_audio = client.files.upload(
            file=temp_local_path,
            config=types.UploadFileConfig(mime_type=mime_type)
        )
        logger.info(f"User audio uploaded. URI: {uploaded_audio.uri} (MIME: {mime_type})")

        # Wait for the uploaded audio file to become ACTIVE
        wait_for_file_active(uploaded_audio)

        # 3. Construct prompt contents with few-shot examples
        contents = []
        calibration_notes = []

        # A. Add standard calibration examples
        for idx, (filename, script) in enumerate(calibration_map.items()):
            if filename in cached_calibration_files:
                file_ref = cached_calibration_files[filename]
                contents.append(file_ref)
                contents.append(f"Calibration Example {idx + 1} - Script: {script}")
                calibration_notes.append(f"Audio {idx + 1} -> Script: \"{script}\"")

        # B. Add dynamically learned history correction examples (up to 3 most recent)
        global cached_history_files
        history_map = load_history_map()
        recent_history = list(history_map.items())[-3:]

        for idx, (h_filename, corrected_text) in enumerate(recent_history):
            h_path = os.path.join(HISTORY_DIR, h_filename)
            if os.path.exists(h_path):
                # If not cached, trigger a background upload so it's ready for future requests
                if h_filename not in cached_history_files:
                    threading.Thread(
                        target=upload_history_file_background,
                        args=(h_filename, h_path),
                        daemon=True
                    ).start()
                
                # Append to model inputs ONLY if already cached
                if h_filename in cached_history_files:
                    file_ref = cached_history_files[h_filename]
                    contents.append(file_ref)
                    contents.append(f"Learned Corrected Example {idx + 1} - Script: {corrected_text}")
                    calibration_notes.append(f"History Audio {idx + 1} -> Script: \"{corrected_text}\"")

        # Add target audio file to contents
        contents.append(uploaded_audio)

        # Build prompt incorporating references
        calibration_references_str = ", ".join(calibration_notes) if calibration_notes else "No calibration files available"
        
        prompt_text = (
            "You are an expert accessibility speech-to-text engine. The following audio clip is from "
            "an individual with a cleft palate. To calibrate your neural network to their unique "
            f"acoustic patterns, use these reference examples of how they pronounce phrases: [{calibration_references_str}]. "
            "Now, listen to the newly attached audio file. Use sentence context, phonetics, and the calibration data "
            "to decode the phrase. Return ONLY the completely corrected text output. "
            "No conversational filler, no markdown wrappers, no introductory fluff."
        )
        contents.append(prompt_text)

        # 4. Invoke the gemini-2.5-flash model using client
        logger.info("Sending content generation request to gemini-2.5-flash...")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents
        )
        
        transcription = response.text.strip()
        logger.info(f"Transcription response: {transcription}")

        return jsonify({
            "transcription": transcription,
            "audio_id": history_filename
        })

    except errors.APIError as gae:
        logger.error(f"Google Generative AI API Error: {gae}")
        return jsonify({"error": f"Gemini API Error: {str(gae)}"}), 502
    except Exception as e:
        logger.error(f"Unexpected error during transcription process: {e}", exc_info=True)
        return jsonify({"error": f"Server Error: {str(e)}"}), 500
        
    finally:
        # Cleanup: Delete user audio file from Gemini cloud storage (kept locally in history dir)
        if uploaded_audio and client:
            try:
                logger.info(f"Deleting temp cloud file from Gemini API: {uploaded_audio.name}...")
                client.files.delete(name=uploaded_audio.name)
                logger.info("Successfully deleted cloud resource.")
            except Exception as e:
                logger.error(f"Error deleting cloud file {uploaded_audio.name}: {e}")

@app.route('/save-correction', methods=['POST'])
def save_correction():
    """Endpoint for user to submit a corrected transcript to train/improve the model in real time."""
    data = request.get_json() or {}
    audio_id = data.get('audio_id')
    corrected_text = data.get('corrected_text')

    if not audio_id or not corrected_text:
        return jsonify({"error": "Missing audio_id or corrected_text."}), 400

    # Verify history file exists
    history_path = os.path.join(HISTORY_DIR, audio_id)
    if not os.path.exists(history_path):
        return jsonify({"error": f"Audio file {audio_id} not found."}), 404

    try:
        # Load, update and save history map
        h_map = load_history_map()
        h_map[audio_id] = corrected_text.strip()
        save_history_map(h_map)

        logger.info(f"Successfully recorded correction for {audio_id}: '{corrected_text}'")
        
        # Pre-upload and cache this corrected file on Gemini to speed up the next run
        global client, cached_history_files
        if api_key and client and audio_id not in cached_history_files:
            logger.info(f"Pre-caching corrected history file on Gemini: {audio_id}...")
            mime_type = get_mime_type(audio_id)
            file_ref = client.files.upload(
                file=history_path,
                config=types.UploadFileConfig(mime_type=mime_type)
            )
            wait_for_file_active(file_ref)
            cached_history_files[audio_id] = file_ref
            logger.info(f"Successfully pre-cached history file: {audio_id}")

        return jsonify({"success": True, "message": "Model updated with new correction!"})
    except Exception as e:
        logger.error(f"Error saving correction for {audio_id}: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Resonate cleft-stt-app server...")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
