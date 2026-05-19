from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_api():
    response = client.get("/dashboard")

    assert response.status_code == 200
    assert isinstance(response.json(), dict)
