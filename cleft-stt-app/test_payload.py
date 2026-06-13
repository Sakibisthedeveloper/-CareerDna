import google.generativeai as genai

genai.configure(api_key="fake")
model = genai.GenerativeModel('gemini-1.5-flash')
try:
    contents = [{"mime_type": "audio/webm", "data": b"dummy"}]
    model.generate_content(contents)
except Exception as e:
    print(f"Type: {type(e).__name__}")
    print(f"Message: {e}")
