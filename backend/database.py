"""
Database connection helper.

Right now this points at the local SQLite dev database (talent_scooper.db).
When you get the real database, this is the main file you change: swap the
connection for your real one, and adjust any date functions in main.py if the
real DB is Postgres/MySQL instead of SQLite.
"""

import sqlite3
from pathlib import Path

# The .db file lives next to this file, so this works no matter where you run from.
DB_PATH = Path(__file__).parent / "talent_scooper.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row      # lets us treat rows like dictionaries
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
