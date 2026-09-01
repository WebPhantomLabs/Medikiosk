from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_session_unauthenticated_patient(client: AsyncClient):
    payload = {
        "kiosk_code": "KIOSK-MAIN-01",
        "patient": {
            "full_name": "Alice Wonderland",
            "date_of_birth": "1995-03-21",
            "sex": "female",
            "phone": "+1987654321",
        },
    }
    response = await client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "INTAKE_IN_PROGRESS"
    assert data["patient"]["full_name"] == "Alice Wonderland"
    assert data["current_question"]["node_id"] == "CHIEF_COMPLAINT"


@pytest.mark.asyncio
async def test_get_session(client: AsyncClient):
    create_res = await client.post(
        "/api/v1/sessions",
        json={
            "kiosk_code": "KIOSK-MAIN-01",
            "patient": {"full_name": "Bob Builder", "sex": "male"},
        },
    )
    session_id = create_res.json()["id"]

    get_res = await client.get(f"/api/v1/sessions/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == session_id
