"""Notifications via OpenClaw WhatsApp and Atena."""

import logging
import subprocess

from config.settings import WHATSAPP_TARGET

logger = logging.getLogger(__name__)


def notify_whatsapp(message):
    """Send a direct WhatsApp message via OpenClaw CLI."""
    try:
        result = subprocess.run(
            [
                'openclaw', 'message', 'send',
                '--channel', 'whatsapp',
                '--target', WHATSAPP_TARGET,
                '-m', message,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            logger.error(f"WhatsApp send failed: {result.stderr}")
            return False
        return True
    except FileNotFoundError:
        logger.error("openclaw CLI not found in PATH")
        return False
    except subprocess.TimeoutExpired:
        logger.error("WhatsApp send timed out")
        return False
    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
        return False


def notify_via_atena(message):
    """Send a message through Atena agent for formatted delivery."""
    try:
        result = subprocess.run(
            [
                'openclaw', 'agent',
                '--agent', 'atena',
                '--to', WHATSAPP_TARGET,
                '--channel', 'whatsapp',
                '--message', message,
                '--deliver',
                '--timeout', '60',
            ],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if result.returncode != 0:
            logger.error(f"Atena notification failed: {result.stderr}")
            return False
        return True
    except FileNotFoundError:
        logger.error("openclaw CLI not found in PATH")
        return False
    except subprocess.TimeoutExpired:
        logger.error("Atena notification timed out")
        return False
    except Exception as e:
        logger.error(f"Atena notification error: {e}")
        return False
