-- =============================================================================
-- MediKiosk — Migration 0002: Seed Data
-- =============================================================================

-- Seed Demo Staff Accounts (Password for all: 'Password123!')
-- BCrypt hash for 'Password123!'
INSERT INTO staff (id, email, password_hash, full_name, role, active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@medikiosk.local', '$2b$12$e8wF4rTz5mB0t5Vf9x9fNuVq9aP5qL8O7R3cW7Y6J8e7L2o1u2p3q', 'System Administrator', 'ADMIN', true),
    ('22222222-2222-2222-2222-222222222222', 'doctor@medikiosk.local', '$2b$12$e8wF4rTz5mB0t5Vf9x9fNuVq9aP5qL8O7R3cW7Y6J8e7L2o1u2p3q', 'Dr. Sarah Connor', 'DOCTOR', true)
ON CONFLICT (email) DO NOTHING;

-- Seed Active Demo Kiosk
INSERT INTO kiosks (id, code, location, status)
VALUES 
    ('33333333-3333-3333-3333-333333333333', 'KIOSK-MAIN-01', 'Main Reception Floor 1', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- Seed Standard Triage Question Bank
-- Node 1: Chief Complaint (Start Node)
INSERT INTO question_bank (node_id, question_text, question_type, is_start_node, is_terminal, active, metadata)
VALUES 
    ('CHIEF_COMPLAINT', 'What is the main reason for your visit today?', 'single_choice', true, false, true, '{"category": "triage"}'::jsonb),
    ('FEVER_DURATION', 'How many days have you had the fever?', 'single_choice', false, false, true, '{"category": "fever"}'::jsonb),
    ('COUGH_TYPE', 'Is your cough dry or with mucus/phlegm?', 'single_choice', false, false, true, '{"category": "respiratory"}'::jsonb),
    ('PAIN_SEVERITY', 'On a scale of 1 to 10, how severe is your pain?', 'single_choice', false, false, true, '{"category": "pain"}'::jsonb),
    ('TRIAGE_COMPLETE', 'Thank you. Your responses have been recorded for the doctor.', 'info', false, true, true, '{"category": "terminal"}'::jsonb)
ON CONFLICT (node_id) DO UPDATE 
SET question_text = EXCLUDED.question_text, is_start_node = EXCLUDED.is_start_node, is_terminal = EXCLUDED.is_terminal;

-- Seed Question Transitions
INSERT INTO question_transitions (node_id, answer_category, next_node_id)
VALUES 
    ('CHIEF_COMPLAINT', 'FEVER', 'FEVER_DURATION'),
    ('CHIEF_COMPLAINT', 'COUGH', 'COUGH_TYPE'),
    ('CHIEF_COMPLAINT', 'PAIN', 'PAIN_SEVERITY'),
    ('CHIEF_COMPLAINT', 'OTHER', 'TRIAGE_COMPLETE'),
    ('FEVER_DURATION', 'LESS_THAN_3_DAYS', 'TRIAGE_COMPLETE'),
    ('FEVER_DURATION', '3_OR_MORE_DAYS', 'TRIAGE_COMPLETE'),
    ('COUGH_TYPE', 'DRY', 'TRIAGE_COMPLETE'),
    ('COUGH_TYPE', 'PRODUCTIVE', 'TRIAGE_COMPLETE'),
    ('PAIN_SEVERITY', 'MILD', 'TRIAGE_COMPLETE'),
    ('PAIN_SEVERITY', 'MODERATE', 'TRIAGE_COMPLETE'),
    ('PAIN_SEVERITY', 'SEVERE', 'TRIAGE_COMPLETE')
ON CONFLICT (node_id, answer_category) DO NOTHING;
