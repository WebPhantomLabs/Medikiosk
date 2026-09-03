# MediKiosk API Documentation

This document describes the API endpoints used by the MediKiosk frontend to communicate with the FastAPI backend.

---

## Base URL

**Development:** `http://localhost:8000/api/v1`  
**Production:** `https://your-backend-domain.com/api/v1`

---

## Authentication

### Patient/Kiosk Endpoints
- **No authentication required**
- Session-based identification using `session_id`

### Staff Endpoints (Doctor/Admin)
- **JWT Bearer Token authentication required**
- Include in headers: `Authorization: Bearer <access_token>`

---

## Endpoints

### 🔐 Authentication

#### POST `/auth/login`
Staff login (Doctor/Admin)

**Request:**
```json
{
  "email": "doctor@hospital.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Dr. Smith",
    "email": "doctor@hospital.com",
    "role": "DOCTOR"
  }
}
```

#### POST `/auth/refresh`
Refresh access token

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### POST `/auth/logout`
Logout (invalidate tokens)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/auth/me`
Get current user info

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "name": "Dr. Smith",
  "email": "doctor@hospital.com",
  "role": "DOCTOR"
}
```

---

### 📋 Session Management

#### POST `/sessions`
Create a new kiosk session

**Request:**
```json
{
  "kiosk_id": "kiosk-001",
  "patient": {
    "name": "Walk-in Patient",
    "date_of_birth": "1990-01-01",
    "sex": "unknown",
    "phone": "+91-9876543210"
  }
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "patient_id": "uuid",
  "status": "CREATED",
  "branch": "allopathy",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### PATCH `/sessions/{session_id}/settings`
Update session settings

**Request:**
```json
{
  "language": "hi",
  "theme": "light",
  "text_size": "large",
  "volume": 80
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

#### POST `/sessions/{session_id}/pause`
Pause an active session (support request)

**Response:**
```json
{
  "message": "Session paused",
  "status": "PAUSED"
}
```

---

### 💬 Intake

#### GET `/intake/question/{node_id}`
Get question text for a node

**Query Params:**
- `lang` (optional): Language code (default: `hi`)

**Response:**
```json
{
  "node_id": "q_chief_complaint",
  "question": "What problem are you facing today?",
  "question_type": "bounded_text",
  "answer_options": null
}
```

#### POST `/intake/answer`
Submit patient answer and get next question

**Request:**
```json
{
  "session_id": "uuid",
  "node_id": "q_chief_complaint",
  "transcript": "I have been experiencing chest pain for 3 days"
}
```

**Response (Next Question):**
```json
{
  "session_id": "uuid",
  "token_number": "A017",
  "answer_category": "bounded_text",
  "next": {
    "node_id": "q_chest_onset",
    "question": "When did the chest pain start?"
  },
  "pre_filled": [],
  "progress_estimate": 25,
  "completed": false
}
```

**Response (Completed):**
```json
{
  "session_id": "uuid",
  "token_number": "A017",
  "completed": true,
  "next": null,
  "progress_estimate": 100
}
```

#### GET `/intake/{session_id}/summary`
Get compiled intake summary

**Response:**
```json
{
  "session_id": "uuid",
  "chief_complaint": "Chest pain",
  "history": [
    {
      "node_id": "q_chest_onset",
      "question": "When did the chest pain start?",
      "answer": "3 days ago",
      "timestamp": "2024-01-15T10:35:00Z"
    }
  ],
  "branch": "allopathy"
}
```

---

### 📄 Documents

#### POST `/documents/upload`
Upload and OCR a document

**Request:** `multipart/form-data`
- `session_id` (query param)
- `image` (file): JPEG/PNG image

**Response:**
```json
{
  "document_id": "uuid",
  "session_id": "uuid",
  "storage_url": "https://storage.example.com/doc123.jpg",
  "status": "PROCESSING"
}
```

**Async Processing Webhook (Future):**
```json
{
  "document_id": "uuid",
  "status": "COMPLETED",
  "ocr_text": "Prescription text...",
  "extracted_entities": [
    {
      "type": "medication",
      "name": "Metformin",
      "dose": "500mg",
      "frequency": "Twice daily",
      "duration": "30 days",
      "bounding_box": {"x": 100, "y": 200, "width": 150, "height": 30},
      "confidence": 92
    }
  ]
}
```

#### GET `/documents/{session_id}`
List documents for a session

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "storage_url": "https://storage.example.com/doc123.jpg",
      "status": "COMPLETED",
      "doc_type": "prescription",
      "created_at": "2024-01-15T10:40:00Z"
    }
  ]
}
```

#### GET `/documents/{session_id}/crop`
Get cropped region of document for entity verification

**Query Params:**
- `entity_id`: ID of extracted entity

**Response:**
```json
{
  "crop_url": "https://storage.example.com/crop_abc123.jpg"
}
```

---

### 🎫 Tokens

#### POST `/token/generate`
Generate queue token for completed session

**Request:**
```json
{
  "session_id": "uuid"
}
```

**Response:**
```json
{
  "token_number": "A017",
  "session_id": "uuid",
  "status": "waiting",
  "generated_at": "2024-01-15T10:45:00Z"
}
```

#### GET `/token/{token_number}`
Get session info by token number

**Response:**
```json
{
  "token_number": "A017",
  "session_id": "uuid",
  "patient_id": "uuid",
  "status": "waiting"
}
```

---

### 🆘 Support

#### POST `/support/request`
Request support (call nurse or report fault)

**Request:**
```json
{
  "kiosk_id": "kiosk-001",
  "session_id": "uuid",
  "type": "nurse_call"
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "message": "Support request received",
  "estimated_response_time": "2-5 minutes"
}
```

---

### 👨‍⚕️ Doctor Dashboard

#### GET `/doctor/queue`
Get list of waiting patients

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "queue": [
    {
      "token_number": "A017",
      "patient_name": "Walk-in Patient",
      "status": "WAITING_FOR_DOCTOR",
      "started_at": "2024-01-15T10:30:00Z",
      "branch": "allopathy",
      "is_urgent": false
    }
  ]
}
```

