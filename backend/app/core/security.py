"""
Security primitives: password hashing, JWT access/refresh tokens, and OTP
hashing utilities.

- Passwords and OTPs are hashed with passlib's bcrypt scheme — plaintext is
  never persisted.
- Access tokens are short-lived JWTs; refresh tokens are long-lived JWTs with
  a distinct `type` claim so one cannot be used in place of the other.
"""
from __future__ import annotations

import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.exceptions import TokenExpiredError, TokenInvalidError

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh"]


# --- Password hashing -------------------------------------------------------
def hash_password(plain_password: str) -> str:
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return _pwd_context.verify(plain_password, password_hash)


# --- OTP hashing --------------------------------------------------------------
def generate_otp(length: int = 6) -> str:
    """Cryptographically secure numeric OTP. Caller is responsible for hashing
    before persistence and for never returning this value in an HTTP response."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def hash_otp(otp: str) -> str:
    return _pwd_context.hash(otp)


def verify_otp(plain_otp: str, otp_hash: str) -> bool:
    return _pwd_context.verify(plain_otp, otp_hash)


# --- JWT ------------------------------------------------------------------------
def _create_token(
    subject: str,
    role: str,
    token_type: TokenType,
    expires_delta: timedelta,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: str, role: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        role,
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: str, role: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        role,
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError() from exc
    except jwt.InvalidTokenError as exc:
        raise TokenInvalidError() from exc

    if payload.get("type") != expected_type:
        raise TokenInvalidError(f"Expected a {expected_type} token.")
    return payload
