from __future__ import annotations

import hashlib
import json
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
from app.services.parser import summarise

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-2.5-flash"


class OrayanError(Exception):
    pass


# --------------------------------------------------------------------------
# Answer cache
# --------------------------------------------------------------------------
# The service keeps no reports of its own: Supabase is the only place a report
# lives. That means a summary or an explanation has to be worked out again when
# somebody reopens a report, which would spend the Gemini allowance every time.
#
# So finished answers are held in memory for a while. The key is a hash of the
# report text that produced them, not the report id, so two different reports
# can never be given each other's answers.
_CACHE: dict[str, str] = {}
_CACHE_LIMIT = 200


def _key(*parts: str) -> str:
    joined = "\u0000".join(parts)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()


def _cached(key: str) -> str:
    return _CACHE.get(key, "")


def _remember(key: str, text: str) -> str:
    if len(_CACHE) >= _CACHE_LIMIT:
        # Plain dicts keep insertion order, so the oldest answer goes first.
        _CACHE.pop(next(iter(_CACHE)), None)
    _CACHE[key] = text
    return text


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


def generate_summary(tests: list[dict], counts: dict, language: str) -> str:
    if not tests:
        raise OrayanError(
            "No test rows could be read from that report. "
            "If it is a scan, please try uploading it as a clear image instead."
        )

    cache_key = _key("summary", language, json.dumps(tests, sort_keys=True, default=str))
    hit = _cached(cache_key)
    if hit:
        return hit

    text = _generate(
        ORAYAN_PERSONALITY,
        build_summary_prompt(tests, counts),
        language,
    )
    return _remember(cache_key, text)


def explain_test(
    tests: list[dict], test_name: str, summary_text: str, language: str
) -> str:
    test = next(
        (item for item in tests if str(item.get("name", "")).lower() == test_name.lower()),
        None,
    )
    if not test:
        raise OrayanError("That test was not found on this report.")

    cache_key = _key(
        "explain", language, test_name.lower(), summary_text, json.dumps(test, sort_keys=True, default=str)
    )
    hit = _cached(cache_key)
    if hit:
        return hit

    text = _generate(
        ORAYAN_PERSONALITY,
        build_explain_prompt(test, summary_text),
        language,
    )
    return _remember(cache_key, text)


def explain_term(term: str, language: str) -> str:
    # Definitions are the same for everybody, so this one is shared.
    cache_key = _key("term", language, term.lower())
    hit = _cached(cache_key)
    if hit:
        return hit

    return _remember(cache_key, _generate(ORAYAN_PERSONALITY, build_glossary_prompt(term), language))


def ask_about_report(
    filename: str,
    tests: list[dict],
    counts: dict,
    question: str,
    summary_text: str,
    language: str,
) -> str:
    context = "\n".join(
        [
            f"Report file: {filename or 'lab report'}",
            f"Tests read: {counts.get('total', len(tests))}",
            f"Outside the reference range on the report: {counts.get('flagged_total', 0)}",
            "",
            "Tests:",
            _tests_block(tests),
            "",
            "Summary already given to the user:",
            summary_text or "(not generated yet)",
        ]
    )

    return _generate(BAYMAX_PERSONALITY, build_ask_prompt(question, context), language)