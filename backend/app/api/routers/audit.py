from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from supabase import AsyncClient

from app.api.dependencies import get_db, require_role
from app.schemas.admin import AuditLogResponse
from app.services.admin_service import AdminService

router = APIRouter(tags=["admin_audit"])


@router.get(
    "",
    response_model=list[AuditLogResponse],
    dependencies=[Depends(require_role("ADMIN"))],
)
async def list_audit_logs(
    action: Annotated[str | None, Query(description="Filter by action")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 50,
    db: AsyncClient = Depends(get_db),
) -> list[AuditLogResponse]:
    """List audit logs with optional filters."""
    service = AdminService(db)
    return await service.list_audit_logs(
        action=action,
        limit=per_page,
        offset=(page - 1) * per_page,
    )
