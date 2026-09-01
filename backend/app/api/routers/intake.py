from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import AsyncClient

from app.api.dependencies import get_ai_provider, get_db
from app.schemas.intake import IntakeAnswerRequest, IntakeAnswerResponse
from app.services.ai.base import AIProvider
from app.services.intake_service import IntakeService

router = APIRouter(tags=["intake"])


@router.post("/answer", response_model=IntakeAnswerResponse, status_code=status.HTTP_200_OK)
async def submit_intake_answer(
    payload: IntakeAnswerRequest,
    db: AsyncClient = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider),
) -> IntakeAnswerResponse:
    """Submit a patient transcript answer for the current question node.
    
    1. Validates the session and expected node.
    2. Uses Gemini AI to classify transcript against DB-defined transitions only.
    3. Backend strictly validates classification against database transitions.
    4. Automatically allocates queue token on the first accepted answer.
    5. Advances session state and returns the next question or completes intake.
    """
    service = IntakeService(db, ai_provider)
    return await service.answer_question(payload)
