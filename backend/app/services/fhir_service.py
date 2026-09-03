from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from supabase import AsyncClient

from app.core.exceptions import NotFoundError, DiagnosisRequiredError, FhirBuildError
from app.repositories.doctor_repository import DiagnosisRepository
from app.repositories.intake_repository import IntakeAnswerRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.staff_repository import StaffRepository
from app.schemas.fhir import FHIRBundleResponse


class FHIRService:
    def __init__(self, db: AsyncClient) -> None:
        self.db = db
        self.session_repo = SessionRepository(db)
        self.patient_repo = PatientRepository(db)
        self.diagnosis_repo = DiagnosisRepository(db)
        self.intake_repo = IntakeAnswerRepository(db)
        self.question_repo = QuestionRepository(db)
        self.staff_repo = StaffRepository(db)

    async def generate_bundle(self, session_id: str) -> FHIRBundleResponse:
        # 1. Fetch Session
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundError(f"Session '{session_id}' not found.", code="SESSION_NOT_FOUND")

        # 2. Fetch Patient
        patient_row = await self.patient_repo.get_by_id(session["patient_id"])
        if not patient_row:
            raise NotFoundError("Patient details not found.", code="PATIENT_NOT_FOUND")

        # 3. Fetch Diagnosis (Doctor is authoritative)
        diag_row = await self.diagnosis_repo.get_by_session_id(session_id)
        if not diag_row:
            raise DiagnosisRequiredError(f"Cannot generate FHIR bundle for session '{session_id}' without a diagnosis.")

        # 4. Fetch Staff (Doctor)
        doctor_row = None
        if diag_row and diag_row.get("doctor_id"):
            doctor_row = await self.staff_repo.get_by_id(diag_row["doctor_id"])

        # 5. Fetch Intake answers
        intake_rows = await self.intake_repo.list_for_session(session_id)

        # Build FHIR R4 Bundle resources
        bundle_id = str(uuid.uuid4())
        patient_resource_id = f"Patient/{patient_row['id']}"
        doctor_resource_id = f"Practitioner/{doctor_row['id']}" if doctor_row else "Practitioner/attending-physician"
        now_iso = datetime.now(UTC).isoformat()

        entries: list[dict[str, Any]] = []

        # Resource: Patient
        patient_resource = {
            "resourceType": "Patient",
            "id": str(patient_row["id"]),
            "name": [{"use": "official", "text": patient_row["full_name"]}],
            "gender": patient_row.get("sex", "unknown"),
        }
        if patient_row.get("date_of_birth"):
            patient_resource["birthDate"] = str(patient_row["date_of_birth"])
        if patient_row.get("phone"):
            patient_resource["telecom"] = [{"system": "phone", "value": patient_row["phone"]}]

        entries.append({
            "fullUrl": f"urn:uuid:{patient_row['id']}",
            "resource": patient_resource,
        })

        # Resource: Practitioner (Doctor)
        if doctor_row:
            doctor_resource = {
                "resourceType": "Practitioner",
                "id": str(doctor_row["id"]),
                "name": [{"use": "official", "text": doctor_row["full_name"]}],
                "telecom": [{"system": "email", "value": doctor_row["email"]}],
            }
            entries.append({
                "fullUrl": f"urn:uuid:{doctor_row['id']}",
                "resource": doctor_resource,
            })

        # Resource: Condition (Doctor Diagnosis)
        condition_id = None
        if diag_row:
            condition_id = str(diag_row["id"])
            condition_resource = {
                "resourceType": "Condition",
                "id": condition_id,
                "clinicalStatus": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active",
                    }]
                },
                "verificationStatus": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "confirmed",
                    }]
                },
                "category": [{
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                        "code": "encounter-diagnosis",
                        "display": "Encounter Diagnosis",
                    }]
                }],
                "code": {
                    "text": diag_row["diagnosis_text"],
                },
                "subject": {"reference": patient_resource_id},
                "recordedDate": diag_row["created_at"],
            }
            if diag_row.get("notes"):
                condition_resource["note"] = [{"text": diag_row["notes"]}]

            entries.append({
                "fullUrl": f"urn:uuid:{condition_id}",
                "resource": condition_resource,
            })

        # Resources: Observations (Intake findings)
        observation_ids: list[str] = []
        for ans in intake_rows:
            obs_id = str(ans["id"])
            observation_ids.append(obs_id)
            q_node = await self.question_repo.get_by_id(ans["node_id"])
            q_text = q_node["question_text"] if q_node else ans["node_id"]

            obs_resource = {
                "resourceType": "Observation",
                "id": obs_id,
                "status": "final",
                "category": [{
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "survey",
                        "display": "Survey",
                    }]
                }],
                "code": {
                    "text": q_text,
                },
                "subject": {"reference": patient_resource_id},
                "effectiveDateTime": ans["created_at"],
                "valueString": f"{ans['transcript']} (Category: {ans['answer_category']})",
            }
            entries.append({
                "fullUrl": f"urn:uuid:{obs_id}",
                "resource": obs_resource,
            })

        # Resource: Composition
        comp_id = str(uuid.uuid4())
        composition_sections = []
        if condition_id:
            composition_sections.append({
                "title": "Diagnosis",
                "code": {"text": "Encounter Diagnosis"},
                "entry": [{"reference": f"Condition/{condition_id}"}],
            })
        if observation_ids:
            composition_sections.append({
                "title": "Intake Responses",
                "code": {"text": "Triage & Intake Survey"},
                "entry": [{"reference": f"Observation/{oid}"} for oid in observation_ids],
            })

        composition_resource = {
            "resourceType": "Composition",
            "id": comp_id,
            "status": "final",
            "type": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "11488-4",
                    "display": "Consultation note",
                }],
                "text": "MediKiosk Intake Consultation Note",
            },
            "date": now_iso,
            "title": "MediKiosk Patient Encounter Summary",
            "subject": [{"reference": patient_resource_id}],
            "author": [{"reference": doctor_resource_id}],
            "section": composition_sections,
        }

        # Insert composition as the first entry in the document bundle
        entries.insert(0, {
            "fullUrl": f"urn:uuid:{comp_id}",
            "resource": composition_resource,
        })

        bundle = {
            "resourceType": "Bundle",
            "id": bundle_id,
            "type": "document",
            "timestamp": now_iso,
            "entry": entries,
        }

        # Validate with fhir.resources
        try:
            from fhir.resources.bundle import Bundle
            Bundle.model_validate(bundle)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("FHIR validation failed: %s", e)
            raise FhirBuildError(str(e))

        return FHIRBundleResponse(
            session_id=session_id,
            bundle_type="document",
            resource_count=len(entries),
            bundle=bundle,
            generated_at=now_iso,
        )
