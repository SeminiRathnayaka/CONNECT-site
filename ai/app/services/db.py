"""SQLite persistence for reports and chat history.

The Orayan report store used to be an in-memory dict, which meant every report
disappeared when the server restarted and Report History could not load an old
report. Everything now lives in a small SQLite file instead.

Gemini's free tier allows only ~20 requests a day, so every generated
explanation is cached here too. Re-opening an already explained test, or
switching language back and forth, costs no API call at all.
"""

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone

DB_PATH = os.getenv(
    "CONNECT_DB_PATH",
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data",
        "connect.db",
    ),
)

MAX_TURNS = 40

SCHEMA = """
CREATE TABLE IF NOT EXISTS reports (
    id           TEXT PRIMARY KEY,
    filename     TEXT NOT NULL,
    source       TEXT NOT NULL,
    raw_text     TEXT NOT NULL,
    summary_json TEXT NOT NULL,
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_tests (
    report_id    TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL,
    name         TEXT NOT NULL,
    raw          TEXT NOT NULL,
    value        REAL,
    value_text   TEXT NOT NULL,
    unit         TEXT NOT NULL,
    range_text   TEXT NOT NULL,
    reference_json   TEXT,
    comparator_json  TEXT,
    status       TEXT NOT NULL,
    PRIMARY KEY (report_id, position)
);

CREATE TABLE IF NOT EXISTS summaries (
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    language  TEXT NOT NULL,
    text      TEXT NOT NULL,
    PRIMARY KEY (report_id, language)
);

CREATE TABLE IF NOT EXISTS explanations (
    report_id TEXT NOT NULL,
    test_name TEXT NOT NULL,
    language  TEXT NOT NULL,
    text      TEXT NOT NULL,
    PRIMARY KEY (report_id, test_name, language)
);

CREATE TABLE IF NOT EXISTS term_explanations (
    term     TEXT NOT NULL,
    language TEXT NOT NULL,
    text     TEXT NOT NULL,
    PRIMARY KEY (term, language)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    session_id TEXT NOT NULL,
    position   INTEGER NOT NULL,
    role       TEXT NOT NULL,
    text       TEXT NOT NULL,
    PRIMARY KEY (session_id, position)
);

CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tests_report ON report_tests(report_id);
"""


def _connect() -> sqlite3.Connection:
    folder = os.path.dirname(DB_PATH)
    if folder:
        os.makedirs(folder, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=10.0)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    with _connect() as connection:
        connection.executescript(SCHEMA)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _loads(value: str | None):
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


# --------------------------------------------------------------------------
# Reports
# --------------------------------------------------------------------------
def save_report(filename: str, text: str, source: str, tests: list[dict], summary: dict) -> str:
    report_id = str(uuid.uuid4())
    init_db()

    with _connect() as connection:
        connection.execute(
            "INSERT INTO reports (id, filename, source, raw_text, summary_json, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (report_id, filename, source, text, json.dumps(summary), _now()),
        )
        connection.executemany(
            "INSERT INTO report_tests (report_id, position, name, raw, value, value_text,"
            " unit, range_text, reference_json, comparator_json, status)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    report_id,
                    index,
                    test["name"],
                    test.get("raw", ""),
                    test.get("value"),
                    test.get("value_text", ""),
                    test.get("unit", ""),
                    test.get("range_text", ""),
                    json.dumps(test["reference"]) if test.get("reference") else None,
                    json.dumps(test["comparator"]) if test.get("comparator") else None,
                    test["status"],
                )
                for index, test in enumerate(tests)
            ],
        )

    return report_id


def _row_to_test(row: sqlite3.Row) -> dict:
    return {
        "name": row["name"],
        "raw": row["raw"],
        "value": row["value"],
        "value_text": row["value_text"],
        "unit": row["unit"],
        "range_text": row["range_text"],
        "reference": _loads(row["reference_json"]),
        "comparator": _loads(row["comparator_json"]),
        "status": row["status"],
    }


