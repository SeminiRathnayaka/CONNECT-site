"""Signup, sign in, sign out, and "who am I" endpoints."""

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field

from app.services import auth, db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=8, max_length=200)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=200)


@router.post("/register")
def register(payload: RegisterRequest, response: Response) -> dict:
    result = auth.register(payload.name, payload.email, payload.password)
    auth.start_session(response, result["user"]["id"])
    return result


@router.post("/login")
def login(payload: LoginRequest, response: Response) -> dict:
    result = auth.login(payload.email, payload.password)
    auth.start_session(response, result["user"]["id"])
    return result


@router.post("/logout")
def logout(request: Request, response: Response) -> dict:
    auth.end_session(response, request)
    return {"ok": True}


@router.get("/me")
def me(request: Request) -> dict:
    user = auth.current_user(request)
    if not user:
        return {"user": None}
    return {"user": auth.public_user(user)}


@router.get("/retention")
def retention(user: dict = Depends(auth.require_user)) -> dict:
    """Tells the frontend what history policy applies, so the UI can explain it."""
    return {
        "max_conversations": db.MAX_CONVERSATIONS,
        "report_retention_days": db.REPORT_RETENTION_DAYS,
    }