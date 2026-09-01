from __future__ import annotations

from supabase import AsyncClient

from app.core.exceptions import (
    NotFoundError,
    SessionConflictError,
    ValidationError,
)
from app.repositories.intake_repository import IntakeAnswerRepository
from app.repositories.question_repository import (
    QuestionRepository,
    QuestionTransitionRepository,
)
from app.repositories.session_repository import (
    QueueTokenRepository,
    SessionRepository,
)
from app.schemas.intake import (
    IntakeAnswerRequest,
    IntakeAnswerResponse,
    QuestionNodeResponse,
    QuestionTransitionResponse,
)
from app.services.ai.base import AIProvider


class IntakeService:
    def __init__(self, db: AsyncClient, ai_provider: AIProvider) -> None:
        self.db = db
        self.ai = ai_provider
        self.session_repo = SessionRepository(db)
        self.question_repo = QuestionRepository(db)
        self.transition_repo = QuestionTransitionRepository(db)
        self.intake_repo = IntakeAnswerRepository(db)
        self.token_repo = QueueTokenRepository(db)

    async def answer_question(self, payload: IntakeAnswerRequest) -> IntakeAnswerResponse:
        session_id = payload.session_id

        # 1. Validate Session
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundError(f"Session '{session_id}' not found.", code="SESSION_NOT_FOUND")

        if session.get("status") in ["COMPLETED", "CANCELLED"]:
            raise SessionConflictError(
                f"Session is already in terminal state '{session.get('status')}'.",
                code="SESSION_TERMINATED",
            )

        if session.get("status") == "WAITING_FOR_DOCTOR":
            raise SessionConflictError(
                "Intake has already been completed for this session.",
                code="INTAKE_ALREADY_COMPLETED",
            )

        # 2. Validate current node
        current_node_id = session.get("current_node_id")
        if not current_node_id:
            raise ValidationError("Session does not currently expect an intake answer.", code="NO_ACTIVE_QUESTION")

        if current_node_id != payload.node_id:
            raise ValidationError(
                f"Submitted question node '{payload.node_id}' does not match expected current node '{current_node_id}'.",
                code="INVALID_QUESTION_NODE",
            )

        # 3. Fetch Question & Allowed Transitions from DB (Authoritative source)
        node = await self.question_repo.get_by_id(current_node_id)
        if not node:
            raise NotFoundError(f"Question node '{current_node_id}' not found.", code="QUESTION_NOT_FOUND")

        transitions = await self.transition_repo.get_transitions_for_node(current_node_id)
        allowed_categories = [t["answer_category"] for t in transitions]

        # 4. Classify Answer with AI Assistant (or direct single transition)
        classified_category = "DEFAULT"
        next_node_id = None

        if transitions:
            # Let AI classify against DB-allowed transitions
            classification = await self.ai.classify_intake_answer(
                transcript=payload.transcript,
                question_text=node["question_text"],
                allowed_categories=allowed_categories,
                metadata=node.get("metadata", {}),
            )
            classified_category = classification.classified_category

            # Strict backend validation: check category exists in DB transitions
            matched_transition = next(
                (t for t in transitions if t["answer_category"].lower() == classified_category.lower()),
                None,
            )
            if not matched_transition:
                # Hallucination or invalid output rejected by backend
                raise ValidationError(
                    f"AI classification '{classified_category}' is not an approved transition for node '{current_node_id}'.",
                    code="INVALID_TRANSITION",
                )

            next_node_id = matched_transition["next_node_id"]
        else:
            # Terminal node with no transitions
            classified_category = "COMPLETED"
            next_node_id = None

        # 5. Persist Intake Answer
        current_count = await self.intake_repo.count_for_session(session_id)
        sequence = current_count + 1

        await self.intake_repo.insert({
            "session_id": session_id,
            "node_id": current_node_id,
            "transcript": payload.transcript,
            "answer_category": classified_category,
            "next_node_id": next_node_id,
            "sequence": sequence,
        })

        # 6. Queue Token Allocation: Assigned on first successfully accepted answer
        token_row = await self.token_repo.get_by_session_id(session_id)
        if not token_row:
            token_row = await self.token_repo.allocate_token(
                session_id=session_id,
                kiosk_id=session["kiosk_id"],
            )
        queue_token = token_row["token_number"] if token_row else None

        # 7. Advance Session State
        is_complete = False
        next_question_obj: QuestionNodeResponse | None = None

        if next_node_id:
            next_node = await self.question_repo.get_by_id(next_node_id)
            if next_node and not next_node.get("is_terminal", False):
                # Move to next question
                await self.session_repo.update(session_id, {
                    "current_node_id": next_node_id,
                    "status": "INTAKE_IN_PROGRESS",
                })
                next_transitions = await self.transition_repo.get_transitions_for_node(next_node_id)
                next_question_obj = QuestionNodeResponse(
                    node_id=next_node["node_id"],
                    question_text=next_node["question_text"],
                    question_type=next_node.get("question_type", "single_choice"),
                    is_start_node=next_node.get("is_start_node", False),
                    is_terminal=next_node.get("is_terminal", False),
                    active=next_node.get("active", True),
                    metadata=next_node.get("metadata", {}),
                    transitions=[QuestionTransitionResponse(**t) for t in next_transitions],
                )
            else:
                # Terminal reached
                is_complete = True
                await self.session_repo.update(session_id, {
                    "current_node_id": None,
                    "status": "WAITING_FOR_DOCTOR",
                })
        else:
            is_complete = True
            await self.session_repo.update(session_id, {
                "current_node_id": None,
                "status": "WAITING_FOR_DOCTOR",
            })

        session_after = await self.session_repo.get_by_id(session_id)
        session_status = session_after["status"] if session_after else "WAITING_FOR_DOCTOR"

        return IntakeAnswerResponse(
            session_id=session_id,
            node_id=current_node_id,
            transcript=payload.transcript,
            classified_category=classified_category,
            sequence=sequence,
            next_node_id=next_node_id,
            next_question=next_question_obj,
            queue_token=queue_token,
            is_complete=is_complete,
            session_status=session_status,
        )
