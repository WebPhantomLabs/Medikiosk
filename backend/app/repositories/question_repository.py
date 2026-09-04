from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class QuestionRepository(BaseRepository):
    """Repository for `question_bank` nodes. `node_id` is the primary key."""

    table_name = "question_bank"

    async def get_by_id(self, record_id: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("node_id", record_id).maybe_single().execute()
        )
        return response.data if response else None

    async def get_start_node(self, branch: str = "allopathy") -> dict[str, Any] | None:
        query = self.table.select("*").eq("is_start_node", True).eq("active", True)
        
        # Depending on DB schema we might need to filter by metadata->>branch, 
        # but mock table doesn't support json operators easily via eq.
        # Let's filter locally after querying if it's the mock. Wait, the mock eq 
        # just does string match. We can use a trick or fetch all start nodes.
        
        response = await query.execute()
        nodes = response.data or []
        for node in nodes:
            node_branch = node.get("branch", node.get("metadata", {}).get("branch", "allopathy"))
            if node_branch == branch:
                return node
        return None

    async def list_active(self) -> list[dict[str, Any]]:
        response = await self.table.select("*").eq("active", True).order("created_at").execute()
        return response.data or []

    async def update_by_node_id(self, node_id: str, values: dict[str, Any]) -> dict[str, Any] | None:
        response = await self.table.update(values).eq("node_id", node_id).execute()
        rows = response.data or []
        return rows[0] if rows else None

    async def delete_by_node_id(self, node_id: str) -> bool:
        response = await self.table.delete().eq("node_id", node_id).execute()
        return bool(response.data)


class QuestionTransitionRepository(BaseRepository):
    table_name = "question_transitions"

    async def get_transitions_for_node(self, node_id: str) -> list[dict[str, Any]]:
        response = await self.table.select("*").eq("node_id", node_id).execute()
        return response.data or []

    async def get_by_node_and_category(self, node_id: str, answer_category: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*")
            .eq("node_id", node_id)
            .ilike("answer_category", answer_category)
            .maybe_single()
            .execute()
        )
        return response.data if response else None

    async def delete_by_node_id(self, node_id: str) -> bool:
        response = await self.table.delete().eq("node_id", node_id).execute()
        return bool(response.data)
