import pytest

from app.services.abdm.mock import MockABDMProvider

@pytest.mark.asyncio
async def test_mock_abdm_authenticate():
    provider = MockABDMProvider()
    result = await provider.authenticate()
    assert result.access_token == "mock_abdm_token"
    assert result.expires_in > 0

@pytest.mark.asyncio
async def test_mock_abdm_verify_abha():
    provider = MockABDMProvider()
    result = await provider.verify_abha("test@sbx")
    assert result.verified is True
    assert result.abha_address == "test@sbx"
    assert result.patient_name == "Mock Patient"

@pytest.mark.asyncio
async def test_mock_abdm_submit_health_record():
    provider = MockABDMProvider()
    result = await provider.submit_health_record("sess_1", {"resourceType": "Bundle"})
    assert result.success is True
    assert result.record_id is not None
    assert result.error is None

@pytest.mark.asyncio
async def test_mock_abdm_health_check():
    provider = MockABDMProvider()
    result = await provider.health_check()
    assert result is True
