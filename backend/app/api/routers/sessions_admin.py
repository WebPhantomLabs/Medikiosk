from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from supabase import AsyncClient

from app.api.dependencies import get_db, require_role
from app.schemas.admin import AdminSessionResponse
from app.services.admin_service import AdminService

router = APIRouter(tags=["admin_sessions"])


@router.get(
    "",
    response_model=list[AdminSessionResponse],
    dependencies=[Depends(require_role("ADMIN"))],
)
async def list_sessions(
    status: Annotated[str | None, Query(description="Filter by session status")] = None,
    date: Annotated[str | None, Query(description="Filter by created date (YYYY-MM-DD)")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
    db: AsyncClient = Depends(get_db),
) -> list[AdminSessionResponse]:
    """List all sessions with optional filters."""
    service = AdminService(db)
    return await service.list_sessions(
        status=status,
        date_filter=date,
        page=page,
        per_page=per_page,
    )
