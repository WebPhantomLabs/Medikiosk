from __future__ import annotations

import pytest

from app.services.fhir_service import FHIRService
from tests.conftest import MockDatabase


@pytest.mark.asyncio
async def test_fhir_bundle_construction():
    db = MockDatabase()
    p = await db.table("patients").insert({
        "full_name": "Jane Smith",
        "date_of_birth": "1990-05-15",
        "sex": "female",
        "phone": "+1234567890",
    })
    patient_id = p.data[0]["id"]

    s = await db.table("sessions").insert({
        "patient_id": patient_id,
        "kiosk_id": "33333333-3333-3333-3333-333333333333",
        "status": "COMPLETED",
    })
    session_id = s.data[0]["id"]

    # Add diagnosis
    await db.table("diagnoses").insert({
        "session_id": session_id,
        "doctor_id": "22222222-2222-2222-2222-222222222222",
        "diagnosis_text": "Acute Viral Pharyngitis",
        "notes": "Hydration and rest recommended.",
    })

    # Add intake answer
    await db.table("intake_answers").insert({
        "session_id": session_id,
        "node_id": "CHIEF_COMPLAINT",
        "transcript": "Sore throat and fever",
        "answer_category": "FEVER",
        "sequence": 1,
    })

    service = FHIRService(db)
    bundle_res = await service.generate_bundle(session_id)

    bundle = bundle_res.bundle
    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "document"

    resource_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
    assert "Composition" in resource_types
    assert "Patient" in resource_types
    assert "Condition" in resource_types
    assert "Observation" in resource_types

    # Validate condition text matches doctor's diagnosis
    condition = next(e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Condition")
    assert condition["code"]["text"] == "Acute Viral Pharyngitis"
