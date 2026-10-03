import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Loaded before app imports, because services read environment variables such as
# DATABASE_URL and GEMINI_API_KEY at import time.
load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        ".env",
    )
)

from app.routes.auth import router as auth_router  # noqa: E402
from app.routes.chat import router as chat_router  # noqa: E402
from app.routes.orayan import router as orayan_router  # noqa: E402
from app.services import db  # noqa: E402


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.init_db()
    expired = db.purge_expired_sessions()
    if expired:
        print(f"Removed {expired} expired session(s).")
    yield


app = FastAPI(title="CONNECT AI", version="2.1.0", lifespan=lifespan)

# Sign-in uses an HttpOnly session cookie, so credentials must be allowed and
# origins must be listed explicitly: browsers reject "*" together with cookies.
# In development Vite proxies /api to this server, which keeps requests
# same-origin, but these origins cover running the two separately.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(orayan_router)


@app.get("/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "model_configured": bool(os.getenv("GEMINI_API_KEY")),
        "database": "postgresql",
    }


if __name__ == "__main__":
    uvicorn.run("app.server:app", host="127.0.0.1", port=8000, reload=True)