import requests

print("Testing live Flask server...")
try:
    with open("cleft-stt-app/data/history/history_1781282056366.wav", "rb") as f:
        audio_data = f.read()
except FileNotFoundError:
    audio_data = b"RIFF$" + b"\x00"*40

files = {'audio': ('test.wav', audio_data, 'audio/wav')}
response = requests.post("http://localhost:5000/transcribe", files=files)

print(f"Status Code: {response.status_code}")
print(f"Headers: {response.headers}")
print(f"Text: {response.text[:200]}")
