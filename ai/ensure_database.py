"""Creates the PostgreSQL database if it is missing, then applies the schema.

Run by "npm run setup". Reads DATABASE_URL from ai/.env, so the database
password stays in your own environment file and is never passed on a command
line or written into a shell history.
"""

import os
import sys
from urllib.parse import urlparse, urlunparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

import psycopg  # noqa: E402

try:
    from app.services import db  # noqa: E402
except RuntimeError as error:
    print("")
    print(str(error))
    raise SystemExit(1) from error


def maintenance_url(url: str) -> str:
    """Points at the default 'postgres' database so we can create ours."""
    parts = urlparse(url)
    return urlunparse(parts._replace(path="/postgres"))


def main() -> int:
    url = db.DATABASE_URL
    target = urlparse(url).path.lstrip("/") or "connect"

    if not url.startswith("postgresql"):
        print(f"DATABASE_URL does not look like a PostgreSQL URL: {url}")
        return 1

    try:
        with psycopg.connect(maintenance_url(url), autocommit=True) as connection:
            exists = connection.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s", (target,)
            ).fetchone()
            if exists:
                print(f'Database "{target}" already exists.')
            else:
                connection.execute(f'CREATE DATABASE "{target}"')
                print(f'Created database "{target}".')
    except psycopg.OperationalError as error:
        print("")
        print("Could not reach PostgreSQL.")
        print(f"  {error}")
        print("")
        print("Check that the PostgreSQL service is running, and that DATABASE_URL in")
        print("ai/.env has the right username, password and port.")
        return 1

    db.init_db()
    print("Schema is up to date.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())