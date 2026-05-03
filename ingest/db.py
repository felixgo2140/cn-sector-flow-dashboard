import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# DB lives inside web/ so Vercel's Next.js bundles it with the deployment.
DB_PATH = ROOT / "web" / "db" / "data.db"
SCHEMA_PATH = ROOT / "db" / "schema.sql"


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_schema() -> None:
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with connect() as conn:
        conn.executescript(sql)
