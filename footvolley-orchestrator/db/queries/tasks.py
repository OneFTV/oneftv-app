"""Task CRUD, lease operations, and status transitions."""

import uuid
from datetime import datetime, timedelta
from config.settings import LEASE_TIMEOUT


def get_tasks(db, status=None, category=None, limit=1):
    """Get tasks by status and/or category."""
    query = "SELECT * FROM tasks WHERE 1=1"
    params = []

    if status:
        query += " AND status = %s"
        params.append(status)
    if category:
        query += " AND category = %s"
        params.append(category)

    query += " ORDER BY priority ASC, created_at ASC LIMIT %s"
    params.append(limit)

    return db.fetchall(query, params)


def get_task(db, task_id):
    """Get a single task by ID."""
    return db.fetchone("SELECT * FROM tasks WHERE id = %s", (task_id,))


def create_task(db, title, description, category='backend', priority=5,
                risk_tier='medium', epic=None):
    """Create a new task in DISCOVERED status."""
    return db.insert(
        """INSERT INTO tasks (title, description, category, priority, risk_tier, epic)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (title, description, category, priority, risk_tier, epic)
    )


def update_task(db, task_id, **fields):
    """Update task fields dynamically."""
    if not fields:
        return
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [task_id]
    db.execute(f"UPDATE tasks SET {set_clause} WHERE id = %s", values)


def transition(db, task_id, from_status, to_status):
    """Transition task status with guard."""
    result = db.execute(
        "UPDATE tasks SET status = %s WHERE id = %s AND status = %s",
        (to_status, task_id, from_status)
    )
    return result.rowcount > 0


def begin_execution(db, task_id, agent_name):
    """Acquire a lease on a task for execution."""
    lease_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(seconds=LEASE_TIMEOUT)

    result = db.execute(
        """UPDATE tasks
           SET lease_id = %s, lease_expires_at = %s, assigned_agent = %s
           WHERE id = %s AND (lease_id IS NULL OR lease_expires_at < NOW())""",
        (lease_id, expires_at, agent_name, task_id)
    )

    if result.rowcount > 0:
        return lease_id
    return None


def release_lease(db, task_id, lease_id):
    """Release a task lease."""
    db.execute(
        "UPDATE tasks SET lease_id = NULL, lease_expires_at = NULL WHERE id = %s AND lease_id = %s",
        (task_id, lease_id)
    )


def get_expired_leases(db):
    """Find tasks with expired leases that are still in progress."""
    return db.fetchall(
        """SELECT * FROM tasks
           WHERE lease_id IS NOT NULL
             AND lease_expires_at < NOW()
             AND status IN ('IN_PROGRESS', 'TESTING', 'REVIEW')"""
    )


def get_task_counts(db):
    """Get counts of tasks by status."""
    rows = db.fetchall(
        "SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status"
    )
    return {row['status']: row['cnt'] for row in rows}
