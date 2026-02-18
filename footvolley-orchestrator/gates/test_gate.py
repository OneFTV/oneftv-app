"""Test gate: scoped coverage by risk tier.

Coverage requirements:
- critical: >= 90%
- high: >= 85%
- medium: >= 80%
- low: >= 70%
"""

import logging

from db.queries.logs import log_agent

logger = logging.getLogger(__name__)

COVERAGE_THRESHOLDS = {
    'critical': 90.0,
    'high': 85.0,
    'medium': 80.0,
    'low': 70.0,
}


def check_test_coverage(db, task):
    """Check if test results meet coverage threshold for task's risk tier.

    Returns (passed, coverage, required).
    """
    task_id = task['id']
    risk_tier = task.get('risk_tier', 'medium')
    required = COVERAGE_THRESHOLDS.get(risk_tier, 80.0)

    # Get latest test results
    result = db.fetchone(
        """SELECT coverage, passed, failed, total_tests
           FROM test_results
           WHERE task_id = %s
           ORDER BY created_at DESC LIMIT 1""",
        (task_id,)
    )

    if not result:
        log_agent(db, 'test_gate', 'no_results',
                  'No test results found', task_id, 'WARN')
        return False, 0, required

    coverage = result.get('coverage') or 0
    failed = result.get('failed', 0)

    # Must have zero failures
    if failed > 0:
        log_agent(db, 'test_gate', 'failures',
                  f"{failed} test(s) failed", task_id, 'WARN')
        return False, coverage, required

    # Check coverage threshold
    passed = coverage >= required
    status = 'pass' if passed else 'fail'
    log_agent(db, 'test_gate', status,
              f"Coverage: {coverage}% (required: {required}% for {risk_tier})",
              task_id)

    return passed, coverage, required
