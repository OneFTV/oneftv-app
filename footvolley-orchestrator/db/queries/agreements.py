"""Agreement gate score storage and iteration tracking."""

import json


def get_latest_iteration(db, task_id):
    """Get the latest iteration number for a task's agreement evaluation."""
    row = db.fetchone(
        "SELECT MAX(iteration) as max_iter FROM decisions WHERE task_id = %s",
        (task_id,)
    )
    return row['max_iter'] or 0 if row else 0


def get_iteration_decisions(db, task_id, iteration):
    """Get both analyst and implementer decisions for an iteration."""
    return db.fetchall(
        """SELECT * FROM decisions
           WHERE task_id = %s AND iteration = %s
           ORDER BY pass_type ASC""",
        (task_id, iteration)
    )


def store_score(db, task_id, pass_type, iteration, scores, quality_score,
                approved, reasoning=None):
    """Store an agreement gate score."""
    db.insert(
        """INSERT INTO decisions (task_id, pass_type, iteration, scores,
           quality_score, approved, reasoning)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (task_id, pass_type, iteration, json.dumps(scores),
         quality_score, approved, reasoning)
    )


def get_agreement_history(db, task_id):
    """Get full agreement history for a task."""
    return db.fetchall(
        """SELECT * FROM decisions WHERE task_id = %s
           ORDER BY iteration ASC, pass_type ASC""",
        (task_id,)
    )
