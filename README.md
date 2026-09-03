# MediKiosk - AI-Powered Multimodal Clinical Intake System

**Smart India Hackathon 2026 | SIH26047**

MediKiosk is an intelligent kiosk system designed to revolutionize OPD (Outpatient Department) patient check-ins in Indian public hospitals. It uses AI-powered voice assistance, document digitization, and seamless ABDM (Ayushman Bharat Digital Mission) integration to reduce doctor workload and improve patient care.

---

## 🎯 Problem Statement

Indian tertiary government hospitals handle 4,000–10,000 patients daily, with average consultation times under 2.5 minutes. This compressed window leads to:

- **Missed comorbidities** and diagnostic errors
- **Incomplete medical histories** — 70-80% of accurate diagnosis depends on proper history-taking
- **Doctor burnout** from manual data entry
- **Paper record chaos** — old prescriptions and lab reports manually deciphered
- **Ayurveda/AYUSH bottleneck** — comprehensive intake (Ashtavidha/Dashavidha Pariksha) requires 15-25 minutes, which doesn't exist in crowded clinics

**MediKiosk's Solution:** Move history-taking and record digitization *before* the consultation, so doctors focus on diagnosis and treatment instead of data entry.

---

## 🚀 Features

### Patient Kiosk Interface
- ✅ **Voice-First Interaction** — Natural conversation in Hindi, English, Tamil, Marathi, Bengali, and Telugu
- ✅ **Zero-Typing Design** — Fully accessible for low-literacy and elderly patients
- ✅ **Smart Question Flow** — AI-driven adaptive intake using constrained LLM decision trees
- ✅ **Document Capture** — OCR-powered medication and lab value extraction from prescriptions
- ✅ **Dual Medical Systems** — Full support for both Allopathy (SOCRATES-guided HPI) and Ayurveda (Ashtavidha/Dashavidha Pariksha)
- ✅ **Accessibility** — Live bidirectional captions, high-contrast mode, adjustable text size and volume
- ✅ **Queue Token** — Instant token generation after check-in completion

### Doctor Dashboard
- ✅ **Patient Queue** — Real-time queue with priority flagging for urgent cases
- ✅ **Structured Summaries** — Clean, scannable clinical summaries (readable in under 15 seconds)
- ✅ **Medication Review** — Voice-reported + OCR-extracted medications with source verification
- ✅ **Field-Level Editing** — 1-click approve or edit-then-approve workflow
- ✅ **FHIR Generation** — Automatic HL7 FHIR R4 bundle creation on sign-off

### Admin Panel
- ✅ **Question Bank Management** — Edit and version control for intake questions
- ✅ **Staff Management** — Add/edit doctors and administrators
- ✅ **Kiosk Configuration** — Assign branch mode (Allopathy/Ayurveda) per kiosk
- ✅ **Language Settings** — Enable/disable supported languages
- ✅ **Session Monitoring** — Real-time kiosk status and session logs

---

## 🏗️ Architecture

### Tech Stack

**Frontend (Next.js 16)**
- React 19 with App Router
- TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Axios for API calls
- Lucide React for icons

**Backend (FastAPI - Separate Repository)**
- Python 3.11+
- PostgreSQL (via Supabase)
- Google Gemini (structured-output LLM routing)
- Google Cloud Vision (OCR)
- HL7 FHIR R4 (via `fhir.resources`)
- Bhashini ULCA (ASR/TTS for multilingual support)

**Database**
- PostgreSQL with Drizzle ORM
- Comprehensive schema supporting:
  - Patient sessions and queue management
  - Question bank with translations
  - Intake answers with compound-answer extraction
  - Document storage with OCR results
  - Medication extraction with confidence scoring
  - Doctor reviews and FHIR bundles

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- FastAPI backend running (see backend PRD for setup)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd medikiosk-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env.local` file:
```bash
# Database (Supabase or local PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional: Direct backend URL for server-side calls
BACKEND_URL=http://localhost:8000/api/v1
```

4. **Push database schema**
```bash
npx drizzle-kit push
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 User Flows

### Patient Kiosk Flow
1. **Idle Screen** → Rotating health tips with "START" button
2. **Language Selection** → Choose from 6 supported languages
3. **Voice Intake** → AI-guided conversation with live captions
4. **Document Capture** → Scan old prescriptions (optional)
5. **Token Display** → Queue number generated and displayed

### Doctor Flow
1. **Login** → Email/password authentication
2. **Queue Dashboard** → View waiting patients sorted by priority
3. **Patient Summary** → Review AI-compiled intake, history, medications
4. **Diagnosis Entry** → Enter diagnosis and prescription
5. **Sign-Off** → Generate FHIR R4 bundle and complete encounter

### Admin Flow
1. **Dashboard** → System statistics and recent sessions
2. **Question Bank** → Edit/version intake questions per branch
3. **Staff Management** → Add/remove doctors and admins
4. **Kiosk Configuration** → Assign branch modes and monitor status

---

## 🗂️ Project Structure

