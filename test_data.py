import requests

url = "http://127.0.0.1:8000/rainfall"
params = {
    "station": "Ibun",
    "start": "2023-01-01",
    "end": "2023-01-31"
}

r = requests.get(url, params=params)
data = r.json()

print(type(data))
print("Total data:", len(data))
print("3 data pertama:")
print(data[:3])
