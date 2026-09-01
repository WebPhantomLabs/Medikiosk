from __future__ import annotations

import json

from app.core.exceptions import MediKioskError
from app.core.logging import get_logger
from app.schemas.document import MedicationExtractionResult, MedicationItem
from app.schemas.intake import AnswerClassificationResult
from app.services.ai.base import AIProvider

logger = get_logger(__name__)


class GeminiAIProvider(AIProvider):
    """Google Gemini AI integration using google-genai SDK.
    
    Used strictly for:
    1. Answer classification against a closed list of allowed DB transitions.
    2. Structured medication entity extraction from OCR text.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash") -> None:
        self.api_key = api_key
        self.model_name = model_name
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not self.api_key:
                raise MediKioskError("Gemini API key is not configured.", code="AI_NOT_CONFIGURED", status_code=500)
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def classify_intake_answer(
        self,
        transcript: str,
        question_text: str,
        allowed_categories: list[str],
        metadata: dict | None = None,
    ) -> AnswerClassificationResult:
        if not allowed_categories:
            raise MediKioskError("No allowed categories provided for classification.", code="INVALID_TRANSITION", status_code=400)

        prompt = f"""
You are a healthcare kiosk intake classification assistant.
Your task is to classify a patient's spoken transcript response to a specific question into EXACTLY ONE of the allowed categories.

Question asked: "{question_text}"
Patient's response: "{transcript}"
Allowed categories: {json.dumps(allowed_categories)}

Rules:
1. You MUST select the single best matching category from the 'Allowed categories' list.
2. You must NOT invent, alter, or hallucinate any category name.
3. You must respond ONLY with a valid JSON object in this exact schema:
{{
  "classified_category": "<exact category string from Allowed categories>",
  "confidence": <float between 0.0 and 1.0>,
  "reasoning": "<brief 1-sentence rationale>"
}}
"""
        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            raw_text = response.text.strip()
            # Clean possible markdown wrapping
            if raw_text.startswith("```json"):
                raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.removeprefix("```").removesuffix("```").strip()

            parsed = json.loads(raw_text)
            category = parsed.get("classified_category", "").strip()
            confidence = float(parsed.get("confidence", 0.9))
            reasoning = parsed.get("reasoning", "")

            # Verify against allowed categories
            matching_cat = next((c for c in allowed_categories if c.lower() == category.lower()), None)
            if not matching_cat:
                logger.warning(
                    "Gemini returned category '%s' not in allowed %s, falling back to first allowed.",
                    category,
                    allowed_categories,
                )
                matching_cat = allowed_categories[0]
                confidence = 0.5

            return AnswerClassificationResult(
                classified_category=matching_cat,
                confidence=confidence,
                reasoning=reasoning,
            )
        except Exception as e:
            logger.error("Gemini classification failed: %s", str(e))
            raise MediKioskError(f"AI classification service failed: {str(e)}", code="AI_SERVICE_ERROR", status_code=502)

    async def extract_medications(self, ocr_text: str) -> list[MedicationItem]:
        if not ocr_text.strip():
            return []

        prompt = f"""
You are a medical document medication extraction assistant.
Extract structured medication items from the provided OCR text of a prescription or doctor note.

OCR text:
\"\"\"
{ocr_text}
\"\"\"

Rules:
1. Extract medication name, dosage (e.g. 500mg, 10ml), frequency (e.g. twice daily, BID), and duration (e.g. 5 days, 1 month).
2. If any field is missing or unclear in the OCR text, set its value to null. DO NOT invent, hallucinate, or guess missing information.
3. Do NOT add medical diagnosis or clinical interpretations.
4. Respond ONLY with a valid JSON object in this exact schema:
{{
  "medications": [
    {{
      "name": "<medication name>",
      "dose": "<dose or null>",
      "frequency": "<frequency or null>",
      "duration": "<duration or null>"
    }}
  ]
}}
"""
        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.removeprefix("```").removesuffix("```").strip()

            parsed = json.loads(raw_text)
            med_res = MedicationExtractionResult(**parsed)
            return med_res.medications
        except Exception as e:
            logger.error("Gemini medication extraction failed: %s", str(e))
            raise MediKioskError(f"AI extraction service failed: {str(e)}", code="AI_SERVICE_ERROR", status_code=502)
