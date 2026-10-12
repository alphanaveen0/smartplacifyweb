import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { query } from "../config/db.js";

const students = [
  { full_name: "Aarav Mehta", email: "aarav.mehta@gurugram.edu", phone: "+91 98765 10001", branch: "Computer Science", graduation_year: 2026, cgpa: 7.8, percentage: 82, backlogs: 1, skills: "JavaScript, React, SQL, DSA", placement_status: "SHORTLISTED" },
  { full_name: "Nisha Rao", email: "nisha.rao@gurugram.edu", phone: "+91 98765 10002", branch: "Information Technology", graduation_year: 2026, cgpa: 8.2, percentage: 86, backlogs: 0, skills: "Python, SQL, Power BI, Excel", placement_status: "APPLIED" },
  { full_name: "Kabir Sethi", email: "kabir.sethi@gurugram.edu", phone: "+91 98765 10003", branch: "Electronics", graduation_year: 2026, cgpa: 7.5, percentage: 79, backlogs: 0, skills: "Java, Spring Boot, MySQL, REST APIs", placement_status: "APPLIED" },
  { full_name: "Meera Iyer", email: "meera.iyer@gurugram.edu", phone: "+91 98765 10004", branch: "Mechanical", graduation_year: 2026, cgpa: 7.9, percentage: 81, backlogs: 0, skills: "Excel, SQL, Tableau, Communication", placement_status: "SELECTED" },
  { full_name: "Rohan Malhotra", email: "rohan.malhotra@gurugram.edu", phone: "+91 98765 10005", branch: "Business Analytics", graduation_year: 2026, cgpa: 8.1, percentage: 84, backlogs: 0, skills: "Python, Machine Learning, SQL, Statistics", placement_status: "APPLIED" },
  { full_name: "Devika Menon", email: "devika.menon@gurugram.edu", phone: "+91 98765 10006", branch: "Information Technology", graduation_year: 2027, cgpa: 8.5, percentage: 88, backlogs: 0, skills: "AWS, Linux, Docker, Kubernetes", placement_status: "INTERVIEW_SCHEDULED" },
  { full_name: "Priya Tomar", email: "priya.tomar@gurugram.edu", phone: "+91 98765 10007", branch: "Computer Science", graduation_year: 2027, cgpa: 8.4, percentage: 87, backlogs: 0, skills: "React, TypeScript, Node.js, MongoDB", placement_status: "SHORTLISTED" },
  { full_name: "Sneha Singh", email: "sneha.singh@gurugram.edu", phone: "+91 98765 10008", branch: "Electronics", graduation_year: 2026, cgpa: 7.2, percentage: 76, backlogs: 1, skills: "Python, IoT, C++, Embedded Systems", placement_status: "APPLIED" },
  { full_name: "Aditya Nair", email: "aditya.nair@gurugram.edu", phone: "+91 98765 10009", branch: "Mechanical", graduation_year: 2027, cgpa: 8.25, percentage: 85, backlogs: 0, skills: "Product Analytics, Excel, SQL, Research", placement_status: "ON_HOLD" },
  { full_name: "Ananya Sen", email: "ananya.sen@gurugram.edu", phone: "+91 98765 10010", branch: "Computer Science", graduation_year: 2026, cgpa: 8.7, percentage: 90, backlogs: 0, skills: "React, JavaScript, UI/UX, HTML, CSS", placement_status: "SHORTLISTED" },
  { full_name: "Arjun Reddy", email: "arjun.reddy@gurugram.edu", phone: "+91 98765 10011", branch: "Computer Science", graduation_year: 2026, cgpa: 8.75, percentage: 91, backlogs: 0, skills: "Node.js, Express, SQL, System Design", placement_status: "APPLIED" },
  { full_name: "Sara Khan", email: "sara.khan@gurugram.edu", phone: "+91 98765 10012", branch: "Information Technology", graduation_year: 2027, cgpa: 8.3, percentage: 86, backlogs: 0, skills: "AWS, DevOps, Python, Terraform", placement_status: "INTERVIEW_SCHEDULED" }
];

