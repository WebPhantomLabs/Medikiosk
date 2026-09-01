from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import AsyncClient

from app.api.dependencies import (
    CurrentUser,
    get_current_staff_user,
    get_db,
    require_role,
)
from app.schemas.admin import KioskCreate, KioskResponse, KioskUpdate
from app.services.admin_service import AdminService

router = APIRouter(tags=["admin-kiosks"])


@router.get(
    "",
    response_model=list[KioskResponse],
    dependencies=[Depends(require_role("ADMIN"))],
)
async def list_kiosks(
    db: AsyncClient = Depends(get_db),
) -> list[KioskResponse]:
    """Admin: List all registered kiosks."""
    service = AdminService(db)
    return await service.list_kiosks()


@router.post(
    "",
    response_model=KioskResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN"))],
)
async def create_kiosk(
    payload: KioskCreate,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> KioskResponse:
    """Admin: Register a new physical kiosk."""
    service = AdminService(db)
    return await service.create_kiosk(payload, current_user.id)


@router.put(
    "/{kiosk_id}",
    response_model=KioskResponse,
    dependencies=[Depends(require_role("ADMIN"))],
)
async def update_kiosk(
    kiosk_id: str,
    payload: KioskUpdate,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> KioskResponse:
    """Admin: Update kiosk configuration or status."""
    service = AdminService(db)
    return await service.update_kiosk(kiosk_id, payload, current_user.id)


@router.delete(
    "/{kiosk_id}",
    dependencies=[Depends(require_role("ADMIN"))],
)
async def delete_kiosk(
    kiosk_id: str,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> dict[str, str]:
    """Admin: Delete kiosk."""
    service = AdminService(db)
    await service.delete_kiosk(kiosk_id, current_user.id)
    return {"message": "Kiosk deleted successfully."}
