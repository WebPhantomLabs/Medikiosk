from __future__ import annotations

import uuid


def new_uuid() -> str:
    """Generate a new UUID4 string for use as a primary key / identifier."""
    return str(uuid.uuid4())
