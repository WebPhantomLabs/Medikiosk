from __future__ import annotations

from abc import ABC, abstractmethod


class OCRProvider(ABC):
    """Abstract interface for Optical Character Recognition (OCR) services.
    
    OCR services perform transcription ONLY on prescription/medical document images.
    They are never treated as a diagnostic system.
    """

    @abstractmethod
    async def extract_text(self, file_bytes: bytes, mime_type: str) -> str:
        """Extract text from the provided image or document bytes."""
        pass
