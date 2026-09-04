"""
Reusable Supabase client or in-memory fallback for local development.

A single async client is created lazily and cached for the lifetime of the
process. If Supabase credentials are not configured, an in-memory SQLite/dictionary
backed database is used automatically so that the application runs immediately.
"""
from __future__ import annotations

from typing import Any

from supabase import AsyncClient, acreate_client

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.in_memory import InMemoryDatabase

logger = get_logger(__name__)

_client: Any = None


async def get_supabase_client() -> AsyncClient:
    """FastAPI-dependency-friendly accessor for the shared Supabase or local client."""
    global _client
    if _client is None:
        settings = get_settings()
        if (
            settings.SUPABASE_URL
            and settings.SUPABASE_SERVICE_ROLE_KEY
            and not settings.SUPABASE_URL.startswith("https://example")
        ):
            try:
                _client = await acreate_client(
                    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
                )
                logger.info("Connected to remote Supabase database: %s", settings.SUPABASE_URL)
            except Exception as e:
                logger.error("Failed to initialize Supabase client: %s", str(e))
                raise
        else:
            logger.info("Running with seeded in-memory database for development.")
            _client = InMemoryDatabase()
    return _client


async def close_supabase_client() -> None:
    """Called from the FastAPI lifespan shutdown hook."""
    global _client
    _client = None
