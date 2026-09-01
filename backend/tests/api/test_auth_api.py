from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_staff_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@medikiosk.local", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["staff"]["role"] == "DOCTOR"


@pytest.mark.asyncio
async def test_staff_login_invalid_password(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@medikiosk.local", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, doctor_headers: dict[str, str]):
    response = await client.get("/api/v1/auth/me", headers=doctor_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "doctor@medikiosk.local"
    assert data["role"] == "DOCTOR"


@pytest.mark.asyncio
async def test_unauthorized_without_token(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
