"""Telegram error notification via structlog processor.

Intercepts ERROR-level log events and sends alerts to a Telegram chat.
Uses a background daemon thread with a queue so it works in both sync
and async contexts (important: many logger.error() calls happen inside
asyncio.to_thread() workers).
"""

import queue
import threading
import time
from datetime import datetime, timezone

import httpx

from src.core.telegram_config import telegram_settings

_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


class TelegramNotifier:
    """Sends error alerts to Telegram with per-key cooldown."""

    def __init__(self) -> None:
        self._cooldowns: dict[str, float] = {}
        self._cooldown_seconds = telegram_settings.telegram_notify_cooldown
        self._queue: queue.Queue[str] = queue.Queue(maxsize=100)
        self._started = False

    # ── structlog processor ───────────────────────────────────────

    def processor(
        self, logger: object, method_name: str, event_dict: dict
    ) -> dict:
        """structlog processor: enqueue Telegram message on ERROR events."""
        if method_name != "error":
            return event_dict

        error_key = self._make_key(event_dict)
        if not self._should_notify(error_key):
            return event_dict

        message = self._format_message(event_dict)
        try:
            self._queue.put_nowait(message)
        except queue.Full:
            pass  # drop silently — never block the logging pipeline

        self._ensure_sender_running()
        return event_dict

    # ── internals ─────────────────────────────────────────────────

    def _make_key(self, event_dict: dict) -> str:
        event = event_dict.get("event", "unknown")
        network = event_dict.get("network", "")
        return f"{event}:{network}" if network else str(event)

    def _should_notify(self, error_key: str) -> bool:
        now = time.monotonic()
        last_sent = self._cooldowns.get(error_key, 0.0)
        if now - last_sent < self._cooldown_seconds:
            return False
        self._cooldowns[error_key] = now
        return True

    def _format_message(self, event_dict: dict) -> str:
        event = event_dict.get("event", "unknown_error")
        network = event_dict.get("network", "")
        error = event_dict.get("error", "")
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        lines = [f"🔴 ERROR: {event}"]
        if network:
            lines.append(f"Network: {network}")
        if error:
            # Truncate very long error messages
            error_str = str(error)[:500]
            lines.append(f"Error: {error_str}")
        lines.append(f"Time: {timestamp}")
        return "\n".join(lines)

    def _ensure_sender_running(self) -> None:
        if self._started:
            return
        self._started = True
        t = threading.Thread(target=self._sender_loop, daemon=True)
        t.start()

    def _sender_loop(self) -> None:
        """Background loop: consume queue and POST to Telegram."""
        url = _TELEGRAM_API.format(token=telegram_settings.telegram_bot_token)
        with httpx.Client(timeout=10) as client:
            while True:
                message = self._queue.get()  # blocks until available
                try:
                    client.post(
                        url,
                        json={
                            "chat_id": telegram_settings.telegram_chat_id,
                            "text": message,
                            "parse_mode": "HTML",
                        },
                    )
                except Exception:
                    pass  # never crash — Telegram failures are silent


# ── module-level singleton & processor function ───────────────────

_notifier: TelegramNotifier | None = None


def get_telegram_processor():
    """Return the structlog processor function.

    If Telegram is not configured, returns a no-op pass-through.
    """
    if not telegram_settings.is_configured:
        return _noop_processor

    global _notifier
    if _notifier is None:
        _notifier = TelegramNotifier()
    return _notifier.processor


def _noop_processor(
    logger: object, method_name: str, event_dict: dict
) -> dict:
    return event_dict
