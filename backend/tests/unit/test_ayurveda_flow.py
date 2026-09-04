import pytest

from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_session_ayurveda_branch(client: AsyncClient):
    payload = {
        "kiosk_code": "KIOSK-MAIN-01",
        "branch": "ayurveda",
        "patient": {
            "full_name": "Ayush Kumar"
        }
    }
    
    response = await client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    
    assert data["status"] == "INTAKE_IN_PROGRESS"
    assert data["current_node_id"] == "ayurveda_prakriti_start"
    
    # Check that current question is returned
    q = data["current_question"]
    assert q is not None
    assert q["node_id"] == "ayurveda_prakriti_start"
