from __future__ import annotations

from fastapi import APIRouter, Depends
from supabase import AsyncClient

from app.api.dependencies import (
    CurrentUser,
    get_current_staff_user,
    get_db,
)
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    StaffResponse,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: AsyncClient = Depends(get_db),
) -> TokenResponse:
    """Authenticate staff (DOCTOR or ADMIN) with email and password."""
    service = AuthService(db)
    return await service.login(payload)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncClient = Depends(get_db),
) -> TokenResponse:
    """Exchange a valid refresh token for a new access/refresh token pair."""
    service = AuthService(db)
    return await service.refresh(payload.refresh_token)


@router.post("/logout")
async def logout(
    payload: RefreshTokenRequest,
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> dict[str, str]:
    """Revoke a refresh token on staff logout."""
    service = AuthService(db)
    await service.logout(payload.refresh_token, current_user.id)
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=StaffResponse)
async def get_me(
    current_user: CurrentUser = Depends(get_current_staff_user),
    db: AsyncClient = Depends(get_db),
) -> StaffResponse:
    """Retrieve profile and role of currently authenticated staff member."""
    service = AuthService(db)
    return await service.get_me(current_user.id)
