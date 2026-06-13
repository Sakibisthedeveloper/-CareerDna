import google.generativeai as genai

model = genai.GenerativeModel('gemini-1.5-flash', system_instruction="Test")
print(hasattr(model, 'system_instruction'))
print(model._system_instruction) if hasattr(model, '_system_instruction') else print("No _system_instruction")