```
medikiosk-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── kiosk/              # Patient kiosk interface
│   │   ├── doctor/             # Doctor portal (login, dashboard)
│   │   ├── admin/              # Admin panel
│   │   └── api/                # API routes (proxy to FastAPI backend)
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components (buttons, etc.)
│   │   ├── kiosk/              # Kiosk-specific components
│   │   ├── doctor/             # Doctor dashboard components
│   │   └── admin/              # Admin panel components
│   ├── db/                     # Database configuration
│   │   ├── schema.ts           # Drizzle ORM schema
│   │   └── index.ts            # Database client
│   ├── lib/                    # Utilities and API client
│   │   ├── utils.ts            # Helper functions
│   │   └── api-client.ts       # Axios API client with auth
│   └── store/                  # Zustand state management
│       └── kiosk-store.ts      # Kiosk session state
├── public/                     # Static assets
├── .env.local                  # Environment variables (create this)
├── drizzle.config.json         # Drizzle ORM configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 🔑 Key Components

### Kiosk Interface
- **IdleScreen** — Screensaver with health tips and START button
- **LanguageSelector** — Large-button language selection
- **VoiceIntake** — Mic button, live captions, progress bar
- **DocumentCapture** — Camera/upload interface for prescriptions
- **TokenDisplay** — Final token with print option
- **SettingsModal** — Language, theme, text size, volume controls
- **SupportModal** — Call nurse or report technical issue

### Doctor Dashboard
- **DoctorLogin** — Email/password authentication
- **PatientQueue** — Real-time queue with urgent flagging
- **PatientSummary** — Tabbed interface (Overview, History, Ayurveda, Meds, Documents, Prescription)

### Admin Panel
- **AdminSidebar** — Navigation menu
- **AdminDashboard** — System statistics and session monitoring
- (Additional CRUD pages for questions, staff, kiosks, languages)

---

## 🔐 Authentication & Security

- **Patient/Kiosk:** No authentication required (session-based, anonymous)
- **Doctor/Admin:** JWT-based authentication with access/refresh tokens
- **Role-Based Access Control (RBAC):** Backend enforces DOCTOR and ADMIN roles
- **Session Security:** Session IDs are never reused; strict IDOR protection
- **Data Privacy:** ABDM-compliant; DPDP Act 2023 adherence

---

## 🌍 Multilingual Support

**Fully Native:**
- Hindi (हिंदी)
- English

**Via Translation Layer:**
- Tamil (தமிழ்)
- Marathi (मराठी)
- Bengali (বাংলা)
- Telugu (తెలుగు)

Auto-detection and manual switching supported. All UI text, AI questions, and voice prompts adapt to selected language.

---

## 📊 Database Schema Highlights

**Core Tables:**
- `sessions` — Kiosk sessions with status tracking (CREATED → INTAKE_IN_PROGRESS → WAITING_FOR_DOCTOR → IN_CONSULTATION → COMPLETED)
- `question_bank` — Pre-written questions with translations and FHIR mappings
- `intake_answers` — Patient responses with compound-answer pre-filling support
- `documents` — OCR'd prescription scans with extracted entities
- `medications` — Voice + OCR medications with confidence scoring
- `tokens` — Queue token management (generated once session completes)
- `doctor_reviews` — Doctor diagnosis and prescription sign-offs
- `fhir_bundles` — Generated FHIR R4 documents

---

## 🧪 Testing & Validation

### Frontend Validation
```bash
# Type checking
npm run typecheck

# Build validation
npm run build

# Linting
npm run lint
```

### Integration Testing
Run the full stack (frontend + backend) and verify:
1. Session creation and token generation
2. Voice intake flow with question progression
3. Document upload and OCR extraction
4. Doctor queue display and patient summary
5. FHIR bundle generation on sign-off

---

## 🚢 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables (Production)
- Set `DATABASE_URL` to production PostgreSQL
- Set `NEXT_PUBLIC_API_URL` to deployed FastAPI backend
- Ensure CORS is configured on backend for frontend domain

### Recommended Hosting
- **Frontend:** Vercel, Netlify, or AWS Amplify
- **Backend:** AWS EC2, Google Cloud Run, or Railway
- **Database:** Supabase, AWS RDS, or managed PostgreSQL

---

## 📈 Performance Targets

- **Kiosk Check-in:** Under 3 minutes for straightforward cases
- **Doctor Summary Review:** Readable in under 15 seconds
- **Token Generation:** Instant (under 1 second)
- **OCR Processing:** Under 5 seconds per document
- **FHIR Bundle Creation:** Under 2 seconds

---

## 🎓 Demo Credentials

### Doctor Login
```
Email: doctor@demo.com
Password: demo123
```

### Admin Login
```
Email: admin@demo.com
Password: admin123
```

*(Create these accounts via the backend staff management API during initial setup)*

---

## 🛠️ Development Tips

### Running Frontend Only (Mock Backend)
If the FastAPI backend isn't running, API calls will fail. For frontend-only development:
1. Mock the API responses in `src/lib/api-client.ts`
2. Use local state instead of real backend calls
3. Comment out the axios interceptors

### Hot Reload
Next.js supports fast refresh. Changes to components, pages, and styles update instantly without full page reload.

### Debugging
- Check browser console for API errors
- Use React DevTools to inspect component state
- Check Network tab for failed API requests
- Backend logs (FastAPI) for server-side issues

---

## 📄 License

This project is part of Smart India Hackathon 2026 and is intended for demonstration and educational purposes.

---

## 👥 Team & Support

**Contact:** SIH Team (sih26047@example.com)  
**Documentation:** See `backend-prd.md` for backend setup  
**Issues:** Report bugs via GitHub Issues  

---

## 🙏 Acknowledgments

- **ABDM (Ayushman Bharat Digital Mission)** for FHIR standards and health infrastructure
- **Google AI Studio** for Gemini API access
- **Bhashini ULCA** for multilingual ASR/TTS
- **NAMASTE Portal** for Ayurveda terminology mapping

---

**Built with ❤️ for Indian Public Healthcare**
