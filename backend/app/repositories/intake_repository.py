from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class IntakeAnswerRepository(BaseRepository):
    table_name = "intake_answers"

    async def list_for_session(self, session_id: str) -> list[dict[str, Any]]:
        response = (
            await self.table.select("*")
            .eq("session_id", session_id)
            .order("sequence")
            .execute()
        )
        return response.data or []

    async def count_for_session(self, session_id: str) -> int:
        response = (
            await self.table.select("id", count="exact")
            .eq("session_id", session_id)
            .execute()
        )
        return response.count or 0
