CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  college_roll_no VARCHAR(80) UNIQUE,
  phone VARCHAR(40),
  college VARCHAR(160) DEFAULT 'Gurugram University',
  course VARCHAR(100),
  branch VARCHAR(120),
  graduation_year INT,
  cgpa NUMERIC(4,2) DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  backlogs INT DEFAULT 0,
  skills TEXT,
  certifications TEXT,
  projects TEXT,
  experience VARCHAR(255),
  placement_status VARCHAR(40) DEFAULT 'PROFILE_PENDING',
  resume_name VARCHAR(255),
  resume_path VARCHAR(500),
  resume_updated_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_branch ON students (branch);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students (college_roll_no);
CREATE INDEX IF NOT EXISTS idx_students_status ON students (placement_status);

CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(40),
  website VARCHAR(255),
  industry VARCHAR(120),
  location VARCHAR(160),
  description TEXT,
  logo VARCHAR(20),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies (verified);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies (industry);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(40) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','company','tpo')),
  student_id BIGINT NULL,
  company_id BIGINT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(160),
  phone VARCHAR(40) NOT NULL,
  purpose VARCHAR(40) NOT NULL DEFAULT 'register',
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  verified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS email VARCHAR(160);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_verifications (phone, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_verifications (email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications (expires_at);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(160),
  job_type VARCHAR(80) DEFAULT 'Full-time',
  salary_package VARCHAR(80),
  experience VARCHAR(160),
  experience_years INT DEFAULT 0,
  required_skills TEXT,
  minimum_cgpa NUMERIC(4,2) DEFAULT 0,
  maximum_backlogs INT DEFAULT 0,
  eligible_branches TEXT,
  graduation_year INT,
  application_deadline DATE,
  openings INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED','DRAFT')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT uq_jobs_company_title UNIQUE (company_id, title)
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_status ON jobs (company_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs (application_deadline);

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  job_id BIGINT NOT NULL,
  status VARCHAR(30) DEFAULT 'APPLIED' CHECK (status IN ('APPLIED','SHORTLISTED','INTERVIEW_SCHEDULED','SELECTED','REJECTED','ON_HOLD')),
  eligibility_score INT DEFAULT 0,
  applied_at DATE NOT NULL,
  result VARCHAR(80),
  package_offered VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_applications_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT uq_application_student_job UNIQUE (student_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications (applied_at);

CREATE TABLE IF NOT EXISTS interviews (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  company_id BIGINT NOT NULL,
  job_id BIGINT NOT NULL,
  interview_date DATE NOT NULL,
  interview_time TIME NOT NULL,
  mode VARCHAR(20) DEFAULT 'Online' CHECK (mode IN ('Online','Offline','Hybrid')),
  location_or_link VARCHAR(500),
  round_name VARCHAR(160),
  status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_interviews_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT uq_interviews_application_round UNIQUE (application_id, round_name)
);

CREATE INDEX IF NOT EXISTS idx_interviews_status_date ON interviews (status, interview_date);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  role VARCHAR(20) DEFAULT 'all' CHECK (role IN ('all','student','company','tpo')),
  user_id BIGINT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(80) DEFAULT 'Announcement',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_role_read ON notifications (role, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
