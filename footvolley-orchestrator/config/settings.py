"""Load configuration from .env file."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from orchestrator directory
_env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(_env_path)


# MySQL
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'footvolley_ops')

# Paths
ONEFTV_APP_DIR = os.getenv('ONEFTV_APP_DIR', '/Users/mac-mini/oneftv-app')
CLAUDE_CLI = os.getenv('CLAUDE_CLI', '/Users/mac-mini/.npm/_npx/becf7b9e49303068/node_modules/.bin/claude')
WORKTREE_BASE = os.getenv('WORKTREE_BASE', '/Users/mac-mini/oneftv-app/.worktrees')

# Notifications
WHATSAPP_TARGET = os.getenv('WHATSAPP_TARGET', '+17866209459')

# Orchestrator timing (in ticks, 1 tick = 60s)
TICK_INTERVAL = int(os.getenv('TICK_INTERVAL', '60'))
SCOUT_INTERVAL = int(os.getenv('SCOUT_INTERVAL', '360'))

# Lease/lock timeouts (seconds)
LEASE_TIMEOUT = int(os.getenv('LEASE_TIMEOUT', '900'))
LOCK_TIMEOUT = int(os.getenv('LOCK_TIMEOUT', '600'))
BUILDER_TIMEOUT = int(os.getenv('BUILDER_TIMEOUT', '600'))

# Agreement gate
AGREEMENT_QUALITY_FLOOR = int(os.getenv('AGREEMENT_QUALITY_FLOOR', '70'))
AGREEMENT_SIMILARITY_THRESHOLD = float(os.getenv('AGREEMENT_SIMILARITY_THRESHOLD', '0.75'))
AGREEMENT_MAX_ITERATIONS = int(os.getenv('AGREEMENT_MAX_ITERATIONS', '3'))
