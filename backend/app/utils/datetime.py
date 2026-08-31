from __future__ import annotations

from datetime import UTC, datetime


def utcnow() -> datetime:
    """Return a timezone-aware UTC datetime. All timestamps in MediKiosk are UTC."""
    return datetime.now(UTC)


def to_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC).isoformat()
