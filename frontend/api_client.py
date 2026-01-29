# frontend/api_client.py
import requests

BASE_URL = "http://127.0.0.1:5050/api"


def fetch_data(endpoint: str):
    url = f"{BASE_URL}/{endpoint}/"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()