import logging
import os

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.prompts.baymax import BAYMAX_PERSONALITY
from app.services import auth, db

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
def chat(payload: ChatRequest, user: dict = Depends(auth.require_user)):
    user_id = user["id"]
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "reply": "My connection is not set up yet.",
            "session_id": payload.session_id or "",
            "language": _normalise_language(payload.language),
        }

    # A conversation id from another account is ignored and replaced, so nobody
    # can join someone else's history by guessing an id.
    session_id = db.get_or_create_conversation(user_id, payload.session_id)
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
    db.touch_conversation(session_id, user_message)
    return {"reply": reply, "session_id": session_id, "language": language}


@router.post("/reset")
def reset(payload: ResetRequest, user: dict = Depends(auth.require_user)):
    # Deletes the whole conversation rather than only its messages, so the id
    # cannot be reused afterwards.
    if not db.delete_conversation(user["id"], payload.session_id):
        raise HTTPException(status_code=404, detail="That conversation was not found.")
    return {"ok": True}


@router.get("/conversations")
def conversations(user: dict = Depends(auth.require_user)):
    """Lists this account's retained conversations, newest first."""
    return {
        "conversations": db.list_conversations(user["id"]),
        "max_conversations": db.MAX_CONVERSATIONS,
    }