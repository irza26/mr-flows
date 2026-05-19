from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_tma_dashboard():
    response = client.get("/tma/dashboard?station=Bendung_Wanir")

    assert response.status_code == 200
    assert "status" in response.json()
    assert "last" in response.json()
