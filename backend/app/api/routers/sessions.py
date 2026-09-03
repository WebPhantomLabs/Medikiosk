from __future__ import annotations

from fastapi import APIRouter, Depends, status, Header
from supabase import AsyncClient

from app.api.dependencies import get_db, get_current_staff_user
from app.core.exceptions import NotAuthenticatedError
from app.schemas.session import SessionCreate, SessionResponse
from app.services.session_service import SessionService

router = APIRouter(tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreate,
    db: AsyncClient = Depends(get_db),
) -> SessionResponse:
    """Create a new temporary kiosk session and capture patient demographics.
    
    Patients are completely unauthenticated — no login, no password, no OTP.
    """
    service = SessionService(db)
    return await service.create_session(payload)


async def verify_session_access(
    session_id: str,
    x_session_token: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> None:
    if x_session_token == session_id:
        return
    if authorization:
        try:
            await get_current_staff_user(authorization=authorization)
            return
        except NotAuthenticatedError:
            pass
    raise NotAuthenticatedError("Missing or invalid session token or staff authorization.")


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    dependencies=[Depends(verify_session_access)],
)
async def get_session(
    session_id: str,
    db: AsyncClient = Depends(get_db),
) -> SessionResponse:
    """Inspect active kiosk visit session status."""
    service = SessionService(db)
    return await service.get_session(session_id)
