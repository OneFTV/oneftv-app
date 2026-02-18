"""Backend builder agent: API routes/Prisma on READY+backend tasks."""

import json
import logging
import os

import yaml

from agents.base_agent import call_llm
from db.queries.tasks import begin_execution, release_lease, update_task, transition
from db.queries.file_locks import acquire_lock, release_all_locks
from db.queries.logs import log_agent
from git.branch_manager import create_worktree, commit_changes
from config.settings import BUILDER_TIMEOUT

logger = logging.getLogger(__name__)


def _load_prompt_template():
    yaml_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'agents.yaml')
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return config['builder_backend']['prompt_template']


def run(db, task):
    """Build backend code for a READY task.

    Flow: acquire lease -> create worktree -> acquire file locks ->
    call Claude Code CLI -> git commit -> release locks -> IN_PROGRESS
    """
    if not task:
        return

    task_id = task['id']
    logger.info(f"Backend builder: task {task_id}: {task['title']}")

    # Acquire lease
    lease_id = begin_execution(db, task_id, 'builder_backend')
    if not lease_id:
        log_agent(db, 'builder_backend', 'lease_failed',
                  'Could not acquire lease', task_id, 'WARN')
        return

    try:
        # Create worktree
        worktree_path, branch_name = create_worktree(task_id)
        if not worktree_path:
            log_agent(db, 'builder_backend', 'worktree_failed',
                      'Could not create worktree', task_id, 'ERROR')
            return

        update_task(db, task_id,
                    branch_name=branch_name,
                    worktree_path=worktree_path)

        # Build prompt
        template = _load_prompt_template()
        spec = task.get('spec', '')
        acceptance = task.get('acceptance_criteria', '[]')

        from string import Template
        prompt = Template(template).safe_substitute(
            title=task['title'],
            spec=spec[:4000],
            acceptance_criteria=acceptance[:1000],
        )

        log_agent(db, 'builder_backend', 'building',
                  f"Branch: {branch_name}", task_id)

        # Call Claude Code CLI in worktree directory
        response = call_llm(
            db, 'builder_backend', prompt,
            task_id=task_id,
            cwd=worktree_path,
            timeout=BUILDER_TIMEOUT,
        )

        if not response:
            log_agent(db, 'builder_backend', 'build_failed',
                      'No LLM response', task_id, 'ERROR')
            return

        # Commit changes
        committed = commit_changes(
            worktree_path,
            f"feat: {task['title'][:80]} (auto-generated)",
            task_id=task_id,
        )

        if committed:
            # Transition READY -> IN_PROGRESS (ready for testing)
            transition(db, task_id, 'READY', 'IN_PROGRESS')
            log_agent(db, 'builder_backend', 'build_complete',
                      f"Code generated on {branch_name}", task_id)
            logger.info(f"Task {task_id} built on branch {branch_name}")
        else:
            log_agent(db, 'builder_backend', 'commit_failed',
                      'No changes to commit', task_id, 'WARN')

    finally:
        # Always release locks and lease
        release_all_locks(db, task_id)
        release_lease(db, task_id, lease_id)