#### GET `/doctor/patient/{token_number}`
Get patient summary by token

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "token_number": "A017",
  "patient": {
    "id": "uuid",
    "name": "Walk-in Patient",
    "age": 34,
    "sex": "male",
    "phone": "+91-9876543210"
  },
  "intake": {
    "chief_complaint": "Chest pain",
    "history": [...]
  },
  "medications": [
    {
      "id": "uuid",
      "name": "Metformin",
      "dose": "500mg",
      "frequency": "Twice daily",
      "duration": "30 days",
      "source": "ocr",
      "confidence": 92
    }
  ],
  "documents": [...],
  "branch": "allopathy"
}
```

#### PATCH `/doctor/patient/{token_number}/field`
Edit a specific field

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "tab": "history",
  "field": "chief_complaint",
  "value": "Severe chest pain"
}
```

**Response:**
```json
{
  "message": "Field updated successfully"
}
```

#### POST `/doctor/patient/{token_number}/signoff`
Sign off and generate FHIR bundle

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "diagnosis": "Acute upper respiratory infection",
  "prescription": "Rest, fluids, Paracetamol 500mg TID for 5 days"
}
```

**Response:**
```json
{
  "message": "Patient signed off successfully",
  "fhir_bundle_id": "uuid",
  "session_id": "uuid"
}
```

---

### 📋 FHIR

#### POST `/fhir/generate/{session_id}`
Generate FHIR R4 bundle

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "bundle_id": "uuid",
  "session_id": "uuid",
  "validated": true,
  "generated_at": "2024-01-15T11:00:00Z"
}
```

#### GET `/fhir/{session_id}`
Retrieve FHIR bundle

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "resourceType": "Bundle",
  "type": "document",
  "entry": [
    {
      "resource": {
        "resourceType": "Composition",
        "status": "final",
        ...
      }
    },
    {
      "resource": {
        "resourceType": "Patient",
        ...
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        ...
      }
    }
  ]
}
```

---

### 🔧 Admin Panel

#### GET `/admin/questions`
List all question bank nodes

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "questions": [
    {
      "node_id": "q_chief_complaint",
      "branch": "allopathy",
      "question_text": "What problem are you facing today?",
      "answer_type": "bounded_text",
      "active": true
    }
  ]
}
```

#### POST `/admin/questions`
Create new question node

**Request:**
```json
{
  "node_id": "q_new_question",
  "branch": "allopathy",
  "question_text": "How long have you had symptoms?",
  "answer_type": "multiple_choice",
  "answer_options": ["Less than 1 week", "1-2 weeks", "More than 2 weeks"],
  "next_node_map": {
    "Less than 1 week": "q_next_node_1",
    "1-2 weeks": "q_next_node_2",
    "More than 2 weeks": "q_next_node_3"
  }
}
```

#### GET `/admin/staff`
List staff members

**Response:**
```json
{
  "staff": [
    {
      "id": "uuid",
      "name": "Dr. Smith",
      "email": "doctor@hospital.com",
      "role": "DOCTOR"
    }
  ]
}
```

#### POST `/admin/staff`
Create staff account

**Request:**
```json
{
  "name": "Dr. Johnson",
  "email": "johnson@hospital.com",
  "password": "securepassword",
  "role": "DOCTOR"
}
```

#### GET `/admin/sessions`
List all sessions (paginated)

**Query Params:**
- `page` (default: 1)
- `page_size` (default: 20)

**Response:**
```json
{
  "sessions": [...],
  "total": 150,
  "page": 1,
  "page_size": 20
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "status_code": 400
}
```

### Common Error Codes
- `400` Bad Request - Invalid input
- `401` Unauthorized - Missing or invalid token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `422` Unprocessable Entity - Validation error
- `500` Internal Server Error - Server error

---

## Rate Limiting

- **Authentication endpoints:** 5 requests per minute per IP
- **General endpoints:** 60 requests per minute per user
- **Document upload:** 10 requests per minute per session

---

## Pagination

List endpoints support pagination:
- `page` (default: 1)
- `page_size` (default: 20, max: 100)

**Response includes:**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}
```

---

## Webhooks (Future)

For async document processing:
- `POST /webhooks/document-processed`
- `POST /webhooks/fhir-generated`

---

**Last Updated:** 2026  
**Version:** 1.0
