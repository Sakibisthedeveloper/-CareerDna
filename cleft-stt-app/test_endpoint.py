import os
import io
import json
from main import app

client = app.test_client()

# Create a dummy audio buffer
audio_data = b"RIFF$" + b"\x00"*40  # Minimal fake wav header
data = {
    'audio': (io.BytesIO(audio_data), 'test.wav')
}

print("Sending request...")
response = client.post('/transcribe', data=data, content_type='multipart/form-data')

print(f"Status Code: {response.status_code}")
print(f"Response Data: {response.data.decode('utf-8')}")
