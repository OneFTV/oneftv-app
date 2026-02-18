#!/usr/bin/env python3
"""Seed initial DISCOVERED tasks from the plan's feature tables."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.connection import DBContext
from db.queries.tasks import create_task

# Feature tasks from the orchestrator plan, organized by epic
SEED_TASKS = [
    # Tournament Management
    {
        'title': 'Implement pool play group generation algorithm',
        'description': 'Generate pool play groups based on team count and seeding. Support 3-team and 4-team groups. Follow NFA format rules.',
        'category': 'backend',
        'priority': 2,
        'risk_tier': 'critical',
        'epic': 'bracket',
    },
    {
        'title': 'Build double elimination bracket generator',
        'description': 'Generate winners and losers bracket from pool play results. Support L1-L6 losers bracket rounds. Include grand finals with reset.',
        'category': 'backend',
        'priority': 1,
        'risk_tier': 'critical',
        'epic': 'bracket',
    },
    {
        'title': 'Implement court scheduling with rest periods',
        'description': 'Assign games to courts with time slots. Ensure minimum rest period between games for same team. Handle multi-court venues.',
        'category': 'backend',
        'priority': 3,
        'risk_tier': 'high',
        'epic': 'bracket',
    },
    {
        'title': 'Build bracket visualization component',
        'description': 'React component to display tournament brackets. Show winners bracket, losers bracket, and grand finals. Support live updates.',
        'category': 'frontend',
        'priority': 2,
        'risk_tier': 'high',
        'epic': 'bracket',
    },

    # Athlete & Rankings
    {
        'title': 'Build athlete profile page with stats',
        'description': 'Display athlete information, tournament history, win/loss record, and ranking progression chart.',
        'category': 'frontend',
        'priority': 4,
        'risk_tier': 'medium',
        'epic': 'athletes',
    },
    {
        'title': 'Implement ranking calculation engine',
        'description': 'Calculate rankings based on tournament results, division placement, and head-to-head records. Follow NFA ranking methodology.',
        'category': 'backend',
        'priority': 3,
        'risk_tier': 'high',
        'epic': 'rankings',
    },
    {
        'title': 'Build rankings leaderboard with filtering',
        'description': 'Display ranked athletes with division filtering, search, and time period selection. Show rank changes.',
        'category': 'frontend',
        'priority': 4,
        'risk_tier': 'medium',
        'epic': 'rankings',
    },

    # Tournament Operations
    {
        'title': 'Build tournament registration flow',
        'description': 'Player/team registration with division selection, partner pairing, and waitlist support.',
        'category': 'frontend',
        'priority': 3,
        'risk_tier': 'medium',
        'epic': 'tournaments',
    },
    {
        'title': 'Implement live scoring API',
        'description': 'Real-time score updates via API. Support set scores, timeouts, and game completion. Trigger bracket advancement.',
        'category': 'backend',
        'priority': 2,
        'risk_tier': 'high',
        'epic': 'live_scoring',
    },
    {
        'title': 'Build tournament management dashboard',
        'description': 'Admin dashboard for tournament directors. Manage brackets, scores, schedule changes, and player management.',
        'category': 'frontend',
        'priority': 3,
        'risk_tier': 'medium',
        'epic': 'tournaments',
    },

    # Infrastructure
    {
        'title': 'Add input validation middleware for API routes',
        'description': 'Zod-based validation for all API route inputs. Consistent error response format.',
        'category': 'backend',
        'priority': 5,
        'risk_tier': 'medium',
        'epic': 'infrastructure',
    },
    {
        'title': 'Implement API error handling and logging',
        'description': 'Standardized error responses, request logging, and error tracking for all API routes.',
        'category': 'backend',
        'priority': 5,
        'risk_tier': 'low',
        'epic': 'infrastructure',
    },
]


def run():
    with DBContext() as db:
        # Check if tasks already seeded
        existing = db.fetchone("SELECT COUNT(*) as cnt FROM tasks")
        if existing and existing['cnt'] > 0:
            print(f"Tasks table already has {existing['cnt']} tasks. "
                  f"Skipping seed to avoid duplicates.")
            print("To re-seed, truncate the tasks table first.")
            return

        print(f"Seeding {len(SEED_TASKS)} initial tasks...")
        for task_data in SEED_TASKS:
            task_id = create_task(
                db,
                title=task_data['title'],
                description=task_data['description'],
                category=task_data['category'],
                priority=task_data['priority'],
                risk_tier=task_data['risk_tier'],
                epic=task_data.get('epic'),
            )
            print(f"  [{task_id}] {task_data['title']}")

    print(f"\nSeeded {len(SEED_TASKS)} tasks in DISCOVERED status.")


if __name__ == '__main__':
    run()
