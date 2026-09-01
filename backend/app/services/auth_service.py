from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta

from supabase import AsyncClient

from app.core.config import get_settings
from app.core.exceptions import (
    AccountDisabledError,
    InvalidCredentialsError,
    NotAuthenticatedError,
    NotFoundError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.repositories.audit_repository import AuditLogRepository
from app.repositories.staff_repository import StaffRepository
from app.schemas.auth import LoginRequest, StaffResponse, TokenResponse


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, db: AsyncClient) -> None:
        self.db = db
        self.staff_repo = StaffRepository(db)
        self.audit_repo = AuditLogRepository(db)
        self.settings = get_settings()

    async def login(self, payload: LoginRequest) -> TokenResponse:
        staff_row = await self.staff_repo.get_by_email(payload.email)
        if not staff_row:
            raise InvalidCredentialsError("Invalid email or password.")

        if not staff_row.get("active", True):
            raise AccountDisabledError("Staff account has been deactivated.")

        if not verify_password(payload.password, staff_row["password_hash"]):
            raise InvalidCredentialsError("Invalid email or password.")

        staff_id = str(staff_row["id"])
        role = staff_row["role"]

        access_token = create_access_token(subject=staff_id, role=role)
        refresh_token = create_refresh_token(subject=staff_id, role=role)

        # Persist refresh token hash
        expires_at = datetime.now(UTC) + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.db.table("refresh_tokens").insert({
            "staff_id": staff_id,
            "token_hash": _hash_token(refresh_token),
            "expires_at": expires_at.isoformat(),
            "revoked": False,
        }).execute()

        # Audit log
        await self.audit_repo.insert({
            "actor_id": staff_id,
            "actor_role": role,
            "action": "STAFF_LOGIN",
            "resource_type": "staff",
            "resource_id": staff_id,
            "metadata": {"email": payload.email},
        })

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            staff=StaffResponse(
                id=staff_id,
                email=staff_row["email"],
                full_name=staff_row["full_name"],
                role=role,
                active=staff_row["active"],
                created_at=staff_row["created_at"],
            ),
        )

    async def refresh(self, refresh_token_str: str) -> TokenResponse:
        payload = decode_token(refresh_token_str, expected_type="refresh")
        staff_id = payload.get("sub")
        role = payload.get("role")
        if not staff_id or not role:
            raise NotAuthenticatedError("Invalid refresh token payload.")

        token_hash = _hash_token(refresh_token_str)
        rt_row_res = await self.db.table("refresh_tokens").select("*").eq("token_hash", token_hash).maybe_single().execute()
        rt_row = rt_row_res.data if rt_row_res else None

        if not rt_row or rt_row.get("revoked", False):
            raise NotAuthenticatedError("Refresh token is invalid or has been revoked.")

        staff_row = await self.staff_repo.get_by_id(staff_id)
        if not staff_row or not staff_row.get("active", True):
            raise AccountDisabledError("Staff account is disabled or does not exist.")

        # Revoke old refresh token (refresh token rotation)
        await self.db.table("refresh_tokens").update({"revoked": True}).eq("id", rt_row["id"]).execute()

        # Issue new token pair
        new_access_token = create_access_token(subject=staff_id, role=role)
        new_refresh_token = create_refresh_token(subject=staff_id, role=role)

        expires_at = datetime.now(UTC) + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.db.table("refresh_tokens").insert({
            "staff_id": staff_id,
            "token_hash": _hash_token(new_refresh_token),
            "expires_at": expires_at.isoformat(),
            "revoked": False,
        }).execute()

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=self.settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            staff=StaffResponse(
                id=staff_id,
                email=staff_row["email"],
                full_name=staff_row["full_name"],
                role=role,
                active=staff_row["active"],
                created_at=staff_row["created_at"],
            ),
        )

    async def logout(self, refresh_token_str: str, current_user_id: str) -> bool:
        try:
            token_hash = _hash_token(refresh_token_str)
            await self.db.table("refresh_tokens").update({"revoked": True}).eq("token_hash", token_hash).execute()
        except Exception:
            pass
        return True

    async def get_me(self, staff_id: str) -> StaffResponse:
        staff_row = await self.staff_repo.get_by_id(staff_id)
        if not staff_row:
            raise NotFoundError("Staff user not found.")
        return StaffResponse(
            id=str(staff_row["id"]),
            email=staff_row["email"],
            full_name=staff_row["full_name"],
            role=staff_row["role"],
            active=staff_row["active"],
            created_at=staff_row["created_at"],
        )
