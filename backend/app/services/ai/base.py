from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.document import MedicationItem
from app.schemas.intake import AnswerClassificationResult


class AIProvider(ABC):
    """Abstract interface for AI classification and extraction providers.
    
    The backend uses AI ONLY for:
    1. Classifying patient intake transcripts against allowed database transitions.
    2. Extracting structured medication information from OCR text.
    
    AI is NEVER the source of clinical diagnosis or treatment.
    """

    @abstractmethod
    async def classify_intake_answer(
        self,
        transcript: str,
        question_text: str,
        allowed_categories: list[str],
        metadata: dict | None = None,
    ) -> AnswerClassificationResult:
        """Classify a patient's spoken transcript against allowed answer categories."""
        pass

    @abstractmethod
    async def extract_medications(self, ocr_text: str) -> list[MedicationItem]:
        """Extract structured medications (name, dose, frequency, duration) from OCR text."""
        pass
