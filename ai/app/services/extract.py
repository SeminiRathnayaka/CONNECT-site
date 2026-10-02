import io
import os

import google.generativeai as genai
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

IMAGE_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
}

MAX_BYTES = 12 * 1024 * 1024

TRANSCRIBE_PROMPT = """
Transcribe this medical report image into plain text.

Rules:
- Output ONLY the visible text. No commentary, no markdown fences, no explanations.
- Keep the original layout as closely as possible using spaces and line breaks.
- Keep table columns separated by at least two spaces.
- Preserve every number, unit and symbol exactly as printed.
- If a value is unreadable write [unreadable] instead of guessing.
- Include headings, patient details, test names, results, units and reference ranges.
"""


class ExtractionError(Exception):
    pass


def _readable_error(error: Exception) -> str:
    text = str(error).lower()
    if "quota" in text or "429" in text or "resource_exhausted" in text:
        return (
            "Orayan has reached the free Gemini usage limit for today. "
            "Please try again later, or use a paid Gemini API key."
        )
    if "401" in text or "invalid authentication" in text:
        return "The server's Gemini API key is not valid."
    if "permission" in text or "403" in text:
        return "This API key is not allowed to read images with this model."
    if "unsupported" in text or "mime" in text:
        return "That image format could not be read. Please try a PNG or JPG."
    return f"Could not read the image: {error}"


def _model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ExtractionError("GEMINI_API_KEY is not configured.")
    return genai.GenerativeModel(model_name="gemini-2.5-flash")


def _extract_pdf(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = [(page.extract_text() or "") for page in reader.pages]
    except Exception as error:
        raise ExtractionError(f"Could not read the PDF: {error}") from error

    text = "\n".join(pages).strip()
    if not text:
        raise ExtractionError(
            "This PDF has no selectable text (it looks like a scan). "
            "Please upload it as an image so it can be read."
        )
    return text


def _extract_image(data: bytes, extension: str) -> tuple[str, bool]:
    mime_type = IMAGE_MIME_TYPES.get(extension.lower(), "image/png")
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction="You are a precise document transcription engine.",
    )

    # google-generativeai 0.8.x takes inline bytes as an inline_data dict.
    inline = {"inline_data": {"mime_type": mime_type, "data": data}}

    try:
        response = model.generate_content([TRANSCRIBE_PROMPT, inline])
    except Exception as error:
        raise ExtractionError(_readable_error(error)) from error

    text = (response.text or "").strip()
    if not text:
        raise ExtractionError("No readable text was found in that image.")
    return text, True


def extract_text(filename: str, data: bytes) -> tuple[str, str, bool]:
    if not data:
        raise ExtractionError("The uploaded file is empty.")

    if len(data) > MAX_BYTES:
        raise ExtractionError("That file is larger than 12 MB. Please upload a smaller file.")

    extension = os.path.splitext(filename or "")[1].lower()

    if extension == ".pdf" or data[:5] == b"%PDF-":
        return _extract_pdf(data), "pdf", False

    if extension in IMAGE_MIME_TYPES:
        text, _ = _extract_image(data, extension)
        return text, "image", True

    raise ExtractionError(
        "Unsupported file type. Please upload a PDF, or a PNG, JPG, WEBP or BMP image. "
        "iPhone HEIC photos need to be saved as JPG first."
    )