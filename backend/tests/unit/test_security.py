from __future__ import annotations

import pytest

from app.core.exceptions import TokenExpiredError, TokenInvalidError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_otp,
    hash_password,
    verify_otp,
    verify_password,
)


def test_password_hash_roundtrip():
    plain = "S3curePassw0rd!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_otp_hash_roundtrip():
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()
    hashed = hash_otp(otp)
    assert verify_otp(otp, hashed) is True
    assert verify_otp("000000" if otp != "000000" else "111111", hashed) is False


def test_access_token_roundtrip():
    token = create_access_token(subject="staff-123", role="DOCTOR")
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == "staff-123"
    assert payload["role"] == "DOCTOR"
    assert payload["type"] == "access"


def test_refresh_token_cannot_be_used_as_access_token():
    token = create_refresh_token(subject="staff-123", role="ADMIN")
    with pytest.raises(TokenInvalidError):
        decode_token(token, expected_type="access")


def test_malformed_token_raises_invalid():
    with pytest.raises(TokenInvalidError):
        decode_token("not-a-real-jwt", expected_type="access")


def test_expired_token_raises_expired(monkeypatch):
    import datetime

    from app.core import security as security_module

    # Force an already-expired token by monkeypatching the expiry delta.
    original = security_module._create_token

    def _expired(subject, role, token_type, expires_delta, extra_claims=None):
        return original(
            subject, role, token_type, datetime.timedelta(seconds=-1), extra_claims
        )

    monkeypatch.setattr(security_module, "_create_token", _expired)
    token = security_module.create_access_token(subject="staff-1", role="DOCTOR")

    with pytest.raises(TokenExpiredError):
        decode_token(token, expected_type="access")
