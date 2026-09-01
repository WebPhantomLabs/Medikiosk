from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# --- Question Bank ---
class TransitionCreate(BaseModel):
    answer_category: str = Field(..., min_length=1)
    next_node_id: str = Field(..., min_length=1)


class QuestionCreate(BaseModel):
    node_id: str = Field(..., min_length=1)
    question_text: str = Field(..., min_length=1)
    question_type: str = "single_choice"
    is_start_node: bool = False
    is_terminal: bool = False
    active: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)
    transitions: list[TransitionCreate] = Field(default_factory=list)


class QuestionUpdate(BaseModel):
    question_text: str | None = None
    question_type: str | None = None
    is_start_node: bool | None = None
    is_terminal: bool | None = None
    active: bool | None = None
    metadata: dict[str, Any] | None = None


# --- Staff ---
class StaffCreate(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1)
    role: Literal["DOCTOR", "ADMIN"]
    active: bool = True


class StaffUpdate(BaseModel):
    email: str | None = Field(default=None, min_length=3)
    password: str | None = Field(default=None, min_length=6)
    full_name: str | None = None
    role: Literal["DOCTOR", "ADMIN"] | None = None
    active: bool | None = None


# --- Kiosks ---
class KioskCreate(BaseModel):
    code: str = Field(..., min_length=1)
    location: str | None = None
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"


class KioskUpdate(BaseModel):
    code: str | None = None
    location: str | None = None
    status: Literal["ACTIVE", "INACTIVE"] | None = None


class KioskResponse(BaseModel):
    id: str
    code: str
    location: str | None = None
    status: str
    created_at: datetime | str
    updated_at: datetime | str

    model_config = {"from_attributes": True}


# --- Audit Logs ---
class AuditLogResponse(BaseModel):
    id: str
    actor_id: str | None = None
    actor_role: str | None = None
    action: str
    resource_type: str | None = None
    resource_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | str

    model_config = {"from_attributes": True}
