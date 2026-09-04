from __future__ import annotations

from supabase import AsyncClient

from app.core.exceptions import (
    MediKioskError,
    NotFoundError,
)
from app.repositories.audit_repository import AuditLogRepository
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
from app.repositories.question_repository import QuestionRepository
from app.repositories.session_repository import (
    QueueTokenRepository,
    SessionRepository,
)
from app.schemas.doctor import (
    DiagnosisCreateRequest,
    DiagnosisResponse,
    DoctorEncounterDetailResponse,
    IntakeAnswerHistory,
    QueueItemResponse,
)
from app.schemas.document import (
    DocumentResponse,
    MedicationItem,
    OCRResultResponse,
)
from app.schemas.session import PatientResponse


class DoctorService:
    def __init__(self, db: AsyncClient) -> None:
        self.db = db
        self.session_repo = SessionRepository(db)
        self.patient_repo = PatientRepository(db)
        self.kiosk_repo = KioskRepository(db)
        self.token_repo = QueueTokenRepository(db)
        self.intake_repo = IntakeAnswerRepository(db)
        self.question_repo = QuestionRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.ocr_repo = OcrResultRepository(db)
        self.med_repo = MedicationRepository(db)
        self.diagnosis_repo = DiagnosisRepository(db)
        self.encounter_repo = DoctorEncounterRepository(db)
        self.audit_repo = AuditLogRepository(db)

    async def get_queue(self) -> list[QueueItemResponse]:
        """Retrieve the live patient queue for doctors without N+1 query overhead."""
        sessions = await self.session_repo.list_by_status(["WAITING_FOR_DOCTOR", "IN_CONSULTATION"])
        if not sessions:
            return []

        session_ids = [str(s["id"]) for s in sessions]
        patient_ids = list(set([str(s["patient_id"]) for s in sessions]))
        kiosk_ids = list(set([str(s["kiosk_id"]) for s in sessions]))

        tokens_resp = await self.db.table("queue_tokens").select("*").in_("session_id", session_ids).execute()
        patients_resp = await self.db.table("patients").select("*").in_("id", patient_ids).execute()
        kiosks_resp = await self.db.table("kiosks").select("*").in_("id", kiosk_ids).execute()

        tokens_map = {t["session_id"]: t for t in tokens_resp.data} if tokens_resp.data else {}
        patients_map = {p["id"]: p for p in patients_resp.data} if patients_resp.data else {}
        kiosks_map = {k["id"]: k for k in kiosks_resp.data} if kiosks_resp.data else {}

        queue_items: list[QueueItemResponse] = []
        for s in sessions:
            session_id = str(s["id"])
            token_row = tokens_map.get(session_id)
            if not token_row:
                continue

            patient = patients_map.get(str(s["patient_id"]))
            kiosk = kiosks_map.get(str(s["kiosk_id"]))

            queue_items.append(
                QueueItemResponse(
                    session_id=session_id,
                    token_number=token_row["token_number"],
                    patient_id=str(s["patient_id"]),
                    patient_name=patient["full_name"] if patient else "Unknown",
                    patient_sex=patient.get("sex", "unknown") if patient else "unknown",
                    patient_dob=str(patient["date_of_birth"]) if patient and patient.get("date_of_birth") else None,
                    kiosk_id=str(s["kiosk_id"]),
                    kiosk_code=kiosk["code"] if kiosk else None,
                    kiosk_location=kiosk.get("location") if kiosk else None,
                    status=s["status"],
                    issued_at=token_row.get("issued_at") or token_row.get("created_at") or "",
                )
            )

        return queue_items

    async def get_encounter_detail(self, identifier: str) -> DoctorEncounterDetailResponse:
        """Fetch complete encounter detail by queue token or session ID."""
        session = None
        token_row = None

        # Try by token_number first
        token_row = await self.token_repo.get_by_token_number(identifier)
        if token_row:
            session = await self.session_repo.get_by_id(token_row["session_id"])
        else:
            # Try by session_id
            session = await self.session_repo.get_by_id(identifier)
            if session:
                token_row = await self.token_repo.get_by_session_id(str(session["id"]))

        if not session:
            raise NotFoundError(f"No encounter found matching '{identifier}'.", code="ENCOUNTER_NOT_FOUND")

        session_id = str(session["id"])
        patient = await self.patient_repo.get_by_id(session["patient_id"])
        if not patient:
            raise NotFoundError("Patient details not found for encounter.", code="PATIENT_NOT_FOUND")

        kiosk = await self.kiosk_repo.get_by_id(session["kiosk_id"])

        # Intake history
        raw_intakes = await self.intake_repo.list_for_session(session_id)
        intake_history: list[IntakeAnswerHistory] = []
        for ans in raw_intakes:
            q_node = await self.question_repo.get_by_id(ans["node_id"])
            ans_meta = ans.get("metadata") or {}
            source = ans_meta.get("source", "ai_classification")
            intake_history.append(
                IntakeAnswerHistory(
                    id=str(ans["id"]) if ans.get("id") else None,
                    node_id=ans["node_id"],
                    question_text=q_node["question_text"] if q_node else None,
                    transcript=ans["transcript"],
                    answer_category=ans["answer_category"],
                    next_node_id=ans.get("next_node_id"),
                    sequence=ans["sequence"],
                    source=source,
                    requires_verification=True,
                    created_at=ans["created_at"],
                )
            )

        # Documents + OCR + Medications
        raw_docs = await self.doc_repo.list_for_session(session_id)
        documents: list[DocumentResponse] = []
        for d in raw_docs:
            doc_id = str(d["id"])
            ocr = await self.ocr_repo.get_by_document_id(doc_id)
            meds = await self.med_repo.list_for_document(doc_id)
            documents.append(
                DocumentResponse(
                    id=doc_id,
                    session_id=session_id,
                    file_name=d.get("file_name"),
                    mime_type=d["mime_type"],
                    size_bytes=d["size_bytes"],
                    status=d["status"],
                    error_message=d.get("error_message"),
                    created_at=d["created_at"],
                    ocr_result=OCRResultResponse(**ocr) if ocr else None,
                    medications=[MedicationItem(**m) for m in meds],
                )
            )

        # Diagnosis (if exists)
        diag_row = await self.diagnosis_repo.get_by_session_id(session_id)
        diagnosis_obj = DiagnosisResponse(**diag_row) if diag_row else None

        return DoctorEncounterDetailResponse(
            session_id=session_id,
            status=session["status"],
            token_number=token_row["token_number"] if token_row else None,
            kiosk_id=str(session["kiosk_id"]),
            kiosk_code=kiosk["code"] if kiosk else None,
            kiosk_location=kiosk.get("location") if kiosk else None,
            patient=PatientResponse(**patient),
            intake_history=intake_history,
            documents=documents,
            diagnosis=diagnosis_obj,
            created_at=session["created_at"],
            updated_at=session["updated_at"],
        )

    async def start_consultation(self, session_id: str, doctor_id: str) -> dict:
        """Start a doctor consultation for a session."""
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundError(f"Session '{session_id}' not found.", code="SESSION_NOT_FOUND")

        if session["status"] != "WAITING_FOR_DOCTOR":
            raise MediKioskError("Session is not waiting for doctor.", code="INVALID_STATUS")

        updated = await self.session_repo.update_status(session_id, "IN_CONSULTATION")

        await self.audit_repo.insert({
            "actor_id": doctor_id,
            "actor_role": "DOCTOR",
            "action": "START_CONSULTATION",
            "resource_type": "session",
            "resource_id": session_id,
            "metadata": {"previous_status": session["status"]},
        })

        return updated

    async def record_diagnosis(
        self,
        session_id: str,
        doctor_id: str,
        payload: DiagnosisCreateRequest,
    ) -> DiagnosisResponse:
        """Record the authoritative clinical diagnosis by the authenticated doctor."""
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundError(f"Session '{session_id}' not found.", code="SESSION_NOT_FOUND")

        # Check existing diagnosis (upsert or update)
        existing_diag = await self.diagnosis_repo.get_by_session_id(session_id)
        if existing_diag:
            diag_record = await self.diagnosis_repo.update(
                existing_diag["id"],
                {
                    "doctor_id": doctor_id,
                    "diagnosis_text": payload.diagnosis_text,
                    "notes": payload.notes,
                },
            )
        else:
            diag_record = await self.diagnosis_repo.insert({
                "session_id": session_id,
                "doctor_id": doctor_id,
                "diagnosis_text": payload.diagnosis_text,
                "notes": payload.notes,
            })

        # Transition session to DIAGNOSIS_RECORDED
        await self.session_repo.update_status(session_id, "DIAGNOSIS_RECORDED")

        # Record audit log
        await self.audit_repo.insert({
            "actor_id": doctor_id,
            "actor_role": "DOCTOR",
            "action": "RECORD_DIAGNOSIS",
            "resource_type": "session",
            "resource_id": session_id,
            "metadata": {"diagnosis_text": payload.diagnosis_text},
        })

        if not diag_record:
            raise MediKioskError("Failed to persist diagnosis record.")

        return DiagnosisResponse(
            id=str(diag_record["id"]),
            session_id=session_id,
            doctor_id=doctor_id,
            diagnosis_text=diag_record["diagnosis_text"],
            notes=diag_record.get("notes"),
            created_at=diag_record["created_at"],
            updated_at=diag_record.get("updated_at", diag_record["created_at"]),
        )

    async def complete_encounter(self, session_id: str, doctor_id: str) -> dict:
        """Mark the encounter as fully completed (signed off)."""
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundError(f"Session '{session_id}' not found.", code="SESSION_NOT_FOUND")

        # Validate that diagnosis is recorded
        if session["status"] not in ["DIAGNOSIS_RECORDED", "COMPLETED"]:
            raise MediKioskError("Session must have a diagnosis recorded before completing.", code="INVALID_STATUS")

        from app.services.fhir_service import FHIRService
        from app.core.exceptions import FhirBuildError
        
        try:
            fhir_svc = FHIRService(self.db)
            await fhir_svc.generate_bundle(session_id)
        except Exception as e:
            raise FhirBuildError(f"Cannot complete encounter because FHIR bundle generation failed: {str(e)}") from e

        updated = await self.session_repo.update_status(session_id, "COMPLETED")

        await self.audit_repo.insert({
            "actor_id": doctor_id,
            "actor_role": "DOCTOR",
            "action": "COMPLETE_ENCOUNTER",
            "resource_type": "session",
            "resource_id": session_id,
            "metadata": {"previous_status": session["status"]},
        })

        return updated
