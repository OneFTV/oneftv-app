"""Research CRUD and promotion threshold check."""


def insert_research(db, topic, findings, source=None, impact_score=None,
                    confidence=None):
    """Insert a research finding."""
    return db.insert(
        """INSERT INTO research (topic, source, findings, impact_score, confidence)
           VALUES (%s, %s, %s, %s, %s)""",
        (topic, source, findings, impact_score, confidence)
    )


def get_promotable_research(db):
    """Get research findings that meet promotion threshold.

    Auto-promotes findings with impact_score >= 7.0 AND confidence >= 0.80.
    """
    return db.fetchall(
        """SELECT * FROM research
           WHERE promoted = FALSE
             AND impact_score >= 7.0
             AND confidence >= 0.80
           ORDER BY impact_score DESC"""
    )


def promote_research(db, research_id, task_id):
    """Mark a research finding as promoted and link to created task."""
    db.execute(
        """UPDATE research SET promoted = TRUE, promoted_task_id = %s
           WHERE id = %s""",
        (task_id, research_id)
    )


def get_recent_research(db, limit=10):
    """Get recent research findings."""
    return db.fetchall(
        "SELECT * FROM research ORDER BY created_at DESC LIMIT %s",
        (limit,)
    )
