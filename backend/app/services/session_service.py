from __future__ import annotations

from supabase import AsyncClient

from app.core.exceptions import (
    NotFoundError,
    ValidationError,
)
from app.repositories.kiosk_repository import KioskRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.question_repository import (
    QuestionRepository,
    QuestionTransitionRepository,
)
from app.repositories.session_repository import (
    QueueTokenRepository,
    SessionRepository,
)
from app.schemas.session import (
    PatientResponse,
    SessionCreate,
    SessionResponse,
)


class SessionService:
    def __init__(self, db: AsyncClient) -> None:
        self.db = db
        self.kiosk_repo = KioskRepository(db)
        self.patient_repo = PatientRepository(db)
        self.session_repo = SessionRepository(db)
        self.question_repo = QuestionRepository(db)
        self.transition_repo = QuestionTransitionRepository(db)
        self.token_repo = QueueTokenRepository(db)

    async def create_session(self, payload: SessionCreate) -> SessionResponse:
        # 1. Resolve & Validate Kiosk
        kiosk = None
        if payload.kiosk_id:
            kiosk = await self.kiosk_repo.get_by_id(payload.kiosk_id)
        elif payload.kiosk_code:
            kiosk = await self.kiosk_repo.get_by_code(payload.kiosk_code)
        
        if not kiosk:
            raise NotFoundError("Specified kiosk was not found.", code="KIOSK_NOT_FOUND")

        if kiosk.get("status") != "ACTIVE":
            raise ValidationError("Kiosk is currently inactive and cannot accept visits.", code="KIOSK_INACTIVE")

        kiosk_id = str(kiosk["id"])

        # 2. Register / Find Patient (Unauthenticated transient identity)
        patient_data = payload.patient.model_dump()
        # Clean date_of_birth format if date object
        if patient_data.get("date_of_birth"):
            patient_data["date_of_birth"] = str(patient_data["date_of_birth"])

        patient = await self.patient_repo.insert(patient_data)
        patient_id = str(patient["id"])

        # 3. Find Start Question Node
        start_node = await self.question_repo.get_start_node()
        start_node_id = start_node["node_id"] if start_node else None

        # 4. Create Session
        initial_status = "INTAKE_IN_PROGRESS" if start_node_id else "CREATED"
        session = await self.session_repo.insert({
            "patient_id": patient_id,
            "kiosk_id": kiosk_id,
            "status": initial_status,
            "current_node_id": start_node_id,
        })
        session_id = str(session["id"])

        # Fetch transitions for start node if present
        current_question_dict = None
        if start_node:
            transitions = await self.transition_repo.get_transitions_for_node(start_node["node_id"])
            current_question_dict = {
                "node_id": start_node["node_id"],
                "question_text": start_node["question_text"],
                "question_type": start_node.get("question_type", "single_choice"),
                "is_start_node": True,
                "is_terminal": start_node.get("is_terminal", False),
                "metadata": start_node.get("metadata", {}),
                "transitions": transitions,
            }

        return SessionResponse(
            id=session_id,
            patient_id=patient_id,
            kiosk_id=kiosk_id,
            status=initial_status,
            current_node_id=start_node_id,
            created_at=session["created_at"],
            updated_at=session["updated_at"],
            patient=PatientResponse(**patient),
            queue_token=None,
            current_question=current_question_dict,
        )

    async def get_session(self, session_id: str) -> SessionResponse:
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundError(f"Session '{session_id}' not found.", code="SESSION_NOT_FOUND")

        patient = await self.patient_repo.get_by_id(session["patient_id"])
        token_row = await self.token_repo.get_by_session_id(session_id)
        token_number = token_row["token_number"] if token_row else None

        current_question_dict = None
        if session.get("current_node_id"):
            node = await self.question_repo.get_by_id(session["current_node_id"])
            if node:
                transitions = await self.transition_repo.get_transitions_for_node(node["node_id"])
                current_question_dict = {
                    "node_id": node["node_id"],
                    "question_text": node["question_text"],
                    "question_type": node.get("question_type", "single_choice"),
                    "is_start_node": node.get("is_start_node", False),
                    "is_terminal": node.get("is_terminal", False),
                    "metadata": node.get("metadata", {}),
                    "transitions": transitions,
                }

        return SessionResponse(
            id=str(session["id"]),
            patient_id=str(session["patient_id"]),
            kiosk_id=str(session["kiosk_id"]),
            status=session["status"],
            current_node_id=session.get("current_node_id"),
            created_at=session["created_at"],
            updated_at=session["updated_at"],
            patient=PatientResponse(**patient) if patient else None,
            queue_token=token_number,
            current_question=current_question_dict,
        )
