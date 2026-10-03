"""Account creation, password hashing, and session-cookie handling.

The React app originally "signed in" by writing a name and email to
localStorage. That is not authentication: anyone could type anyone else's email
and the app would accept it. Since chat history and medical reports now belong
to an account, a real check is required before that data can be called private.

Passwords are hashed with PBKDF2-HMAC-SHA256 using a per-user random salt. This
uses only the Python standard library, so no extra dependency is needed. Plain
passwords are never stored or logged.
"""

import base64
import hashlib
import hmac
import os

from fastapi import HTTPException, Request

from app.services import db

# 240k iterations is the current OWASP guidance for PBKDF2-HMAC-SHA256.
PBKDF2_ITERATIONS = int(os.getenv("CONNECT_PBKDF2_ITERATIONS", "240000"))
SESSION_COOKIE = "connect_session"

MIN_PASSWORD_LENGTH = 8


def hash_password(password: str) -> str:
    """Returns pbkdf2_sha256$iterations$salt$hash, all base64."""
    salt = os.urandom(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return "$".join(
        [
            "pbkdf2_sha256",
            str(PBKDF2_ITERATIONS),
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(derived).decode("ascii"),
        ]
    )


def verify_password(password: str, stored: str) -> bool:
    """Constant-time check of a password against a stored hash."""
    try:
        algorithm, iterations, salt_b64, hash_b64 = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        derived = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, int(iterations)
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(derived, expected)


def normalise_email(email: str) -> str:
    return (email or "").strip().lower()


def register(name: str, email: str, password: str) -> dict:
    email = normalise_email(email)

    if not (name or "").strip():
        raise HTTPException(400, "Please enter your name.")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(400, "Please enter a valid email address.")
    if len(password or "") < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            400, f"Please use a password of at least {MIN_PASSWORD_LENGTH} characters."
        )

    if db.get_user_by_email(email):
        raise HTTPException(409, "An account already exists for that email.")

    user_id = db.create_user(email, name, hash_password(password))
    record = db.get_user_by_id(user_id)
    return {"user": public_user(record)}


def login(email: str, password: str) -> dict:
    record = db.get_user_by_email(normalise_email(email))
    # Same message either way, so this cannot be used to discover which emails
    # have accounts.
    if not record or not verify_password(password or "", record["password_hash"]):
        raise HTTPException(401, "Incorrect email or password.")

    return {"user": public_user(record)}


def start_session(response, user_id: str) -> None:
    token, expires_at = db.create_session(user_id)
    max_age = db.SESSION_RETENTION_DAYS * 24 * 60 * 60
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return expires_at


def end_session(response, request: Request) -> None:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        db.delete_session(token)
    response.delete_cookie(SESSION_COOKIE, path="/")


def current_user(request: Request) -> dict | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    return db.get_user_by_session(token)


def require_user(request: Request) -> dict:
    """FastAPI dependency that rejects the request when nobody is signed in."""
    user = current_user(request)
    if not user:
        raise HTTPException(401, "Please sign in to continue.")
    return user


def public_user(user: dict) -> dict:
    created_at = user.get("created_at")
    if hasattr(created_at, "date"):
        created_at = created_at.date().isoformat()
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "created_at": created_at or "",
    }