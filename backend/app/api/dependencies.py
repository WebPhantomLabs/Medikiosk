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

from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, NotAuthenticatedError
from app.core.security import decode_token
from app.db.supabase import get_supabase_client
from app.services.ai.base import AIProvider
from app.services.ai.gemini import GeminiAIProvider
from app.services.ai.mock import MockAIProvider
from app.services.ocr.base import OCRProvider
from app.services.ocr.mock import MockOCRProvider
from app.services.ocr.vision import GoogleVisionOCRProvider
from app.services.storage.base import StorageProvider
from app.services.storage.local import LocalStorageProvider, MockStorageProvider
from app.services.abdm.base import ABDMProvider


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


def get_ai_provider() -> AIProvider:
    """Factory dependency for AIProvider."""
    settings = get_settings()
    if settings.GEMINI_API_KEY:
        return GeminiAIProvider(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)
    return MockAIProvider()


def get_ocr_provider() -> OCRProvider:
    """Factory dependency for OCRProvider."""
    settings = get_settings()
    if settings.GOOGLE_APPLICATION_CREDENTIALS:
        return GoogleVisionOCRProvider(credentials_path=settings.GOOGLE_APPLICATION_CREDENTIALS)
    return MockOCRProvider()


def get_storage_provider() -> StorageProvider:
    """Factory dependency for StorageProvider."""
    settings = get_settings()
    if settings.APP_ENV == "test":
        return MockStorageProvider()
    return LocalStorageProvider()


def get_abdm_provider() -> ABDMProvider:
    """Factory dependency for ABDMProvider."""
    settings = get_settings()
    if settings.ABDM_ENABLED and settings.ABDM_CLIENT_ID:
        from app.services.abdm.client import ABDMClient
        return ABDMClient(settings)
    from app.services.abdm.mock import MockABDMProvider
    return MockABDMProvider()


def get_speech_provider() -> "app.services.speech.base.SpeechProvider":
    settings = get_settings()
    if settings.BHASHINI_API_KEY:
        from app.services.speech.bhashini import BhashiniSpeechProvider
        return BhashiniSpeechProvider(
            api_key=settings.BHASHINI_API_KEY,
            user_id=settings.BHASHINI_USER_ID,
            ulca_api_key=settings.BHASHINI_ULCA_API_KEY,
            pipeline_url=settings.BHASHINI_PIPELINE_URL,
            timeout=settings.BHASHINI_TIMEOUT_SECONDS
        )
    from app.services.speech.mock import MockSpeechProvider
    return MockSpeechProvider()
