from __future__ import annotations

from app.schemas.admin import (
    AuditLogResponse,
    KioskCreate,
    KioskResponse,
    KioskUpdate,
    QuestionCreate,
    QuestionUpdate,
    StaffCreate,
    StaffUpdate,
    TransitionCreate,
)
from app.schemas.auth import (
    LoginRequest,
    OTPRequest,
    OTPResponse,
    OTPVerifyRequest,
    RefreshTokenRequest,
    StaffResponse,
    TokenResponse,
)
from app.schemas.common import ErrorDetail, ErrorResponse, PaginationParams, SuccessResponse
from app.schemas.doctor import (
    DiagnosisCreateRequest,
    DiagnosisResponse,
    DoctorEncounterDetailResponse,
    IntakeAnswerHistory,
    QueueItemResponse,
)
from app.schemas.document import (
    DocumentResponse,
    MedicationExtractionResult,
    MedicationItem,
    OCRResultResponse,
)
from app.schemas.fhir import FHIRBundleResponse
from app.schemas.intake import (
    AnswerClassificationResult,
    IntakeAnswerRequest,
    IntakeAnswerResponse,
    QuestionNodeResponse,
    QuestionTransitionResponse,
)
from app.schemas.session import (
    PatientCreate,
    PatientResponse,
    SessionCreate,
    SessionResponse,
)

__all__ = [
    "ErrorDetail",
    "ErrorResponse",
    "SuccessResponse",
    "PaginationParams",
    "LoginRequest",
    "RefreshTokenRequest",
    "StaffResponse",
    "TokenResponse",
    "OTPRequest",
    "OTPVerifyRequest",
    "OTPResponse",
    "PatientCreate",
    "PatientResponse",
    "SessionCreate",
    "SessionResponse",
    "QuestionTransitionResponse",
    "QuestionNodeResponse",
    "IntakeAnswerRequest",
    "AnswerClassificationResult",
    "IntakeAnswerResponse",
    "MedicationItem",
    "MedicationExtractionResult",
    "OCRResultResponse",
    "DocumentResponse",
    "QueueItemResponse",
    "IntakeAnswerHistory",
    "DiagnosisCreateRequest",
    "DiagnosisResponse",
    "DoctorEncounterDetailResponse",
    "FHIRBundleResponse",
    "QuestionCreate",
    "QuestionUpdate",
    "TransitionCreate",
    "StaffCreate",
    "StaffUpdate",
    "KioskCreate",
    "KioskUpdate",
    "KioskResponse",
    "AuditLogResponse",
]
