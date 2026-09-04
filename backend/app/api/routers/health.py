from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from supabase import AsyncClient

from app.api.dependencies import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Liveness probe to verify that the application process is running."""
    return {"status": "ok"}


@router.get("/health/ready")
async def readiness_check(db: AsyncClient = Depends(get_db)) -> JSONResponse:
    from app.core.config import get_settings
    settings = get_settings()
    """Readiness probe to verify infrastructure connectivity without leaking sensitive details."""
    db_status = "ok"
    try:
        # Simple connectivity check
        await db.table("kiosks").select("id").limit(1).execute()
    except Exception:
        db_status = "degraded"

    ai_provider = "gemini" if settings.GEMINI_API_KEY else "mock"
    ocr_provider = "google" if settings.GOOGLE_APPLICATION_CREDENTIALS else "mock"
    speech_provider = "bhashini" if getattr(settings, "BHASHINI_API_KEY", None) else "mock"
    abdm = "enabled" if getattr(settings, "ABDM_ENABLED", False) and getattr(settings, "ABDM_CLIENT_ID", None) else "disabled"

    http_status = (
        status.HTTP_200_OK if db_status == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(
        status_code=http_status,
        content={
            "status": "ready" if db_status == "ok" else "unready", 
            "checks": {
                "database": db_status,
                "ai_provider": ai_provider,
                "ocr_provider": ocr_provider,
                "speech_provider": speech_provider,
                "abdm": abdm
            }
        },
    )
