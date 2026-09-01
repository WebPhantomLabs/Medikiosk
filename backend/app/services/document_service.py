from __future__ import annotations

from supabase import AsyncClient

from app.core.exceptions import (
    NotFoundError,
    SessionConflictError,
)
from app.core.logging import get_logger
from app.repositories.document_repository import (
    DocumentRepository,
    OcrResultRepository,
)
from app.repositories.medication_repository import MedicationRepository
from app.repositories.session_repository import SessionRepository
from app.schemas.document import (
    DocumentResponse,
    MedicationItem,
    OCRResultResponse,
)
from app.services.ai.base import AIProvider
from app.services.ocr.base import OCRProvider
from app.services.storage.base import StorageProvider
from app.utils.file_validator import validate_file

logger = get_logger(__name__)


class DocumentService:
    def __init__(
        self,
        db: AsyncClient,
        storage_provider: StorageProvider,
        ocr_provider: OCRProvider,
        ai_provider: AIProvider,
    ) -> None:
        self.db = db
        self.storage = storage_provider
        self.ocr = ocr_provider
        self.ai = ai_provider
        self.doc_repo = DocumentRepository(db)
        self.ocr_repo = OcrResultRepository(db)
        self.med_repo = MedicationRepository(db)
        self.session_repo = SessionRepository(db)

    async def upload_and_process_prescription(
        self,
        session_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> DocumentResponse:
        # 1. Validate Session
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundError(f"Session '{session_id}' not found.", code="SESSION_NOT_FOUND")

        if session.get("status") in ["COMPLETED", "CANCELLED"]:
            raise SessionConflictError("Cannot upload documents to a completed or cancelled session.", code="SESSION_TERMINATED")

        # 2. Validate File (Size & Magic MIME)
        validated_mime = validate_file(file_bytes, declared_mime_type=content_type)

        # 3. Store file
        storage_path = await self.storage.save_file(file_bytes, filename, validated_mime)

        # 4. Insert Document record
        doc_record = await self.doc_repo.insert({
            "session_id": session_id,
            "file_name": filename,
            "mime_type": validated_mime,
            "size_bytes": len(file_bytes),
            "storage_path": storage_path,
            "status": "PROCESSING",
        })
        doc_id = str(doc_record["id"])

        try:
            # 5. Perform OCR
            raw_text = await self.ocr.extract_text(file_bytes, validated_mime)
            ocr_record = await self.ocr_repo.insert({
                "document_id": doc_id,
                "raw_text": raw_text,
            })

            # 6. Extract structured medications via AI
            extracted_meds = await self.ai.extract_medications(raw_text)
            for med in extracted_meds:
                await self.med_repo.insert({
                    "document_id": doc_id,
                    "name": med.name,
                    "dose": med.dose,
                    "frequency": med.frequency,
                    "duration": med.duration,
                })

            # 7. Update document status to COMPLETED
            updated_doc = await self.doc_repo.update(doc_id, {"status": "COMPLETED"})

            return DocumentResponse(
                id=doc_id,
                session_id=session_id,
                file_name=filename,
                mime_type=validated_mime,
                size_bytes=len(file_bytes),
                status="COMPLETED",
                error_message=None,
                created_at=updated_doc["created_at"],
                ocr_result=OCRResultResponse(
                    document_id=doc_id,
                    raw_text=raw_text,
                    created_at=ocr_record["created_at"],
                ),
                medications=extracted_meds,
            )

        except Exception as exc:
            logger.error("Document processing failed for doc '%s': %s", doc_id, str(exc))
            await self.doc_repo.update(doc_id, {
                "status": "FAILED",
                "error_message": str(exc),
            })
            return DocumentResponse(
                id=doc_id,
                session_id=session_id,
                file_name=filename,
                mime_type=validated_mime,
                size_bytes=len(file_bytes),
                status="FAILED",
                error_message=str(exc),
                created_at=doc_record["created_at"],
                ocr_result=None,
                medications=[],
            )

    async def get_document_details(self, document_id: str) -> DocumentResponse:
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise NotFoundError(f"Document '{document_id}' not found.", code="DOCUMENT_NOT_FOUND")

        ocr = await self.ocr_repo.get_by_document_id(document_id)
        meds = await self.med_repo.list_for_document(document_id)

        return DocumentResponse(
            id=str(doc["id"]),
            session_id=str(doc["session_id"]),
            file_name=doc.get("file_name"),
            mime_type=doc["mime_type"],
            size_bytes=doc["size_bytes"],
            status=doc["status"],
            error_message=doc.get("error_message"),
            created_at=doc["created_at"],
            ocr_result=OCRResultResponse(**ocr) if ocr else None,
            medications=[MedicationItem(**m) for m in meds],
        )
