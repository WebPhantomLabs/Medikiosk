from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    date_of_birth: date | str | None = None
    sex: Literal["male", "female", "other", "unknown"] = "unknown"
    phone: str | None = None


class PatientResponse(BaseModel):
    id: str
    full_name: str
    date_of_birth: date | str | None = None
    sex: str = "unknown"
    phone: str | None = None
    created_at: datetime | str | None = None

    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    kiosk_id: str | None = None
    kiosk_code: str | None = None
    patient: PatientCreate


class SessionResponse(BaseModel):
    id: str
    patient_id: str
    kiosk_id: str
    status: str
    current_node_id: str | None = None
    created_at: datetime | str
    updated_at: datetime | str
    patient: PatientResponse | None = None
    queue_token: str | None = None
    current_question: dict[str, Any] | None = None

    model_config = {"from_attributes": True}
