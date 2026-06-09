import os
import time
import json
import logging
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("learn_agent")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PHONETIC_RULES_PATH = os.path.join(BASE_DIR, 'data', 'phonetic_rules.txt')

# Load environment variables (.env.local in parent folder first, then local .env)
parent_dir = os.path.dirname(BASE_DIR)
env_local_path = os.path.join(parent_dir, '.env.local')

if os.path.exists(env_local_path):
    logger.info(f"Loading environment from {env_local_path}")
    load_dotenv(env_local_path)
else:
    load_dotenv()

# Helper functions to obtain isolated clients dynamically
def get_gemini_client():
    """Dynamically initializes and returns a legacy GenerativeModel with the 3rd key exclusively."""
    api_key = os.environ.get("GEMINI_API_KEY_3") or os.environ.get("GOOGLE_AI_API_KEY")
    if not api_key:
        raise ValueError("Missing Gemini API key.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

def get_supabase_client():
    """Dynamically initializes and returns a Supabase client to avoid module-level global variables."""
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or
        os.environ.get("SUPABASE_KEY") or
        os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        logger.warning("Supabase credentials not fully configured.")
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"CRITICAL ERROR [Supabase Init]: {str(e)}")
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

def fetch_recent_history():
    """Poll Supabase table 'speech_history' for rows from the last 24 hours."""
    supabase_client = get_supabase_client()
    if not supabase_client:
        logger.warning("Supabase client not active. Cannot poll.")
        return []
    
    try:
        # Pull rows from the last 24 hours
        time_threshold = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        logger.info(f"Polling Supabase speech_history rows since {time_threshold}...")
        
        response = supabase_client.table('speech_history') \
            .select("raw_transcript,corrected_text") \
            .gte("created_at", time_threshold) \
            .execute()
        
        rows = response.data or []
        logger.info(f"Retrieved {len(rows)} rows from Supabase.")
        return rows
    except Exception as e:
        print(f"CRITICAL ERROR [Supabase Query]: {str(e)}")
        logger.error(f"Failed to query Supabase: {e}")
        return []

def save_or_append_rules(new_rules_text):
    """Save or append new logical mapping rules to the configuration cache file."""
    os.makedirs(os.path.dirname(PHONETIC_RULES_PATH), exist_ok=True)
    
    existing_rules = set()
    if os.path.exists(PHONETIC_RULES_PATH):
        try:
            with open(PHONETIC_RULES_PATH, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("- If sound is "):
                        existing_rules.add(line)
        except Exception as e:
            print(f"CRITICAL ERROR [Phonetic Rules File Read]: {str(e)}")
            logger.error(f"Error reading existing phonetic rules cache: {e}")
            
    # Parse new rules
    new_rules_added = 0
    for line in new_rules_text.splitlines():
        line = line.strip()
        if line.startswith("- If sound is "):
            if line not in existing_rules:
                existing_rules.add(line)
                new_rules_added += 1
                logger.info(f"Discovered new phonetic rule: {line}")
                
    if new_rules_added > 0:
        try:
            sorted_rules = sorted(list(existing_rules))
            with open(PHONETIC_RULES_PATH, 'w', encoding='utf-8') as f:
                f.write("\n".join(sorted_rules) + "\n")
            logger.info(f"Successfully wrote {len(sorted_rules)} total rules ({new_rules_added} new) to {PHONETIC_RULES_PATH}")
        except Exception as e:
            print(f"CRITICAL ERROR [Phonetic Rules File Write]: {str(e)}")
            logger.error(f"Error writing phonetic rules cache: {e}")
    else:
        logger.info("No new unique rules discovered in this cycle.")

def compile_linguistic_rules(rows):
    """Analyze discrepancies and discover cleft palate phonetic translation rules using Gemini 2.5 Flash."""
    # Filter for rows with discrepancies
    comparison_pairs = []
    for row in rows:
        raw = row.get("raw_transcript", "").strip()
        corrected = row.get("corrected_text", "").strip()
        if raw and corrected and raw != corrected:
            comparison_pairs.append((raw, corrected))
            
    if not comparison_pairs:
        logger.info("No discrepancies between raw and corrected text found in the last 24 hours.")
        return
    
    logger.info(f"Analyzing {len(comparison_pairs)} discrepancy pairs using Gemini 2.5 Flash...")
    
    pairs_str = "\n".join([f"Raw phonetic: \"{raw}\" -> Corrected intent: \"{corrected}\"" for raw, corrected in comparison_pairs])
    
    system_instruction = (
        "You are an expert linguistic analysis compiler specializing in cleft palate speech pathology and speech-to-text calibration.\n"
        "Your task is to compare the discrepancies between raw speech inputs (which have phonetic distortions) and successfully corrected intended texts.\n"
        "Systematically discover repeated phonetic errors caused by the speaker's cleft palate and output clean, standard dictionary rules matching this exact syntax:\n"
        "- If sound is [X] -> translates to: [Y]\n"
        "Where [X] is the distorted/mispronounced sound or word, and [Y] is the intended translated word/phrase.\n"
        "Return ONLY these rules, one per line. Do not include any intro, explanation, markdown formatting, or preamble."
    )
    
    prompt = f"""
Compare the discrepancies in the following speech history entries and compile phonetic translation rules:

{pairs_str}

Rules:
"""
    
    try:
        model = get_gemini_client()
        response = model.generate_content(
            prompt,
            generation_config={'temperature': 0.0}
        )
        rules_text = response.text.strip()
        if rules_text:
            logger.info("Gemini 2.5 Flash successfully generated rules.")
            save_or_append_rules(rules_text)
        else:
            logger.warning("Gemini 2.5 Flash returned an empty response.")
    except Exception as e:
        print(f"CRITICAL ERROR [Gemini API Request]: {str(e)}")
        logger.error(f"Error calling Gemini API for linguistic compilation: {e}")

def run_loop(poll_interval_seconds=300):
    """Continuous background learning agent loop."""
    logger.info(f"Starting background learning loop (polling every {poll_interval_seconds}s)...")
    while True:
        try:
            rows = fetch_recent_history()
            if rows:
                compile_linguistic_rules(rows)
            else:
                logger.info("No recent history rows found in this cycle.")
        except Exception as e:
            print(f"CRITICAL ERROR [Learning Agent Cycle]: {str(e)}")
            logger.error(f"Unhandled error in learning agent cycle: {e}")
        
        logger.info(f"Sleeping for {poll_interval_seconds}s before next polling cycle...")
        time.sleep(poll_interval_seconds)

if __name__ == "__main__":
    import sys
    # Allow single run via '--once' flag
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        logger.info("Executing single run of background learning agent...")
        rows = fetch_recent_history()
        if rows:
            compile_linguistic_rules(rows)
        else:
            logger.info("No history rows found.")
    else:
        run_loop()
