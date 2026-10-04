"""Runs the Orayan report pipeline end to end with a real PDF.

Uploads a generated blood-test PDF through /api/orayan/upload, which is the first
thing the user does after signing in. That single call exercises PDF text
extraction, the Gemini call, and the parser that turns the model's reply into
structured rows, so a break anywhere in that chain shows up here.

The token is a real Supabase sign-in, because the route is protected and a
fabricated one would only prove the 401 path.
"""

import io
import json
import os
import sys
import time
import urllib.request

from dotenv import load_dotenv

AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(AI_DIR, ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

sys.path.insert(0, AI_DIR)

from fastapi.testclient import TestClient  # noqa: E402

from app.server import app  # noqa: E402

def build_pdf(lines: list[str]) -> bytes:
    """Builds a valid single-page PDF with a correct cross-reference table.

    A hand-written PDF needs byte offsets that match the file exactly, so they
    are computed while the objects are assembled rather than guessed.
    """
    content = "BT /F1 12 Tf 60 720 Td 14 TL\n"
    for line in lines:
        escaped = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        content += f"({escaped}) Tj T*\n"
    content += "ET"
    stream = content.encode("latin-1")

    objects = [
        b"<</Type/Catalog/Pages 2 0 R>>",
        b"<</Type/Pages/Kids[3 0 R]/Count 1>>",
        b"<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R"
        b"/Resources<</Font<</F1 5 0 R>>>>>>",
        b"<</Length " + str(len(stream)).encode() + b">>stream\n" + stream + b"\nendstream",
        b"<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"

    start_xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += f"trailer\n<</Size {len(objects) + 1}/Root 1 0 R>>\nstartxref\n{start_xref}\n%%EOF\n".encode()
    return bytes(out)


SAMPLE_PDF = build_pdf(
    [
        "COMPLETE BLOOD COUNT",
        "Haemoglobin   13.4 g/dL      11.0 - 15.5    Normal",
        "White cells   6.1 10^9/L     4.0 - 11.0     Normal",
        "Platelets     240 10^9/L     150 - 400      Normal",
        "Haematocrit   0.40           0.36 - 0.46    Normal",
        "Ferritin      18 ug/L        30 - 300       Low",
    ]
)


def get_token() -> str:
    email = f"orayan-{int(time.time() * 1000)}@gmail.com"
    body = json.dumps({"email": email, "password": f"Probe!{int(time.time())}"}).encode()
    request = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/signup",
        data=body,
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)["access_token"]


token = get_token()
client = TestClient(app, raise_server_exceptions=False)
headers = {"Authorization": f"Bearer {token}"}

response = client.post(
    "/api/orayan/upload",
    files={"file": ("blood-count.pdf", io.BytesIO(SAMPLE_PDF), "application/pdf")},
    data={"language": "en"},
    headers=headers,
)

print(f"POST /api/orayan/upload -> HTTP {response.status_code}")

if response.status_code != 200:
    sys.stdout.buffer.write(
        json.dumps(response.json(), ensure_ascii=False, indent=2)[:1500].encode("utf-8")
    )
    print()
    raise SystemExit("the upload route failed")

payload = response.json()
tests = payload.get("tests") or []

out = {
    "filename": payload.get("filename"),
    "source": payload.get("source"),
    "tests_read": len(tests),
    "rows": [
        {k: row.get(k) for k in ("name", "value", "unit", "status")}
        for row in tests[:8]
    ],
    "summary_present": bool(payload.get("summary_text")),
    "summary_error": payload.get("summary_error"),
    "counts": payload.get("counts"),
    "summary_head": (payload.get("summary_text") or "")[:200],
}
sys.stdout.buffer.write((json.dumps(out, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))

problems = []
if not tests:
    problems.append("no test rows came back from a readable blood-count PDF")
if not payload.get("summary_text"):
    problems.append(
        "no summary was produced: " + str(payload.get("summary_error") or "no reason given")
    )

print()
if problems:
    for problem in problems:
        print(f"PROBLEM: {problem}")
    raise SystemExit(1)

print("the report pipeline works: PDF text was read, rows were parsed, a summary was written")
print("Now click the same thing in the browser to confirm the UI path.")