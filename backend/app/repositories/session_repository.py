from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository):
    table_name = "sessions"

    async def get_active(self, session_id: str) -> dict[str, Any] | None:
        """Fetch a session only if it is not COMPLETED/CANCELLED — used to
        enforce that kiosk operations only proceed against a live visit."""
        response = (
            await self.table.select("*")
            .eq("id", session_id)
            .not_.in_("status", ["COMPLETED", "CANCELLED"])
            .maybe_single()
            .execute()
        )
        return response.data if response else None


class QueueTokenRepository(BaseRepository):
    table_name = "queue_tokens"

    async def get_by_session_id(self, session_id: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("session_id", session_id).maybe_single().execute()
        )
        return response.data if response else None
