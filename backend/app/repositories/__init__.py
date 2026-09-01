from __future__ import annotations

from app.repositories.audit_repository import AuditLogRepository
from app.repositories.base import BaseRepository
from app.repositories.doctor_repository import (
    DiagnosisRepository,
    DoctorEncounterRepository,
)
from app.repositories.document_repository import (
    DocumentRepository,
    OcrResultRepository,
)
from app.repositories.intake_repository import IntakeAnswerRepository
from app.repositories.kiosk_repository import KioskRepository
from app.repositories.medication_repository import MedicationRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.question_repository import (
    QuestionRepository,
    QuestionTransitionRepository,
)
from app.repositories.session_repository import (
    QueueTokenRepository,
    SessionRepository,
)
from app.repositories.staff_repository import StaffRepository

__all__ = [
    "BaseRepository",
    "StaffRepository",
    "PatientRepository",
    "KioskRepository",
    "SessionRepository",
    "QueueTokenRepository",
    "QuestionRepository",
    "QuestionTransitionRepository",
    "IntakeAnswerRepository",
    "DocumentRepository",
    "OcrResultRepository",
    "MedicationRepository",
    "DoctorEncounterRepository",
    "DiagnosisRepository",
    "AuditLogRepository",
]
