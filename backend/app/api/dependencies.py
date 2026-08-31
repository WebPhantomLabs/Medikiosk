"""
Shared FastAPI dependencies.

`get_current_staff_user` decodes and validates the bearer access token.
`require_role(...)` builds a dependency that additionally enforces RBAC.
Role/authorization checks live here — never in the frontend, never assumed.
"""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header
from supabase import AsyncClient

from app.core.exceptions import ForbiddenError, NotAuthenticatedError
from app.core.security import decode_token
from app.db.supabase import get_supabase_client


@dataclass(frozen=True)
class CurrentUser:
    id: str
    role: str  # "DOCTOR" | "ADMIN"


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise NotAuthenticatedError("Missing or malformed Authorization header.")
    return authorization.split(" ", 1)[1].strip()


async def get_current_staff_user(
    authorization: str | None = Header(default=None),
) -> CurrentUser:
    """Resolve the authenticated staff (DOCTOR/ADMIN) user from the access token.

    Raises NotAuthenticatedError (401) if the token is missing/invalid/expired.
    Does not perform role-specific checks — see `require_role`.
    """
    token = _extract_bearer_token(authorization)
    payload = decode_token(token, expected_type="access")
    role = payload.get("role")
    subject = payload.get("sub")
    if not role or not subject:
        raise NotAuthenticatedError("Token is missing required claims.")
    return CurrentUser(id=subject, role=role)


def require_role(*allowed_roles: str):
    """Build a dependency that authenticates AND authorizes by role.

    Usage:
        @router.get(..., dependencies=[Depends(require_role("ADMIN"))])
    """

    async def _dependency(
        current_user: CurrentUser = Depends(get_current_staff_user),  # noqa: B008
    ) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                f"Role '{current_user.role}' is not permitted to access this resource."
            )
        return current_user

    return _dependency


async def get_db() -> AsyncClient:
    """FastAPI dependency wrapper around the shared Supabase client."""
    return await get_supabase_client()
