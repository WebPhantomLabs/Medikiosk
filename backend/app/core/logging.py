"""
Structured logging configuration.

MediKiosk handles sensitive medical data, so logging is deliberately
conservative: we log operational metadata (request id, endpoint, duration,
status) but never full patient payloads, transcripts, OCR text, diagnoses,
tokens, or credentials. Call sites are responsible for keeping `extra`
payloads free of sensitive fields; this module only configures format/level.
"""
from __future__ import annotations

import logging
import sys
from typing import Any

_SENSITIVE_KEYS = {
    "password",
    "otp",
    "otp_code",
    "access_token",
    "refresh_token",
    "authorization",
    "api_key",
    "service_role_key",
    "transcript",
    "diagnosis",
    "ocr_text",
}


class _RedactingFilter(logging.Filter):
    """Best-effort redaction of obviously sensitive keys in log `extra` data."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        for key in list(vars(record).keys()):
            if key.lower() in _SENSITIVE_KEYS:
                setattr(record, key, "***REDACTED***")
        return True


def configure_logging(debug: bool = False) -> None:
    """Configure root logging once at application startup."""
    level = logging.DEBUG if debug else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt=(
            "%(asctime)s | %(levelname)-8s | %(name)s | "
            "%(message)s"
        ),
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)
    handler.addFilter(_RedactingFilter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Quiet noisy third-party loggers by default.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def safe_extra(**fields: Any) -> dict[str, Any]:
    """Helper for call sites to build a redaction-friendly `extra` dict."""
    return {k: v for k, v in fields.items() if k.lower() not in _SENSITIVE_KEYS}
