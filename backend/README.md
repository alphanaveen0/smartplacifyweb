# SmartPlacify Backend

Production-style Express + Supabase Postgres backend for the existing SmartPlacify frontend.

## Folder Structure

```txt
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── uploads/
├── .env
├── .env.example
├── .gitignore
└── package.json
```

## Database Tables

- `users`: authentication, role, linked `student_id`/`company_id`
- `students`: student profile, academic data, skills, resume metadata
- `companies`: employer profile and verification state
- `jobs`: job posts, eligibility criteria, deadline, status
- `applications`: student/job applications with unique `(student_id, job_id)`
- `interviews`: scheduled rounds linked to application/student/company/job
- `notifications`: role/user-targeted notifications
- `otp_verifications`: hashed signup OTP attempts and expiry state

## API Endpoints

All frontend endpoints are available under `/api` and also at root for compatibility.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/forgot-password`
- `GET|POST /api/students`
- `GET|PUT|DELETE /api/students/:id`
- `POST /api/students/:id/resume`
- `GET|POST /api/companies`
- `GET|PUT|DELETE /api/companies/:id`
- `GET|POST /api/jobs`
- `GET|PUT|DELETE /api/jobs/:id`
- `GET /api/jobs/:jobId/eligibility/:studentId`
- `GET|POST /api/applications`
- `PUT /api/applications/:id`
- `GET|POST /api/interviews`
- `PUT|DELETE /api/interviews/:id`
- `GET|POST /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `GET /api/dashboard/:role`
- `GET /api/reports/summary`
- `POST /api/ai/chat`
- `POST /api/ai/resume-check`
- `POST /api/smart-ai/insights`
- `POST /api/smart-ai/ask`
- `GET /api/smart-ai/student-insights`
- `GET /api/smart-ai/job-matches`
- `GET /api/smart-ai/placement-risk`
- `POST /api/smart-ai/candidate-matches`
- `GET /api/smart-ai/report-insights`
- `POST /api/smart-ai/interview-preparation`

## Required Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:8000,http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_supabase_database_password
DB_NAME=postgres
DB_SSL=true
DB_POOL_MAX=10
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
OTP_EXPIRES_MINUTES=10
OTP_DEV_RESPONSE=true
BCRYPT_ROUNDS=12
UPLOAD_DIR=uploads/resumes
MAX_UPLOAD_MB=5
```

Frontend real API mode:

```env
VITE_API_URL=http://localhost:4000/api
VITE_USE_MOCKS=false
```

## Installation

```bash
cd backend
npm install
```

## Database Setup

```bash
cd backend
npm run db:migrate
npm run db:seed
```

The seed script loads realistic portfolio/demo data:

- 12 student profiles with roll numbers, skills, CGPA, backlogs, resumes, and placement status
- 10 hiring companies with verified profiles and contact details
- 10 active jobs across software, analytics, cloud, consulting, and product roles
- 16 real-looking applications with eligibility scores and statuses
- 5 interview schedules with rounds, dates, modes, and notes
- Role-specific notifications and three login accounts

## Run Backend

```bash
cd backend
npm run dev
```

or:

```bash
npm start
```

## Test Credentials

All seeded accounts use `password123`.

- TPO/Admin: `admin@test.com`
- Student: `student@test.com`
- Company: `company@test.com`

Signup OTP in local/dev mode:

- If `OTP_DEV_RESPONSE=true`, the API response includes `devOtp`.
- In frontend mock mode, use OTP `123456`.
- In production, set `OTP_DEV_RESPONSE=false` and configure a real provider such as Brevo/Twilio/TextBee.

## Completed

- JWT auth and role-based authorization
- bcrypt password hashing
- Supabase Postgres schema with constraints, indexes, and relationships
- Students, companies, jobs, applications, interviews, notifications
- Duplicate application prevention at DB and API level
- Eligibility checking
- Resume upload storage
- Dashboard and report data
- Search/filter/sort/pagination response shape for existing frontend
- Smart AI backend endpoints backed by live Postgres placement data
- Role-aware Smart AI responses for students, TPO/admins, and companies
- Signup mobile OTP verification with hashed OTP storage

## Remaining Limitations

- Python AI service is intentionally not implemented yet; Smart AI currently uses backend heuristics over verified database records.
- Real SMS/email provider credentials are not configured yet; OTP currently supports console/dev delivery until Brevo/Twilio/TextBee is connected.
- Email delivery for forgot password is a placeholder response.
