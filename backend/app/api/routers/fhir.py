from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import AsyncClient

from app.api.dependencies import (
    get_db,
    require_role,
)
from app.schemas.fhir import FHIRBundleResponse
from app.services.fhir_service import FHIRService

router = APIRouter(tags=["fhir"])


@router.post(
    "/generate/{session_id}",
    response_model=FHIRBundleResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role("DOCTOR", "ADMIN"))],
)
async def generate_fhir_bundle(
    session_id: str,
    db: AsyncClient = Depends(get_db),
) -> FHIRBundleResponse:
    """Generate a validated FHIR R4 Bundle for a patient encounter."""
    service = FHIRService(db)
    return await service.generate_bundle(session_id)


@router.get(
    "/{session_id}",
    response_model=FHIRBundleResponse,
    dependencies=[Depends(require_role("DOCTOR", "ADMIN"))],
)
async def get_fhir_bundle(
    session_id: str,
    db: AsyncClient = Depends(get_db),
) -> FHIRBundleResponse:
    """Retrieve FHIR R4 Bundle for an encounter."""
    service = FHIRService(db)
    return await service.get_bundle(session_id)