const companies = [
  { name: "TCS", email: "campus@tcs.com", phone: "+91 124 400 1100", website: "https://www.tcs.com", industry: "IT Services", location: "Bengaluru", logo: "T", verified: true },
  { name: "Accenture", email: "campus@accenture.com", phone: "+91 80 4100 2200", website: "https://www.accenture.com", industry: "Consulting", location: "Hyderabad", logo: "A", verified: true },
  { name: "Deloitte", email: "campus@deloitte.com", phone: "+91 11 4200 3300", website: "https://www.deloitte.com", industry: "Consulting", location: "Delhi NCR", logo: "D", verified: true },
  { name: "Infosys", email: "campus@infosys.com", phone: "+91 20 4300 4400", website: "https://www.infosys.com", industry: "IT Services", location: "Pune", logo: "I", verified: true },
  { name: "Wipro", email: "campus@wipro.com", phone: "+91 22 4500 5500", website: "https://www.wipro.com", industry: "IT Services", location: "Noida", logo: "W", verified: true },
  { name: "TechNova Solutions", email: "placements@technova.com", phone: "+91 124 500 1100", website: "https://technova.example", industry: "Software", location: "Gurugram", logo: "TN", verified: true },
  { name: "CloudArc Systems", email: "hiring@cloudarc.com", phone: "+91 20 500 2200", website: "https://cloudarc.example", industry: "Cloud", location: "Pune", logo: "CA", verified: true },
  { name: "PeopleFirst Labs", email: "campus@peoplefirst.com", phone: "+91 22 500 3300", website: "https://peoplefirst.example", industry: "HR Tech", location: "Mumbai", logo: "PF", verified: true },
  { name: "FinEdge Analytics", email: "campus@finedge.com", phone: "+91 80 500 4400", website: "https://finedge.example", industry: "FinTech", location: "Bengaluru", logo: "FE", verified: true },
  { name: "Northstar Consulting", email: "talent@northstar.com", phone: "+91 11 500 5500", website: "https://northstar.example", industry: "Consulting", location: "Delhi NCR", logo: "NC", verified: false }
];

