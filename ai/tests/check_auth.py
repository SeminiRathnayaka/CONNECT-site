"""Checks that the FastAPI service enforces Supabase tokens correctly.

Calls the chat endpoint three ways and reports the status each one produced, so
the difference between "refused because there is no token" and "got past the auth
check" is visible without needing the Gemini quota to be available.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

from dotenv import load_dotenv

AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(AI_DIR, ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

sys.path.insert(0, AI_DIR)

from fastapi.testclient import TestClient  # noqa: E402

from app.server import app  # noqa: E402


def get_token() -> tuple[str, str]:
    """Signs up a throwaway account and returns its access token and id."""
    email = f"authprobe-{int(time.time() * 1000)}@gmail.com"
    body = json.dumps({"email": email, "password": f"Probe!{int(time.time())}"}).encode()

    request = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/signup",
        data=body,
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)

    if not payload.get("access_token"):
        raise SystemExit(f"could not sign up: {payload}")

    token = payload["access_token"]
    claims = json.loads(
        urllib.request.urlopen(
            urllib.request.Request(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"apikey": ANON_KEY, "Authorization": f"Bearer {token}"},
            ),
            timeout=30,
        ).read()
    )
    return token, claims["id"]


def status_for(client: TestClient, headers: dict[str, str]) -> int:
    try:
        response = client.post(
            "/api/chat",
            json={"message": "hello"},
            headers=headers,
        )
    except Exception as failure:  # noqa: BLE001
        print(f"    raised {type(failure).__name__}: {failure}")
        return -1
    return response.status_code


token, user_id = get_token()
print(f"  signed in throwaway account {user_id}")

client = TestClient(app, raise_server_exceptions=False)

no_token = status_for(client, {})
print(f"  no token            -> HTTP {no_token}")

garbage = status_for(client, {"Authorization": "Bearer not-a-real-token"})
print(f"  malformed token     -> HTTP {garbage}")

real = status_for(client, {"Authorization": f"Bearer {token}"})
print(f"  genuine token       -> HTTP {real}")

problems = []
if no_token in (200,):
    problems.append("the endpoint answered without any token at all")
if garbage in (200,):
    problems.append("the endpoint accepted a made-up token")
if real in (401, 403):
    problems.append("the endpoint rejected a genuine Supabase token")
if real == -1:
    problems.append("the genuine token request crashed")

print()
if problems:
    for problem in problems:
        print(f"PROBLEM: {problem}")
    raise SystemExit(1)

print("auth behaves correctly:")
print(f"  refused without a token ({no_token}) and a fake one ({garbage})")
print(f"  accepted a real Supabase token ({real})")