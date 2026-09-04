from app.services.speech.base import SpeechProvider, TranscriptionResult, SynthesisResult

class MockSpeechProvider(SpeechProvider):
    def __init__(self):
        self._force_error: Exception | None = None

    def force_error(self, error: Exception | None) -> None:
        self._force_error = error

    async def transcribe(self, audio_bytes: bytes, language: str, mime_type: str = 'audio/wav') -> TranscriptionResult:
        if self._force_error:
            raise self._force_error
        return TranscriptionResult(text='Mock transcript for testing', language=language, confidence=0.95)

    async def synthesize(self, text: str, language: str) -> SynthesisResult:
        if self._force_error:
            raise self._force_error
        return SynthesisResult(audio_bytes=b'mock-audio', mime_type='audio/wav', language=language)

    def supported_languages(self) -> list[str]:
        return ['en', 'hi', 'ta', 'mr', 'bn', 'te']