const jobs = [
  { company: "campus@tcs.com", title: "Software Engineer", description: "Entry-level engineering role for Java, React and cloud application teams.", location: "Bengaluru", job_type: "Full-time", salary_package: "6 - 9 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "Java, React, Node.js, SQL", minimum_cgpa: 7.0, maximum_backlogs: 1, eligible_branches: "Computer Science, Information Technology, Electronics", graduation_year: 2026, application_deadline: "2026-11-15", openings: 120, status: "ACTIVE" },
  { company: "campus@accenture.com", title: "Frontend Developer", description: "Build responsive enterprise dashboards using React and JavaScript.", location: "Gurugram", job_type: "Full-time", salary_package: "5 - 8 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "React, JavaScript, HTML, CSS", minimum_cgpa: 7.0, maximum_backlogs: 1, eligible_branches: "Computer Science, Information Technology", graduation_year: 2026, application_deadline: "2026-11-20", openings: 65, status: "ACTIVE" },
  { company: "campus@deloitte.com", title: "Data Analyst", description: "Analytics consulting role using SQL, Python, Excel and Power BI.", location: "Hyderabad", job_type: "Full-time", salary_package: "5 - 8 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "Python, SQL, Power BI, Excel", minimum_cgpa: 7.2, maximum_backlogs: 0, eligible_branches: "Computer Science, Information Technology, Business Analytics", graduation_year: 2026, application_deadline: "2026-12-05", openings: 40, status: "ACTIVE" },
  { company: "campus@infosys.com", title: "Associate Engineer", description: "Full-stack role across Java, cloud and backend services.", location: "Pune", job_type: "Full-time", salary_package: "4 - 7 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "Java, React, AWS", minimum_cgpa: 6.8, maximum_backlogs: 1, eligible_branches: "Computer Science, Information Technology, Electronics", graduation_year: 2026, application_deadline: "2026-12-12", openings: 85, status: "ACTIVE" },
  { company: "placements@technova.com", title: "Frontend Engineer", description: "React frontend role for placement portal products.", location: "Gurugram", job_type: "Full-time", salary_package: "12 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "React, JavaScript, CSS", minimum_cgpa: 7.5, maximum_backlogs: 0, eligible_branches: "Computer Science, Information Technology", graduation_year: 2026, application_deadline: "2026-11-18", openings: 6, status: "ACTIVE" },
  { company: "placements@technova.com", title: "Backend Engineer", description: "Node.js API engineering role for SaaS dashboards.", location: "Hybrid", job_type: "Full-time", salary_package: "13 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "Node.js, SQL, JavaScript", minimum_cgpa: 8.0, maximum_backlogs: 0, eligible_branches: "Computer Science, Information Technology", graduation_year: 2026, application_deadline: "2026-12-08", openings: 3, status: "ACTIVE" },
  { company: "hiring@cloudarc.com", title: "DevOps Trainee", description: "Cloud operations and SRE trainee role.", location: "Pune", job_type: "Full-time", salary_package: "9.5 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "Linux, AWS, Python, Docker", minimum_cgpa: 7.2, maximum_backlogs: 1, eligible_branches: "Computer Science, Information Technology", graduation_year: 2027, application_deadline: "2026-12-12", openings: 4, status: "ACTIVE" },
  { company: "campus@finedge.com", title: "Business Analyst", description: "FinTech analytics role for data-driven product teams.", location: "Bengaluru", job_type: "Full-time", salary_package: "8.5 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "SQL, Excel, Communication, Analytics", minimum_cgpa: 7.0, maximum_backlogs: 0, eligible_branches: "Business Analytics, Computer Science, Information Technology", graduation_year: 2026, application_deadline: "2026-11-25", openings: 12, status: "ACTIVE" },
  { company: "campus@peoplefirst.com", title: "Product Associate", description: "Product operations role for HR SaaS workflows.", location: "Mumbai", job_type: "Internship", salary_package: "₹35,000/month", experience: "Internship", experience_years: 0, required_skills: "Product Analytics, Research, SQL", minimum_cgpa: 7.0, maximum_backlogs: 1, eligible_branches: "Computer Science, Business Analytics, Mechanical", graduation_year: 2027, application_deadline: "2026-11-30", openings: 10, status: "ACTIVE" },
  { company: "talent@northstar.com", title: "Consulting Analyst", description: "Business consulting role with data and presentation ownership.", location: "Delhi NCR", job_type: "Full-time", salary_package: "7.5 LPA", experience: "Fresher eligible", experience_years: 0, required_skills: "Excel, SQL, Communication, Research", minimum_cgpa: 7.4, maximum_backlogs: 0, eligible_branches: "Business Analytics, Computer Science, Mechanical", graduation_year: 2026, application_deadline: "2026-12-02", openings: 15, status: "ACTIVE" }
];

const applications = [
  ["aarav.mehta@gurugram.edu", "Frontend Engineer", "SHORTLISTED", 95, "2026-10-05"],
  ["nisha.rao@gurugram.edu", "Data Analyst", "APPLIED", 83, "2026-10-03"],
  ["kabir.sethi@gurugram.edu", "Software Engineer", "APPLIED", 79, "2026-10-04"],
  ["meera.iyer@gurugram.edu", "Business Analyst", "SELECTED", 91, "2026-09-26"],
  ["rohan.malhotra@gurugram.edu", "Data Analyst", "SHORTLISTED", 88, "2026-10-02"],
  ["devika.menon@gurugram.edu", "DevOps Trainee", "INTERVIEW_SCHEDULED", 89, "2026-09-28"],
  ["priya.tomar@gurugram.edu", "Frontend Developer", "SHORTLISTED", 92, "2026-10-01"],
  ["sneha.singh@gurugram.edu", "Associate Engineer", "ON_HOLD", 72, "2026-10-06"],
  ["aditya.nair@gurugram.edu", "Product Associate", "APPLIED", 84, "2026-10-03"],
  ["ananya.sen@gurugram.edu", "Frontend Developer", "SHORTLISTED", 94, "2026-10-02"],
  ["arjun.reddy@gurugram.edu", "Backend Engineer", "APPLIED", 93, "2026-10-04"],
  ["sara.khan@gurugram.edu", "DevOps Trainee", "INTERVIEW_SCHEDULED", 90, "2026-09-29"],
  ["aarav.mehta@gurugram.edu", "Software Engineer", "APPLIED", 81, "2026-10-06"],
  ["nisha.rao@gurugram.edu", "Business Analyst", "SHORTLISTED", 86, "2026-10-07"],
  ["kabir.sethi@gurugram.edu", "Associate Engineer", "REJECTED", 68, "2026-10-01"],
  ["meera.iyer@gurugram.edu", "Consulting Analyst", "SELECTED", 90, "2026-09-30"]
];

const interviews = [
  ["aarav.mehta@gurugram.edu", "Frontend Engineer", "2026-10-14", "10:00", "Online", "Technical Round", "SCHEDULED"],
  ["devika.menon@gurugram.edu", "DevOps Trainee", "2026-10-16", "14:00", "Online", "SRE Fundamentals", "SCHEDULED"],
  ["sara.khan@gurugram.edu", "DevOps Trainee", "2026-10-18", "11:00", "Offline", "Cloud Operations Round", "SCHEDULED"],
  ["priya.tomar@gurugram.edu", "Frontend Developer", "2026-10-20", "15:00", "Online", "React Coding Round", "SCHEDULED"],
  ["meera.iyer@gurugram.edu", "Business Analyst", "2026-10-08", "12:00", "Hybrid", "Final HR Round", "COMPLETED"]
];

async function upsertStudent(student, index) {
  const college_roll_no = `SP${student.graduation_year}${String(index + 1).padStart(3, "0")}`;
  const resume_name = `${student.full_name.replace(/\s+/g, "_")}_Resume.pdf`;
  await query(
    `INSERT INTO students (full_name, email, phone, college_roll_no, college, course, branch, graduation_year, cgpa, percentage, backlogs, skills, certifications, projects, experience, placement_status, resume_name, resume_updated_at)
     VALUES (:full_name, :email, :phone, :college_roll_no, 'Gurugram University', 'B.Tech', :branch, :graduation_year, :cgpa, :percentage, :backlogs, :skills, 'AWS Cloud Practitioner, SQL Advanced', 'Placement analytics dashboard, Portfolio website', 'Fresher', :placement_status, :resume_name, CURRENT_DATE)
     ON CONFLICT (email) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       college_roll_no = EXCLUDED.college_roll_no,
       branch = EXCLUDED.branch,
       graduation_year = EXCLUDED.graduation_year,
       cgpa = EXCLUDED.cgpa,
       percentage = EXCLUDED.percentage,
       backlogs = EXCLUDED.backlogs,
       skills = EXCLUDED.skills,
       placement_status = EXCLUDED.placement_status,
       resume_name = EXCLUDED.resume_name,
       resume_updated_at = EXCLUDED.resume_updated_at,
       updated_at = NOW()`,
    { ...student, college_roll_no, resume_name }
  );
}

async function upsertCompany(company) {
  const description = `${company.name} is an active SmartPlacify campus hiring partner.`;
  await query(
    `INSERT INTO companies (name, email, phone, website, industry, location, description, logo, verified)
     VALUES (:name, :email, :phone, :website, :industry, :location, :description, :logo, :verified)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       phone = EXCLUDED.phone,
       website = EXCLUDED.website,
       industry = EXCLUDED.industry,
       location = EXCLUDED.location,
       description = EXCLUDED.description,
       logo = EXCLUDED.logo,
       verified = EXCLUDED.verified,
       updated_at = NOW()`,
    { ...company, description }
  );
}

async function upsertJob(job, companyId) {
  await query(
    `INSERT INTO jobs (company_id, title, description, location, job_type, salary_package, experience, experience_years, required_skills, minimum_cgpa, maximum_backlogs, eligible_branches, graduation_year, application_deadline, openings, status)
     VALUES (:company_id, :title, :description, :location, :job_type, :salary_package, :experience, :experience_years, :required_skills, :minimum_cgpa, :maximum_backlogs, :eligible_branches, :graduation_year, :application_deadline, :openings, :status)
     ON CONFLICT (company_id, title) DO UPDATE SET
       description = EXCLUDED.description,
       location = EXCLUDED.location,
       job_type = EXCLUDED.job_type,
       salary_package = EXCLUDED.salary_package,
       experience = EXCLUDED.experience,
       experience_years = EXCLUDED.experience_years,
       required_skills = EXCLUDED.required_skills,
       minimum_cgpa = EXCLUDED.minimum_cgpa,
       maximum_backlogs = EXCLUDED.maximum_backlogs,
       eligible_branches = EXCLUDED.eligible_branches,
       graduation_year = EXCLUDED.graduation_year,
       application_deadline = EXCLUDED.application_deadline,
       openings = EXCLUDED.openings,
       status = EXCLUDED.status,
       updated_at = NOW()`,
    { ...job, company_id: companyId }
  );
}

async function seedUsers(passwordHash, studentByEmail, companyByEmail) {
  const users = [
    { name: "Dr. Anjali Sharma", email: "admin@test.com", phone: "+91 98765 43210", role: "tpo", student_id: null, company_id: null },
    { name: "Aarav Mehta", email: "student@test.com", phone: "+91 98765 43211", role: "student", student_id: studentByEmail.get("aarav.mehta@gurugram.edu")?.id, company_id: null },
    { name: "Priya Kapoor", email: "company@test.com", phone: "+91 98765 43212", role: "company", student_id: null, company_id: companyByEmail.get("placements@technova.com")?.id }
  ];

  for (const user of users) {
    await query(
      `INSERT INTO users (name, email, phone, password_hash, role, student_id, company_id)
       VALUES (:name, :email, :phone, :passwordHash, :role, :student_id, :company_id)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         student_id = EXCLUDED.student_id,
         company_id = EXCLUDED.company_id,
         is_active = TRUE,
         updated_at = NOW()`,
      { ...user, passwordHash }
    );
  }
}

async function seedApplications(studentByEmail, jobByTitle) {
  for (const [studentEmail, jobTitle, status, eligibility_score, applied_at] of applications) {
    const student = studentByEmail.get(studentEmail);
    const job = jobByTitle.get(jobTitle);
    if (!student || !job) continue;
    await query(
      `INSERT INTO applications (student_id, job_id, status, eligibility_score, applied_at, result, package_offered)
       VALUES (:student_id, :job_id, :status, :eligibility_score, :applied_at, :result, :package_offered)
       ON CONFLICT (student_id, job_id) DO UPDATE SET
         status = EXCLUDED.status,
         eligibility_score = EXCLUDED.eligibility_score,
         applied_at = EXCLUDED.applied_at,
         result = EXCLUDED.result,
         package_offered = EXCLUDED.package_offered,
         updated_at = NOW()`,
      {
        student_id: student.id,
        job_id: job.id,
        status,
        eligibility_score,
        applied_at,
        result: status === "SELECTED" ? "Offer Released" : null,
        package_offered: status === "SELECTED" ? job.salary_package : null
      }
    );
  }
}

async function seedInterviews(studentByEmail, jobByTitle) {
  for (const [studentEmail, jobTitle, interview_date, interview_time, mode, round_name, status] of interviews) {
    const student = studentByEmail.get(studentEmail);
    const job = jobByTitle.get(jobTitle);
    if (!student || !job) continue;
    const [application] = await query("SELECT id FROM applications WHERE student_id = :student_id AND job_id = :job_id", { student_id: student.id, job_id: job.id });
    if (!application) continue;
    await query(
      `INSERT INTO interviews (application_id, student_id, company_id, job_id, interview_date, interview_time, mode, location_or_link, round_name, status, notes)
       VALUES (:application_id, :student_id, :company_id, :job_id, :interview_date, :interview_time, :mode, :location_or_link, :round_name, :status, :notes)
       ON CONFLICT (application_id, round_name) DO UPDATE SET
         interview_date = EXCLUDED.interview_date,
         interview_time = EXCLUDED.interview_time,
         mode = EXCLUDED.mode,
         location_or_link = EXCLUDED.location_or_link,
         status = EXCLUDED.status,
         notes = EXCLUDED.notes,
         updated_at = NOW()`,
      {
        application_id: application.id,
        student_id: student.id,
        company_id: job.company_id,
        job_id: job.id,
        interview_date,
        interview_time,
        mode,
        location_or_link: mode === "Online" ? `https://meet.smartplacify.local/${application.id}` : job.location,
        round_name,
        status,
        notes: `Prepare for ${round_name} with company-specific questions.`
      }
    );
  }
}

async function seedNotifications() {
  const notifications = [
    ["all", "Welcome to SmartPlacify", "Your backend database is ready with realistic placement data.", "Announcement"],
    ["student", "New job matches available", "Several active jobs now match your skills and eligibility.", "Jobs"],
    ["tpo", "Placement funnel updated", "Applications, interviews, and selections have been refreshed.", "Analytics"],
    ["company", "Candidate pipeline ready", "Shortlisted candidates are available for review.", "Hiring"]
  ];

  for (const [role, title, message, type] of notifications) {
    await query(
      `INSERT INTO notifications (role, title, message, type, is_read)
       SELECT :role, :title, :message, :type, FALSE
       WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = :title AND role = :role)`,
      { role, title, message, type }
    );
  }
}

async function getRowsByEmail(table) {
  const rows = await query(`SELECT * FROM ${table}`);
  return new Map(rows.map((row) => [row.email, row]));
}

async function seed() {
  const passwordHash = await bcrypt.hash("password123", env.bcryptRounds);

  for (const [index, student] of students.entries()) {
    await upsertStudent(student, index);
  }

  for (const company of companies) {
    await upsertCompany(company);
  }

  const companyByEmail = await getRowsByEmail("companies");
  for (const job of jobs) {
    const company = companyByEmail.get(job.company);
    if (company) await upsertJob(job, company.id);
  }

  const studentByEmail = await getRowsByEmail("students");
  const jobRows = await query("SELECT * FROM jobs");
  const jobByTitle = new Map(jobRows.map((job) => [job.title, job]));

  await seedUsers(passwordHash, studentByEmail, companyByEmail);
  await seedApplications(studentByEmail, jobByTitle);
  await seedInterviews(studentByEmail, jobByTitle);
  await seedNotifications();

  console.log("Database seed completed with realistic SmartPlacify data.");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
