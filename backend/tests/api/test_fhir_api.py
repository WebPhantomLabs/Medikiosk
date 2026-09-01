from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_generate_fhir_bundle_api(client: AsyncClient, doctor_headers: dict[str, str]):
    # 1. Create session & complete flow with diagnosis
    s_res = await client.post(
        "/api/v1/sessions",
        json={"kiosk_code": "KIOSK-MAIN-01", "patient": {"full_name": "Isaac Newton", "sex": "male"}},
    )
    session_id = s_res.json()["id"]

    await client.post(
        "/api/v1/intake/answer",
        json={"session_id": session_id, "node_id": "CHIEF_COMPLAINT", "transcript": "Fever for 2 days"},
    )
    await client.post(
        "/api/v1/intake/answer",
        json={"session_id": session_id, "node_id": "FEVER_DURATION", "transcript": "less than 3 days"},
    )
    await client.post(
        f"/api/v1/doctor/encounters/{session_id}/diagnosis",
        json={"diagnosis_text": "Influenza A", "notes": "Prescribed hydration."},
        headers=doctor_headers,
    )

    # 2. Generate FHIR R4 Bundle
    fhir_res = await client.post(f"/api/v1/fhir/generate/{session_id}", headers=doctor_headers)
    assert fhir_res.status_code == 200
    fhir_data = fhir_res.json()
    assert fhir_data["bundle"]["resourceType"] == "Bundle"
    assert fhir_data["resource_count"] > 0
