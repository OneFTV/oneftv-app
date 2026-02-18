"""Tester agent: generate tests + run them on task branch.

Two-step: (1) Claude Code generates tests, (2) run npx vitest.
"""

import json
import logging
import os
import subprocess

import yaml

from agents.base_agent import call_llm
from db.queries.tasks import begin_execution, release_lease, transition, get_task
from db.queries.logs import log_agent, log_test_result
from git.branch_manager import get_changed_files, commit_changes
from config.settings import ONEFTV_APP_DIR

logger = logging.getLogger(__name__)


def _load_prompt_template():
    yaml_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'agents.yaml')
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return config['tester']['prompt_template']


def _run_vitest(worktree_path):
    """Run vitest in the worktree and return parsed results."""
    try:
        result = subprocess.run(
            ['npx', 'vitest', 'run', '--reporter=json'],
            capture_output=True,
            text=True,
            cwd=worktree_path,
            timeout=120,
        )

        # Try to parse JSON output
        try:
            # vitest JSON output may be mixed with other output
            stdout = result.stdout
            json_start = stdout.find('{')
            if json_start >= 0:
                # Find the matching closing brace
                depth = 0
                for i, c in enumerate(stdout[json_start:], json_start):
                    if c == '{':
                        depth += 1
                    elif c == '}':
                        depth -= 1
                    if depth == 0:
                        report = json.loads(stdout[json_start:i + 1])
                        return {
                            'passed': report.get('numPassedTests', 0),
                            'failed': report.get('numFailedTests', 0),
                            'total': report.get('numTotalTests', 0),
                            'skipped': report.get('numPendingTests', 0),
                            'success': report.get('success', False),
                            'report': report,
                        }
        except json.JSONDecodeError:
            pass

        # Fallback: parse exit code
        return {
            'passed': 0,
            'failed': 1 if result.returncode != 0 else 0,
            'total': 1,
            'skipped': 0,
            'success': result.returncode == 0,
            'report': {'stdout': result.stdout[:2000], 'stderr': result.stderr[:2000]},
        }

    except subprocess.TimeoutExpired:
        return {
            'passed': 0,
            'failed': 1,
            'total': 1,
            'skipped': 0,
            'success': False,
            'report': {'error': 'Vitest timed out after 120s'},
        }
    except FileNotFoundError:
        return {
            'passed': 0,
            'failed': 1,
            'total': 0,
            'skipped': 0,
            'success': False,
            'report': {'error': 'npx/vitest not found'},
        }


def run(db, task):
    """Generate and run tests for an IN_PROGRESS task.

    Step 1: Claude Code generates tests in the worktree
    Step 2: Run vitest and record results
    If tests pass -> transition to TESTING (ready for review)
    """
    if not task:
        return

    task_id = task['id']
    worktree_path = task.get('worktree_path')

    if not worktree_path or not os.path.isdir(worktree_path):
        log_agent(db, 'tester', 'no_worktree',
                  'Task has no valid worktree', task_id, 'ERROR')
        return

    logger.info(f"Tester: task {task_id}: {task['title']}")

    # Acquire lease
    lease_id = begin_execution(db, task_id, 'tester')
    if not lease_id:
        log_agent(db, 'tester', 'lease_failed',
                  'Could not acquire lease', task_id, 'WARN')
        return

    try:
        # Step 1: Generate tests via Claude Code CLI
        changed_files = get_changed_files(worktree_path)
        template = _load_prompt_template()

        from string import Template
        prompt = Template(template).safe_substitute(
            title=task['title'],
            changed_files='\n'.join(changed_files),
            spec=task.get('spec', '')[:2000],
            acceptance_criteria=task.get('acceptance_criteria', '[]')[:1000],
        )

        log_agent(db, 'tester', 'generating_tests',
                  f"Changed files: {len(changed_files)}", task_id)

        response = call_llm(
            db, 'tester', prompt,
            task_id=task_id,
            cwd=worktree_path,
            timeout=300,
        )

        if not response:
            log_agent(db, 'tester', 'test_gen_failed',
                      'No LLM response', task_id, 'ERROR')
            return

        # Commit generated tests
        commit_changes(worktree_path, f"test: add tests for task {task_id}",
                       task_id=task_id)

        # Step 2: Run vitest
        log_agent(db, 'tester', 'running_tests', None, task_id)
        results = _run_vitest(worktree_path)

        # Record test results
        log_test_result(
            db, task_id, 'unit',
            total_tests=results['total'],
            passed=results['passed'],
            failed=results['failed'],
            skipped=results['skipped'],
            report=results['report'],
        )

        if results['success'] and results['failed'] == 0:
            # Tests pass -> TESTING (ready for code review)
            transition(db, task_id, 'IN_PROGRESS', 'TESTING')
            log_agent(db, 'tester', 'tests_passed',
                      f"Passed: {results['passed']}/{results['total']}",
                      task_id)
            logger.info(f"Task {task_id}: {results['passed']}/{results['total']} tests passed")
        else:
            log_agent(db, 'tester', 'tests_failed',
                      f"Failed: {results['failed']}/{results['total']}",
                      task_id, 'WARN')
            logger.warning(f"Task {task_id}: {results['failed']} test(s) failed")

    finally:
        release_lease(db, task_id, lease_id)
