"""
Base repository.

All database access goes through repositories — services never talk to
Supabase directly. Repositories return plain dicts (raw row data); mapping
into Pydantic response schemas happens in the service/router layer so
raw database objects are never returned directly from an API route.
"""
from __future__ import annotations

from typing import Any

from supabase import AsyncClient


class BaseRepository:
    """Thin wrapper around a Supabase table, shared by all repositories."""

    table_name: str

    def __init__(self, client: AsyncClient) -> None:
        self._client = client

    @property
    def table(self):
        return self._client.table(self.table_name)

    async def get_by_id(self, record_id: str) -> dict[str, Any] | None:
        response = await self.table.select("*").eq("id", record_id).maybe_single().execute()
        return response.data if response else None

    async def list(
        self, *, limit: int = 20, offset: int = 0, order_by: str = "created_at"
    ) -> list[dict[str, Any]]:
        response = (
            await self.table.select("*")
            .order(order_by, desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data or []

    async def insert(self, values: dict[str, Any]) -> dict[str, Any]:
        response = await self.table.insert(values).execute()
        return (response.data or [{}])[0]

    async def update(self, record_id: str, values: dict[str, Any]) -> dict[str, Any] | None:
        response = await self.table.update(values).eq("id", record_id).execute()
        rows = response.data or []
        return rows[0] if rows else None

    async def delete(self, record_id: str) -> bool:
        response = await self.table.delete().eq("id", record_id).execute()
        return bool(response.data)
