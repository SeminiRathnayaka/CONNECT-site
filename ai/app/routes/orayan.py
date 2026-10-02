import logging

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from app.services import orayan as orayan_service
from app.services.extract import ExtractionError, extract_text
from app.services.parser import parse_report, summarise

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orayan", tags=["orayan"])

MAX_FILENAME = 200


class ExplainRequest(BaseModel):
    report_id: str
    test_name: str = Field(min_length=1, max_length=200)
    language: str = "en"


class TermRequest(BaseModel):
    term: str = Field(min_length=1, max_length=120)


class AskRequest(BaseModel):
    report_id: str
    question: str = Field(min_length=1, max_length=2000)


class SummaryRequest(BaseModel):
    report_id: str
    language: str = "en"


def _normalise_language(language: str) -> str:
    value = (language or "en").strip().lower()
    return value[:2] if value[:2] in ("en", "si") else "en"


def _fail(error, status: int = 400) -> HTTPException:
    message = str(error)
    logger.warning("Orayan request failed: %s", message)
    return HTTPException(status_code=status, detail=message)


@router.post("/upload")
async def upload(file: UploadFile = File(...), language: str = Form("en")):
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

    report_id = orayan_service.save_report(filename, text, source, tests)

    summary_text = ""
    summary_error = None
    try:
        summary_text = orayan_service.generate_summary(report_id, language)
    except orayan_service.OrayanError as error:
        summary_error = str(error)
        logger.warning("Summary unavailable for %s: %s", filename, summary_error)

    return {
        "report_id": report_id,
        "filename": filename,
        "source": source,
        "was_image": was_image,
        "language": language,
        "tests": tests,
        "counts": summarise(tests),
        "summary_text": summary_text,
        "summary_error": summary_error,
    }


@router.post("/summary")
def summary(payload: SummaryRequest):
    language = _normalise_language(payload.language)
    try:
        record = orayan_service.get_report(payload.report_id)
        cached = orayan_service.get_summary_text(payload.report_id, language)
        if cached:
            return {
                "report_id": payload.report_id,
                "language": language,
                "summary_text": cached,
                "counts": record["summary"],
            }
        text = orayan_service.generate_summary(payload.report_id, language)
    except orayan_service.OrayanError as error:
        raise _fail(error, status=404 if "no longer available" in str(error) else 502) from error

    return {
        "report_id": payload.report_id,
        "language": language,
        "summary_text": text,
        "counts": record["summary"],
    }


@router.post("/explain")
def explain(payload: ExplainRequest):
    language = _normalise_language(payload.language)
    try:
        text = orayan_service.explain_test(payload.report_id, payload.test_name, language)
    except orayan_service.OrayanError as error:
        raise _fail(error, status=404 if "not found" in str(error) else 502) from error

    return {"test_name": payload.test_name, "language": language, "explanation": text}


@router.post("/term")
def term(payload: TermRequest, language: str = "en"):
    language = _normalise_language(language)
    try:
        text = orayan_service.explain_term(payload.term, language)
    except orayan_service.OrayanError as error:
        raise _fail(error, status=502) from error

    return {"term": payload.term, "language": language, "explanation": text}


@router.post("/ask")
def ask(payload: AskRequest, language: str = "en"):
    language = _normalise_language(language)
    try:
        text = orayan_service.ask_about_report(payload.report_id, payload.question, language)
    except orayan_service.OrayanError as error:
        raise _fail(error, status=404 if "no longer available" in str(error) else 502) from error

    return {"question": payload.question, "language": language, "answer": text}


@router.get("/reports")
def list_reports(limit: int = Query(50, ge=1, le=200)):
    return {"reports": orayan_service.list_reports(limit)}


@router.get("/reports/{report_id}")
def get_report(report_id: str, language: str = "en"):
    language = _normalise_language(language)
    try:
        record = orayan_service.get_report(report_id)
    except orayan_service.OrayanError as error:
        raise _fail(error, status=404) from error

    return {
        "report_id": record["report_id"],
        "filename": record["filename"],
        "source": record["source"],
        "created_at": record["created_at"],
        "language": language,
        "tests": record["tests"],
        "counts": record["summary"],
        "summary_text": orayan_service.get_summary_text(report_id, language),
    }


@router.delete("/reports/{report_id}")
def delete_report(report_id: str):
    if not orayan_service.delete_report(report_id):
        raise HTTPException(status_code=404, detail="That report could not be found.")
    return {"ok": True}