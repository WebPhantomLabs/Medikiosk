from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class DoctorEncounterRepository(BaseRepository):
    table_name = "doctor_encounters"

    async def get_by_session_id(self, session_id: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("session_id", session_id).maybe_single().execute()
        )
        return response.data if response else None


class DiagnosisRepository(BaseRepository):
    table_name = "diagnoses"

    async def get_by_session_id(self, session_id: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("session_id", session_id).maybe_single().execute()
        )
        return response.data if response else None
