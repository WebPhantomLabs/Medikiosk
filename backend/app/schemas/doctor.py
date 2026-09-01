from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.document import DocumentResponse
from app.schemas.session import PatientResponse


class QueueItemResponse(BaseModel):
    session_id: str
    token_number: str
    patient_id: str
    patient_name: str
    patient_sex: str
    patient_dob: str | None = None
    kiosk_id: str
    kiosk_code: str | None = None
    kiosk_location: str | None = None
    status: str
    issued_at: datetime | str

    model_config = {"from_attributes": True}


class IntakeAnswerHistory(BaseModel):
    id: str | None = None
    node_id: str
    question_text: str | None = None
    transcript: str
    answer_category: str
    next_node_id: str | None = None
    sequence: int
    created_at: datetime | str

    model_config = {"from_attributes": True}


class DiagnosisCreateRequest(BaseModel):
    diagnosis_text: str = Field(..., min_length=1, max_length=1000)
    notes: str | None = Field(default=None, max_length=5000)


class DiagnosisResponse(BaseModel):
    id: str
    session_id: str
    doctor_id: str
    diagnosis_text: str
    notes: str | None = None
    created_at: datetime | str
    updated_at: datetime | str

    model_config = {"from_attributes": True}


class DoctorEncounterDetailResponse(BaseModel):
    session_id: str
    status: str
    token_number: str | None = None
    kiosk_id: str
    kiosk_code: str | None = None
    kiosk_location: str | None = None
    patient: PatientResponse
    intake_history: list[IntakeAnswerHistory] = Field(default_factory=list)
    documents: list[DocumentResponse] = Field(default_factory=list)
    diagnosis: DiagnosisResponse | None = None
    created_at: datetime | str
    updated_at: datetime | str

    model_config = {"from_attributes": True}
