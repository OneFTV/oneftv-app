"""Lease recovery and lock cleanup gates."""

import logging
from db.queries.tasks import get_expired_leases, release_lease, transition
from db.queries.file_locks import cleanup_expired_locks, release_all_locks
from db.queries.logs import log_agent

logger = logging.getLogger(__name__)


def recover_expired_leases(db):
    """Find tasks with expired leases and reset them."""
    expired = get_expired_leases(db)

    for task in expired:
        task_id = task['id']
        lease_id = task['lease_id']
        old_status = task['status']

        logger.warning(f"Recovering expired lease for task {task_id} "
                       f"(agent: {task['assigned_agent']}, status: {old_status})")

        # Release the lease
        release_lease(db, task_id, lease_id)

        # Release any file locks held by this task
        release_all_locks(db, task_id)

        # Reset to READY so it can be picked up again
        if old_status == 'IN_PROGRESS':
            transition(db, task_id, 'IN_PROGRESS', 'READY')
        elif old_status == 'TESTING':
            transition(db, task_id, 'TESTING', 'READY')
        elif old_status == 'REVIEW':
            transition(db, task_id, 'REVIEW', 'READY')

        log_agent(db, 'lease_gate', 'recover_lease',
                  f"Reset task {task_id} from {old_status} to READY",
                  task_id, 'WARN')

    if expired:
        logger.info(f"Recovered {len(expired)} expired lease(s)")

    return len(expired)


def run_cleanup(db):
    """Clean up expired locks."""
    cleaned = cleanup_expired_locks(db)
    if cleaned > 0:
        logger.info(f"Cleaned up {cleaned} expired file lock(s)")
        log_agent(db, 'lease_gate', 'cleanup_locks',
                  f"Released {cleaned} expired locks")
    return cleaned
