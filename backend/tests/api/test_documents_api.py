from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_prescription_document(client: AsyncClient):
    # 1. Create session
    session_res = await client.post(
        "/api/v1/sessions",
        json={"kiosk_code": "KIOSK-MAIN-01", "patient": {"full_name": "David Bowie"}},
    )
    session_id = session_res.json()["id"]

    # 2. Upload prescription file (PNG magic header)
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"Rx: Paracetamol 500mg"
    files = {"file": ("prescription.png", png_bytes, "image/png")}
    data = {"session_id": session_id}

    upload_res = await client.post("/api/v1/documents/prescription", data=data, files=files)
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    assert doc_data["status"] == "COMPLETED"
    assert doc_data["ocr_result"] is not None
    assert len(doc_data["medications"]) > 0


@pytest.mark.asyncio
async def test_upload_invalid_mime_type(client: AsyncClient):
    session_res = await client.post(
        "/api/v1/sessions",
        json={"kiosk_code": "KIOSK-MAIN-01", "patient": {"full_name": "Eve Polastri"}},
    )
    session_id = session_res.json()["id"]

    files = {"file": ("malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-dosexec")}
    data = {"session_id": session_id}

    upload_res = await client.post("/api/v1/documents/prescription", data=data, files=files)
    assert upload_res.status_code == 400
    assert upload_res.json()["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"
