from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
    status,
)
from supabase import AsyncClient

from app.api.dependencies import (
    get_ai_provider,
    get_db,
    get_ocr_provider,
    get_storage_provider,
)
from app.schemas.document import DocumentResponse
from app.services.ai.base import AIProvider
from app.services.document_service import DocumentService
from app.services.ocr.base import OCRProvider
from app.services.storage.base import StorageProvider

router = APIRouter(tags=["documents"])


@router.post("/prescription", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncClient = Depends(get_db),
    storage: StorageProvider = Depends(get_storage_provider),
    ocr: OCRProvider = Depends(get_ocr_provider),
    ai: AIProvider = Depends(get_ai_provider),
) -> DocumentResponse:
    """Upload prescription image or PDF, transcribe via Google Vision OCR, and extract structured medications."""
    content = await file.read()
    service = DocumentService(db, storage, ocr, ai)
    return await service.upload_and_process_prescription(
        session_id=session_id,
        file_bytes=content,
        filename=file.filename or "prescription.jpg",
        content_type=file.content_type or "image/jpeg",
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: AsyncClient = Depends(get_db),
    storage: StorageProvider = Depends(get_storage_provider),
    ocr: OCRProvider = Depends(get_ocr_provider),
    ai: AIProvider = Depends(get_ai_provider),
) -> DocumentResponse:
    """Retrieve document details, raw OCR transcription, and structured medications."""
    service = DocumentService(db, storage, ocr, ai)
    return await service.get_document_details(document_id)
