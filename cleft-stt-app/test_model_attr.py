import google.generativeai as genai

model = genai.GenerativeModel('gemini-2.5-flash', system_instruction="Hello")
print(hasattr(model, 'system_instruction'))
try:
    print(model.system_instruction)
except Exception as e:
    print(f"Error accessing system_instruction: {e}")

model2 = genai.GenerativeModel('gemini-2.5-flash')
print(hasattr(model2, 'system_instruction'))
try:
    print(model2.system_instruction)
except Exception as e:
    print(f"Error accessing system_instruction: {e}")
