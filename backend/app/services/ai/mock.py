from __future__ import annotations

import re

from app.schemas.document import MedicationItem
from app.schemas.intake import AnswerClassificationResult
from app.services.ai.base import AIProvider


class MockAIProvider(AIProvider):
    """Deterministic mock AI provider for testing and offline development."""

    def __init__(
        self,
        default_category: str | None = None,
        default_medications: list[MedicationItem] | None = None,
    ) -> None:
        self.default_category = default_category
        self.default_medications = default_medications or []
        self.classification_overrides: dict[str, str] = {}

    def set_classification(self, transcript: str, category: str) -> None:
        self.classification_overrides[transcript.lower().strip()] = category

    async def classify_intake_answer(
        self,
        transcript: str,
        question_text: str,
        allowed_categories: list[str],
        metadata: dict | None = None,
    ) -> AnswerClassificationResult:
        clean_transcript = transcript.lower().strip()

        # Check explicit overrides
        if clean_transcript in self.classification_overrides:
            return AnswerClassificationResult(
                classified_category=self.classification_overrides[clean_transcript],
                confidence=1.0,
                reasoning="Mock override match",
            )

        # Keyword heuristics for common intake replies
        for cat in allowed_categories:
            cat_lower = cat.lower()
            if cat_lower in clean_transcript or clean_transcript in cat_lower:
                return AnswerClassificationResult(
                    classified_category=cat,
                    confidence=0.95,
                    reasoning=f"Matched keyword '{cat}' in transcript",
                )

        # Yes/No heuristics
        if "yes" in clean_transcript or "yeah" in clean_transcript or "true" in clean_transcript:
            for cat in allowed_categories:
                if "yes" in cat.lower() or "positive" in cat.lower() or "true" in cat.lower():
                    return AnswerClassificationResult(
                        classified_category=cat,
                        confidence=0.9,
                        reasoning="Matched positive transcript",
                    )
        if "no" in clean_transcript or "nope" in clean_transcript or "false" in clean_transcript:
            for cat in allowed_categories:
                if "no" in cat.lower() or "negative" in cat.lower() or "false" in cat.lower():
                    return AnswerClassificationResult(
                        classified_category=cat,
                        confidence=0.9,
                        reasoning="Matched negative transcript",
                    )

        # Fallback to default or first allowed category
        chosen = self.default_category or (allowed_categories[0] if allowed_categories else "UNKNOWN")
        return AnswerClassificationResult(
            classified_category=chosen,
            confidence=0.8,
            reasoning="Fallback mock selection",
        )

    async def extract_medications(self, ocr_text: str) -> list[MedicationItem]:
        if self.default_medications:
            return self.default_medications

        meds: list[MedicationItem] = []
        # Simple heuristic parser for common medication patterns in test text
        # e.g., "Paracetamol 500mg twice daily for 5 days"
        lines = [line.strip() for line in ocr_text.splitlines() if line.strip()]
        for line in lines:
            # Check for common dosage indicators
            match = re.search(
                r"([A-Za-z\s]+?)\s+(\d+\s*(?:mg|g|ml|mcg|tablets?|capsules?))\s*(.*?)(?:for\s+([\w\s]+))?$",
                line,
                re.IGNORECASE,
            )
            if match:
                name = match.group(1).strip()
                dose = match.group(2).strip()
                frequency = match.group(3).strip() or None
                duration = match.group(4).strip() if match.group(4) else None
                meds.append(
                    MedicationItem(
                        name=name,
                        dose=dose,
                        frequency=frequency,
                        duration=duration,
                    )
                )
            elif any(rx in line.lower() for rx in ["tab", "cap", "syrup", "paracetamol", "amoxicillin", "ibuprofen", "metformin", "aspirin"]):
                parts = line.split()
                name = parts[0] if parts else "Medication"
                meds.append(
                    MedicationItem(
                        name=name,
                        dose=parts[1] if len(parts) > 1 else None,
                        frequency=None,
                        duration=None,
                    )
                )
        return meds
