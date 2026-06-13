import google.generativeai as genai

try:
    model = genai.GenerativeModel('gemini-1.5-flash', system_instruction="You are a helpful assistant")
    print("system_instruction is valid!")
except Exception as e:
    print(f"Error initializing model: {type(e).__name__}: {e}")
