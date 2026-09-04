from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_patient_preconsultation_journey(client: AsyncClient):
    """End-to-end integration test validating the entire MediKiosk pre-consultation journey."""

    # -------------------------------------------------------------------------
    # 1. Staff Authentication
    # -------------------------------------------------------------------------
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "doctor@medikiosk.local", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    doctor_token = login_res.json()["access_token"]
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}

    # -------------------------------------------------------------------------
    # 2. Patient Kiosk Session Creation (Unauthenticated)
    # -------------------------------------------------------------------------
    session_res = await client.post(
        "/api/v1/sessions",
        json={
            "kiosk_code": "KIOSK-MAIN-01",
            "patient": {
                "full_name": "Eleanor Vance",
                "date_of_birth": "1988-11-04",
                "sex": "female",
                "phone": "+1-555-0199",
            },
        },
    )
    assert session_res.status_code == 201
    session_data = session_res.json()
    session_id = session_data["id"]
    assert session_data["status"] == "INTAKE_IN_PROGRESS"
    assert session_data["current_question"]["node_id"] == "CHIEF_COMPLAINT"

    # -------------------------------------------------------------------------
    # 3. First Intake Answer (Chief Complaint -> Fever) & Queue Token Allocation
    # -------------------------------------------------------------------------
    ans1_res = await client.post(
        "/api/v1/intake/answer",
        json={
            "session_id": session_id,
            "node_id": "CHIEF_COMPLAINT",
            "transcript": "I have been suffering from a bad fever and chills",
        },
    )
    assert ans1_res.status_code == 200
    ans1_data = ans1_res.json()
    assert ans1_data["classified_category"] == "FEVER"
    assert ans1_data["next_node_id"] == "FEVER_DURATION"
    assert ans1_data["queue_token"] is not None
    token_number = ans1_data["queue_token"]
    assert ans1_data["is_complete"] is False

    # -------------------------------------------------------------------------
    # 4. Second Intake Answer (Fever Duration -> Completion)
    # -------------------------------------------------------------------------
    ans2_res = await client.post(
        "/api/v1/intake/answer",
        json={
            "session_id": session_id,
            "node_id": "FEVER_DURATION",
            "transcript": "It started 4 days ago",
        },
    )
    assert ans2_res.status_code == 200
    ans2_data = ans2_res.json()
    assert ans2_data["is_complete"] is True
    assert ans2_data["session_status"] == "WAITING_FOR_DOCTOR"

    # -------------------------------------------------------------------------
    # 5. Prescription Upload, OCR Transcription & Medication Extraction
    # -------------------------------------------------------------------------
    prescription_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        b"\nRx:\nParacetamol 500mg twice daily for 5 days\nAmoxicillin 250mg 3 times a day for 7 days"
    )
    files = {"file": ("rx_eleanor.png", prescription_bytes, "image/png")}
    doc_res = await client.post(
        "/api/v1/documents/prescription",
        data={"session_id": session_id},
        files=files,
    )
    assert doc_res.status_code == 201
    doc_data = doc_res.json()
    assert doc_data["status"] == "COMPLETED"
    assert doc_data["ocr_result"] is not None
    assert len(doc_data["medications"]) >= 2

    # -------------------------------------------------------------------------
    # 6. Doctor Queue Retrieval
    # -------------------------------------------------------------------------
    queue_res = await client.get("/api/v1/doctor/queue", headers=doctor_headers)
    assert queue_res.status_code == 200
    queue = queue_res.json()
    assert any(item["session_id"] == session_id for item in queue)

    # -------------------------------------------------------------------------
    # 7. Doctor Encounter Details Retrieval
    # -------------------------------------------------------------------------
    enc_res = await client.get(f"/api/v1/doctor/queue/{token_number}", headers=doctor_headers)
    assert enc_res.status_code == 200
    enc = enc_res.json()
    assert enc["patient"]["full_name"] == "Eleanor Vance"
    assert len(enc["intake_history"]) == 2
    assert len(enc["documents"]) == 1

    # -------------------------------------------------------------------------
    # 8. Doctor Enters Authoritative Diagnosis
    # -------------------------------------------------------------------------
    diag_res = await client.post(
        f"/api/v1/doctor/encounters/{session_id}/diagnosis",
        json={
            "diagnosis_text": "Acute Bacterial Pharyngitis with Pyrexia",
            "notes": "Patient started on antibiotic therapy. Advised warm saline gargles.",
        },
        headers=doctor_headers,
    )
    assert diag_res.status_code == 200
    diag_data = diag_res.json()
    assert diag_data["diagnosis_text"] == "Acute Bacterial Pharyngitis with Pyrexia"

    # --- 8. Patient checks status ---
    session_check = await client.get(
        f"/api/v1/sessions/{session_id}",
        headers={"X-Session-Token": session_id}
    )
    assert session_check.status_code == 200
    assert session_check.json()["status"] == "DIAGNOSIS_RECORDED"

    # 8.5 Complete encounter
    comp_res = await client.post(
        f"/api/v1/doctor/encounters/{session_id}/complete",
        headers=doctor_headers,
    )
    assert comp_res.status_code == 200

    # -------------------------------------------------------------------------
    # 9. FHIR R4 Bundle Generation
    # -------------------------------------------------------------------------
    fhir_res = await client.post(f"/api/v1/fhir/generate/{session_id}", headers=doctor_headers)
    assert fhir_res.status_code == 200
    bundle_data = fhir_res.json()
    assert bundle_data["bundle_type"] == "document"
    bundle = bundle_data["bundle"]
    assert bundle["resourceType"] == "Bundle"

    types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
    assert "Composition" in types
    assert "Patient" in types
    assert "Condition" in types
    assert "Observation" in types

    # Check that Condition reflects doctor's diagnosis
    condition = next(e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "Condition")
    assert condition["code"]["text"] == "Acute Bacterial Pharyngitis with Pyrexia"
