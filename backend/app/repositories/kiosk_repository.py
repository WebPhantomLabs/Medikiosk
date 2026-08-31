from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class KioskRepository(BaseRepository):
    table_name = "kiosks"

    async def get_by_code(self, code: str) -> dict[str, Any] | None:
        response = await self.table.select("*").eq("code", code).maybe_single().execute()
        return response.data if response else None
