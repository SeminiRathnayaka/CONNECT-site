import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services import orayan as orayan_service, supabase_auth
from app.services.extract import ExtractionError, extract_text
from app.services.parser import parse_report, summarise

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orayan", tags=["orayan"])

MAX_FILENAME = 200

# A lab report is small, but this stops a crafted request from sending an
# enormous payload that would be pasted into a prompt.
MAX_REPORT_TEXT = 20_000


def _counts(tests: list[dict], supplied: dict) -> dict:
    """Trusts the app's counts when it sent them, otherwise works them out."""
    return supplied or summarise(tests)


class ReportContext(BaseModel):
    """The parsed report, sent by the app because the service keeps no copy.

    Supabase stores the report; this only carries enough of it for Gemini to
    answer questions. Anything absent simply makes the answer more general.
    """

    filename: str = Field(default="", max_length=200)
    tests: list[dict] = Field(default_factory=list)
    counts: dict = Field(default_factory=dict)
    summary_text: str = ""


class ExplainRequest(ReportContext):
    test_name: str = Field(min_length=1, max_length=200)
    language: str = "en"


class TermRequest(BaseModel):
    term: str = Field(min_length=1, max_length=120)


class AskRequest(ReportContext):
    question: str = Field(min_length=1, max_length=2000)
    language: str = "en"


class SummaryRequest(ReportContext):
    language: str = "en"


def _normalise_language(language: str) -> str:
    value = (language or "en").strip().lower()
    return value[:2] if value[:2] in ("en", "si") else "en"


def _fail(error, status: int = 400) -> HTTPException:
    message = str(error)
    logger.warning("Orayan request failed: %s", message)
    return HTTPException(status_code=status, detail=message)


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    language: str = Form("en"),
    user: dict = Depends(supabase_auth.current_user),
):
    del user
    language = _normalise_language(language)
    filename = (file.filename or "report")[:MAX_FILENAME]

    try:
        data = await file.read()
        text, source, was_image = extract_text(filename, data)
    except ExtractionError as error:
        raise _fail(error) from error
    except Exception as error:
        logger.exception("Unexpected extraction error")
        raise _fail("Orayan could not read that file.") from error

    tests = parse_report(text)

    if not tests:
        raise _fail(
            "No test rows could be read from that file. "
            "If it is a scan, please try uploading a clear image of the report."
        )

    counts = summarise(tests)

    # The report itself is not stored here. The app saves it in Supabase and
    # sends the parsed rows back with any later question.
    summary_text = ""
    summary_error = None
    try:
        summary_text = orayan_service.generate_summary(tests, counts, language)
    except orayan_service.OrayanError as error:
        summary_error = str(error)
        logger.warning("Summary unavailable for %s: %s", filename, summary_error)

    return {
        "filename": filename,
        "source": source,
        "was_image": was_image,
        "language": language,
        "tests": tests,
        "counts": counts,
        "summary_text": summary_text,
        "summary_error": summary_error,
    }


@router.post("/summary")
def summary(payload: SummaryRequest, user: dict = Depends(supabase_auth.current_user)):
    del user  # The account is checked; Supabase already holds the report itself.
    language = _normalise_language(payload.language)
    counts = _counts(payload.tests, payload.counts)

    try:
        text = orayan_service.generate_summary(payload.tests, counts, language)
    except orayan_service.OrayanError as error:
        raise _fail(error, status=502) from error

    return {"language": language, "summary_text": text, "counts": counts}


@router.post("/explain")
def explain(payload: ExplainRequest, user: dict = Depends(supabase_auth.current_user)):
    del user
    language = _normalise_language(payload.language)
    try:
        text = orayan_service.explain_test(
            payload.tests,
            payload.test_name,
            payload.summary_text[:MAX_REPORT_TEXT],
            language,
        )
    except orayan_service.OrayanError as error:
        raise _fail(error, status=502) from error

    return {"test_name": payload.test_name, "language": language, "explanation": text}


@router.post("/term")
def term(
    payload: TermRequest,
    language: str = "en",
    user: dict = Depends(supabase_auth.current_user),
):
    # Definitions are shared reference text so no report is involved, but the
    # endpoint still needs an account: otherwise anyone who finds the address
    # could spend the Gemini quota.
    del user
    language = _normalise_language(language)
    try:
        text = orayan_service.explain_term(payload.term, language)
    except orayan_service.OrayanError as error:
        raise _fail(error, status=502) from error

    return {"term": payload.term, "language": language, "explanation": text}


@router.post("/ask")
def ask(payload: AskRequest, language: str = "en", user: dict = Depends(supabase_auth.current_user)):
    del user
    language = _normalise_language(language)
    try:
        text = orayan_service.ask_about_report(
            payload.filename,
            payload.tests,
            _counts(payload.tests, payload.counts),
            payload.question,
            payload.summary_text[:MAX_REPORT_TEXT],
            language,
        )
    except orayan_service.OrayanError as error:
        raise _fail(error, status=502) from error

    return {"question": payload.question, "language": language, "answer": text}