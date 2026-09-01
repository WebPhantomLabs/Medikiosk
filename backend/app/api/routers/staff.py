from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import AsyncClient

from app.api.dependencies import (
    CurrentUser,
    get_current_staff_user,
    get_db,
    require_role,
)
from app.schemas.admin import StaffCreate, StaffUpdate
from app.schemas.auth import StaffResponse
from app.services.admin_service import AdminService

router = APIRouter(tags=["admin-staff"])


@router.get(
    "",
    response_model=list[StaffResponse],
    dependencies=[Depends(require_role("ADMIN"))],
)
async def list_staff(
    db: AsyncClient = Depends(get_db),
) -> list[StaffResponse]:
    """Admin: List all staff accounts."""
    service = AdminService(db)
    return await service.list_staff()


@router.post(
    "",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN"))],
)
async def create_staff(
    payload: StaffCreate,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> StaffResponse:
    """Admin: Create new staff account (DOCTOR or ADMIN)."""
    service = AdminService(db)
    return await service.create_staff(payload, current_user.id)


@router.put(
    "/{staff_id}",
    response_model=StaffResponse,
    dependencies=[Depends(require_role("ADMIN"))],
)
async def update_staff(
    staff_id: str,
    payload: StaffUpdate,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> StaffResponse:
    """Admin: Update staff member details or password."""
    service = AdminService(db)
    return await service.update_staff(staff_id, payload, current_user.id)


@router.delete(
    "/{staff_id}",
    dependencies=[Depends(require_role("ADMIN"))],
)
async def delete_staff(
    staff_id: str,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> dict[str, str]:
    """Admin: Delete staff member."""
    service = AdminService(db)
    await service.delete_staff(staff_id, current_user.id)
    return {"message": "Staff member deleted successfully."}
