from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class StaffRepository(BaseRepository):
    table_name = "staff"

    async def get_by_email(self, email: str) -> dict[str, Any] | None:
        response = await self.table.select("*").eq("email", email).maybe_single().execute()
        return response.data if response else None
