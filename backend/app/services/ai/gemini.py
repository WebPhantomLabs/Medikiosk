from __future__ import annotations

import asyncio
import json
import time

from pydantic import ValidationError

from app.core.config import get_settings
from app.core.exceptions import MediKioskError, LlmProviderError, LlmValidationError
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

    async def _generate_content_with_retry(self, prompt: str) -> str:
        settings = get_settings()
        timeout = settings.GEMINI_TIMEOUT_SECONDS
        max_retries = settings.GEMINI_MAX_RETRIES

        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()
                client = self._get_client()
                
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        client.models.generate_content,
                        model=self.model_name,
                        contents=prompt,
                    ),
                    timeout=timeout
                )
                latency = time.time() - start_time
                logger.info(
                    "Gemini API call successful",
                    extra={"latency": latency, "model": self.model_name, "attempt": attempt + 1}
                )
                return response.text.strip()
            
            except TimeoutError:
                logger.warning(f"Gemini API call timeout (attempt {attempt + 1})")
                if attempt == max_retries:
                    raise LlmProviderError("AI timeout", code="AI_TIMEOUT")
                await asyncio.sleep(2 ** attempt)
            
            except Exception as e:
                err_str = str(e).lower()
                is_transient = any(x in err_str for x in ["429", "500", "503", "quota", "rate limit"])
                logger.warning(f"Gemini API call error (attempt {attempt + 1}): {err_str}")
                
                if is_transient and attempt < max_retries:
                    await asyncio.sleep(2 ** attempt)
                    continue
                
                if "quota" in err_str or "429" in err_str:
                    raise LlmProviderError("Quota exceeded", code="AI_QUOTA_EXCEEDED")
                
                raise MediKioskError(f"AI service failed: {str(e)}", code="AI_SERVICE_ERROR", status_code=502)

    def _parse_json_response(self, raw_text: str) -> dict:
        if raw_text.startswith("```json"):
            raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.removeprefix("```").removesuffix("```").strip()

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as e:
            logger.error("Gemini invalid JSON response: %s", str(e))
            raise LlmValidationError("Invalid JSON response from AI", code="AI_INVALID_RESPONSE")

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
        raw_text = await self._generate_content_with_retry(prompt)
        parsed = self._parse_json_response(raw_text)

        try:
            result = AnswerClassificationResult.model_validate(parsed)
        except ValidationError as e:
            logger.error("Gemini classification Pydantic validation failed: %s", str(e))
            raise LlmValidationError("Invalid JSON response format from AI", code="AI_INVALID_RESPONSE")

        # Verify against allowed categories
        matching_cat = next((c for c in allowed_categories if c.lower() == result.classified_category.lower()), None)
        if not matching_cat:
            raise LlmValidationError(
                f"Gemini returned category '{result.classified_category}' not in allowed categories.",
                code="AI_VALIDATION_ERROR"
            )

        return AnswerClassificationResult(
            classified_category=matching_cat,
            confidence=result.confidence,
            reasoning=result.reasoning,
        )

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
        raw_text = await self._generate_content_with_retry(prompt)
        parsed = self._parse_json_response(raw_text)

        try:
            med_res = MedicationExtractionResult.model_validate(parsed)
            return med_res.medications
        except ValidationError as e:
            logger.error("Gemini medication extraction Pydantic validation failed: %s", str(e))
            raise LlmValidationError("Invalid JSON response format from AI", code="AI_INVALID_RESPONSE")
