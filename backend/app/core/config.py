"""
Typed application configuration.

All configuration is loaded from environment variables (via a .env file in
local development). Nothing here should contain real secrets — see
`.env.example` for the documented list of variables a deployment must set.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central, typed application settings.

    Values are read from environment variables (case-insensitive) and,
    for local development, from a `.env` file in the project root.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application -------------------------------------------------
    APP_ENV: str = Field(default="development")
    APP_NAME: str = Field(default="MediKiosk Backend")
    APP_VERSION: str = Field(default="0.1.0")
    DEBUG: bool = Field(default=True)
    API_V1_PREFIX: str = Field(default="/api/v1")

    # --- Supabase / Postgres ------------------------------------------
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")

    # --- ABDM ---
    ABDM_BASE_URL: str = Field(default='https://dev.abdm.gov.in')
    ABDM_CLIENT_ID: str = Field(default='')
    ABDM_CLIENT_SECRET: str = Field(default='')
    ABDM_ENABLED: bool = Field(default=False)

    # --- Gemini ---------------------------------------------------------
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash")
    GEMINI_TIMEOUT_SECONDS: int = Field(default=30)
    GEMINI_MAX_RETRIES: int = Field(default=2)

    # --- Google Cloud Vision -------------------------------------------
    GOOGLE_APPLICATION_CREDENTIALS: str = Field(default="")

    # --- Auth / OTP -----------------------------------------------------
    JWT_SECRET_KEY: str = Field(default="change-me-in-production")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    OTP_TTL_SECONDS: int = Field(default=300)
    OTP_MAX_ATTEMPTS: int = Field(default=5)
    OTP_LOG_TO_CONSOLE: bool = Field(default=True)  # dev-only; must be False in prod

    # --- Rate limiting ----------------------------------------------------
    AUTH_RATE_LIMIT_PER_MINUTE: int = Field(default=10)

    # --- Uploads ----------------------------------------------------------
    MAX_UPLOAD_SIZE_BYTES: int = Field(default=10 * 1024 * 1024)  # 10 MB
    # Stored as a raw comma-separated string (not list[str]) because
    # pydantic-settings attempts to JSON-decode list-typed env values before
    # any field validator runs, which breaks plain "a,b,c" env syntax.
    # `allowed_upload_mime_types` below exposes the parsed list.
    ALLOWED_UPLOAD_MIME_TYPES: str = Field(
        default="image/jpeg,image/png,application/pdf"
    )

    # --- Bhashini Speech ---
    BHASHINI_API_KEY: str = Field(default='')
    BHASHINI_USER_ID: str = Field(default='')
    BHASHINI_ULCA_API_KEY: str = Field(default='')
    BHASHINI_PIPELINE_URL: str = Field(default='https://dhruva-api.bhashini.gov.in/services/inference/pipeline')
    BHASHINI_TIMEOUT_SECONDS: int = Field(default=30)

    # --- CORS ---------------------------------------------------------------
    CORS_ORIGINS: str = Field(default="http://localhost:3000")

    @staticmethod
    def _split_csv(value: str) -> list[str]:
        return [item.strip() for item in value.split(",") if item.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return self._split_csv(self.CORS_ORIGINS)

    @property
    def allowed_upload_mime_types_list(self) -> list[str]:
        return self._split_csv(self.ALLOWED_UPLOAD_MIME_TYPES)

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() in {"prod", "production"}

    @model_validator(mode="after")
    def _validate_jwt_secret(self) -> Settings:
        import warnings
        if self.is_production and self.JWT_SECRET_KEY == "change-me-in-production":
            warnings.warn("JWT_SECRET_KEY is set to the default insecure value in production!", UserWarning)
        return self

@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (loaded once per process)."""
    return Settings()
