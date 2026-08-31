"""
Reusable Supabase client.

A single async client is created lazily and cached for the lifetime of the
process, rather than constructing a new client per repository call. The
service-role key is used server-side only and must never be forwarded to
the frontend or included in any API response.
"""
from __future__ import annotations

from supabase import AsyncClient, acreate_client

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_client: AsyncClient | None = None


async def get_supabase_client() -> AsyncClient:
    """FastAPI-dependency-friendly accessor for the shared Supabase client.

    Creates the client on first use and reuses it thereafter. Safe to call
    from multiple repositories/services without incurring reconnect cost.
    """
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            logger.warning(
                "Supabase credentials are not configured; "
                "database-backed features will fail until SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY are set."
            )
        _client = await acreate_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _client


async def close_supabase_client() -> None:
    """Called from the FastAPI lifespan shutdown hook."""
    global _client
    _client = None
