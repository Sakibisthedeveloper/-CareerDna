import google.generativeai as genai

model = genai.GenerativeModel('gemini-2.5-flash', system_instruction="Hello")
print([a for a in dir(model) if 'system' in a.lower()])
