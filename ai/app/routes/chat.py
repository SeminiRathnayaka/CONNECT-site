import logging
import os
import uuid

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.prompts.baymax import BAYMAX_PERSONALITY
from app.services import db

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

MODEL_NAME = "gemini-2.5-flash"

LANGUAGE_RULES = {
    "en": (
        "LANGUAGE: Reply in simple, natural English. Use a few gentle emojis "
        "where they fit, for example 🤍 😊."
    ),
    "si": (
        "LANGUAGE: Reply in natural Sinhala (සිංහල) written in Sinhala script. Keep medical "
        "terms understandable and use everyday Sinhala. If a term has no good Sinhala "
        "equivalent, give the English term in brackets. Use a few gentle emojis "
        "where they fit, for example 🤍 😊."
    ),
}


def _normalise_language(language: str | None) -> str:
    value = (language or "en").strip().lower()
    return value[:2] if value[:2] in ("en", "si") else "en"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None
    language: str = "en"


class ResetRequest(BaseModel):
    session_id: str


@router.post("/chat")
def chat(payload: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "reply": "My connection is not set up yet.",
            "session_id": payload.session_id or "",
            "language": _normalise_language(payload.language),
        }

    session_id = payload.session_id or str(uuid.uuid4())
    language = _normalise_language(payload.language)
    user_message = payload.message.strip()

    instruction = f"{BAYMAX_PERSONALITY}\n\n{LANGUAGE_RULES[language]}"
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=instruction,
    )
    chat_session = model.start_chat(history=db.get_chat_history(session_id))

    try:
        response = chat_session.send_message(user_message)
    except Exception as error:
        from app.services.orayan import _friendly_error

        logger.warning("Chat request failed: %s", error)
        raise HTTPException(status_code=502, detail=_friendly_error(error)) from error

    reply = (response.text or "").strip()
    if not reply:
        raise HTTPException(status_code=502, detail="Baymax returned an empty reply. Please try again.")

    db.append_chat(session_id, user_message, reply)
    return {"reply": reply, "session_id": session_id, "language": language}


@router.post("/reset")
def reset(payload: ResetRequest):
    db.clear_chat(payload.session_id)
    return {"ok": True}