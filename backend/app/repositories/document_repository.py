from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository):
    table_name = "documents"

    async def list_for_session(self, session_id: str) -> list[dict[str, Any]]:
        response = await self.table.select("*").eq("session_id", session_id).execute()
        return response.data or []


class OcrResultRepository(BaseRepository):
    table_name = "ocr_results"

    async def get_by_document_id(self, document_id: str) -> dict[str, Any] | None:
        response = (
            await self.table.select("*").eq("document_id", document_id).maybe_single().execute()
        )
        return response.data if response else None
