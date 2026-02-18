"""Scout agent: research via Claude Code CLI, writes to research table."""

import json
import logging

import yaml

from agents.base_agent import call_llm
from db.queries.research import insert_research, get_promotable_research, promote_research
from db.queries.tasks import create_task
from db.queries.logs import log_agent

logger = logging.getLogger(__name__)

RESEARCH_TOPICS = [
    "NFA tournament rule updates and format changes",
    "Competitor footvolley apps and scoring systems",
    "Best practices for double elimination bracket UX",
    "Pool play scheduling optimization algorithms",
    "Real-time scoring and live feed patterns",
]


def _load_prompt_template():
    """Load scout prompt template from agents.yaml."""
    import os
    yaml_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'agents.yaml')
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    return config['scout']['prompt_template']


def run(db, _task):
    """Run scout research cycle.

    Picks a topic, runs Claude Code CLI research, stores findings,
    and auto-promotes high-impact discoveries.
    """
    template = _load_prompt_template()

    # Pick topic based on least-researched area
    existing = db.fetchall(
        "SELECT topic, COUNT(*) as cnt FROM research GROUP BY topic"
    )
    existing_counts = {r['topic']: r['cnt'] for r in existing}

    # Find least-researched topic
    topic = min(RESEARCH_TOPICS, key=lambda t: existing_counts.get(t, 0))

    logger.info(f"Scout researching: {topic}")
    log_agent(db, 'scout', 'research_start', topic)

    from string import Template
    prompt = Template(template).safe_substitute(topic=topic)
    response = call_llm(db, 'scout', prompt, timeout=300)

    if not response:
        log_agent(db, 'scout', 'research_failed', topic, level='ERROR')
        return

    # Parse JSON response
    try:
        # Try to extract JSON from response
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            data = json.loads(response[json_start:json_end])
        else:
            data = {
                'topic': topic,
                'findings': response,
                'impact_score': 5.0,
                'confidence': 0.5,
                'source': 'claude_code',
            }
    except json.JSONDecodeError:
        data = {
            'topic': topic,
            'findings': response,
            'impact_score': 5.0,
            'confidence': 0.5,
            'source': 'claude_code',
        }

    # Store research
    insert_research(
        db,
        topic=data.get('topic', topic),
        findings=data.get('findings', response),
        source=data.get('source', 'claude_code'),
        impact_score=data.get('impact_score'),
        confidence=data.get('confidence'),
    )

    log_agent(db, 'scout', 'research_stored', topic)

    # Auto-promote high-impact findings
    promotable = get_promotable_research(db)
    for finding in promotable:
        task_id = create_task(
            db,
            title=f"[Scout] {finding['topic'][:200]}",
            description=finding['findings'],
            category='backend',
            priority=max(1, 10 - int(finding['impact_score'])),
        )
        promote_research(db, finding['id'], task_id)
        log_agent(db, 'scout', 'research_promoted',
                  f"Research {finding['id']} -> Task {task_id}", task_id)
        logger.info(f"Promoted research {finding['id']} to task {task_id}")

    logger.info(f"Scout completed research on: {topic}")