def get_report(report_id: str) -> dict | None:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM reports WHERE id = ?", (report_id,)
        ).fetchone()
        if row is None:
            return None

        test_rows = connection.execute(
            "SELECT * FROM report_tests WHERE report_id = ? ORDER BY position",
            (report_id,),
        ).fetchall()

    return {
        "report_id": report_id,
        "filename": row["filename"],
        "source": row["source"],
        "text": row["raw_text"],
        "created_at": row["created_at"],
        "tests": [_row_to_test(test) for test in test_rows],
        "summary": _loads(row["summary_json"]) or {},
        "summary_text": {},
    }


def list_reports(limit: int = 50) -> list[dict]:
    init_db()
    limit = max(1, min(int(limit or 50), 200))
    with _connect() as connection:
        rows = connection.execute(
            "SELECT id, filename, source, summary_json, created_at"
            " FROM reports ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [
        {
            "report_id": row["id"],
            "filename": row["filename"],
            "source": row["source"],
            "created_at": row["created_at"],
            "summary": _loads(row["summary_json"]) or {},
        }
        for row in rows
    ]


def delete_report(report_id: str) -> bool:
    init_db()
    with _connect() as connection:
        cursor = connection.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        connection.execute("DELETE FROM summaries WHERE report_id = ?", (report_id,))
        connection.execute("DELETE FROM explanations WHERE report_id = ?", (report_id,))
    return cursor.rowcount > 0


# --------------------------------------------------------------------------
# Cached generated text
# --------------------------------------------------------------------------
def get_summary_text(report_id: str, language: str) -> str:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT text FROM summaries WHERE report_id = ? AND language = ?",
            (report_id, language),
        ).fetchone()
    return row["text"] if row else ""


def set_summary_text(report_id: str, language: str, text: str) -> None:
    init_db()
    with _connect() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO summaries (report_id, language, text) VALUES (?, ?, ?)",
            (report_id, language, text),
        )


def get_explanation(report_id: str, test_name: str, language: str) -> str:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT text FROM explanations"
            " WHERE report_id = ? AND test_name = ? AND language = ?",
            (report_id, test_name, language),
        ).fetchone()
    return row["text"] if row else ""


def set_explanation(report_id: str, test_name: str, language: str, text: str) -> None:
    init_db()
    with _connect() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO explanations (report_id, test_name, language, text)"
            " VALUES (?, ?, ?, ?)",
            (report_id, test_name, language, text),
        )


def get_term_explanation(term: str, language: str) -> str:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT text FROM term_explanations WHERE term = ? AND language = ?",
            (term.strip().lower(), language),
        ).fetchone()
    return row["text"] if row else ""


def set_term_explanation(term: str, language: str, text: str) -> None:
    init_db()
    with _connect() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO term_explanations (term, language, text) VALUES (?, ?, ?)",
            (term.strip().lower(), language, text),
        )


# --------------------------------------------------------------------------
# Chat history
# --------------------------------------------------------------------------
def get_chat_history(session_id: str) -> list[dict]:
    init_db()
    with _connect() as connection:
        rows = connection.execute(
            "SELECT role, text FROM chat_messages WHERE session_id = ?"
            " ORDER BY position DESC LIMIT ?",
            (session_id, MAX_TURNS),
        ).fetchall()
    return [{"role": row["role"], "parts": [{"text": row["text"]}]} for row in reversed(rows)]


def append_chat(session_id: str, user_text: str, model_text: str) -> None:
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT COALESCE(MAX(position), -1) AS last FROM chat_messages WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        start = row["last"] + 1
        connection.executemany(
            "INSERT INTO chat_messages (session_id, position, role, text) VALUES (?, ?, ?, ?)",
            [
                (session_id, start, "user", user_text),
                (session_id, start + 1, "model", model_text),
            ],
        )
        connection.execute(
            "DELETE FROM chat_messages WHERE session_id = ? AND position <= ?",
            (session_id, start - MAX_TURNS),
        )


def clear_chat(session_id: str) -> None:
    init_db()
    with _connect() as connection:
        connection.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))