"""Planner agent: reads research/task, writes spec + acceptance criteria."""

import json
import logging
import os

import yaml

from agents.base_agent import call_llm
from db.queries.tasks import update_task, transition
from db.queries.logs import log_agent
from config.settings import ONEFTV_APP_DIR

logger = logging.getLogger(__name__)


def _load_prompt_template():
    """Load planner prompt template from agents.yaml."""
    yaml_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'agents.yaml')
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return config['planner']['prompt_template']


def _read_file_safe(path, max_lines=100):
    """Read a file safely, returning content or empty string."""
    try:
        with open(path, 'r') as f:
            lines = f.readlines()
        return ''.join(lines[:max_lines])
    except (FileNotFoundError, PermissionError):
        return ''


def _build_context(task):
    """Build context from prisma schema and relevant source files."""
    schema_path = os.path.join(ONEFTV_APP_DIR, 'prisma', 'schema.prisma')
    schema_context = _read_file_safe(schema_path, max_lines=200)

    # Determine relevant source files based on category
    source_files = []
    category = task.get('category', 'backend')

    if category == 'frontend':
        src_dir = os.path.join(ONEFTV_APP_DIR, 'src', 'components')
        if os.path.isdir(src_dir):
            for root, _, files in os.walk(src_dir):
                for f in files:
                    if f.endswith('.tsx') or f.endswith('.ts'):
                        source_files.append(os.path.join(root, f))
                        if len(source_files) >= 5:
                            break
                if len(source_files) >= 5:
                    break
    elif category == 'backend':
        api_dir = os.path.join(ONEFTV_APP_DIR, 'src', 'app', 'api')
        if os.path.isdir(api_dir):
            for root, _, files in os.walk(api_dir):
                for f in files:
                    if f == 'route.ts':
                        source_files.append(os.path.join(root, f))
                        if len(source_files) >= 5:
                            break
                if len(source_files) >= 5:
                    break

    source_context = ''
    for sf in source_files[:5]:
        rel_path = os.path.relpath(sf, ONEFTV_APP_DIR)
        content = _read_file_safe(sf, max_lines=50)
        if content:
            source_context += f"\n--- {rel_path} ---\n{content}\n"

    return schema_context, source_context


def run(db, task):
    """Process a DISCOVERED task: build spec + acceptance criteria, transition to SPECCED."""
    if not task:
        return

    task_id = task['id']
    logger.info(f"Planner processing task {task_id}: {task['title']}")
    log_agent(db, 'planner', 'planning_start', task['title'], task_id)

    template = _load_prompt_template()
    schema_context, source_context = _build_context(task)

    from string import Template
    prompt = Template(template).safe_substitute(
        title=task['title'],
        description=task.get('description', ''),
        category=task.get('category', 'backend'),
        schema_context=schema_context[:3000],
        source_context=source_context[:3000],
    )

    response = call_llm(db, 'planner', prompt, task_id=task_id, timeout=300)

    if not response:
        log_agent(db, 'planner', 'planning_failed', 'No LLM response', task_id, 'ERROR')
        return

    # Parse spec and acceptance criteria from response
    try:
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            data = json.loads(response[json_start:json_end])
            spec = data.get('spec', response)
            acceptance = data.get('acceptance_criteria', [])
        else:
            spec = response
            acceptance = []
    except json.JSONDecodeError:
        spec = response
        acceptance = []

    # Update task with spec and acceptance criteria
    update_task(db, task_id,
                spec=spec,
                acceptance_criteria=json.dumps(acceptance))

    # Transition DISCOVERED -> SPECCED
    if transition(db, task_id, 'DISCOVERED', 'SPECCED'):
        log_agent(db, 'planner', 'planning_complete',
                  f"Spec length: {len(spec)}, Criteria: {len(acceptance)}", task_id)
        logger.info(f"Task {task_id} specced with {len(acceptance)} acceptance criteria")
    else:
        log_agent(db, 'planner', 'transition_failed',
                  'Could not transition DISCOVERED -> SPECCED', task_id, 'WARN')
