from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

@dataclass
class ABDMAuthToken:
    access_token: str
    expires_in: int
    token_type: str = 'bearer'

@dataclass 
class ABHAVerificationResult:
    verified: bool
    abha_number: str | None = None
    abha_address: str | None = None
    patient_name: str | None = None
    error: str | None = None

@dataclass
class HealthRecordSubmissionResult:
    success: bool
    record_id: str | None = None
    error: str | None = None

class ABDMProvider(ABC):
    """Abstract interface for Ayushman Bharat Digital Mission integration.
    
    This adapter boundary separates MediKiosk from the ABDM ecosystem.
    All ABDM interactions go through this interface.
    """
    
    @abstractmethod
    async def authenticate(self) -> ABDMAuthToken:
        """Authenticate with ABDM gateway."""
        pass
    
    @abstractmethod
    async def verify_abha(self, abha_id: str) -> ABHAVerificationResult:
        """Verify an ABHA (Ayushman Bharat Health Account) number."""
        pass
    
    @abstractmethod
    async def submit_health_record(self, session_id: str, fhir_bundle: dict) -> HealthRecordSubmissionResult:
        """Submit a FHIR health record to ABDM."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if ABDM service is reachable."""
        pass
