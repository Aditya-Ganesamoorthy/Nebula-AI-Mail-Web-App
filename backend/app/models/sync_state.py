import sqlite3
import time
from typing import Optional, Dict, Any
from app.core.config import settings

def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    path = db_path or settings.DATABASE_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path: Optional[str] = None):
    """Initialize SQLite tables for Gmail sync state and push notifications."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sync_state (
                    user_email TEXT PRIMARY KEY,
                    history_id TEXT,
                    watch_expiration INTEGER,
                    last_synced_at INTEGER,
                    created_at INTEGER
                )
            """)
    finally:
        conn.close()

def get_sync_state(user_email: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve the current historyId and watch expiration for a user."""
    init_db(db_path)
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_email, history_id, watch_expiration, last_synced_at, created_at FROM sync_state WHERE user_email = ?",
            (user_email,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)
    finally:
        conn.close()

def upsert_sync_state(
    user_email: str,
    history_id: Optional[str] = None,
    watch_expiration: Optional[int] = None,
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Insert or update synchronization state for a user account."""
    init_db(db_path)
    now = int(time.time())
    existing = get_sync_state(user_email, db_path)
    
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.cursor()
            if existing:
                new_history_id = history_id if history_id is not None else existing.get("history_id")
                new_expiration = watch_expiration if watch_expiration is not None else existing.get("watch_expiration")
                cursor.execute(
                    """
                    UPDATE sync_state 
                    SET history_id = ?, watch_expiration = ?, last_synced_at = ?
                    WHERE user_email = ?
                    """,
                    (new_history_id, new_expiration, now, user_email)
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO sync_state (user_email, history_id, watch_expiration, last_synced_at, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (user_email, history_id, watch_expiration, now, now)
                )
    finally:
        conn.close()
    return get_sync_state(user_email, db_path)
