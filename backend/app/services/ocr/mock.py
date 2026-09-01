from __future__ import annotations

from app.services.ocr.base import OCRProvider


class MockOCRProvider(OCRProvider):
    """Deterministic mock OCR provider for tests and development."""

    def __init__(self, default_text: str | None = None) -> None:
        self.default_text = default_text or "Rx:\nParacetamol 500mg twice daily for 5 days\nAmoxicillin 250mg 3 times a day for 7 days"
        self.custom_responses: dict[bytes, str] = {}

    def set_mock_response(self, file_bytes: bytes, text: str) -> None:
        self.custom_responses[file_bytes] = text

    async def extract_text(self, file_bytes: bytes, mime_type: str) -> str:
        if file_bytes in self.custom_responses:
            return self.custom_responses[file_bytes]
        return self.default_text
