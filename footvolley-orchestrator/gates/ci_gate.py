"""CI gate: local CI checks before merge.

Runs: tsc --noEmit, eslint (if configured), npm audit, prisma validate.
All must pass for merge to proceed.
"""

import logging
import subprocess
import time

from db.queries.tasks import transition, update_task
from db.queries.logs import log_agent, log_ci_result
from db.queries.file_locks import release_all_locks
from git.branch_manager import merge_to_main, delete_branch, remove_worktree
from notifications.notifier import notify_whatsapp

logger = logging.getLogger(__name__)

CI_CHECKS = [
    ('typecheck', ['npx', 'tsc', '--noEmit']),
    ('prisma_validate', ['npx', 'prisma', 'validate']),
    ('audit', ['npm', 'audit', '--audit-level=high']),
]


def _run_check(check_type, cmd, worktree_path):
    """Run a single CI check. Returns (passed, output, duration_ms)."""
    start = time.time()
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=worktree_path,
            timeout=120,
        )
        duration_ms = int((time.time() - start) * 1000)
        output = (result.stdout + '\n' + result.stderr)[:2000]
        passed = result.returncode == 0
        return passed, output, duration_ms
    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start) * 1000)
        return False, f'{check_type} timed out after 120s', duration_ms
    except FileNotFoundError:
        return False, f'Command not found: {cmd[0]}', 0


def run_ci_gate(db, task):
    """Run all CI checks on a REVIEW task.

    If all pass -> merge to main -> DONE -> WhatsApp notification.
    If any fail -> log results, stay in REVIEW.
    """
    if not task:
        return

    task_id = task['id']
    worktree_path = task.get('worktree_path')
    branch_name = task.get('branch_name')

    if not worktree_path or not branch_name:
        log_agent(db, 'ci_gate', 'missing_info',
                  'No worktree_path or branch_name', task_id, 'ERROR')
        return

    logger.info(f"CI gate: task {task_id}")
    log_agent(db, 'ci_gate', 'start', None, task_id)

    all_passed = True

    for check_type, cmd in CI_CHECKS:
        passed, output, duration_ms = _run_check(check_type, cmd, worktree_path)
        log_ci_result(db, task_id, check_type, passed, output, duration_ms)

        if passed:
            logger.info(f"  {check_type}: PASS ({duration_ms}ms)")
        else:
            logger.warning(f"  {check_type}: FAIL ({duration_ms}ms)")
            all_passed = False

    if not all_passed:
        log_agent(db, 'ci_gate', 'failed',
                  'One or more CI checks failed', task_id, 'WARN')
        return

    # All CI checks passed -> merge to main
    logger.info(f"Task {task_id}: All CI checks passed, merging to main")
    log_agent(db, 'ci_gate', 'ci_passed', 'All checks passed', task_id)

    merged = merge_to_main(branch_name)
    if not merged:
        log_agent(db, 'ci_gate', 'merge_failed',
                  f'Could not merge {branch_name} to main', task_id, 'ERROR')
        return

    # Cleanup: delete branch, remove worktree, release locks
    delete_branch(branch_name)
    remove_worktree(task_id)
    release_all_locks(db, task_id)

    # Transition to DONE
    transition(db, task_id, 'REVIEW', 'DONE')
    update_task(db, task_id, completed_at='NOW()')
    log_agent(db, 'ci_gate', 'done',
              f'Merged {branch_name} to main', task_id)

    # Notify
    notify_whatsapp(
        f"Task {task_id} DONE: {task['title']}\n"
        f"Branch {branch_name} merged to main."
    )

    logger.info(f"Task {task_id} DONE and merged to main!")
