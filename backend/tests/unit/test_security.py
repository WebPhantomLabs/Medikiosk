from __future__ import annotations

import pytest

from app.core.exceptions import TokenInvalidError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hashing():
    pw = "SuperSecret123!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_access_token_creation_and_decoding():
    token = create_access_token(subject="user-123", role="DOCTOR")
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == "user-123"
    assert payload["role"] == "DOCTOR"
    assert payload["type"] == "access"


def test_refresh_token_creation_and_decoding():
    token = create_refresh_token(subject="user-456", role="ADMIN")
    payload = decode_token(token, expected_type="refresh")
    assert payload["sub"] == "user-456"
    assert payload["role"] == "ADMIN"
    assert payload["type"] == "refresh"


def test_invalid_token_type():
    token = create_access_token(subject="user-123", role="DOCTOR")
    with pytest.raises(TokenInvalidError):
        decode_token(token, expected_type="refresh")


def test_malformed_token():
    with pytest.raises(TokenInvalidError):
        decode_token("not.a.valid.jwt.token", expected_type="access")
