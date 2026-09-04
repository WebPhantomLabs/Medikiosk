import base64
import httpx
import time
from app.core.exceptions import SpeechProviderError, UnsupportedLanguageError
from app.core.logging import get_logger
from app.services.speech.base import SpeechProvider, TranscriptionResult, SynthesisResult

logger = get_logger(__name__)

class BhashiniSpeechProvider(SpeechProvider):
    def __init__(self, api_key: str, user_id: str, ulca_api_key: str, pipeline_url: str, timeout: int = 30):
        self.api_key = api_key
        self.user_id = user_id
        self.ulca_api_key = ulca_api_key
        self.pipeline_url = pipeline_url
        self.timeout = timeout
        self.supported_langs = {'hi': 'hi', 'en': 'en', 'ta': 'ta', 'mr': 'mr', 'bn': 'bn', 'te': 'te'}

    def supported_languages(self) -> list[str]:
        return list(self.supported_langs.keys())

    async def transcribe(self, audio_bytes: bytes, language: str, mime_type: str = 'audio/wav') -> TranscriptionResult:
        if language not in self.supported_langs:
            raise UnsupportedLanguageError(f"Language {language} not supported.")
        
        headers = {
            "Authorization": self.api_key,
            "ulcaApiKey": self.ulca_api_key,
            "userID": self.user_id,
            "Content-Type": "application/json"
        }
        
        b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
        payload = {
            "pipelineTasks": [{"taskType": "asr", "config": {"language": {"sourceLanguage": language}}}],
            "inputData": {"audio": [{"audioContent": b64_audio}]}
        }
        
        start_time = time.time()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(self.pipeline_url, json=payload, headers=headers)
                response.raise_for_status()
            except httpx.TimeoutException:
                logger.error("Bhashini ASR timed out after %s seconds.", self.timeout)
                raise SpeechProviderError("ASR timeout", code="SPEECH_TIMEOUT", status_code=504)
            except Exception as e:
                # 1 retry on transient error
                try:
                    logger.warning("Bhashini ASR failed, retrying... %s", str(e))
                    response = await client.post(self.pipeline_url, json=payload, headers=headers)
                    response.raise_for_status()
                except Exception as retry_e:
                    logger.error("Bhashini ASR failed on retry: %s", str(retry_e))
                    raise SpeechProviderError(f"ASR failed: {str(retry_e)}")
        
        latency = (time.time() - start_time) * 1000
        logger.info("Bhashini ASR took %.2f ms", latency)
        
        try:
            data = response.json()
            text = data["pipelineResponse"][0]["output"][0]["source"]
            return TranscriptionResult(text=text, language=language, confidence=1.0, duration_ms=int(latency))
        except (KeyError, IndexError) as e:
            logger.error("Bhashini ASR unexpected response format: %s", str(e))
            raise SpeechProviderError("ASR response format error")

    async def synthesize(self, text: str, language: str) -> SynthesisResult:
        if language not in self.supported_langs:
            raise UnsupportedLanguageError(f"Language {language} not supported.")
        
        headers = {
            "Authorization": self.api_key,
            "ulcaApiKey": self.ulca_api_key,
            "userID": self.user_id,
            "Content-Type": "application/json"
        }
        
        payload = {
            "pipelineTasks": [{"taskType": "tts", "config": {"language": {"sourceLanguage": language}}}],
            "inputData": {"input": [{"source": text}]}
        }
        
        start_time = time.time()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(self.pipeline_url, json=payload, headers=headers)
                response.raise_for_status()
            except httpx.TimeoutException:
                logger.error("Bhashini TTS timed out after %s seconds.", self.timeout)
                raise SpeechProviderError("TTS timeout", code="SPEECH_TIMEOUT", status_code=504)
            except Exception as e:
                # 1 retry
                try:
                    logger.warning("Bhashini TTS failed, retrying... %s", str(e))
                    response = await client.post(self.pipeline_url, json=payload, headers=headers)
                    response.raise_for_status()
                except Exception as retry_e:
                    logger.error("Bhashini TTS failed on retry: %s", str(retry_e))
                    raise SpeechProviderError(f"TTS failed: {str(retry_e)}")
        
        latency = (time.time() - start_time) * 1000
        logger.info("Bhashini TTS took %.2f ms", latency)
        
        try:
            data = response.json()
            audio_b64 = data["pipelineResponse"][0]["audio"][0]["audioContent"]
            audio_bytes = base64.b64decode(audio_b64)
            return SynthesisResult(audio_bytes=audio_bytes, mime_type='audio/wav', language=language, duration_ms=int(latency))
        except (KeyError, IndexError) as e:
            logger.error("Bhashini TTS unexpected response format: %s", str(e))
            raise SpeechProviderError("TTS response format error")
