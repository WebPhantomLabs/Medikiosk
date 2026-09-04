from fastapi import APIRouter, Depends, UploadFile, Form, File, Response
from pydantic import BaseModel
from app.api.dependencies import get_speech_provider
from app.services.speech.base import SpeechProvider

router = APIRouter(tags=["speech"])

class SynthesizeRequest(BaseModel):
    text: str
    language: str

@router.post("/transcribe")
async def transcribe(
    language: str = Form(...),
    audio: UploadFile = File(...),
    speech_provider: SpeechProvider = Depends(get_speech_provider)
):
    audio_bytes = await audio.read()
    mime_type = audio.content_type or "audio/wav"
    result = await speech_provider.transcribe(audio_bytes, language, mime_type)
    return {
        "text": result.text,
        "confidence": result.confidence,
        "language": result.language,
        "duration_ms": result.duration_ms
    }

@router.post("/synthesize")
async def synthesize(
    request: SynthesizeRequest,
    speech_provider: SpeechProvider = Depends(get_speech_provider)
):
    result = await speech_provider.synthesize(request.text, request.language)
    return Response(content=result.audio_bytes, media_type=result.mime_type)
