from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository):
    table_name = "sessions"

    async def get_active(self, session_id: str) -> dict[str, Any] | None:
        """Fetch a session only if it is not COMPLETED/CANCELLED."""
        response = (
            await self.table.select("*")
            .eq("id", session_id)
            .not_.in_("status", ["COMPLETED", "CANCELLED"])
            .maybe_single()
            .execute()
        )
        return response.data if response else None

    async def update_status(self, session_id: str, new_status: str) -> dict[str, Any] | None:
        return await self.update(session_id, {"status": new_status})

    async def update_current_node(self, session_id: str, node_id: str | None) -> dict[str, Any] | None:
        return await self.update(session_id, {"current_node_id": node_id})

    async def list_by_status(self, statuses: list[str]) -> list[dict[str, Any]]:
        response = (
            await self.table.select("*")
            .in_("status", statuses)
            .order("created_at", desc=False)
            .execute()
        )
        return response.data or []


class QueueTokenRepository(BaseRepository):
    table_name = "queue_tokens"

    async def get_by_session_id(self, session_id: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("session_id", session_id).maybe_single().execute()
        )
        return response.data if response else None

    async def get_by_token_number(self, token_number: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("token_number", token_number).maybe_single().execute()
        )
        return response.data if response else None

    async def count_by_kiosk(self, kiosk_id: str) -> int:
        response = (
            await self.table.select("id", count="exact")
            .eq("kiosk_id", kiosk_id)
            .execute()
        )
        return response.count if response and response.count is not None else len(response.data or [])

    async def allocate_token(self, session_id: str, kiosk_id: str, prefix: str = "T") -> dict[str, Any]:
        """Idempotently allocate queue token for a session."""
        existing = await self.get_by_session_id(session_id)
        if existing:
            return existing

        count = await self.count_by_kiosk(kiosk_id)
        token_number = f"{prefix}-{count + 1:03d}"
        now_iso = datetime.now(UTC).isoformat()
        return await self.insert({
            "session_id": session_id,
            "kiosk_id": kiosk_id,
            "token_number": token_number,
            "issued_at": now_iso,
        })
