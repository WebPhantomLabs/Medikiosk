from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class QuestionRepository(BaseRepository):
    """Repository for `question_bank` nodes. `id` here is the business key
    `node_id`, so get_by_id is overridden accordingly."""

    table_name = "question_bank"

    async def get_by_id(self, record_id: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("node_id", record_id).maybe_single().execute()
        )
        return response.data if response else None

    async def get_start_node(self) -> dict[str, Any] | None:
        response = (
            await self.table.select("*")
            .eq("is_start_node", True)
            .eq("active", True)
            .maybe_single()
            .execute()
        )
        return response.data if response else None


class QuestionTransitionRepository(BaseRepository):
    table_name = "question_transitions"

    async def get_transitions_for_node(self, node_id: str) -> list[dict[str, Any]]:
        response = await self.table.select("*").eq("node_id", node_id).execute()
        return response.data or []
