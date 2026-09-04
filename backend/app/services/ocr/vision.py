from __future__ import annotations

from app.core.exceptions import MediKioskError, OcrProviderError
from app.core.logging import get_logger
from app.services.ocr.base import OCRProvider, OCRResult

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

    async def extract_text(self, file_bytes: bytes, mime_type: str) -> OCRResult:
        if not file_bytes:
            return OCRResult(text="", confidence=0.0)
        try:
            from google.cloud import vision
            import asyncio
            client = self._get_client()
            image = vision.Image(content=file_bytes)
            
            # Use asyncio.wait_for and to_thread for 30s timeout
            response = await asyncio.wait_for(
                asyncio.to_thread(client.document_text_detection, image=image),
                timeout=30.0
            )
            
            if response.error.message:
                raise OcrProviderError(f"Vision API error: {response.error.message}", code="OCR_SERVICE_ERROR", status_code=502)

            full_text_annotation = response.full_text_annotation
            text = full_text_annotation.text if full_text_annotation else ""
            
            # Calculate average confidence across pages
            confidence = 0.0
            if full_text_annotation and full_text_annotation.pages:
                total_conf = sum(page.confidence for page in full_text_annotation.pages if hasattr(page, 'confidence'))
                confidence = total_conf / len(full_text_annotation.pages)

            return OCRResult(text=text, confidence=confidence)
        
        except getattr(__import__('asyncio'), 'TimeoutError'):
            logger.error("Google Cloud Vision text detection timed out after 30s")
            raise OcrProviderError("OCR processing timed out", code="OCR_TIMEOUT", status_code=504)
        except MediKioskError:
            raise
        except Exception as e:
            logger.error("Google Cloud Vision text detection failed: %s", str(e))
            raise OcrProviderError(f"OCR processing failed: {str(e)}", code="OCR_SERVICE_ERROR", status_code=502)
