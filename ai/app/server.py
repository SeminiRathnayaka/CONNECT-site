import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Loaded before app imports, because services read environment variables such as
# SUPABASE_URL and GEMINI_API_KEY at import time.
load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        ".env",
    )
)

from app.routes.chat import router as chat_router  # noqa: E402
from app.routes.orayan import router as orayan_router  # noqa: E402

# There is no database start-up step any more: Supabase holds every account and
# report, so the service starts even when nothing else is running.
app = FastAPI(title="CONNECT AI", version="3.1.0")

# Sign-in is handled by Supabase, and the browser sends a bearer token rather
# than a cookie, so requests no longer need credentials. The origins are still
# listed explicitly because browsers do not allow "*" with an Authorization
# header on cross-origin requests.
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

# Extra origins can be added for a deployed site, comma separated.
_extra = os.getenv("AI_ALLOWED_ORIGINS", "").strip()
if _extra:
    _allowed_origins.extend(origin.strip() for origin in _extra.split(",") if origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The local username/password auth routes are gone: Supabase owns accounts now,
# and keeping a second sign-in path would mean two sources of truth.
app.include_router(chat_router)
app.include_router(orayan_router)


@app.get("/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "model_configured": bool(os.getenv("GEMINI_API_KEY")),
        "supabase_configured": bool((os.getenv("SUPABASE_URL") or "").strip()),
        "storage": "supabase",
    }


if __name__ == "__main__":
    uvicorn.run("app.server:app", host="127.0.0.1", port=8000, reload=True)