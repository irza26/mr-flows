from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import conn
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login_admin(data: LoginRequest):
    cur = conn.cursor()

    cur.execute(
        "SELECT id, email, password_hash, name FROM admin_users WHERE email = %s",
        (data.email,)
    )

    user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Email tidak terdaftar")

    user_id, email, password_hash, name = user

    if not pwd_context.verify(data.password, password_hash):
        raise HTTPException(status_code=401, detail="Password salah")

    return {
        "id": user_id,
        "email": email,
        "name": name
    }
