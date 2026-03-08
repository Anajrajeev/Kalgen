"""
Auth service — password hashing (bcrypt 5.x) + JWT encode/decode.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from app.database import supabase
from app.agriniti.core.config import settings
from app.agriniti.core.models import User


# ---------------------------------------------------------------------------
# Password helpers (using bcrypt directly — passlib is incompatible with bcrypt>=4)
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> str | None:
    """Returns user_id (sub) or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def get_user_by_email(db: any, email: str) -> User | None:
    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        if response.data:
            return User(**response.data[0])
        return None
    except Exception:
        return None


def get_user_by_id(db: any, user_id: str) -> User | None:
    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        if response.data:
            return User(**response.data[0])
        return None
    except Exception:
        return None
