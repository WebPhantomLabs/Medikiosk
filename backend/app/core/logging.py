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


import json

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.name,
        }
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        
        # We don't necessarily need all extra attributes, but the instructions 
        # asked to include 'timestamp', 'level', 'message', 'request_id', 'module'.
        # Since the _RedactingFilter runs before format, sensitive keys are redacted.
        # We can dump extra keys if we want, or just stick to the requested fields.
        # It's good practice to include them for structured logging.
        standard_keys = {"name", "msg", "args", "levelname", "levelno", "pathname", "filename", "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName", "created", "msecs", "relativeCreated", "thread", "threadName", "processName", "process", "taskName", "request_id"}
        for key, val in vars(record).items():
            if key not in standard_keys:
                try:
                    log_obj[key] = str(val) if not isinstance(val, (int, float, bool, str)) else val
                except Exception:
                    log_obj[key] = "<unserializable>"
                    
        return json.dumps(log_obj)

def configure_logging(debug: bool = False) -> None:
    """Configure root logging once at application startup."""
    level = logging.DEBUG if debug else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    formatter = JSONFormatter(datefmt="%Y-%m-%dT%H:%M:%S%z")
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
