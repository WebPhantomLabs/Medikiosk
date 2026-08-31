-- =============================================================================
-- MediKiosk — Migration 0001: Initial schema
--
-- ASSUMPTION: The canonical PRD database DDL (PRD §13.3 in the original
-- specification) was not supplied verbatim to this build. This migration is
-- derived directly from the entity list in PRD §19 ("Database Core
-- Entities") and the field requirements scattered throughout the PRD
-- (sessions, queue tokens, question bank, intake, documents, doctor
-- encounters, diagnoses, audit logs). If a canonical schema is supplied
-- later, reconcile it against this migration before relying on it in
-- production.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Generic "touch updated_at" trigger, reused by every table with that column.
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- staff_role enum — the ONLY two authenticated application roles.
-- ---------------------------------------------------------------------------
do $$ begin
  create type staff_role as enum ('DOCTOR', 'ADMIN');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- staff — authenticated Doctor / Admin accounts. Patients are NEVER stored
-- here; patients have no login.
-- ---------------------------------------------------------------------------
create table if not exists staff (
    id              uuid primary key default gen_random_uuid(),
    email           text not null unique,
    password_hash   text not null,
    full_name       text not null,
    role            staff_role not null,
    active          boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create trigger trg_staff_updated_at
    before update on staff
    for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- refresh_tokens — revocable refresh-token records for staff sessions.
-- Only a hash of the token is stored, never the raw value.
-- ---------------------------------------------------------------------------
create table if not exists refresh_tokens (
    id              uuid primary key default gen_random_uuid(),
    staff_id        uuid not null references staff(id) on delete cascade,
    token_hash      text not null unique,
    expires_at      timestamptz not null,
    revoked         boolean not null default false,
    created_at      timestamptz not null default now()
);

create index if not exists idx_refresh_tokens_staff_id on refresh_tokens(staff_id);

-- ---------------------------------------------------------------------------
-- otp_codes — STAFF-ONLY demo OTP mechanism (never used for patients).
-- OTP value is hashed before persistence; TTL and attempt-limiting enforced
-- at the application layer using these fields.
-- ---------------------------------------------------------------------------
create table if not exists otp_codes (
    id              uuid primary key default gen_random_uuid(),
    staff_id        uuid not null references staff(id) on delete cascade,
    otp_hash        text not null,
    expires_at      timestamptz not null,
    attempts        integer not null default 0,
    max_attempts    integer not null default 5,
    consumed        boolean not null default false,
    created_at      timestamptz not null default now()
);

create index if not exists idx_otp_codes_staff_id on otp_codes(staff_id);

-- ---------------------------------------------------------------------------
-- kiosks — physical kiosk devices/locations.
-- ---------------------------------------------------------------------------
create table if not exists kiosks (
    id              uuid primary key default gen_random_uuid(),
    code            text not null unique,
    location        text,
    status          text not null default 'ACTIVE'
                        check (status in ('ACTIVE', 'INACTIVE')),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create trigger trg_kiosks_updated_at
    before update on kiosks
    for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- patients — NOT an authenticated identity. Created transiently per visit.
-- ---------------------------------------------------------------------------
create table if not exists patients (
    id              uuid primary key default gen_random_uuid(),
    full_name       text not null,
    date_of_birth   date,
    sex             text default 'unknown'
                        check (sex in ('male', 'female', 'other', 'unknown')),
    phone           text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create trigger trg_patients_updated_at
    before update on patients
    for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- question_bank — decision-tree nodes. The database is the sole authority
-- for valid questions/transitions; Gemini may only select among what this
-- table (and question_transitions) permits.
-- ---------------------------------------------------------------------------
create table if not exists question_bank (
    node_id         text primary key,
    question_text   text not null,
    question_type   text not null default 'single_choice',
    is_start_node   boolean not null default false,
    is_terminal     boolean not null default false,
    active          boolean not null default true,
    metadata        jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create trigger trg_question_bank_updated_at
    before update on question_bank
    for each row execute function set_updated_at();

create index if not exists idx_question_bank_active on question_bank(active);

-- ---------------------------------------------------------------------------
-- question_transitions — permitted answer_category -> next_node_id pairs
-- for a given node. This table is what Gemini's output is validated against.
-- ---------------------------------------------------------------------------
create table if not exists question_transitions (
    id              uuid primary key default gen_random_uuid(),
    node_id         text not null references question_bank(node_id) on delete cascade,
    answer_category text not null,
    next_node_id    text not null references question_bank(node_id),
    created_at      timestamptz not null default now(),
    unique (node_id, answer_category)
);

create index if not exists idx_question_transitions_node_id on question_transitions(node_id);

-- ---------------------------------------------------------------------------
-- sessions — one kiosk visit. Patients interact ONLY via session_id; no
-- login. Session state/ownership is what authorizes kiosk API access, not
-- the bare session_id string.
-- ---------------------------------------------------------------------------
create table if not exists sessions (
    id                  uuid primary key default gen_random_uuid(),
    patient_id          uuid not null references patients(id) on delete restrict,
    kiosk_id            uuid not null references kiosks(id) on delete restrict,
    status              text not null default 'CREATED'
                            check (status in (
                                'CREATED', 'INTAKE_IN_PROGRESS', 'WAITING_FOR_DOCTOR',
                                'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'
                            )),
    current_node_id     text references question_bank(node_id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create trigger trg_sessions_updated_at
    before update on sessions
    for each row execute function set_updated_at();

create index if not exists idx_sessions_kiosk_id on sessions(kiosk_id);
create index if not exists idx_sessions_status on sessions(status);

-- ---------------------------------------------------------------------------
-- queue_tokens — exactly one token per session, assigned atomically.
-- The unique constraint on session_id makes token assignment idempotent at
-- the database level: a retried "assign token" request cannot create a
-- second row for the same session. Uniqueness of the human-readable
-- token_number is scoped per kiosk.
-- ---------------------------------------------------------------------------
create table if not exists queue_tokens (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid not null unique references sessions(id) on delete cascade,
    kiosk_id        uuid not null references kiosks(id),
    token_number    text not null,
    issued_at       timestamptz not null default now(),
    unique (kiosk_id, token_number)
);

create index if not exists idx_queue_tokens_kiosk_id on queue_tokens(kiosk_id);

-- ---------------------------------------------------------------------------
-- intake_answers — one row per accepted question/answer in a session.
-- ---------------------------------------------------------------------------
create table if not exists intake_answers (
    id                  uuid primary key default gen_random_uuid(),
    session_id          uuid not null references sessions(id) on delete cascade,
    node_id             text not null references question_bank(node_id),
    transcript          text not null,
    answer_category     text not null,
    next_node_id        text references question_bank(node_id),
    sequence            integer not null,
    created_at          timestamptz not null default now(),
    unique (session_id, sequence)
);

create index if not exists idx_intake_answers_session_id on intake_answers(session_id);

-- ---------------------------------------------------------------------------
-- documents — uploaded prescriptions/medical documents.
-- ---------------------------------------------------------------------------
create table if not exists documents (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid not null references sessions(id) on delete cascade,
    file_name       text,
    mime_type       text not null,
    size_bytes      integer not null,
    storage_path    text,
    status          text not null default 'UPLOADED'
                        check (status in ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message   text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create trigger trg_documents_updated_at
    before update on documents
    for each row execute function set_updated_at();

create index if not exists idx_documents_session_id on documents(session_id);

-- ---------------------------------------------------------------------------
-- ocr_results — raw OCR text per document (transcription only, not diagnosis).
-- ---------------------------------------------------------------------------
create table if not exists ocr_results (
    id              uuid primary key default gen_random_uuid(),
    document_id     uuid not null unique references documents(id) on delete cascade,
    raw_text        text,
    created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- medications — structured extraction output. Unknown fields are NULL, never
-- fabricated. Distinct from any future doctor-confirmed medication data.
-- ---------------------------------------------------------------------------
create table if not exists medications (
    id              uuid primary key default gen_random_uuid(),
    document_id     uuid not null references documents(id) on delete cascade,
    name            text not null,
    dose            text,
    frequency       text,
    duration        text,
    created_at      timestamptz not null default now()
);

create index if not exists idx_medications_document_id on medications(document_id);

-- ---------------------------------------------------------------------------
-- doctor_encounters — a doctor's working session against a patient encounter.
-- ---------------------------------------------------------------------------
create table if not exists doctor_encounters (
    id              uuid primary key default gen_random_uuid(),
    session_id      uuid not null unique references sessions(id) on delete cascade,
    doctor_id       uuid not null references staff(id),
    status          text not null default 'IN_PROGRESS'
                        check (status in ('IN_PROGRESS', 'COMPLETED')),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create trigger trg_doctor_encounters_updated_at
    before update on doctor_encounters
    for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- diagnoses — ALWAYS doctor-entered. Never written by the LLM.
-- ---------------------------------------------------------------------------
create table if not exists diagnoses (
    id                  uuid primary key default gen_random_uuid(),
    session_id          uuid not null unique references sessions(id) on delete cascade,
    doctor_id           uuid not null references staff(id),
    diagnosis_text      text not null,
    notes               text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create trigger trg_diagnoses_updated_at
    before update on diagnoses
    for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs — staff action trail. Never stores full medical payloads.
-- ---------------------------------------------------------------------------
create table if not exists audit_logs (
    id              uuid primary key default gen_random_uuid(),
    actor_id        uuid references staff(id),
    actor_role      text,
    action          text not null,
    resource_type   text,
    resource_id     text,
    metadata        jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs(created_at);
create index if not exists idx_audit_logs_actor_id on audit_logs(actor_id);

-- =============================================================================
-- Row Level Security
--
-- All tables above are accessed exclusively through the backend using the
-- Supabase SERVICE ROLE key (never exposed to the frontend). RLS is enabled
-- with no permissive policies, so any accidental use of an anon/public key
-- is denied by default rather than silently allowed.
-- =============================================================================
alter table staff               enable row level security;
alter table refresh_tokens      enable row level security;
alter table otp_codes           enable row level security;
alter table kiosks              enable row level security;
alter table patients            enable row level security;
alter table question_bank       enable row level security;
alter table question_transitions enable row level security;
alter table sessions            enable row level security;
alter table queue_tokens        enable row level security;
alter table intake_answers      enable row level security;
alter table documents           enable row level security;
alter table ocr_results         enable row level security;
alter table medications         enable row level security;
alter table doctor_encounters   enable row level security;
alter table diagnoses           enable row level security;
alter table audit_logs          enable row level security;

-- No policies are created: with RLS enabled and zero policies, all access
-- through the anon/authenticated (non-service-role) key is denied. The
-- service role bypasses RLS by design, which is the only key this backend
-- server uses.
