from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import AsyncClient

from app.api.dependencies import (
    CurrentUser,
    get_current_staff_user,
    get_db,
    require_role,
)
from app.schemas.doctor import (
    DiagnosisCreateRequest,
    DiagnosisResponse,
    DoctorEncounterDetailResponse,
    QueueItemResponse,
)
from app.services.doctor_service import DoctorService

router = APIRouter(tags=["doctor"])


@router.get(
    "/queue",
    response_model=list[QueueItemResponse],
    dependencies=[Depends(require_role("DOCTOR", "ADMIN"))],
)
async def get_doctor_queue(
    db: AsyncClient = Depends(get_db),
) -> list[QueueItemResponse]:
    """Retrieve list of patients waiting for doctor consultation."""
    service = DoctorService(db)
    return await service.get_queue()


@router.get(
    "/queue/{token_number}",
    response_model=DoctorEncounterDetailResponse,
    dependencies=[Depends(require_role("DOCTOR", "ADMIN"))],
)
async def get_encounter_by_token(
    token_number: str,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> DoctorEncounterDetailResponse:
    """Retrieve comprehensive encounter details by queue token number or session ID."""
    service = DoctorService(db)
    result = await service.get_encounter_detail(token_number)
    
    from app.repositories.audit_repository import AuditLogRepository
    audit_repo = AuditLogRepository(db)
    await audit_repo.insert({
        "actor_id": current_user.id,
        "actor_role": current_user.role,
        "action": "VIEW_ENCOUNTER_DETAILS",
        "resource_type": "session",
        "resource_id": result.session_id,
        "metadata": {"token_number": token_number},
    })
    
    return result


@router.post(
    "/queue/{token_number}/start",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role("DOCTOR"))],
)
async def start_consultation_endpoint(
    token_number: str,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> dict:
    """Start consultation for a patient in the queue."""
    service = DoctorService(db)
    
    from app.repositories.session_repository import QueueTokenRepository
    from app.core.exceptions import NotFoundError
    
    token_repo = QueueTokenRepository(db)
    token_row = await token_repo.get_by_token_number(token_number)
    
    # Try treating token_number as session_id if token not found
    session_id = token_row["session_id"] if token_row else token_number
        
    return await service.start_consultation(session_id, current_user.id)


@router.post(
    "/encounters/{session_id}/diagnosis",
    response_model=DiagnosisResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role("DOCTOR"))],
)
async def record_patient_diagnosis(
    session_id: str,
    payload: DiagnosisCreateRequest,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> DiagnosisResponse:
    """Record authoritative clinical diagnosis by authenticated doctor."""
    service = DoctorService(db)
    return await service.record_diagnosis(session_id, current_user.id, payload)
