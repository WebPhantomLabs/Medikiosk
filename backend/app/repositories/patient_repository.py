from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository):
    table_name = "patients"

    async def find_by_phone_and_name(self, phone: str, full_name: str) -> dict[str, Any] | None:
        if not phone:
            return None
        response = (
            await self.table.select("*")
            .eq("phone", phone)
            .ilike("full_name", full_name)
            .maybe_single()
            .execute()
        )
        return response.data if response else None
