"""
FastAPI router — /auth
Handles user registration, login, and profile retrieval.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.agriniti.core.database import get_db
from app.agriniti.core.models import User
from app.agriniti.services import chroma_service, embedding_service
from app.agriniti.services.auth_service import (
    create_access_token,
    decode_token,
    get_user_by_email,
    get_user_by_id,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------------------------------------------------------------------------
# Pydantic schemas (auth-specific)
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "farmer"          # farmer | buyer | both
    state: str | None = None
    district: str | None = None
    pincode: str | None = None
    primary_crops: str | None = None   # e.g. "Onion,Garlic,Tomato"
    phone: str | None = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    state: str | None
    district: str | None
    pincode: str | None
    primary_crops: str | None
    phone: str | None
    is_verified: bool
    tier: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------------
# Dependency — current authenticated user
# ---------------------------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenOut, status_code=201, summary="Create account")
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        role=body.role,
        state=body.state,
        district=body.district,
        pincode=body.pincode,
        primary_crops=body.primary_crops,
        phone=body.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Embed buyer profile into ChromaDB (best-effort, non-blocking)
    if user.role in ("buyer", "both"):
        try:
            text = embedding_service.build_buyer_text(
                name=user.name,
                primary_crops=user.primary_crops,
                state=user.state,
                district=user.district,
                role=user.role,
            )
            vec = await embedding_service.embed_text(text, task_type="RETRIEVAL_DOCUMENT")
            chroma_service.upsert_buyer(
                user_id=user.id,
                embedding=vec,
                metadata={
                    "name": user.name,
                    "state": user.state or "",
                    "crops": user.primary_crops or "",
                },
            )
        except Exception:
            pass  # non-critical

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut, summary="Login and get JWT token")
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(db, form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut, summary="Get current user profile")
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
