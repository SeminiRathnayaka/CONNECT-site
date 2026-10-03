import logging
import os

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.prompts.baymax import BAYMAX_PERSONALITY
from app.services import supabase_auth

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

MODEL_NAME = "gemini-2.5-flash"

# How many earlier turns to replay. Enough for a coherent reply without sending
# a whole conversation on every message.
MAX_HISTORY_TURNS = 20

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


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|model)$")
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: str = "en"
    # The conversation lives in the browser's Supabase tables, protected by Row
    # Level Security, so the last turns are sent along and this service stays
    # stateless. That keeps a second copy of somebody's health conversation out
    # of a second database.
    history: list[ChatMessage] = Field(default_factory=list)


@router.post("/chat")
def chat(payload: ChatRequest, user: dict = Depends(supabase_auth.current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    language = _normalise_language(payload.language)

    if not api_key:
        return {"reply": "My connection is not set up yet.", "language": language}

    # Only the most recent turns are needed for context, and the cap keeps a
    # long conversation from growing past the model's context window.
    history = [
        {"role": turn.role, "parts": [turn.content]}
        for turn in payload.history[-MAX_HISTORY_TURNS:]
    ]

    instruction = f"{BAYMAX_PERSONALITY}\n\n{LANGUAGE_RULES[language]}"
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=instruction,
    )
    chat_session = model.start_chat(history=history)

    user_message = payload.message.strip()

    try:
        response = chat_session.send_message(user_message)
    except Exception as error:
        from app.services.orayan import _friendly_error

        logger.warning("Chat request failed: %s", error)
        raise HTTPException(status_code=502, detail=_friendly_error(error)) from error

    reply = (response.text or "").strip()
    if not reply:
        raise HTTPException(status_code=502, detail="Baymax returned an empty reply. Please try again.")

    return {"reply": reply, "language": language}