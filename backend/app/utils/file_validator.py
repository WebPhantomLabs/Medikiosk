from __future__ import annotations

from app.core.exceptions import ValidationError

ALLOWED_MIME_TYPES = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "application/pdf": [b"%PDF"],
}


from app.core.config import get_settings

def validate_file(
    content: bytes,
    declared_mime_type: str,
) -> str:
    """Validate uploaded document bytes against size and magic numbers.
    
    Returns normalized MIME type or raises ValidationError.
    """
    settings = get_settings()
    max_bytes = settings.MAX_UPLOAD_SIZE_BYTES
    if len(content) > max_bytes:
        raise ValidationError(
            f"File size ({len(content)} bytes) exceeds maximum permitted limit of {max_bytes} bytes.",
            code="FILE_TOO_LARGE",
        )

    if not content:
        raise ValidationError("Uploaded file is empty.", code="EMPTY_FILE")

    # Check magic numbers
    matched_mime = None
    for mime, signatures in ALLOWED_MIME_TYPES.items():
        for sig in signatures:
            if content.startswith(sig):
                matched_mime = mime
                break
        if matched_mime:
            break

    if not matched_mime:
        raise ValidationError(
            f"Unsupported file format or invalid file signature. Permitted formats: JPEG, PNG, PDF.",
            code="UNSUPPORTED_MEDIA_TYPE",
        )

    return matched_mime
