import google.generativeai as genai

print(f"genai version: {genai.__version__}")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    contents = [
        {"mime_type": "audio/webm", "data": b"dummy_data"},
        "Test prompt"
    ]
    print("Payload format constructed successfully!")
    print("Testing generation config type conversion...")
    # Just attempting to convert dict to GenerationConfig locally to test SDK compatibility
    try:
        from google.generativeai.types import generation_types
        config = generation_types.to_generation_config_dict({'temperature': 0.0})
        print(f"Dict to config works: {config}")
    except Exception as inner:
        print(f"Config mapping error: {inner}")
except Exception as e:
    print(f"Error: {e}")
