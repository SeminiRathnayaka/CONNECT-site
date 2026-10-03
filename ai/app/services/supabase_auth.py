"""Checks that a request really comes from a signed-in CONNECT account.

The browser sends the Supabase access token in the Authorization header. This
module verifies it before any Gemini call happens, so an outsider cannot use
your API key by guessing the address.

Two ways to verify:

1. Decode the JWT locally with the project's JWT secret. Fast, and no network
   call per request.
2. Ask Supabase to confirm the token. Used automatically when the secret is not
   set, which is what happens if you only ever run the app locally.

The user id returned here is the same id used by the profiles table and the
Row Level Security policies, so the AI service and the database agree on who
somebody is.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

logger = logging.getLogger(__name__)

# auto_error=False so a missing header returns our own clear message instead of
# FastAPI's default 403.
bearer_scheme = HTTPBearer(auto_error=False)


def _supabase_url() -> str:
    url = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").strip().rstrip("/")
    return url


def _anon_key() -> str:
    return (os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "").strip()


@lru_cache(maxsize=1)
def _jwt_secret() -> str:
    return (os.getenv("SUPABASE_JWT_SECRET") or "").strip()


def _decode_locally(token: str) -> dict | None:
    """Verifies the signature and expiry without a network call."""
    secret = _jwt_secret()
    if not secret:
        return None

    try:
        import jwt  # PyJWT
    except ImportError:
        logger.warning("PyJWT is not installed; falling back to asking Supabase.")
        return None

    try:
        # Supabase signs access tokens with HS256 by default.
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except Exception as error:  # noqa: BLE001 - any failure means "not valid"
        logger.info("Local token check failed, trying Supabase: %s", error)
        return None


def _verify_with_supabase(token: str) -> dict | None:
    """Asks Supabase whether the token is genuine and still active."""
    url = _supabase_url()
    key = _anon_key()
    if not url or not key:
        return None

    try:
        response = httpx.get(
            f"{url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": key},
            timeout=5.0,
        )
    except httpx.HTTPError as error:
        logger.warning("Could not reach Supabase to check the token: %s", error)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not confirm your session. Please try again in a moment.",
        ) from error

    if response.status_code != 200:
        return None

    try:
        return response.json()
    except ValueError:
        return None


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """FastAPI dependency that returns the signed-in account.

    Returns a dict with at least an "id" key, which matches the shape the
    routes expect.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to use the health assistant.",
        )

    token = credentials.credentials

    claims = _decode_locally(token) or _verify_with_supabase(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        )

    user_id = claims.get("sub") or claims.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session could not be read. Please sign in again.",
        )

    return {
        "id": str(user_id),
        "email": claims.get("email", ""),
        "role": claims.get("role", "authenticated"),
    }