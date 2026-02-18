"""SHA-256 hash-based file lock acquire/release/cleanup."""

import hashlib
from datetime import datetime, timedelta
from config.settings import LOCK_TIMEOUT


def _hash_path(file_path):
    """SHA-256 hash of file path for indexing."""
    return hashlib.sha256(file_path.encode()).hexdigest()


def acquire_lock(db, file_path, task_id, agent_name, timeout=None):
    """Acquire a file lock. Returns True if acquired, False if already locked."""
    path_hash = _hash_path(file_path)
    timeout = timeout or LOCK_TIMEOUT
    expires_at = datetime.utcnow() + timedelta(seconds=timeout)

    # Check for existing active lock
    existing = db.fetchone(
        """SELECT * FROM file_locks
           WHERE file_path_hash = %s AND released_at IS NULL AND expires_at > NOW()""",
        (path_hash,)
    )

    if existing:
        return False

    # Clean up any expired locks for this path
    db.execute(
        """UPDATE file_locks SET released_at = NOW()
           WHERE file_path_hash = %s AND released_at IS NULL AND expires_at <= NOW()""",
        (path_hash,)
    )

    db.insert(
        """INSERT INTO file_locks (file_path_hash, file_path, task_id, agent_name, expires_at)
           VALUES (%s, %s, %s, %s, %s)""",
        (path_hash, file_path, task_id, agent_name, expires_at)
    )
    return True


def release_lock(db, file_path, task_id):
    """Release a file lock."""
    path_hash = _hash_path(file_path)
    db.execute(
        """UPDATE file_locks SET released_at = NOW()
           WHERE file_path_hash = %s AND task_id = %s AND released_at IS NULL""",
        (path_hash, task_id)
    )


def release_all_locks(db, task_id):
    """Release all locks held by a task."""
    db.execute(
        "UPDATE file_locks SET released_at = NOW() WHERE task_id = %s AND released_at IS NULL",
        (task_id,)
    )


def cleanup_expired_locks(db):
    """Release all expired locks."""
    result = db.execute(
        "UPDATE file_locks SET released_at = NOW() WHERE released_at IS NULL AND expires_at <= NOW()"
    )
    return result.rowcount


def get_active_locks(db):
    """Get all currently active locks."""
    return db.fetchall(
        """SELECT * FROM file_locks
           WHERE released_at IS NULL AND expires_at > NOW()
           ORDER BY acquired_at ASC"""
    )
