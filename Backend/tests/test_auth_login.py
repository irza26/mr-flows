from fastapi.testclient import TestClient
from app.main import app
from passlib.context import CryptContext

client = TestClient(app)

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

class FakeCursor:
    def __init__(self, user):
        self.user = user

    def execute(self, query, params):
        pass

    def fetchone(self):
        return self.user


class FakeConn:
    def __init__(self, user):
        self.user = user

    def cursor(self):
        return FakeCursor(self.user)

def test_login_success(monkeypatch):
    fake_password = "admin123"
    fake_hash = pwd_context.hash(fake_password)

    fake_user = (1, "admin@test.com", fake_hash, "Admin Test")

    monkeypatch.setattr(
        "app.routers.auth.conn",
        FakeConn(fake_user)
    )

    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123"
    })

    assert response.status_code == 200
    assert response.json()["email"] == "admin@test.com"


def test_login_wrong_password(monkeypatch):
    fake_hash = pwd_context.hash("password_benar")

    fake_user = (1, "admin@test.com", fake_hash, "Admin Test")

    monkeypatch.setattr(
        "app.routers.auth.conn",
        FakeConn(fake_user)
    )

    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "salah"
    })

    assert response.status_code == 401
    assert response.json()["detail"] == "Password salah"


def test_login_email_not_found(monkeypatch):
    monkeypatch.setattr(
        "app.routers.auth.conn",
        FakeConn(None)
    )

    response = client.post("/auth/login", json={
        "email": "tidakada@test.com",
        "password": "apaaja"
    })

    assert response.status_code == 401
    assert response.json()["detail"] == "Email tidak terdaftar"
