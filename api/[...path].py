"""
Vercel entry point for the CONNECT AI service.

Vercel turns every module under api/ into a serverless function. The file name
is the catch-all [...path] because the application's own routes already start
with /api, at /api/chat and /api/orayan/upload. A plain api/index.py would only
answer /api itself and nothing below it.

The application itself is untouched and still runs locally with uvicorn, so there
is one implementation rather than two.

What this costs compared with a normal server:

- Vercel rejects request bodies over 4.5 MB, which is why MAX_BYTES in
  ai/app/services/extract.py is 4 MB. Larger report scans cannot be uploaded.
- A function is stopped when unused and started on the next request, so the
  first call after a quiet period is slow while it starts.
- A single call has a time limit, and reading a report through Gemini can take
  a good part of it.

Those are reasons to move this somewhere with more room if it ever has to handle
real traffic. They are not reasons it cannot work here.
"""

import os
import sys

# The application lives in ai/, which is not on the import path when Vercel runs
# the function, so it is added before the import below.
AI_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ai")
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from app.server import app  # noqa: E402,F401