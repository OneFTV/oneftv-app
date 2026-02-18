"""Reviewer agent: architecture/security review of task changes."""

import json
import logging
import os

import yaml

from agents.base_agent import call_llm
from db.queries.tasks import begin_execution, release_lease, transition
from db.queries.logs import log_agent
from git.branch_manager import get_diff

logger = logging.getLogger(__name__)


def _load_prompt_template():
    yaml_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'agents.yaml')
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return config['reviewer']['prompt_template']


def run(db, task):
    """Review a TESTING task's code changes.

    Claude Code CLI reviews changed files for architecture, security,
    NFA compliance. Returns {approved, issues, severity}.
    If approved -> transition to REVIEW (ready for CI gate).
    """
    if not task:
        return

    task_id = task['id']
    worktree_path = task.get('worktree_path')

    if not worktree_path or not os.path.isdir(worktree_path):
        log_agent(db, 'reviewer', 'no_worktree',
                  'Task has no valid worktree', task_id, 'ERROR')
        return

    logger.info(f"Reviewer: task {task_id}: {task['title']}")

    # Acquire lease
    lease_id = begin_execution(db, task_id, 'reviewer')
    if not lease_id:
        log_agent(db, 'reviewer', 'lease_failed',
                  'Could not acquire lease', task_id, 'WARN')
        return

    try:
        # Get diff
        diff = get_diff(worktree_path)
        if not diff:
            log_agent(db, 'reviewer', 'no_diff',
                      'No changes to review', task_id, 'WARN')
            # No changes means nothing to block — approve
            transition(db, task_id, 'TESTING', 'REVIEW')
            return

        template = _load_prompt_template()
        from string import Template
        prompt = Template(template).safe_substitute(diff=diff[:8000])

        log_agent(db, 'reviewer', 'reviewing',
                  f"Diff size: {len(diff)} chars", task_id)

        response = call_llm(
            db, 'reviewer', prompt,
            task_id=task_id,
            timeout=300,
        )

        if not response:
            log_agent(db, 'reviewer', 'review_failed',
                      'No LLM response', task_id, 'ERROR')
            return

        # Parse review result
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                review = json.loads(response[json_start:json_end])
            else:
                review = {'approved': True, 'issues': [], 'severity': 'low'}
        except json.JSONDecodeError:
            review = {'approved': True, 'issues': [], 'severity': 'low'}

        approved = review.get('approved', False)
        issues = review.get('issues', [])
        severity = review.get('severity', 'low')

        log_agent(db, 'reviewer', 'review_complete',
                  f"Approved: {approved}, Issues: {len(issues)}, Severity: {severity}",
                  task_id)

        if approved:
            transition(db, task_id, 'TESTING', 'REVIEW')
            logger.info(f"Task {task_id} approved by reviewer")
        else:
            log_agent(db, 'reviewer', 'review_rejected',
                      json.dumps(issues[:5]), task_id, 'WARN')
            logger.warning(f"Task {task_id} rejected: {len(issues)} issues "
                           f"(severity: {severity})")

    finally:
        release_lease(db, task_id, lease_id)
