from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_intake_answer_progression(client: AsyncClient):
    # 1. Create Session
    session_res = await client.post(
        "/api/v1/sessions",
        json={
            "kiosk_code": "KIOSK-MAIN-01",
            "patient": {"full_name": "Charlie Chaplin"},
        },
    )
    session_id = session_res.json()["id"]

    # 2. Answer Start Question (CHIEF_COMPLAINT) with Fever
    ans1_res = await client.post(
        "/api/v1/intake/answer",
        json={
            "session_id": session_id,
            "node_id": "CHIEF_COMPLAINT",
            "transcript": "I have had a high fever for two days",
        },
    )
    assert ans1_res.status_code == 200
    ans1_data = ans1_res.json()
    assert ans1_data["classified_category"] == "FEVER"
    assert ans1_data["next_node_id"] == "FEVER_DURATION"
    assert ans1_data["queue_token"] is not None
    assert ans1_data["is_complete"] is False

    # 3. Answer Next Question (FEVER_DURATION)
    ans2_res = await client.post(
        "/api/v1/intake/answer",
        json={
            "session_id": session_id,
            "node_id": "FEVER_DURATION",
            "transcript": "less than 3 days",
        },
    )
    assert ans2_res.status_code == 200
    ans2_data = ans2_res.json()
    assert ans2_data["is_complete"] is True
    assert ans2_data["session_status"] == "WAITING_FOR_DOCTOR"
