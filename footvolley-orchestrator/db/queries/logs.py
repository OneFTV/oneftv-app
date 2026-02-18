"""Agent logs and decision logging."""

import json


def log_agent(db, agent_name, action, detail=None, task_id=None, level='INFO'):
    """Insert an agent log entry."""
    db.insert(
        """INSERT INTO agent_logs (agent_name, task_id, action, detail, level)
           VALUES (%s, %s, %s, %s, %s)""",
        (agent_name, task_id, action, detail, level)
    )


def log_decision(db, task_id, pass_type, iteration, scores, quality_score,
                 approved, reasoning=None):
    """Insert an agreement gate decision."""
    db.insert(
        """INSERT INTO decisions (task_id, pass_type, iteration, scores,
           quality_score, approved, reasoning)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (task_id, pass_type, iteration, json.dumps(scores), quality_score,
         approved, reasoning)
    )


def get_decisions(db, task_id, iteration=None):
    """Get decisions for a task, optionally filtered by iteration."""
    query = "SELECT * FROM decisions WHERE task_id = %s"
    params = [task_id]
    if iteration is not None:
        query += " AND iteration = %s"
        params.append(iteration)
    query += " ORDER BY created_at ASC"
    return db.fetchall(query, params)


def log_call(db, idempotency_key, agent_name, task_id, prompt_hash):
    """Log an LLM call attempt (pending)."""
    return db.insert(
        """INSERT INTO agent_call_log (idempotency_key, agent_name, task_id, prompt_hash)
           VALUES (%s, %s, %s, %s)""",
        (idempotency_key, agent_name, task_id, prompt_hash)
    )


def complete_call(db, idempotency_key, response, duration_ms, status='success'):
    """Mark an LLM call as completed."""
    db.execute(
        """UPDATE agent_call_log
           SET response = %s, duration_ms = %s, status = %s, completed_at = NOW()
           WHERE idempotency_key = %s""",
        (response, duration_ms, status, idempotency_key)
    )


def get_existing_call(db, idempotency_key):
    """Check if an idempotent call already exists with a response."""
    return db.fetchone(
        """SELECT * FROM agent_call_log
           WHERE idempotency_key = %s AND status = 'success'""",
        (idempotency_key,)
    )


def log_test_result(db, task_id, test_type, total_tests, passed, failed,
                    skipped=0, coverage=None, report=None):
    """Insert a test result."""
    db.insert(
        """INSERT INTO test_results (task_id, test_type, total_tests, passed,
           failed, skipped, coverage, report)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (task_id, test_type, total_tests, passed, failed, skipped, coverage,
         json.dumps(report) if report else None)
    )


def log_ci_result(db, task_id, check_type, passed, output=None, duration_ms=None):
    """Insert a CI gate result."""
    db.insert(
        """INSERT INTO ci_results (task_id, check_type, passed, output, duration_ms)
           VALUES (%s, %s, %s, %s, %s)""",
        (task_id, check_type, passed, output, duration_ms)
    )
