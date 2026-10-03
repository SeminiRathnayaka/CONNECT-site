"""PostgreSQL persistence for accounts, reports and chat history.

Originally this was an in-memory dict, then a SQLite file. It is now PostgreSQL
because the app has real accounts: SQLite only allows one writer at a time, so a
busy app with many people uploading reports at once would hit "database is
locked". PostgreSQL handles concurrent users properly.

Gemini's free tier allows only ~20 requests a day, so every generated
explanation is cached here too. Re-opening an already explained test, or
switching language back and forth, costs no API call at all.

Retention policy, per account:
  * Baymax keeps the 7 most recent conversations, so it can remember context
    without growing forever.
  * Orayan keeps 3 months of reports, so a person can compare older results.
"""

import json
import os
import secrets
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

# Loaded here, not in server.py, because DATABASE_URL is read at import time.
# If a module imports db before the app calls load_dotenv(), it would silently
# fall back to the wrong database.
load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        ".env",
    )
)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy ai/.env.example to ai/.env and set it to your "
        "PostgreSQL connection string, then run: python ai/ensure_database.py"
    )

MAX_TURNS = 40

MAX_CONVERSATIONS = int(os.getenv("CONNECT_MAX_CONVERSATIONS", "7"))
REPORT_RETENTION_DAYS = int(os.getenv("CONNECT_REPORT_RETENTION_DAYS", "90"))
SESSION_RETENTION_DAYS = int(os.getenv("CONNECT_SESSION_DAYS", "30"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
    id           TEXT PRIMARY KEY,
    user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
    filename     TEXT NOT NULL,
    source       TEXT NOT NULL,
    raw_text     TEXT NOT NULL,
    summary_json JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_tests (
    report_id       TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    position        INTEGER NOT NULL,
    name            TEXT NOT NULL,
    raw             TEXT NOT NULL,
    value           DOUBLE PRECISION,
    value_text      TEXT NOT NULL,
    unit            TEXT NOT NULL,
    range_text      TEXT NOT NULL,
    reference_json  JSONB,
    comparator_json JSONB,
    status          TEXT NOT NULL,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (session_id, position)
);

CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tests_report ON report_tests(report_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at DESC);
"""


@contextmanager
def _db():
    """Opens a connection, commits on success, and always closes."""
    connection = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def init_db() -> None:
    with _db() as connection:
        connection.execute(SCHEMA)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value) -> str:
    """JSON-safe ISO string for a timestamptz column."""
    if isinstance(value, datetime):
        return value.isoformat()
    return value or ""


def _loads(value):
    if not value:
        return None
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return None


# --------------------------------------------------------------------------
# Accounts and sessions
# --------------------------------------------------------------------------
def create_user(email: str, name: str, password_hash: str) -> str:
    init_db()
    user_id = str(uuid.uuid4())
    with _db() as connection:
        connection.execute(
            "INSERT INTO users (id, email, name, password_hash) VALUES (%s, %s, %s, %s)",
            (user_id, email.strip().lower(), name.strip(), password_hash),
        )
    return user_id


def get_user_by_email(email: str) -> dict | None:
    init_db()
    with _db() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = %s", (email.strip().lower(),)
        ).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> dict | None:
    init_db()
    with _db() as connection:
        row = connection.execute("SELECT * FROM users WHERE id = %s", (user_id,)).fetchone()
    return dict(row) if row else None


def create_session(user_id: str) -> tuple[str, str]:
    """Returns (token, expires_at_iso)."""
    init_db()
    token = secrets.token_urlsafe(32)
    expires_at = _now() + timedelta(days=SESSION_RETENTION_DAYS)
    with _db() as connection:
        connection.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
            (token, user_id, expires_at),
        )
    return token, expires_at.isoformat()


def get_user_by_session(token: str) -> dict | None:
    """Resolves a session cookie to a user, ignoring expired sessions."""
    if not token:
        return None
    init_db()
    with _db() as connection:
        row = connection.execute(
            "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id"
            " WHERE s.token = %s AND s.expires_at > now()",
            (token,),
        ).fetchone()
    return dict(row) if row else None


def delete_session(token: str) -> None:
    init_db()
    with _db() as connection:
        connection.execute("DELETE FROM sessions WHERE token = %s", (token,))


def purge_expired_sessions() -> int:
    init_db()
    with _db() as connection:
        cursor = connection.execute("DELETE FROM sessions WHERE expires_at <= now()")
        return cursor.rowcount or 0


# --------------------------------------------------------------------------
# Conversations
# --------------------------------------------------------------------------
def get_or_create_conversation(user_id: str, conversation_id: str | None) -> str:
    """Reuses a conversation only when it belongs to this account."""
    init_db()
    if conversation_id:
        with _db() as connection:
            row = connection.execute(
                "SELECT id FROM conversations WHERE id = %s AND user_id = %s",
                (conversation_id, user_id),
            ).fetchone()
        if row:
            return row["id"]

    new_id = str(uuid.uuid4())
    with _db() as connection:
        connection.execute(
            "INSERT INTO conversations (id, user_id) VALUES (%s, %s)", (new_id, user_id)
        )
    # Enforced here so retention can never be forgotten by a future caller.
    prune_conversations(user_id)
    return new_id


def list_conversations(user_id: str, limit: int = 50) -> list[dict]:
    init_db()
    with _db() as connection:
        rows = connection.execute(
            "SELECT id, title, created_at, updated_at FROM conversations"
            " WHERE user_id = %s ORDER BY updated_at DESC LIMIT %s",
            (user_id, limit),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "created_at": _iso(row["created_at"]),
            "updated_at": _iso(row["updated_at"]),
        }
        for row in rows
    ]


def delete_conversation(user_id: str, conversation_id: str) -> bool:
    init_db()
    with _db() as connection:
        cursor = connection.execute(
            "DELETE FROM conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id),
        )
        if cursor.rowcount:
            connection.execute(
                "DELETE FROM chat_messages WHERE session_id = %s", (conversation_id,)
            )
    return bool(cursor.rowcount)


def prune_conversations(user_id: str, keep: int = MAX_CONVERSATIONS) -> int:
    """Deletes this account's oldest conversations beyond the retention limit."""
    init_db()
    keep = max(1, keep)
    with _db() as connection:
        stale = connection.execute(
            "SELECT id FROM conversations WHERE user_id = %s"
            " ORDER BY updated_at DESC, created_at DESC LIMIT ALL OFFSET %s",
            (user_id, keep),
        ).fetchall()
        removed = [row["id"] for row in stale]
        if removed:
            connection.execute(
                "DELETE FROM chat_messages WHERE session_id = ANY(%s)", (removed,)
            )
            connection.execute("DELETE FROM conversations WHERE id = ANY(%s)", (removed,))
    return len(removed)


def prune_reports(user_id: str, days: int = REPORT_RETENTION_DAYS) -> int:
    """Deletes this account's reports older than the retention window."""
    init_db()
    cutoff = _now() - timedelta(days=max(1, days))
    with _db() as connection:
        stale = connection.execute(
            "SELECT id FROM reports WHERE user_id = %s AND created_at < %s",
            (user_id, cutoff),
        ).fetchall()
        removed = [row["id"] for row in stale]
        if removed:
            connection.execute(
                "DELETE FROM summaries WHERE report_id = ANY(%s)", (removed,)
            )
            connection.execute(
                "DELETE FROM explanations WHERE report_id = ANY(%s)", (removed,)
            )
            connection.execute("DELETE FROM reports WHERE id = ANY(%s)", (removed,))
    return len(removed)


# --------------------------------------------------------------------------
# Reports
# --------------------------------------------------------------------------
def save_report(
    filename: str,
    text: str,
    source: str,
    tests: list[dict],
    summary: dict,
    user_id: str | None = None,
) -> str:
    report_id = str(uuid.uuid4())
    init_db()

    with _db() as connection:
        connection.execute(
            "INSERT INTO reports (id, user_id, filename, source, raw_text, summary_json)"
            " VALUES (%s, %s, %s, %s, %s, %s)",
            (report_id, user_id, filename, source, text, Jsonb(summary)),
        )
        rows = [
            (
                report_id,
                index,
                test["name"],
                test.get("raw", ""),
                test.get("value"),
                test.get("value_text", ""),
                test.get("unit", ""),
                test.get("range_text", ""),
                Jsonb(test["reference"]) if test.get("reference") else None,
                Jsonb(test["comparator"]) if test.get("comparator") else None,
                test["status"],
            )
            for index, test in enumerate(tests)
        ]
        if rows:
            with connection.cursor() as cursor:
                cursor.executemany(
                    "INSERT INTO report_tests (report_id, position, name, raw, value,"
                    " value_text, unit, range_text, reference_json, comparator_json, status)"
                    " VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    rows,
                )

    return report_id


def _row_to_test(row: dict) -> dict:
    return {
        "name": row["name"],
        "raw": row["raw"],
        "value": row["value"],
        "value_text": row["value_text"],
        "unit": row["unit"],
        "range_text": row["range_text"],
        "reference": _loads(row.get("reference_json")),
        "comparator": _loads(row.get("comparator_json")),
        "status": row["status"],
    }


def get_report(report_id: str, user_id: str | None = None) -> dict | None:
    """Fetches a report, but only if it belongs to this account."""
    init_db()
    with _db() as connection:
        if user_id:
            row = connection.execute(
                "SELECT * FROM reports WHERE id = %s AND user_id = %s",
                (report_id, user_id),
            ).fetchone()
        else:
            row = connection.execute(
                "SELECT * FROM reports WHERE id = %s", (report_id,)
            ).fetchone()
        if row is None:
            return None

        test_rows = connection.execute(
            "SELECT * FROM report_tests WHERE report_id = %s ORDER BY position",
            (report_id,),
        ).fetchall()

    return {
        "report_id": report_id,
        "filename": row["filename"],
        "source": row["source"],
        "text": row["raw_text"],
        "created_at": _iso(row["created_at"]),
        "tests": [_row_to_test(test) for test in test_rows],
        "summary": _loads(row.get("summary_json")) or {},
        "summary_text": {},
    }


def list_reports(limit: int = 50, user_id: str | None = None) -> list[dict]:
    """Lists this account's reports only."""
    init_db()
    limit = max(1, min(int(limit or 50), 200))
    with _db() as connection:
        if user_id:
            rows = connection.execute(
                "SELECT id, filename, source, summary_json, created_at FROM reports"
                " WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
                (user_id, limit),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT id, filename, source, summary_json, created_at"
                " FROM reports ORDER BY created_at DESC LIMIT %s",
                (limit,),
            ).fetchall()
    return [
        {
            "report_id": row["id"],
            "filename": row["filename"],
            "source": row["source"],
            "created_at": _iso(row["created_at"]),
            "summary": _loads(row.get("summary_json")) or {},
        }
        for row in rows
    ]


def delete_report(report_id: str, user_id: str | None = None) -> bool:
    """Deletes a report, but only if it belongs to this account."""
    init_db()
    with _db() as connection:
        if user_id:
            cursor = connection.execute(
                "DELETE FROM reports WHERE id = %s AND user_id = %s", (report_id, user_id)
            )
        else:
            cursor = connection.execute("DELETE FROM reports WHERE id = %s", (report_id,))
        connection.execute("DELETE FROM summaries WHERE report_id = %s", (report_id,))
        connection.execute("DELETE FROM explanations WHERE report_id = %s", (report_id,))
    return bool(cursor.rowcount)


# --------------------------------------------------------------------------
# Cached generated text
# --------------------------------------------------------------------------
def get_summary_text(report_id: str, language: str) -> str:
    init_db()
    with _db() as connection:
        row = connection.execute(
            "SELECT text FROM summaries WHERE report_id = %s AND language = %s",
            (report_id, language),
        ).fetchone()
    return row["text"] if row else ""


def set_summary_text(report_id: str, language: str, text: str) -> None:
    init_db()
    with _db() as connection:
        connection.execute(
            "INSERT INTO summaries (report_id, language, text) VALUES (%s, %s, %s)"
            " ON CONFLICT (report_id, language) DO UPDATE SET text = EXCLUDED.text",
            (report_id, language, text),
        )


def get_explanation(report_id: str, test_name: str, language: str) -> str:
    init_db()
    with _db() as connection:
        row = connection.execute(
            "SELECT text FROM explanations"
            " WHERE report_id = %s AND test_name = %s AND language = %s",
            (report_id, test_name, language),
        ).fetchone()
    return row["text"] if row else ""


def set_explanation(report_id: str, test_name: str, language: str, text: str) -> None:
    init_db()
    with _db() as connection:
        connection.execute(
            "INSERT INTO explanations (report_id, test_name, language, text)"
            " VALUES (%s, %s, %s, %s)"
            " ON CONFLICT (report_id, test_name, language) DO UPDATE SET text = EXCLUDED.text",
            (report_id, test_name, language, text),
        )


def get_term_explanation(term: str, language: str) -> str:
    init_db()
    with _db() as connection:
        row = connection.execute(
            "SELECT text FROM term_explanations WHERE term = %s AND language = %s",
            (term.strip().lower(), language),
        ).fetchone()
    return row["text"] if row else ""


def set_term_explanation(term: str, language: str, text: str) -> None:
    init_db()
    with _db() as connection:
        connection.execute(
            "INSERT INTO term_explanations (term, language, text) VALUES (%s, %s, %s)"
            " ON CONFLICT (term, language) DO UPDATE SET text = EXCLUDED.text",
            (term.strip().lower(), language, text),
        )


# --------------------------------------------------------------------------
# Chat history (stored per conversation, which belongs to one account)
# --------------------------------------------------------------------------
def touch_conversation(conversation_id: str, first_user_text: str) -> None:
    """Marks the conversation as recently used and titles it from the first message."""
    init_db()
    title = (first_user_text or "").strip().replace("\n", " ")[:60]
    with _db() as connection:
        connection.execute(
            "UPDATE conversations SET updated_at = now(),"
            " title = CASE WHEN title = '' THEN %s ELSE title END"
            " WHERE id = %s",
            (title, conversation_id),
        )


def get_chat_history(session_id: str) -> list[dict]:
    init_db()
    with _db() as connection:
        rows = connection.execute(
            "SELECT role, text FROM chat_messages WHERE session_id = %s"
            " ORDER BY position DESC LIMIT %s",
            (session_id, MAX_TURNS),
        ).fetchall()
    return [{"role": row["role"], "parts": [{"text": row["text"]}]} for row in reversed(rows)]


def append_chat(session_id: str, user_text: str, model_text: str) -> None:
    init_db()
    with _db() as connection:
        row = connection.execute(
            "SELECT COALESCE(MAX(position), -1) AS last FROM chat_messages"
            " WHERE session_id = %s",
            (session_id,),
        ).fetchone()
        start = row["last"] + 1
        with connection.cursor() as cursor:
            cursor.executemany(
                "INSERT INTO chat_messages (session_id, position, role, text)"
                " VALUES (%s, %s, %s, %s)",
                [
                    (session_id, start, "user", user_text),
                    (session_id, start + 1, "model", model_text),
                ],
            )
        connection.execute(
            "DELETE FROM chat_messages WHERE session_id = %s AND position <= %s",
            (session_id, start - MAX_TURNS),
        )


def clear_chat(session_id: str) -> None:
    init_db()
    with _db() as connection:
        connection.execute("DELETE FROM chat_messages WHERE session_id = %s", (session_id,))