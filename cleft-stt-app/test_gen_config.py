import google.generativeai as genai

genai.configure(api_key="fake_key_123")
model = genai.GenerativeModel('gemini-1.5-flash')
try:
    model.generate_content("test", generation_config={"temperature": 0.0})
    print("Dict config is accepted by generate_content!")
except TypeError as e:
    print(f"TypeError on config: {e}")
except Exception as e:
    print(f"Other Error: {e}")
