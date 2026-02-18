"""Base agent with Claude Code CLI wrapper and idempotency."""

import hashlib
import logging
import os
import subprocess
import time

from db.queries.logs import log_call, complete_call, get_existing_call, log_agent
from config.settings import CLAUDE_CLI, ONEFTV_APP_DIR

logger = logging.getLogger(__name__)


def call_llm(db, agent_name, prompt, task_id=None, cwd=None, timeout=300,
             idempotency_key=None):
    """Call Claude Code CLI with idempotency check.

    - Wraps `claude --print --dangerously-skip-permissions`
    - Unsets CLAUDECODE env var to avoid nested session detection
    - Uses stdin=subprocess.DEVNULL
    - Checks agent_call_log for idempotency before firing
    """
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()

    # Build idempotency key if not provided
    if idempotency_key is None:
        idempotency_key = f"{agent_name}:{task_id or 'none'}:{prompt_hash[:16]}"

    # Check for existing successful call
    existing = get_existing_call(db, idempotency_key)
    if existing:
        logger.info(f"[{agent_name}] Idempotent hit for {idempotency_key}")
        return existing['response']

    # Log the call attempt
    log_call(db, idempotency_key, agent_name, task_id, prompt_hash)
    db.conn.commit()

    # Prepare environment: unset CLAUDECODE to avoid nested detection
    env = os.environ.copy()
    env.pop('CLAUDECODE', None)

    cwd = cwd or ONEFTV_APP_DIR

    start_time = time.time()

    try:
        result = subprocess.run(
            [CLAUDE_CLI, '--print', '--dangerously-skip-permissions', prompt],
            capture_output=True,
            text=True,
            stdin=subprocess.DEVNULL,
            cwd=cwd,
            env=env,
            timeout=timeout,
        )

        duration_ms = int((time.time() - start_time) * 1000)
        response = result.stdout

        if result.returncode != 0:
            error_msg = result.stderr or f"Exit code {result.returncode}"
            log_agent(db, agent_name, 'call_llm_error', error_msg, task_id, 'ERROR')
            complete_call(db, idempotency_key, error_msg, duration_ms, 'error')
            db.conn.commit()
            return None

        complete_call(db, idempotency_key, response, duration_ms, 'success')
        log_agent(db, agent_name, 'call_llm_success',
                  f"Duration: {duration_ms}ms, Response length: {len(response)}",
                  task_id)
        db.conn.commit()
        return response

    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start_time) * 1000)
        log_agent(db, agent_name, 'call_llm_timeout',
                  f"Timeout after {timeout}s", task_id, 'ERROR')
        complete_call(db, idempotency_key, f"TIMEOUT after {timeout}s",
                      duration_ms, 'error')
        db.conn.commit()
        return None

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        log_agent(db, agent_name, 'call_llm_exception', str(e), task_id, 'ERROR')
        complete_call(db, idempotency_key, str(e), duration_ms, 'error')
        db.conn.commit()
        return None


def run_agent_safe(db, agent_fn, task, agent_name=None):
    """Run an agent function with error handling and logging."""
    name = agent_name or getattr(agent_fn, '__module__', 'unknown')
    task_id = task['id'] if task else None

    try:
        log_agent(db, name, 'start', None, task_id)
        db.conn.commit()
        result = agent_fn(db, task)
        log_agent(db, name, 'complete', None, task_id)
        db.conn.commit()
        return result
    except Exception as e:
        logger.exception(f"[{name}] Agent error: {e}")
        log_agent(db, name, 'error', str(e), task_id, 'ERROR')
        db.conn.commit()
        return None
