from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class FHIRBundleResponse(BaseModel):
    session_id: str
    bundle_type: str = "document"
    resource_count: int
    bundle: dict[str, Any]
    generated_at: datetime | str = Field(default_factory=lambda: datetime.utcnow().isoformat())
