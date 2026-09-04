"""
Centralized, domain-specific exceptions.

Routes/services raise these instead of generic `Exception` or leaking
framework/database errors. `app.main` registers handlers that translate
these into the standard error envelope:

    { "error": { "code": "...", "message": "..." } }

without ever leaking stack traces or internal details to the client.
"""
from __future__ import annotations


class MediKioskError(Exception):
    """Base class for all application-level errors."""

    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, code: str | None = None, status_code: int | None = None) -> None:
        self.message = message or self.message
        self.code = code or self.code
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message)


# --- Auth -----------------------------------------------------------------
class InvalidCredentialsError(MediKioskError):
    code = "INVALID_CREDENTIALS"
    status_code = 401
    message = "Invalid credentials."


class AccountDisabledError(MediKioskError):
    code = "ACCOUNT_DISABLED"
    status_code = 403
    message = "Account has been deactivated."


class TokenExpiredError(MediKioskError):
    code = "TOKEN_EXPIRED"
    status_code = 401
    message = "Token has expired."


class TokenInvalidError(MediKioskError):
    code = "TOKEN_INVALID"
    status_code = 401
    message = "Token is invalid."


class NotAuthenticatedError(MediKioskError):
    code = "NOT_AUTHENTICATED"
    status_code = 401
    message = "Authentication is required."


class ForbiddenError(MediKioskError):
    code = "FORBIDDEN"
    status_code = 403
    message = "You do not have permission to perform this action."


# --- OTP --------------------------------------------------------------------
class OtpExpiredError(MediKioskError):
    code = "OTP_EXPIRED"
    status_code = 400
    message = "OTP has expired."


class OtpInvalidError(MediKioskError):
    code = "OTP_INVALID"
    status_code = 400
    message = "OTP is invalid."


class OtpAttemptsExceededError(MediKioskError):
    code = "OTP_ATTEMPTS_EXCEEDED"
    status_code = 429
    message = "Maximum OTP verification attempts exceeded."


class OtpAlreadyConsumedError(MediKioskError):
    code = "OTP_ALREADY_CONSUMED"
    status_code = 400
    message = "OTP has already been used."


# --- Sessions / Kiosk --------------------------------------------------------
class SessionNotFoundError(MediKioskError):
    code = "SESSION_NOT_FOUND"
    status_code = 404
    message = "Session does not exist."


class SessionNotActiveError(MediKioskError):
    code = "SESSION_NOT_ACTIVE"
    status_code = 409
    message = "Session is not in an active state."


class SessionConflictError(MediKioskError):
    code = "SESSION_CONFLICT"
    status_code = 409
    message = "Session conflict."


# --- Question engine / Gemini -------------------------------------------------
class QuestionNodeNotFoundError(MediKioskError):
    code = "QUESTION_NODE_NOT_FOUND"
    status_code = 404
    message = "Question node does not exist."


class InvalidTransitionError(MediKioskError):
    code = "INVALID_TRANSITION"
    status_code = 422
    message = "The requested transition is not permitted."


class LlmProviderError(MediKioskError):
    code = "LLM_PROVIDER_ERROR"
    status_code = 502
    message = "The classification provider failed."


class LlmValidationError(MediKioskError):
    code = "LLM_VALIDATION_ERROR"
    status_code = 502
    message = "The classification provider returned an invalid response."


# --- Documents / OCR ------------------------------------------------------------
class UnsupportedFileTypeError(MediKioskError):
    code = "UNSUPPORTED_FILE_TYPE"
    status_code = 400
    message = "Unsupported file type."


class FileTooLargeError(MediKioskError):
    code = "FILE_TOO_LARGE"
    status_code = 400
    message = "Uploaded file exceeds the maximum allowed size."


class OcrProviderError(MediKioskError):
    code = "OCR_PROVIDER_ERROR"
    status_code = 502
    message = "OCR provider failed."


# --- Doctor / FHIR --------------------------------------------------------------
class EncounterNotFoundError(MediKioskError):
    code = "ENCOUNTER_NOT_FOUND"
    status_code = 404
    message = "Encounter does not exist."


class DiagnosisRequiredError(MediKioskError):
    code = "DIAGNOSIS_REQUIRED"
    status_code = 409
    message = "A doctor diagnosis is required before generating FHIR output."


class FhirBuildError(MediKioskError):
    code = "FHIR_BUILD_ERROR"
    status_code = 500
    message = "Failed to build a valid FHIR resource."


# --- Generic resource errors ------------------------------------------------------
class NotFoundError(MediKioskError):
    code = "NOT_FOUND"
    status_code = 404
    message = "Resource not found."


class ConflictError(MediKioskError):
    code = "CONFLICT"
    status_code = 409
    message = "Resource conflict."


class ValidationError(MediKioskError):
    code = "VALIDATION_FAILED"
    status_code = 400
    message = "Validation failed."


class ValidationFailedError(ValidationError):
    status_code = 422


class RateLimitedError(MediKioskError):
    code = "RATE_LIMITED"
    status_code = 429
    message = "Too many requests. Please try again later."


# --- Speech ----------------------------------------------------------------------
class SpeechProviderError(MediKioskError):
    code = 'SPEECH_PROVIDER_ERROR'
    status_code = 502
    message = 'Speech provider failed.'

class UnsupportedLanguageError(MediKioskError):
    code = 'UNSUPPORTED_LANGUAGE'
    status_code = 400
    message = 'The requested language is not supported.'


# --- ABDM ------------------------------------------------------------------------
class ABDMProviderError(MediKioskError):
    code = 'ABDM_PROVIDER_ERROR'
    status_code = 502
    message = 'ABDM service is unavailable.'


class ABDMNotConfiguredError(MediKioskError):
    code = 'ABDM_NOT_CONFIGURED'
    status_code = 503
    message = 'ABDM integration is not configured.'
