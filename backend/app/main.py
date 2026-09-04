"""
MediKiosk Backend — application entrypoint.

Wires together configuration, logging, routers, CORS, and global exception
handling. Business logic never lives here — this module only assembles the
application.
"""
from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import (
    auth,
    doctor,
    documents,
    fhir,
    health,
    intake,
    kiosks,
    question_bank,
    sessions,
    sessions_admin,
    audit,
    staff,
    speech,
)
from app.core.config import get_settings
from app.core.exceptions import MediKioskError
from app.core.logging import configure_logging, get_logger
from app.db.supabase import close_supabase_client

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(debug=settings.DEBUG)
    logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.APP_ENV)
    yield
    logger.info("Shutting down %s", settings.APP_NAME)
    await close_supabase_client()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "MediKiosk healthcare kiosk backend: kiosk intake, AI-assisted "
            "question routing, prescription OCR, doctor review, and FHIR R4 "
            "document generation."
        ),
        lifespan=lifespan,
        # Hide interactive docs entirely in production if desired; kept on
        # here since Swagger access is an explicit acceptance criterion.
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    _rate_limit_cache: dict[str, list[float]] = {}

    @app.middleware("http")
    async def rate_limit_auth(request: Request, call_next):
        if request.url.path.startswith(f"{settings.API_V1_PREFIX}/auth"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            
            if client_ip not in _rate_limit_cache:
                _rate_limit_cache[client_ip] = []
                
            _rate_limit_cache[client_ip] = [ts for ts in _rate_limit_cache[client_ip] if now - ts < 60]
            
            if len(_rate_limit_cache[client_ip]) >= settings.AUTH_RATE_LIMIT_PER_MINUTE:
                return JSONResponse(
                    status_code=429,
                    content={"error": {"code": "RATE_LIMITED", "message": "Too many requests. Please try again later."}}
                )
            
            _rate_limit_cache[client_ip].append(now)

        return await call_next(request)

    @app.middleware("http")
    async def add_request_id_and_timing(request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response

    @app.exception_handler(MediKioskError)
    async def handle_medikiosk_error(request: Request, exc: MediKioskError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        logger.exception(
            "unhandled exception", extra={"request_id": request_id, "path": request.url.path}
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred.",
                }
            },
        )

    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": "HTTP_ERROR", "message": str(exc.detail)}},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed."}},
        )

    prefix = settings.API_V1_PREFIX
    app.include_router(health.router)  # /health (unversioned, for infra probes)
    app.include_router(health.router, prefix=prefix)  # /api/v1/health for frontend client
    app.include_router(auth.router, prefix=f"{prefix}/auth")
    app.include_router(sessions.router, prefix=f"{prefix}/sessions")
    app.include_router(intake.router, prefix=f"{prefix}/intake")
    app.include_router(documents.router, prefix=f"{prefix}/documents")
    app.include_router(doctor.router, prefix=f"{prefix}/doctor")
    app.include_router(fhir.router, prefix=f"{prefix}/fhir")
    app.include_router(question_bank.router, prefix=f"{prefix}/admin/questions")
    app.include_router(staff.router, prefix=f"{prefix}/admin/staff")
    app.include_router(kiosks.router, prefix=f"{prefix}/admin/kiosks")
    app.include_router(sessions_admin.router, prefix=f"{prefix}/admin/sessions")
    app.include_router(audit.router, prefix=f"{prefix}/admin/audit-logs")
    app.include_router(speech.router, prefix=f"{prefix}/speech")

    return app


app = create_app()