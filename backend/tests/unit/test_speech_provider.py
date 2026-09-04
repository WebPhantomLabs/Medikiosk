import pytest

from app.services.speech.mock import MockSpeechProvider

@pytest.mark.asyncio
async def test_mock_speech_transcribe():
    provider = MockSpeechProvider()
    result = await provider.transcribe(b"dummy_audio", "hi")
    assert result.text == "Mock transcript for testing"
    assert result.language == "hi"
    assert result.confidence > 0.0

@pytest.mark.asyncio
async def test_mock_speech_synthesize():
    provider = MockSpeechProvider()
    result = await provider.synthesize("test", "en")
    assert result.audio_bytes == b'mock-audio'
    assert result.language == "en"

@pytest.mark.asyncio
async def test_mock_speech_supported_languages():
    provider = MockSpeechProvider()
    assert "en" in provider.supported_languages()
    assert "hi" in provider.supported_languages()

@pytest.mark.asyncio
async def test_mock_speech_force_error():
    provider = MockSpeechProvider()
    provider.force_error(RuntimeError("Mock error"))
    with pytest.raises(RuntimeError, match="Mock error"):
        await provider.transcribe(b"audio", "en")
