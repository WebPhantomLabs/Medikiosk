from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class MedicationRepository(BaseRepository):
    table_name = "medications"

    async def list_for_document(self, document_id: str) -> list[dict[str, Any]]:
        response = await self.table.select("*").eq("document_id", document_id).execute()
        return response.data or []
