"""Git worktree management for task isolation.

Uses `git worktree add/remove` for parallel task branches.
Symlinks node_modules from main worktree to avoid npm install per task.
"""

import logging
import os
import subprocess

from config.settings import ONEFTV_APP_DIR, WORKTREE_BASE

logger = logging.getLogger(__name__)


def _git(args, cwd=None):
    """Run a git command and return (success, stdout, stderr)."""
    cwd = cwd or ONEFTV_APP_DIR
    result = subprocess.run(
        ['git'] + args,
        capture_output=True,
        text=True,
        cwd=cwd,
    )
    return result.returncode == 0, result.stdout.strip(), result.stderr.strip()


def create_worktree(task_id, branch_name=None):
    """Create a git worktree for a task.

    Returns (worktree_path, branch_name) on success, (None, None) on failure.
    """
    if branch_name is None:
        branch_name = f"orch/task-{task_id}"

    worktree_path = os.path.join(WORKTREE_BASE, str(task_id))

    # Ensure base directory exists
    os.makedirs(WORKTREE_BASE, exist_ok=True)

    # Create worktree with new branch from main
    ok, out, err = _git(['worktree', 'add', '-b', branch_name,
                         worktree_path, 'main'])

    if not ok:
        # Branch might already exist, try without -b
        ok, out, err = _git(['worktree', 'add', worktree_path, branch_name])
        if not ok:
            logger.error(f"Failed to create worktree for task {task_id}: {err}")
            return None, None

    # Symlink node_modules from main worktree
    main_nm = os.path.join(ONEFTV_APP_DIR, 'node_modules')
    wt_nm = os.path.join(worktree_path, 'node_modules')

    if os.path.isdir(main_nm) and not os.path.exists(wt_nm):
        os.symlink(main_nm, wt_nm)
        logger.info(f"Symlinked node_modules to worktree {task_id}")

    # Also symlink .next if it exists (for builds)
    main_next = os.path.join(ONEFTV_APP_DIR, '.next')
    if os.path.isdir(main_next):
        wt_next = os.path.join(worktree_path, '.next')
        if not os.path.exists(wt_next):
            os.symlink(main_next, wt_next)

    logger.info(f"Created worktree at {worktree_path} on branch {branch_name}")
    return worktree_path, branch_name


def remove_worktree(task_id):
    """Remove a worktree for a task."""
    worktree_path = os.path.join(WORKTREE_BASE, str(task_id))

    if not os.path.isdir(worktree_path):
        return True

    # Remove symlinks first to avoid git worktree remove issues
    for link_name in ('node_modules', '.next'):
        link_path = os.path.join(worktree_path, link_name)
        if os.path.islink(link_path):
            os.unlink(link_path)

    ok, out, err = _git(['worktree', 'remove', '--force', worktree_path])
    if not ok:
        logger.error(f"Failed to remove worktree {worktree_path}: {err}")
        return False

    logger.info(f"Removed worktree for task {task_id}")
    return True


def commit_changes(worktree_path, message, task_id=None):
    """Commit all changes in a worktree."""
    # Stage all changes
    ok, _, err = _git(['add', '-A'], cwd=worktree_path)
    if not ok:
        logger.error(f"Git add failed: {err}")
        return False

    # Check if there are changes to commit
    ok, out, _ = _git(['status', '--porcelain'], cwd=worktree_path)
    if not out.strip():
        logger.info("No changes to commit")
        return True

    # Commit
    full_message = f"{message}\n\nTask-ID: {task_id}" if task_id else message
    ok, _, err = _git(['commit', '-m', full_message], cwd=worktree_path)
    if not ok:
        logger.error(f"Git commit failed: {err}")
        return False

    logger.info(f"Committed changes in worktree: {message}")
    return True


def merge_to_main(branch_name):
    """Merge a task branch to main with --no-ff."""
    # Ensure we're on main
    ok, current, _ = _git(['branch', '--show-current'])
    if current != 'main':
        ok, _, err = _git(['checkout', 'main'])
        if not ok:
            logger.error(f"Failed to checkout main: {err}")
            return False

    ok, _, err = _git(['merge', '--no-ff', branch_name,
                       '-m', f"Merge {branch_name} into main"])
    if not ok:
        logger.error(f"Merge failed: {err}")
        return False

    logger.info(f"Merged {branch_name} to main")
    return True


def delete_branch(branch_name):
    """Delete a task branch after merge."""
    ok, _, err = _git(['branch', '-d', branch_name])
    if not ok:
        logger.warning(f"Failed to delete branch {branch_name}: {err}")
        return False
    return True


def get_changed_files(worktree_path):
    """Get list of changed files in worktree relative to main."""
    ok, out, _ = _git(['diff', '--name-only', 'main'], cwd=worktree_path)
    if not ok:
        return []
    return [f.strip() for f in out.split('\n') if f.strip()]


def get_diff(worktree_path):
    """Get the full diff of changes in worktree vs main."""
    ok, out, _ = _git(['diff', 'main'], cwd=worktree_path)
    return out if ok else ''
