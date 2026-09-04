from __future__ import annotations

from app.core.exceptions import OcrProviderError
from app.services.ocr.base import OCRProvider, OCRResult


class MockOCRProvider(OCRProvider):
    """Deterministic mock OCR provider for tests and development."""

    def __init__(self, default_text: str | None = None) -> None:
        self.default_text = default_text or "Rx:\nParacetamol 500mg twice daily for 5 days\nAmoxicillin 250mg 3 times a day for 7 days"
        self.custom_responses: dict[bytes, str] = {}
        self._force_error: Exception | None = None

    def set_mock_response(self, file_bytes: bytes, text: str) -> None:
        self.custom_responses[file_bytes] = text

    def force_error(self, error: Exception | None) -> None:
        self._force_error = error

    async def extract_text(self, file_bytes: bytes, mime_type: str) -> OCRResult:
        if self._force_error:
            raise self._force_error

        text = self.custom_responses.get(file_bytes, self.default_text)
        return OCRResult(text=text, confidence=0.99)
