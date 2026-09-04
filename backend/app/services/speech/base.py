from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class TranscriptionResult:
    text: str
    language: str
    confidence: float
    duration_ms: int | None = None

@dataclass
class SynthesisResult:
    audio_bytes: bytes
    mime_type: str  # e.g. 'audio/wav'
    language: str
    duration_ms: int | None = None

class SpeechProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, language: str, mime_type: str = 'audio/wav') -> TranscriptionResult:
        """Convert speech audio to text (ASR)."""
        pass
    
    @abstractmethod
    async def synthesize(self, text: str, language: str) -> SynthesisResult:
        """Convert text to speech audio (TTS)."""
        pass
    
    @abstractmethod
    def supported_languages(self) -> list[str]:
        """Return list of supported language codes."""
        pass
