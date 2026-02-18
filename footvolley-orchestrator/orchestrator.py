#!/usr/bin/env python3
"""Main orchestrator: 60s tick loop with startup recovery and signal handling."""

import datetime
import logging
import os
import signal
import sys
import time

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.settings import TICK_INTERVAL, SCOUT_INTERVAL
from db.connection import DBContext
from db.queries.tasks import get_tasks, get_task_counts
from db.queries.logs import log_agent
from gates.lease_gate import recover_expired_leases, run_cleanup
from notifications.notifier import notify_whatsapp, notify_via_atena

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger('orchestrator')

# Graceful shutdown flag
_shutdown = False


def _signal_handler(signum, frame):
    global _shutdown
    sig_name = signal.Signals(signum).name
    logger.info(f"Received {sig_name}, shutting down gracefully...")
    _shutdown = True


def startup_recovery():
    """Recover from any unclean shutdown."""
    logger.info("Running startup recovery...")
    with DBContext() as db:
        recovered = recover_expired_leases(db)
        cleaned = run_cleanup(db)
        log_agent(db, 'orchestrator', 'startup_recovery',
                  f"Recovered {recovered} leases, cleaned {cleaned} locks")
    logger.info(f"Startup recovery complete: {recovered} leases, {cleaned} locks")


def tick(cycle):
    """Single orchestrator tick. Each phase picks at most 1 task."""
    with DBContext() as db:
        # Always: recover expired leases and clean up locks
        recover_expired_leases(db)
        run_cleanup(db)

        # Phase 2: Scout (every SCOUT_INTERVAL ticks = ~6 hours)
        if cycle % SCOUT_INTERVAL == 0 and cycle > 0:
            try:
                from agents.scout import run as scout_run
                from agents.base_agent import run_agent_safe
                run_agent_safe(db, scout_run, None, 'scout')
            except ImportError:
                pass  # Scout not yet implemented

        # Phase 2: Planner — process DISCOVERED tasks
        for task in get_tasks(db, status='DISCOVERED', limit=1):
            try:
                from agents.planner import run as planner_run
                from agents.base_agent import run_agent_safe
                run_agent_safe(db, planner_run, task, 'planner')
            except ImportError:
                pass  # Planner not yet implemented

        # Phase 2: Agreement gate — evaluate SPECCED tasks
        for task in get_tasks(db, status='SPECCED', limit=1):
            try:
                from gates.agreement_gate import evaluate_agreement
                evaluate_agreement(db, task)
            except ImportError:
                pass  # Agreement gate not yet implemented

        # Phase 3: Builders — process READY tasks
        for task in get_tasks(db, status='READY', category='frontend', limit=1):
            try:
                from agents.builder_frontend import run as frontend_run
                from agents.base_agent import run_agent_safe
                run_agent_safe(db, frontend_run, task, 'builder_frontend')
            except ImportError:
                pass

        for task in get_tasks(db, status='READY', category='backend', limit=1):
            try:
                from agents.builder_backend import run as backend_run
                from agents.base_agent import run_agent_safe
                run_agent_safe(db, backend_run, task, 'builder_backend')
            except ImportError:
                pass

        # Phase 4: Tester — process IN_PROGRESS tasks
        for task in get_tasks(db, status='IN_PROGRESS', limit=1):
            try:
                from agents.tester import run as tester_run
                from agents.base_agent import run_agent_safe
                run_agent_safe(db, tester_run, task, 'tester')
            except ImportError:
                pass

        # Phase 4: Reviewer — process TESTING tasks
        for task in get_tasks(db, status='TESTING', limit=1):
            try:
                from agents.reviewer import run as reviewer_run
                from agents.base_agent import run_agent_safe
                run_agent_safe(db, reviewer_run, task, 'reviewer')
            except ImportError:
                pass

        # Phase 4: CI gate — process REVIEW tasks (merge to main)
        for task in get_tasks(db, status='REVIEW', limit=1):
            try:
                from gates.ci_gate import run_ci_gate
                run_ci_gate(db, task)
            except ImportError:
                pass

        # Daily summary at 8 AM
        now = datetime.datetime.now()
        if now.hour == 8 and now.minute == 0 and cycle > 0:
            counts = get_task_counts(db)
            total = sum(counts.values())
            done = counts.get('DONE', 0)
            in_progress = counts.get('IN_PROGRESS', 0)
            blocked = counts.get('BLOCKED', 0)

            summary_msg = (
                f"Daily Orchestrator Summary ({now.strftime('%Y-%m-%d')})\n"
                f"Tasks: {total} total, {done} done, {in_progress} in progress, "
                f"{blocked} blocked\n"
                + ", ".join(f"{s}: {c}" for s, c in sorted(counts.items()))
            )
            notify_via_atena(summary_msg)
            log_agent(db, 'orchestrator', 'daily_summary', summary_msg)

        # Log cycle summary
        if cycle % 10 == 0:  # Every 10 ticks (~10 min)
            counts = get_task_counts(db)
            summary = ", ".join(f"{s}:{c}" for s, c in sorted(counts.items()))
            logger.info(f"Cycle {cycle} summary: {summary or 'no tasks'}")
            log_agent(db, 'orchestrator', 'cycle_summary', summary)


def main():
    global _shutdown

    # Register signal handlers
    signal.signal(signal.SIGTERM, _signal_handler)
    signal.signal(signal.SIGINT, _signal_handler)

    logger.info("=" * 60)
    logger.info("Footvolley AI Orchestrator starting")
    logger.info(f"Tick interval: {TICK_INTERVAL}s, Scout interval: {SCOUT_INTERVAL} ticks")
    logger.info("=" * 60)

    # Startup recovery
    startup_recovery()

    # Notify
    notify_whatsapp("Orchestrator started")

    cycle = 0

    while not _shutdown:
        try:
            tick_start = time.time()
            tick(cycle)
            tick_duration = time.time() - tick_start

            if tick_duration > TICK_INTERVAL:
                logger.warning(f"Tick {cycle} took {tick_duration:.1f}s "
                               f"(>{TICK_INTERVAL}s)")

            cycle += 1

            # Sleep for remainder of tick interval
            sleep_time = max(0, TICK_INTERVAL - tick_duration)
            if sleep_time > 0 and not _shutdown:
                time.sleep(sleep_time)

        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
            break
        except Exception as e:
            logger.exception(f"Tick {cycle} error: {e}")
            # Don't crash on individual tick errors
            time.sleep(TICK_INTERVAL)
            cycle += 1

    logger.info("Orchestrator stopped")
    notify_whatsapp("Orchestrator stopped")


if __name__ == '__main__':
    main()
