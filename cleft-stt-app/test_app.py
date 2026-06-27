import requests
import time
import os

with open("test.wav", "wb") as f:
    f.write(b"RIFF" + b"\x00" * 2000)

files = {'audio': open('test.wav', 'rb')}
data = {'mode': 'async'}

resp = requests.post("http://localhost:5000/transcribe", files=files, data=data)
print(resp.json())
task_id = resp.json().get('task_id')

if task_id:
    for _ in range(10):
        r = requests.get(f"http://localhost:5000/transcribe-status/{task_id}")
        print(r.status_code, r.json())
        time.sleep(2)
