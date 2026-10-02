import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router
from app.routes.orayan import router as orayan_router
from app.services import db

load_dotenv()


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="CONNECT AI", version="2.0.0", lifespan=lifespan)

# The React app is served by Vite on a different port in development, so the
# browser needs CORS. Credentials are never used, so "*" is safe here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(orayan_router)


@app.get("/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "model_configured": bool(os.getenv("GEMINI_API_KEY")),
        "database": db.DB_PATH,
    }


if __name__ == "__main__":
    uvicorn.run("app.server:app", host="127.0.0.1", port=8000, reload=True)