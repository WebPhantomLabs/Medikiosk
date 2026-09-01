from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_kiosk_crud(client: AsyncClient, admin_headers: dict[str, str], doctor_headers: dict[str, str]):
    # 1. Doctor cannot access Admin endpoints (RBAC)
    doc_res = await client.get("/api/v1/admin/kiosks", headers=doctor_headers)
    assert doc_res.status_code == 403

    # 2. Admin can list kiosks
    list_res = await client.get("/api/v1/admin/kiosks", headers=admin_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Admin can create kiosk
    create_res = await client.post(
        "/api/v1/admin/kiosks",
        json={"code": "KIOSK-ER-02", "location": "Emergency Room Gate 2", "status": "ACTIVE"},
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    kiosk_id = create_res.json()["id"]

    # 4. Admin can update kiosk
    up_res = await client.put(
        f"/api/v1/admin/kiosks/{kiosk_id}",
        json={"location": "Emergency Room Gate 2 (Renovated)"},
        headers=admin_headers,
    )
    assert up_res.status_code == 200
    assert up_res.json()["location"] == "Emergency Room Gate 2 (Renovated)"


@pytest.mark.asyncio
async def test_admin_staff_crud(client: AsyncClient, admin_headers: dict[str, str]):
    create_res = await client.post(
        "/api/v1/admin/staff",
        json={
            "email": "dr.house@medikiosk.local",
            "password": "DiagnosticMaster123!",
            "full_name": "Dr. Gregory House",
            "role": "DOCTOR",
            "active": True,
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    staff_id = create_res.json()["id"]

    list_res = await client.get("/api/v1/admin/staff", headers=admin_headers)
    assert list_res.status_code == 200
    assert any(s["id"] == staff_id for s in list_res.json())
