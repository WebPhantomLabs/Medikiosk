# MediKiosk Backend

FastAPI backend for the MediKiosk healthcare kiosk system.

The MediKiosk backend manages a patient's complete pre-consultation journey:
1. Temporary unauthenticated kiosk sessions & demographic capture.
2. Predefined health-intake question flow with Gemini AI routing against backend-approved transitions.
3. Concurrency-safe, atomic queue/token allocation.
4. Prescription & medical document upload pipeline with Google Cloud Vision OCR.
5. Structured medication extraction via Gemini without clinical code fabrication.
6. Authenticated doctor queue inspection & comprehensive encounter reviews.
7. Authoritative clinical diagnosis recording by doctors.
8. Validated FHIR R4 Bundle generation (`Composition`, `Patient`, `Condition`, `Observation`).
9. Administrator APIs for Question Bank, Staff, and Kiosks.
10. Secure audit logging and sensitive data scrubbing.

---

## 1. Engineering Principles

```text
DATABASE = SYSTEM OF RECORD
BACKEND  = SYSTEM OF CONTROL
GEMINI   = CLASSIFICATION / EXTRACTION ASSISTANT
VISION   = OCR TRANSCRIPTION SERVICE
DOCTOR   = SOLE CLINICAL AUTHORITY
FHIR     = STANDARDIZED INTEROPERABLE OUTPUT
FRONTEND = CLIENT OF THE API
```

---

## 2. Architecture & Directory Structure

```text
backend/
├── app/
│   ├── main.py                  # FastAPI application entrypoint & middleware
│   ├── api/
│   │   ├── dependencies.py      # Auth, RBAC & provider dependency injection
│   │   └── routers/
│   │       ├── auth.py          # Staff login, refresh, logout, me
│   │       ├── sessions.py      # Kiosk session creation & demographics
│   │       ├── intake.py        # Question-answering & AI routing & queue token
│   │       ├── documents.py     # Prescription upload, OCR & medication extraction
│   │       ├── doctor.py        # Doctor queue, encounter review, authoritative diagnosis
│   │       ├── fhir.py          # FHIR R4 bundle generation
│   │       ├── question_bank.py # Admin question & transition CRUD
│   │       ├── staff.py         # Admin staff management CRUD
│   │       ├── kiosks.py        # Admin kiosk management CRUD
│   │       └── health.py        # /health (liveness) & /health/ready (readiness)
│   ├── core/
│   │   ├── config.py            # Typed settings via pydantic-settings
│   │   ├── exceptions.py        # Standardized error hierarchy
│   │   ├── logging.py           # Structured logging & PII redaction
│   │   └── security.py          # Password hashing (bcrypt) & JWT access/refresh
│   ├── db/
│   │   ├── supabase.py          # Async Supabase client
│   │   └── migrations/
│   │       ├── 0001_init.sql    # Core database schema & RLS policies
│   │       └── 0002_seed.sql    # Seed data (questions, demo staff, kiosks)
│   ├── repositories/            # Encapsulated database access layer
│   ├── schemas/                 # Pydantic V2 request & response models
│   ├── services/
│   │   ├── ai/                  # AIProvider abstraction (Gemini & Mock)
│   │   ├── ocr/                 # OCRProvider abstraction (Google Vision & Mock)
│   │   ├── storage/             # StorageProvider abstraction (Local & Mock)
│   │   ├── auth_service.py      # Staff auth & token lifecycle
│   │   ├── session_service.py   # Kiosk session onboarding
│   │   ├── intake_service.py    # Intake question engine & transition validation
│   │   ├── document_service.py  # Upload, OCR & medication extraction
│   │   ├── doctor_service.py    # Queue retrieval, encounters, diagnosis
│   │   ├── fhir_service.py      # FHIR R4 Bundle generator (fhir.resources)
│   │   └── admin_service.py     # Admin CRUD & audit trails
│   └── utils/
│       └── file_validator.py    # MIME type & magic byte verification
├── tests/
│   ├── conftest.py              # Self-contained in-memory DB & provider test fixtures
│   ├── unit/                    # Security, intake engine, queue, OCR, FHIR unit tests
│   ├── api/                     # REST API & RBAC tests
│   └── integration/             # Full patient pre-consultation journey integration test
├── Dockerfile                   # Production container build
├── requirements.txt
└── .env.example
```

---

## 3. Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Virtual environment (`venv`)

### 2. Setup & Installation
```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Linux/macOS
.\.venv\Scripts\Activate.ps1    # On Windows PowerShell

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
```

### 3. Run Server
```bash
uvicorn app.main:app --reload --port 8000
```
- API Docs (Swagger): `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Liveness Probe: `http://localhost:8000/health`
- Readiness Probe: `http://localhost:8000/health/ready`

---

## 4. Running Automated Tests

Run the complete test suite (unit, API, integration):
```bash
pytest -v
```

All 34 tests execute self-contained in memory without requiring live cloud credentials.

---

## 5. Docker Deployment

Build and run container:
```bash
docker build -t medikiosk-backend .
docker run -p 8000:8000 --env-file .env medikiosk-backend
```

---

## 6. Core API Endpoints

### Authentication (Staff Only)
- `POST /api/v1/auth/login` - Staff email/password login -> JWT access + refresh tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Revoke refresh token
- `GET /api/v1/auth/me` - Authenticated staff profile

### Kiosk (Unauthenticated Patients)
- `POST /api/v1/sessions` - Capture patient demographics, initialize kiosk visit & start question
- `GET /api/v1/sessions/{session_id}` - Session status inspection
- `POST /api/v1/intake/answer` - Submit spoken transcript, AI classification against DB transitions, auto queue token assignment
- `POST /api/v1/documents/prescription` - Prescription upload, Google Vision OCR transcription, Gemini medication extraction

### Doctor (Authenticated: DOCTOR / ADMIN)
- `GET /api/v1/doctor/queue` - Retrieve waiting and in-consultation patient queue
- `GET /api/v1/doctor/queue/{token_number}` - Retrieve comprehensive encounter details (demographics, intake Q&A, documents, OCR, extracted meds)
- `POST /api/v1/doctor/encounters/{session_id}/diagnosis` - Record authoritative clinical diagnosis -> marks session COMPLETED

### FHIR
- `POST /api/v1/fhir/generate/{session_id}` - Generate validated FHIR R4 Bundle (`Composition`, `Patient`, `Condition`, `Observation`)
- `GET /api/v1/fhir/{session_id}` - Retrieve encounter FHIR Bundle

### Admin (Authenticated: ADMIN)
- `GET/POST/PUT/DELETE /api/v1/admin/questions[/{node_id}]` - Question bank & transition CRUD
- `GET/POST/PUT/DELETE /api/v1/admin/staff[/{staff_id}]` - Staff management CRUD
- `GET/POST/PUT/DELETE /api/v1/admin/kiosks[/{kiosk_id}]` - Kiosk management CRUD
