from __future__ import annotations

from fastapi import APIRouter, Depends, status
from supabase import AsyncClient

from app.api.dependencies import (
    CurrentUser,
    get_current_staff_user,
    get_db,
    require_role,
)
from app.schemas.admin import QuestionCreate, QuestionUpdate
from app.schemas.intake import QuestionNodeResponse
from app.services.admin_service import AdminService

router = APIRouter(tags=["admin-questions"])


@router.get(
    "",
    response_model=list[QuestionNodeResponse],
    dependencies=[Depends(require_role("ADMIN"))],
)
async def list_questions(
    db: AsyncClient = Depends(get_db),
) -> list[QuestionNodeResponse]:
    """Admin: List all question nodes with their transitions."""
    service = AdminService(db)
    return await service.list_questions()


@router.post(
    "",
    response_model=QuestionNodeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN"))],
)
async def create_question(
    payload: QuestionCreate,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> QuestionNodeResponse:
    """Admin: Create a new question node with allowed transitions."""
    service = AdminService(db)
    return await service.create_question(payload, current_user.id)


@router.get(
    "/{node_id}",
    response_model=QuestionNodeResponse,
    dependencies=[Depends(require_role("ADMIN"))],
)
async def get_question(
    node_id: str,
    db: AsyncClient = Depends(get_db),
) -> QuestionNodeResponse:
    """Admin: Get question node details."""
    service = AdminService(db)
    return await service.get_question(node_id)


@router.put(
    "/{node_id}",
    response_model=QuestionNodeResponse,
    dependencies=[Depends(require_role("ADMIN"))],
)
async def update_question(
    node_id: str,
    payload: QuestionUpdate,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> QuestionNodeResponse:
    """Admin: Update an existing question node."""
    service = AdminService(db)
    return await service.update_question(node_id, payload, current_user.id)


@router.delete(
    "/{node_id}",
    dependencies=[Depends(require_role("ADMIN"))],
)
async def delete_question(
    node_id: str,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> dict[str, str]:
    """Admin: Delete a question node and its transitions."""
    service = AdminService(db)
    await service.delete_question(node_id, current_user.id)
    return {"message": f"Question node '{node_id}' deleted successfully."}
