from __future__ import annotations

import pytest

from app.core.exceptions import ValidationError
from app.schemas.intake import IntakeAnswerRequest
from app.services.ai.mock import MockAIProvider
from app.services.intake_service import IntakeService
from tests.conftest import MockDatabase


@pytest.mark.asyncio
async def test_intake_valid_transition():
    db = MockDatabase()
    # Create patient & session
    p = await db.table("patients").insert({"full_name": "John Doe"})
    s = await db.table("sessions").insert({
        "patient_id": p.data[0]["id"],
        "kiosk_id": "33333333-3333-3333-3333-333333333333",
        "status": "INTAKE_IN_PROGRESS",
        "current_node_id": "CHIEF_COMPLAINT",
    })
    session_id = s.data[0]["id"]

    mock_ai = MockAIProvider(default_category="FEVER")
    service = IntakeService(db, mock_ai)

    res = await service.answer_question(
        IntakeAnswerRequest(
            session_id=session_id,
            node_id="CHIEF_COMPLAINT",
            transcript="I have a high fever and headache",
        )
    )

    assert res.classified_category == "FEVER"
    assert res.next_node_id == "FEVER_DURATION"
    assert res.queue_token is not None
    assert res.is_complete is False


@pytest.mark.asyncio
async def test_intake_rejects_hallucinated_category():
    db = MockDatabase()
    p = await db.table("patients").insert({"full_name": "John Doe"})
    s = await db.table("sessions").insert({
        "patient_id": p.data[0]["id"],
        "kiosk_id": "33333333-3333-3333-3333-333333333333",
        "status": "INTAKE_IN_PROGRESS",
        "current_node_id": "CHIEF_COMPLAINT",
    })
    session_id = s.data[0]["id"]

    # AI returns a category not in the database transitions
    mock_ai = MockAIProvider(default_category="NON_EXISTENT_CATEGORY")
    service = IntakeService(db, mock_ai)

    with pytest.raises(ValidationError) as exc:
        await service.answer_question(
            IntakeAnswerRequest(
                session_id=session_id,
                node_id="CHIEF_COMPLAINT",
                transcript="Random reply",
            )
        )
    assert exc.value.code == "INVALID_TRANSITION"


@pytest.mark.asyncio
async def test_intake_rejects_wrong_node():
    db = MockDatabase()
    p = await db.table("patients").insert({"full_name": "John Doe"})
    s = await db.table("sessions").insert({
        "patient_id": p.data[0]["id"],
        "kiosk_id": "33333333-3333-3333-3333-333333333333",
        "status": "INTAKE_IN_PROGRESS",
        "current_node_id": "CHIEF_COMPLAINT",
    })
    session_id = s.data[0]["id"]

    mock_ai = MockAIProvider()
    service = IntakeService(db, mock_ai)

    with pytest.raises(ValidationError) as exc:
        await service.answer_question(
            IntakeAnswerRequest(
                session_id=session_id,
                node_id="FEVER_DURATION",  # Mismatched node
                transcript="3 days",
            )
        )
    assert exc.value.code == "INVALID_QUESTION_NODE"
