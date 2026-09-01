from __future__ import annotations

from app.core.exceptions import MediKioskError
from app.core.logging import get_logger
from app.services.ocr.base import OCRProvider

logger = get_logger(__name__)


class GoogleVisionOCRProvider(OCRProvider):
    """Google Cloud Vision OCR implementation for document text detection."""

    def __init__(self, credentials_path: str | None = None) -> None:
        self.credentials_path = credentials_path
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from google.cloud import vision
                if self.credentials_path:
                    self._client = vision.ImageAnnotatorClient.from_service_account_file(self.credentials_path)
                else:
                    self._client = vision.ImageAnnotatorClient()
            except Exception as e:
                logger.error("Failed to initialize Google Cloud Vision client: %s", str(e))
                raise MediKioskError(f"Cloud Vision client initialization failed: {str(e)}", code="OCR_NOT_CONFIGURED", status_code=500)
        return self._client

    async def extract_text(self, file_bytes: bytes, mime_type: str) -> str:
        if not file_bytes:
            return ""
        try:
            from google.cloud import vision
            client = self._get_client()
            image = vision.Image(content=file_bytes)
            
            response = client.document_text_detection(image=image)
            if response.error.message:
                raise MediKioskError(f"Vision API error: {response.error.message}", code="OCR_SERVICE_ERROR", status_code=502)

            full_text_annotation = response.full_text_annotation
            return full_text_annotation.text if full_text_annotation else ""
        except MediKioskError:
            raise
        except Exception as e:
            logger.error("Google Cloud Vision text detection failed: %s", str(e))
            raise MediKioskError(f"OCR processing failed: {str(e)}", code="OCR_SERVICE_ERROR", status_code=502)
