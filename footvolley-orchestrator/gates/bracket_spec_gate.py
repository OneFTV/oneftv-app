"""Bracket spec gate: blocks bracket epic tasks until all 10 sections complete."""

import logging

from db.queries.logs import log_agent

logger = logging.getLogger(__name__)


def check_bracket_spec_complete(db):
    """Check if all bracket spec sections are completed.

    Returns (is_complete, completed_count, total_count).
    """
    row = db.fetchone(
        """SELECT
             COUNT(*) as total,
             SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as done
           FROM bracket_spec_sections"""
    )

    if not row:
        return False, 0, 0

    total = row['total']
    done = row['done'] or 0
    return done >= total, done, total


def get_incomplete_sections(db):
    """Get list of incomplete bracket spec sections."""
    return db.fetchall(
        """SELECT section_name, description
           FROM bracket_spec_sections
           WHERE completed = FALSE
           ORDER BY id"""
    )


def gate_bracket_task(db, task):
    """Check if a bracket epic task can proceed.

    Returns True if the task can proceed, False if blocked.
    """
    task_id = task['id']
    epic = task.get('epic', '')

    # Only gate bracket-related epics
    if not epic or 'bracket' not in epic.lower():
        return True

    is_complete, done, total = check_bracket_spec_complete(db)

    if is_complete:
        log_agent(db, 'bracket_spec_gate', 'pass',
                  f"All {total} sections complete", task_id)
        return True

    incomplete = get_incomplete_sections(db)
    sections = ', '.join(s['section_name'] for s in incomplete)
    log_agent(db, 'bracket_spec_gate', 'blocked',
              f"Incomplete ({done}/{total}): {sections}", task_id, 'WARN')
    logger.info(f"Task {task_id} blocked by bracket spec gate: "
                f"{done}/{total} sections complete")
    return False


def mark_section_complete(db, section_name, task_id=None):
    """Mark a bracket spec section as completed."""
    db.execute(
        """UPDATE bracket_spec_sections
           SET completed = TRUE, completed_at = NOW(), task_id = %s
           WHERE section_name = %s""",
        (task_id, section_name)
    )
    log_agent(db, 'bracket_spec_gate', 'section_complete',
              section_name, task_id)
