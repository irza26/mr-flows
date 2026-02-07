from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ch_dashboard():
    response = client.get("/ch/dashboard?station=Cihawuk")

    assert response.status_code == 200
    assert "current" in response.json()
