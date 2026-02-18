"""Agreement gate: two-pass scoring (analyst + implementer).

Quality floor >= 70 per dimension, similarity >= 0.75.
On failure after 3 iterations -> BLOCKED + WhatsApp notification.
"""

import json
import logging
import os

import yaml

from agents.base_agent import call_llm
from db.queries.agreements import get_latest_iteration, store_score
from db.queries.tasks import transition, update_task
from db.queries.logs import log_agent
from notifications.notifier import notify_whatsapp
from config.settings import (
    AGREEMENT_QUALITY_FLOOR,
    AGREEMENT_SIMILARITY_THRESHOLD,
    AGREEMENT_MAX_ITERATIONS,
)

logger = logging.getLogger(__name__)

DIMENSIONS = ['completeness', 'business_logic', 'data_model',
              'feasibility', 'security', 'testability']

# Weights for similarity calculation
WEIGHTS = {
    'completeness': 0.20,
    'business_logic': 0.25,
    'data_model': 0.15,
    'feasibility': 0.15,
    'security': 0.15,
    'testability': 0.10,
}


def _load_prompts():
    """Load analyst and implementer prompts from agents.yaml."""
    yaml_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'agents.yaml')
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return (config['agreement']['analyst_prompt'],
            config['agreement']['implementer_prompt'])


def _parse_scores(response):
    """Extract scores JSON from LLM response."""
    if not response:
        return None, None

    try:
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            data = json.loads(response[json_start:json_end])
            scores = data.get('scores', {})
            reasoning = data.get('reasoning', '')
            return scores, reasoning
    except json.JSONDecodeError:
        pass

    return None, None


def _check_quality_floor(scores):
    """Check if all dimensions meet the quality floor."""
    for dim in DIMENSIONS:
        score = scores.get(dim, 0)
        if score < AGREEMENT_QUALITY_FLOOR:
            return False, dim, score
    return True, None, None


def _calculate_similarity(analyst_scores, implementer_scores):
    """Calculate weighted similarity between analyst and implementer scores.

    Returns similarity score (0-1). Higher = more agreement.
    Similarity = 1 - weighted_delta, where delta is normalized difference.
    """
    weighted_delta = 0.0
    for dim in DIMENSIONS:
        a = analyst_scores.get(dim, 50)
        b = implementer_scores.get(dim, 50)
        delta = abs(a - b) / 100.0  # Normalize to 0-1
        weighted_delta += delta * WEIGHTS.get(dim, 1.0 / len(DIMENSIONS))

    return 1.0 - weighted_delta


def _average_quality(scores):
    """Calculate average quality score across dimensions."""
    vals = [scores.get(dim, 0) for dim in DIMENSIONS]
    return sum(vals) / len(vals) if vals else 0


def evaluate_agreement(db, task):
    """Evaluate a SPECCED task through the agreement gate.

    Makes 2 Claude Code CLI calls:
    - Pass A: Analyst perspective
    - Pass B: Implementer perspective

    Checks quality floor and similarity. On pass -> READY.
    On failure after max iterations -> BLOCKED + notification.
    """
    task_id = task['id']
    spec = task.get('spec', '')
    acceptance = task.get('acceptance_criteria', '[]')

    if not spec:
        log_agent(db, 'agreement_gate', 'no_spec',
                  'Task has no spec, skipping', task_id, 'WARN')
        return

    iteration = get_latest_iteration(db, task_id) + 1

    if iteration > AGREEMENT_MAX_ITERATIONS:
        # Already exceeded max iterations, should be blocked
        return

    logger.info(f"Agreement gate: task {task_id}, iteration {iteration}")
    log_agent(db, 'agreement_gate', 'evaluate_start',
              f"Iteration {iteration}", task_id)

    analyst_prompt, implementer_prompt = _load_prompts()

    # Pass A: Analyst
    from string import Template
    prompt_a = Template(analyst_prompt).safe_substitute(
        title=task['title'],
        spec=spec[:3000],
        acceptance_criteria=acceptance[:1000],
    )
    response_a = call_llm(
        db, 'agreement_analyst', prompt_a, task_id=task_id,
        idempotency_key=f"agreement:analyst:{task_id}:{iteration}",
        timeout=300,
    )
    analyst_scores, analyst_reasoning = _parse_scores(response_a)

    if not analyst_scores:
        log_agent(db, 'agreement_gate', 'analyst_parse_failed',
                  'Could not parse analyst scores', task_id, 'ERROR')
        return

    store_score(db, task_id, 'analyst', iteration, analyst_scores,
                _average_quality(analyst_scores), True, analyst_reasoning)

    # Pass B: Implementer
    prompt_b = Template(implementer_prompt).safe_substitute(
        title=task['title'],
        spec=spec[:3000],
        acceptance_criteria=acceptance[:1000],
    )
    response_b = call_llm(
        db, 'agreement_implementer', prompt_b, task_id=task_id,
        idempotency_key=f"agreement:implementer:{task_id}:{iteration}",
        timeout=300,
    )
    implementer_scores, implementer_reasoning = _parse_scores(response_b)

    if not implementer_scores:
        log_agent(db, 'agreement_gate', 'implementer_parse_failed',
                  'Could not parse implementer scores', task_id, 'ERROR')
        return

    store_score(db, task_id, 'implementer', iteration, implementer_scores,
                _average_quality(implementer_scores), True, implementer_reasoning)

    # Check quality floor for both
    a_pass, a_dim, a_score = _check_quality_floor(analyst_scores)
    b_pass, b_dim, b_score = _check_quality_floor(implementer_scores)

    if not a_pass:
        logger.warning(f"Task {task_id}: Analyst quality floor failed on "
                       f"{a_dim}={a_score}")

    if not b_pass:
        logger.warning(f"Task {task_id}: Implementer quality floor failed on "
                       f"{b_dim}={b_score}")

    # Check similarity
    similarity = _calculate_similarity(analyst_scores, implementer_scores)
    logger.info(f"Task {task_id}: Similarity = {similarity:.3f}")

    passed = a_pass and b_pass and similarity >= AGREEMENT_SIMILARITY_THRESHOLD

    if passed:
        # Transition SPECCED -> READY
        if transition(db, task_id, 'SPECCED', 'READY'):
            log_agent(db, 'agreement_gate', 'approved',
                      f"Similarity: {similarity:.3f}, Iteration: {iteration}",
                      task_id)
            logger.info(f"Task {task_id} APPROVED (similarity={similarity:.3f})")
        return

    # Failed - check if max iterations exceeded
    if iteration >= AGREEMENT_MAX_ITERATIONS:
        transition(db, task_id, 'SPECCED', 'BLOCKED')
        update_task(db, task_id, iteration_count=iteration)
        log_agent(db, 'agreement_gate', 'blocked',
                  f"Max iterations ({AGREEMENT_MAX_ITERATIONS}) exceeded",
                  task_id, 'WARN')

        # Notify via WhatsApp
        notify_whatsapp(
            f"Task {task_id} BLOCKED after {iteration} agreement iterations.\n"
            f"Title: {task['title']}\n"
            f"Similarity: {similarity:.3f}\n"
            f"Analyst failed: {a_dim}={a_score}\n"
            f"Implementer failed: {b_dim}={b_score}"
        )
        logger.warning(f"Task {task_id} BLOCKED after {iteration} iterations")
    else:
        update_task(db, task_id, iteration_count=iteration)
        log_agent(db, 'agreement_gate', 'iteration_failed',
                  f"Iteration {iteration}: similarity={similarity:.3f}",
                  task_id, 'WARN')
        logger.info(f"Task {task_id}: iteration {iteration} failed, will retry")
