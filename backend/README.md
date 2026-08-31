# MediKiosk Backend

FastAPI backend for the MediKiosk healthcare kiosk system. See `PRD.md` in the
project root (or the repository docs) for the full product/technical
specification this implementation follows.

**Current status: Phase 0 — Project Foundation.** This phase provides the
running application skeleton, configuration, database schema, dev tooling,
and test harness. Feature endpoints (auth, sessions, intake, documents,
doctor, FHIR, admin) are wired as registered-but-empty routers and are
implemented in subsequent phases — see [Roadmap](#roadmap) below.

---

## 1. Prerequisites

- Python 3.11+
- A Supabase project (Postgres) — for later phases; not required to run
  Phase 0's `/health` check and test suite
- (Later phases) Gemini API key, Google Cloud Vision service-account credentials

## 2. Setup

```bash
# 1. Create and activate a virtual environment
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET_KEY, etc.
```

## 3. Apply database migrations

Migrations live in `app/db/migrations/` as plain, version-controlled SQL
files, applied in order.

```bash
# Using the Supabase CLI (recommended):
supabase db push

# Or run the SQL directly against your Postgres instance, e.g.:
psql "$DATABASE_URL" -f app/db/migrations/0001_init.sql
```

`0001_init.sql` creates all core entities (staff, refresh_tokens, otp_codes,
kiosks, patients, question_bank, question_transitions, sessions,
queue_tokens, intake_answers, documents, ocr_results, medications,
doctor_encounters, diagnoses, audit_logs), enables Row Level Security on
every table with no permissive policies (the backend uses the Supabase
service-role key, which bypasses RLS by design — no other key should ever
be used), and documents the one schema assumption this build made (see the
comment header in that file).

## 4. Run the server

```bash
uvicorn app.main:app --reload
```

- App: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health

## 5. Run tests

```bash
pytest              # run the full suite
pytest -v           # verbose
pytest --maxfail=1  # stop on first failure
```

All 14 Phase-0 tests should pass. Tests never call paid external services;
Gemini/Vision/SMS mocking will be added alongside the phases that use them.

## 6. Lint

```bash
ruff check .            # lint
ruff check . --fix      # auto-fix what's fixable
mypy app                # optional type checking
```

---

## Project Structure

```text
app/
├── main.py                 # App wiring: FastAPI instance, CORS, exception handlers, router registration
├── api/
│   ├── dependencies.py      # Auth/RBAC dependencies (get_current_staff_user, require_role)
│   └── routers/             # One router module per domain (thin — logic lives in services)
├── core/
│   ├── config.py             # Typed Settings (env-driven)
│   ├── logging.py            # Structured, redaction-aware logging
│   ├── exceptions.py         # Domain exceptions -> standard error envelope
│   └── security.py           # Password hashing, OTP hashing, JWT issuing/verification
├── schemas/                  # Pydantic V2 request/response models (per domain)
├── repositories/              # Supabase-backed data access (one class per entity)
├── services/                  # Business logic (empty until later phases)
├── db/
│   ├── supabase.py            # Shared async Supabase client
│   └── migrations/            # Version-controlled SQL migrations
└── utils/                     # ids.py, datetime.py

tests/
├── conftest.py                # Shared fixtures (async httpx client bound to the ASGI app)
├── unit/                      # Fast, isolated tests
└── integration/                # Cross-cutting behavior (error envelope, routing)
```

**Principles:** routes stay thin; business logic lives in `services/`;
database access lives in `repositories/`; every external provider (Gemini,
Vision, SMS) sits behind a service abstraction so the rest of the app never
depends on an SDK directly.

---

## Error Response Format

All handled errors return a consistent envelope and never leak stack traces:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session does not exist."
  }
}
```

Domain-specific exception classes live in `app/core/exceptions.py`; add new
ones there rather than raising raw `HTTPException` with ad-hoc messages.

---

## Security Notes (Phase 0 baseline)

- Passwords and OTPs are hashed with bcrypt via passlib — never stored in plaintext.
- Access tokens are short-lived JWTs (`type: access`); refresh tokens are
  long-lived JWTs (`type: refresh`) — one cannot be substituted for the other.
- `require_role(...)` enforces RBAC at the dependency level; role checks are
  never left to the frontend.
- All Phase-0 tables have Row Level Security **enabled with no policies** —
  only the backend's service-role key (never exposed to any client) can read
  or write them.
- `.env` is git-ignored; `.env.example` documents every variable with placeholder values only.
- Logging redacts a fixed set of sensitive field names (passwords, OTPs, tokens, transcripts, diagnoses, OCR text) via `app/core/logging.py`'s `_RedactingFilter`.

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Project foundation (this phase) | ✅ Done |
| 1 | Question engine + Gemini router | ⏳ Not started |
| 2 | Staff OTP, kiosk sessions, queue tokens, intake API | ⏳ Not started |
| 3 | Prescription upload, OCR, medication extraction | ⏳ Not started |
| 4 | Doctor dashboard, diagnosis, FHIR R4 generation | ⏳ Not started |
| 5 | Admin CRUD (questions, staff, kiosks) | ⏳ Not started |
| 6 | Integration hardening | ⏳ Not started |
| 7 | Security review | ⏳ Not started |
| 8 | Docker + local run tooling | ⏳ Not started |
| 9 | Final acceptance test | ⏳ Not started |

See `PRD.md` for full detail on every phase.

---

## Known Limitations (Phase 0)

- `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` in `.env.example` are placeholders — a real Supabase project is required for anything beyond `/health` and the pure unit tests.
- Feature routers (`auth`, `sessions`, `intake`, `documents`, `doctor`, `fhir`, admin CRUD) are registered but intentionally empty — implemented phase-by-phase.
- The database schema in `0001_init.sql` is derived from the PRD's entity list (§19) because the canonical DDL (§13.3) was not supplied verbatim to this build. Reconcile against a canonical schema if/when one is provided.
- No Dockerfile yet — added in Phase 8.
