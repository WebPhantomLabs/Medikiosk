from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class MedicationItem(BaseModel):
    name: str = Field(..., min_length=1)
    dose: str | None = None
    frequency: str | None = None
    duration: str | None = None

    model_config = {"from_attributes": True}


class MedicationExtractionResult(BaseModel):
    medications: list[MedicationItem] = Field(default_factory=list)


class OCRResultResponse(BaseModel):
    document_id: str
    raw_text: str | None = None
    created_at: datetime | str | None = None

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: str
    session_id: str
    file_name: str | None = None
    mime_type: str
    size_bytes: int
    status: Literal["UPLOADED", "PROCESSING", "COMPLETED", "FAILED"]
    error_message: str | None = None
    created_at: datetime | str
    ocr_result: OCRResultResponse | None = None
    medications: list[MedicationItem] = Field(default_factory=list)

    model_config = {"from_attributes": True}
