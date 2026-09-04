from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_doctor_queue_and_diagnosis(client: AsyncClient, doctor_headers: dict[str, str]):
    # 1. Patient starts session & completes intake
    s_res = await client.post(
        "/api/v1/sessions",
        json={"kiosk_code": "KIOSK-MAIN-01", "patient": {"full_name": "Grace Hopper", "sex": "female"}},
    )
    session_id = s_res.json()["id"]

    # Intake answer
    ans_res = await client.post(
        "/api/v1/intake/answer",
        json={"session_id": session_id, "node_id": "CHIEF_COMPLAINT", "transcript": "Other symptoms"},
    )
    token_number = ans_res.json()["queue_token"]

    # 2. Doctor views queue
    queue_res = await client.get("/api/v1/doctor/queue", headers=doctor_headers)
    assert queue_res.status_code == 200
    queue_items = queue_res.json()
    assert any(q["session_id"] == session_id for q in queue_items)

    # 3. Doctor views encounter details
    enc_res = await client.get(f"/api/v1/doctor/queue/{token_number}", headers=doctor_headers)
    assert enc_res.status_code == 200
    assert enc_res.json()["patient"]["full_name"] == "Grace Hopper"

    # 4. Doctor records diagnosis
    diag_payload = {
        "diagnosis_text": "Common Cold / Mild Viral Rhinitis",
        "notes": "Rest, warm fluids, OTC decongestant as needed.",
    }
    diag_res = await client.post(
        f"/api/v1/doctor/encounters/{session_id}/diagnosis",
        json=diag_payload,
        headers=doctor_headers,
    )
    assert diag_res.status_code == 200
    diag_data = diag_res.json()
    assert diag_data["diagnosis_text"] == diag_payload["diagnosis_text"]

    # Check session is completed
    sess_res = await client.get(
        f"/api/v1/sessions/{session_id}",
        headers={"X-Session-Token": session_id}
    )
    assert sess_res.json()["status"] == "DIAGNOSIS_RECORDED"


@pytest.mark.asyncio
async def test_unauthenticated_doctor_access_blocked(client: AsyncClient):
    response = await client.get("/api/v1/doctor/queue")
    assert response.status_code == 401
