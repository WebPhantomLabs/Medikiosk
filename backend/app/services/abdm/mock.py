from app.services.abdm.base import (
    ABDMProvider,
    ABDMAuthToken,
    ABHAVerificationResult,
    HealthRecordSubmissionResult
)

class MockABDMProvider(ABDMProvider):
    """Mock ABDM provider for local development and testing."""
    
    async def authenticate(self) -> ABDMAuthToken:
        return ABDMAuthToken(
            access_token="mock_abdm_token",
            expires_in=3600
        )

    async def verify_abha(self, abha_id: str) -> ABHAVerificationResult:
        return ABHAVerificationResult(
            verified=True,
            abha_number=abha_id if "@" not in abha_id else "12-3456-7890-1234",
            abha_address=abha_id if "@" in abha_id else f"{abha_id}@sbx",
            patient_name="Mock Patient",
            error=None
        )

    async def submit_health_record(self, session_id: str, fhir_bundle: dict) -> HealthRecordSubmissionResult:
        return HealthRecordSubmissionResult(
            success=True,
            record_id="mock_record_12345",
            error=None
        )

    async def health_check(self) -> bool:
        return True
