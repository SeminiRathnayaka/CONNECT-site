import os

import google.generativeai as genai
from dotenv import load_dotenv

from app.prompts.baymax import BAYMAX_PERSONALITY
from app.prompts.orayan import (
    ORAYAN_PERSONALITY,
    build_ask_prompt,
    build_explain_prompt,
    build_glossary_prompt,
    build_summary_prompt,
    language_rule,
)
from app.services import db
from app.services.parser import summarise

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-2.5-flash"


class OrayanError(Exception):
    pass


def _model(system_instruction: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise OrayanError("GEMINI_API_KEY is not configured on the server.")
    return genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_instruction,
    )


def _require_api_key() -> None:
    if not os.getenv("GEMINI_API_KEY"):
        raise OrayanError("GEMINI_API_KEY is not configured on the server.")


def save_report(filename: str, text: str, source: str, tests: list[dict]) -> str:
    return db.save_report(filename, text, source, tests, summarise(tests))


def get_report(report_id: str) -> dict:
    record = db.get_report(report_id)
    if not record:
        raise OrayanError("That report is no longer available. Please upload it again.")
    return record


def list_reports(limit: int = 50) -> list[dict]:
    return db.list_reports(limit)


def delete_report(report_id: str) -> bool:
    return db.delete_report(report_id)


RATE_LIMIT_HINT = (
    "Orayan has reached the free Gemini usage limit for today. "
    "Please try again later, or use a paid Gemini API key."
)


def _friendly_error(error: Exception) -> str:
    text = str(error).lower()

    if "quota" in text or "429" in text or "resource_exhausted" in text:
        return RATE_LIMIT_HINT
    if "401" in text or "invalid authentication" in text or "api key" in text:
        return "Orayan could not reach Gemini. The server's API key needs to be checked."
    if "permission" in text or "403" in text:
        return "Orayan is not allowed to use this Gemini model. The API key needs to be checked."
    if "timeout" in text or "deadline" in text:
        return "Orayan took too long to answer. Please try again."

    return f"Orayan could not complete that: {error}"


def _generate(system_instruction: str, prompt: str, language: str) -> str:
    _require_api_key()
    instruction = f"{system_instruction}\n\n{language_rule(language)}"
    model = _model(instruction)
    try:
        response = model.generate_content(prompt)
    except Exception as error:
        raise OrayanError(_friendly_error(error)) from error

    text = (response.text or "").strip()
    if not text:
        raise OrayanError("Orayan returned an empty answer. Please try again.")
    return text


def _tests_block(tests: list[dict]) -> str:
    if not tests:
        return "No individual test rows could be read from this report."

    lines = []
    for test in tests:
        lines.append(
            "{name} | result: {value} | unit: {unit} | "
            "reference range on report: {range} | compared as: {status}".format(
                name=test["name"],
                value=test["value_text"] or "not readable",
                unit=test["unit"] or "not printed",
                range=test["range_text"] or "not printed",
                status=test["status"],
            )
        )
    return "\n".join(lines)


def generate_summary(report_id: str, language: str) -> str:
    record = get_report(report_id)
    tests, summary = record["tests"], record["summary"]

    if not tests:
        raise OrayanError(
            "No test rows could be read from that report. "
            "If it is a scan, please try uploading it as a clear image instead."
        )

    cached = db.get_summary_text(report_id, language)
    if cached:
        return cached

    text = _generate(
        ORAYAN_PERSONALITY,
        build_summary_prompt(tests, summary),
        language,
    )
    db.set_summary_text(report_id, language, text)
    return text


def get_summary_text(report_id: str, language: str) -> str:
    get_report(report_id)
    return db.get_summary_text(report_id, language)


def explain_test(report_id: str, test_name: str, language: str) -> str:
    record = get_report(report_id)
    test = next(
        (item for item in record["tests"] if item["name"].lower() == test_name.lower()),
        None,
    )
    if not test:
        raise OrayanError("That test was not found on this report.")

    cached = db.get_explanation(report_id, test["name"], language)
    if cached:
        return cached

    text = _generate(
        ORAYAN_PERSONALITY,
        build_explain_prompt(test, db.get_summary_text(report_id, language)),
        language,
    )
    db.set_explanation(report_id, test["name"], language, text)
    return text


def explain_term(term: str, language: str) -> str:
    cached = db.get_term_explanation(term, language)
    if cached:
        return cached

    text = _generate(ORAYAN_PERSONALITY, build_glossary_prompt(term), language)
    db.set_term_explanation(term, language, text)
    return text


def ask_about_report(report_id: str, question: str, language: str) -> str:
    record = get_report(report_id)
    context = "\n".join(
        [
            f"Report file: {record['filename']}",
            f"Tests read: {record['summary'].get('total', 0)}",
            f"Outside the reference range on the report: {record['summary'].get('flagged_total', 0)}",
            "",
            "Tests:",
            _tests_block(record["tests"]),
            "",
            "Summary already given to the user:",
            db.get_summary_text(report_id, language) or "(not generated yet)",
        ]
    )

    return _generate(BAYMAX_PERSONALITY, build_ask_prompt(question, context), language)