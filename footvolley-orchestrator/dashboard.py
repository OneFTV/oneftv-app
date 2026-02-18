#!/usr/bin/env python3
"""Terminal status dashboard with ANSI formatting, 30s refresh."""

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.connection import DBContext

# ANSI escape codes
BOLD = '\033[1m'
RESET = '\033[0m'
GREEN = '\033[32m'
YELLOW = '\033[33m'
RED = '\033[31m'
CYAN = '\033[36m'
DIM = '\033[2m'
CLEAR = '\033[2J\033[H'

STATUS_COLORS = {
    'DISCOVERED': CYAN,
    'SPECCED': CYAN,
    'READY': YELLOW,
    'IN_PROGRESS': YELLOW,
    'TESTING': YELLOW,
    'REVIEW': YELLOW,
    'DONE': GREEN,
    'BLOCKED': RED,
    'FAILED': RED,
}


def _bar(value, max_val, width=20):
    """Render a simple ASCII progress bar."""
    if max_val == 0:
        return '[' + ' ' * width + ']'
    filled = int(width * value / max_val)
    return '[' + '#' * filled + ' ' * (width - filled) + ']'


def render(db):
    """Render the dashboard."""
    lines = []

    lines.append(f"{BOLD}{'=' * 60}{RESET}")
    lines.append(f"{BOLD}  Footvolley AI Orchestrator — Dashboard{RESET}")
    lines.append(f"{DIM}  {time.strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
    lines.append(f"{BOLD}{'=' * 60}{RESET}")

    # Task counts by status
    lines.append(f"\n{BOLD}Tasks{RESET}")
    rows = db.fetchall(
        "SELECT status, COUNT(*) as cnt FROM tasks GROUP BY status ORDER BY status"
    )
    total = sum(r['cnt'] for r in rows)
    done = sum(r['cnt'] for r in rows if r['status'] == 'DONE')

    for row in rows:
        color = STATUS_COLORS.get(row['status'], '')
        lines.append(f"  {color}{row['status']:15s}{RESET} {row['cnt']:3d}")

    if total > 0:
        lines.append(f"  {'─' * 22}")
        lines.append(f"  {'Total':15s} {total:3d}  {_bar(done, total)}")

    # Active leases
    lines.append(f"\n{BOLD}Active Leases{RESET}")
    leases = db.fetchall(
        """SELECT id, title, assigned_agent, lease_expires_at
           FROM tasks WHERE lease_id IS NOT NULL
           ORDER BY lease_expires_at ASC"""
    )
    if leases:
        for l in leases:
            exp = l['lease_expires_at']
            lines.append(f"  Task {l['id']:3d} | {l['assigned_agent']:20s} | "
                         f"Expires: {exp}")
    else:
        lines.append(f"  {DIM}None{RESET}")

    # File locks
    lines.append(f"\n{BOLD}File Locks{RESET}")
    locks = db.fetchall(
        """SELECT file_path, agent_name, expires_at
           FROM file_locks
           WHERE released_at IS NULL AND expires_at > NOW()
           ORDER BY acquired_at ASC"""
    )
    if locks:
        for lk in locks:
            path = lk['file_path']
            if len(path) > 40:
                path = '...' + path[-37:]
            lines.append(f"  {path:40s} | {lk['agent_name']:15s}")
    else:
        lines.append(f"  {DIM}None{RESET}")

    # Recent agreement scores
    lines.append(f"\n{BOLD}Recent Agreement Scores{RESET}")
    agreements = db.fetchall(
        """SELECT d.task_id, t.title, d.pass_type, d.iteration,
                  d.quality_score, d.approved
           FROM decisions d
           JOIN tasks t ON d.task_id = t.id
           ORDER BY d.created_at DESC LIMIT 6"""
    )
    if agreements:
        for a in agreements:
            status = f"{GREEN}PASS{RESET}" if a['approved'] else f"{RED}FAIL{RESET}"
            title = a['title'][:30] if a['title'] else '?'
            lines.append(f"  Task {a['task_id']:3d} | {a['pass_type']:12s} | "
                         f"Iter {a['iteration']} | Score: {a['quality_score']:5.1f} | "
                         f"{status}")
    else:
        lines.append(f"  {DIM}None{RESET}")

    # Recent test results
    lines.append(f"\n{BOLD}Recent Test Results{RESET}")
    tests = db.fetchall(
        """SELECT tr.task_id, t.title, tr.passed, tr.failed, tr.total_tests,
                  tr.coverage
           FROM test_results tr
           JOIN tasks t ON tr.task_id = t.id
           ORDER BY tr.created_at DESC LIMIT 5"""
    )
    if tests:
        for tr in tests:
            color = GREEN if tr['failed'] == 0 else RED
            cov = f"{tr['coverage']:.0f}%" if tr['coverage'] else 'N/A'
            lines.append(f"  Task {tr['task_id']:3d} | "
                         f"{color}{tr['passed']}/{tr['total_tests']} passed{RESET} | "
                         f"Coverage: {cov}")
    else:
        lines.append(f"  {DIM}None{RESET}")

    # Recent CI results
    lines.append(f"\n{BOLD}Recent CI Results{RESET}")
    ci = db.fetchall(
        """SELECT cr.task_id, cr.check_type, cr.passed, cr.duration_ms
           FROM ci_results cr
           ORDER BY cr.created_at DESC LIMIT 6"""
    )
    if ci:
        for c in ci:
            color = GREEN if c['passed'] else RED
            dur = f"{c['duration_ms']}ms" if c['duration_ms'] else 'N/A'
            status = 'PASS' if c['passed'] else 'FAIL'
            lines.append(f"  Task {c['task_id']:3d} | {c['check_type']:18s} | "
                         f"{color}{status}{RESET} | {dur}")
    else:
        lines.append(f"  {DIM}None{RESET}")

    # Recent agent activity
    lines.append(f"\n{BOLD}Recent Activity (last 10){RESET}")
    logs = db.fetchall(
        """SELECT agent_name, action, detail, created_at, level
           FROM agent_logs
           ORDER BY created_at DESC LIMIT 10"""
    )
    for log in logs:
        color = RED if log['level'] == 'ERROR' else (
            YELLOW if log['level'] == 'WARN' else '')
        detail = (log['detail'] or '')[:50]
        ts = log['created_at'].strftime('%H:%M:%S') if log['created_at'] else ''
        lines.append(f"  {DIM}{ts}{RESET} {color}{log['agent_name']:20s}{RESET} "
                     f"{log['action']:20s} {detail}")

    lines.append(f"\n{DIM}Refreshing every 30s. Press Ctrl+C to exit.{RESET}")

    return '\n'.join(lines)


def main():
    print("Starting dashboard...")
    try:
        while True:
            with DBContext() as db:
                output = render(db)
            print(CLEAR + output, flush=True)
            time.sleep(30)
    except KeyboardInterrupt:
        print("\nDashboard stopped.")


if __name__ == '__main__':
    main()
