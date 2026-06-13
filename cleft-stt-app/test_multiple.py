import io
from main import app

client = app.test_client()
audio_data = b"RIFF$" + b"\x00"*40

for i in range(5):
    print(f"\n--- Request {i+1} ---")
    data = {'audio': (io.BytesIO(audio_data), 'test.wav')}
    response = client.post('/transcribe', data=data, content_type='multipart/form-data')
    print(f"Status: {response.status_code}")
    print(f"Data: {response.data.decode('utf-8')[:200]}")
