import re

with open("API_DOCUMENTATION.md", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Session Create
content = content.replace('''{
  "kiosk_id": "kiosk-001",
  "patient": {
    "name": "Walk-in Patient",
    "date_of_birth": "1990-01-01",
    "sex": "unknown",
    "phone": "+91-9876543210"
  }
}''', '''{
  "kiosk_id": "kiosk-001",
  "patient": {
    "full_name": "Walk-in Patient",
    "date_of_birth": "1990-01-01",
    "sex": "unknown",
    "phone": "+91-9876543210"
  },
  "language": "hi",
  "branch": "allopathy"
}''')

# 2. Update Intake Answer to include language
content = content.replace('''{
  "session_id": "uuid",
  "node_id": "q_chief_complaint",
  "transcript": "I have been experiencing chest pain for 3 days"
}''', '''{
  "session_id": "uuid",
  "node_id": "q_chief_complaint",
  "transcript": "I have been experiencing chest pain for 3 days",
  "language": "hi"
}''')

# 3. Documents
doc_section = """### 📄 Documents

#### POST `/documents/prescription`
Upload prescription image or PDF, transcribe via Google Vision OCR, and extract structured medications.

**Request:** `multipart/form-data`
- `session_id` (form parameter)
- `file` (file): JPEG, PNG, or PDF

**Response:**
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "file_name": "prescription.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 102400,
  "status": "COMPLETED",
  "created_at": "2024-01-15T10:40:00Z",
  "ocr_result": {
    "document_id": "uuid",
    "raw_text": "Prescription text...",
    "created_at": "2024-01-15T10:40:05Z"
  },
  "medications": [
    {
      "name": "Metformin",
      "dose": "500mg",
      "frequency": "Twice daily",
      "duration": "30 days",
      "source": "ai_extracted",
      "confidence": 0.95,
      "requires_verification": false
    }
  ]
}
```

#### GET `/documents/{document_id}`
Retrieve document details, raw OCR transcription, and structured medications.

**Headers (Optional):** `Authorization: Bearer <token>`
**Query Params (Optional):** `session_id=<uuid>`

**Response:** (Same as POST /documents/prescription)"""

content = re.sub(r'### 📄 Documents.*?(?=---)', doc_section + '\n\n', content, flags=re.DOTALL)

# 4. Remove /support/request
content = re.sub(r'#### POST `/support/request`.*?---', '---', content, flags=re.DOTALL)
content = re.sub(r'### 🆘 Support.*?---', '', content, flags=re.DOTALL)

# 5. Doctor queue endpoints
content = content.replace('GET `/doctor/patient/{token_number}`', 'GET `/doctor/queue/{id}`')

# 6. Add Speech endpoints and Health observability
speech_section = """### 🎤 Speech

#### POST `/speech/transcribe`
Convert speech audio to text (ASR)

**Request:** `multipart/form-data`
- `language` (form parameter)
- `audio` (file): Audio file

**Response:**
```json
{
  "text": "Extracted text",
  "confidence": 0.95,
  "language": "hi",
  "duration_ms": 1500
}
```

#### POST `/speech/synthesize`
Convert text to speech audio (TTS)

**Request:**
```json
{
  "text": "Namaste",
  "language": "hi"
}
```

**Response:**
Returns audio bytes (e.g. `audio/wav`).

---
"""
content = content.replace('### 📋 Session Management', speech_section + '\n### 📋 Session Management')

health_section = """### 🩺 Observability

#### GET `/health/ready`
Get service health and provider readiness status.

**Response:**
```json
{
  "status": "UP",
  "providers": {
    "database": "supabase",
    "ai": "gemini",
    "ocr": "vision",
    "speech": "bhashini"
  }
}
```

---
"""
content = content.replace('### 🔐 Authentication', health_section + '\n### 🔐 Authentication')

with open("API_DOCUMENTATION.md", "w", encoding="utf-8") as f:
    f.write(content)
