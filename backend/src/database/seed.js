import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { query } from "../config/db.js";

const students = [
  ["Aarav Mehta", "aarav.mehta@gurugram.edu", "Computer Science", 2026, 8.8, 0, "React, JavaScript, SQL, DSA", "SHORTLISTED"],
  ["Sara Khan", "sara.khan@gurugram.edu", "Information Technology", 2027, 8.2, 0, "AWS, Linux, Python", "APPLIED"],
  ["Devika Menon", "devika.menon@gurugram.edu", "Computer Science", 2026, 7.7, 0, "Docker, Kubernetes, Python", "APPLIED"],
  ["Meera Iyer", "meera.iyer@gurugram.edu", "Business Analytics", 2027, 8.5, 0, "Excel, SQL, Communication", "SELECTED"],
  ["Sanya Sharma", "sanya.sharma@gurugram.edu", "Information Technology", 2026, 8.1, 0, "Node.js, React, SQL", "INTERVIEW_SCHEDULED"],
  ["Nisha Rao", "nisha.rao@gurugram.edu", "Computer Science", 2027, 7.4, 1, "Python, Power BI, SQL", "APPLIED"]
];

const companies = [
  ["TechNova Solutions", "placements@technova.com", "Software", "Gurugram", "TN", true],
  ["CloudArc Systems", "hiring@cloudarc.com", "Cloud", "Pune", "CA", true],
  ["Northstar Consulting", "talent@northstar.com", "Consulting", "Delhi NCR", "NC", false],
  ["FinEdge Analytics", "campus@finedge.com", "FinTech", "Bengaluru", "FE", true],
  ["PeopleFirst Labs", "campus@peoplefirst.com", "HR Tech", "Mumbai", "PF", true]
];

async function insertIgnore(sql, params) {
  await query(sql, params);
}

async function seed() {
  const passwordHash = await bcrypt.hash("password123", env.bcryptRounds);

  for (const [full_name, email, branch, graduation_year, cgpa, backlogs, skills, placement_status] of students) {
    const college_roll_no = `SP${graduation_year}${String(students.findIndex((student) => student[1] === email) + 1).padStart(3, "0")}`;
    await insertIgnore(
      `INSERT IGNORE INTO students (full_name, email, college_roll_no, college, course, branch, graduation_year, cgpa, percentage, backlogs, skills, certifications, projects, experience, placement_status, resume_name, resume_updated_at)
       VALUES (:full_name, :email, :college_roll_no, 'Gurugram University', 'B.Tech', :branch, :graduation_year, :cgpa, 82, :backlogs, :skills, 'AWS Cloud Practitioner', 'Placement analytics dashboard', 'Fresher', :placement_status, CONCAT(REPLACE(:full_name, ' ', '_'), '_Resume.pdf'), CURRENT_DATE)`,
      { full_name, email, college_roll_no, branch, graduation_year, cgpa, backlogs, skills, placement_status }
    );
  }

  for (const [name, email, industry, location, logo, verified] of companies) {
    await insertIgnore(
      `INSERT IGNORE INTO companies (name, email, phone, website, industry, location, description, logo, verified)
       VALUES (:name, :email, '+91 98765 43210', 'https://example.com', :industry, :location, CONCAT(:name, ' campus hiring partner.'), :logo, :verified)`,
      { name, email, industry, location, logo, verified }
    );
  }

  const [aarav] = await query("SELECT id FROM students WHERE email = 'aarav.mehta@gurugram.edu'");
  const [technova] = await query("SELECT id FROM companies WHERE email = 'placements@technova.com'");
  const [cloudarc] = await query("SELECT id FROM companies WHERE email = 'hiring@cloudarc.com'");

  await insertIgnore(
    `INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
     ('Dr. Anjali Sharma', 'admin@test.com', :passwordHash, 'tpo')`,
    { passwordHash }
  );
  await insertIgnore(
    `INSERT IGNORE INTO users (name, email, password_hash, role, student_id) VALUES
     ('Aarav Mehta', 'student@test.com', :passwordHash, 'student', :student_id)`,
    { passwordHash, student_id: aarav.id }
  );
  await insertIgnore(
    `INSERT IGNORE INTO users (name, email, password_hash, role, company_id) VALUES
     ('Priya Kapoor', 'company@test.com', :passwordHash, 'company', :company_id)`,
    { passwordHash, company_id: technova.id }
  );

  const jobs = [
    [technova.id, "Frontend Engineer", "React frontend role for placement portal products.", "Gurugram", "Full-time", "12 LPA", "Fresher eligible", 0, "React, JavaScript, CSS", 7.5, 0, "Computer Science, Information Technology", 2026, "2026-11-18", 6, "ACTIVE"],
    [cloudarc.id, "DevOps Trainee", "Cloud operations and SRE trainee role.", "Pune", "Full-time", "9.5 LPA", "Fresher eligible", 0, "Linux, AWS, Python", 7.2, 1, "Computer Science, Information Technology", 2027, "2026-12-12", 4, "ACTIVE"],
    [technova.id, "Backend Engineer", "Node.js API engineering role.", "Hybrid", "13 LPA", "Fresher eligible", 0, "Node.js, SQL, JavaScript", 8, 0, "Computer Science, Information Technology", 2026, "2026-12-08", 3, "CLOSED"]
  ];

  for (const job of jobs) {
    await insertIgnore(
      `INSERT IGNORE INTO jobs (company_id, title, description, location, job_type, salary_package, experience, experience_years, required_skills, minimum_cgpa, maximum_backlogs, eligible_branches, graduation_year, application_deadline, openings, status)
       VALUES (:company_id, :title, :description, :location, :job_type, :salary_package, :experience, :experience_years, :required_skills, :minimum_cgpa, :maximum_backlogs, :eligible_branches, :graduation_year, :application_deadline, :openings, :status)`,
      {
        company_id: job[0], title: job[1], description: job[2], location: job[3], job_type: job[4], salary_package: job[5],
        experience: job[6], experience_years: job[7], required_skills: job[8], minimum_cgpa: job[9], maximum_backlogs: job[10],
        eligible_branches: job[11], graduation_year: job[12], application_deadline: job[13], openings: job[14], status: job[15]
      }
    );
  }

  const [frontendJob] = await query("SELECT id, company_id FROM jobs WHERE title = 'Frontend Engineer' LIMIT 1");
  await insertIgnore(
    `INSERT IGNORE INTO applications (student_id, job_id, status, eligibility_score, applied_at)
     VALUES (:student_id, :job_id, 'SHORTLISTED', 95, CURRENT_DATE)`,
    { student_id: aarav.id, job_id: frontendJob.id }
  );
  const [application] = await query("SELECT id FROM applications WHERE student_id = :student_id AND job_id = :job_id", { student_id: aarav.id, job_id: frontendJob.id });
  await insertIgnore(
    `INSERT IGNORE INTO interviews (application_id, student_id, company_id, job_id, interview_date, interview_time, mode, location_or_link, round_name, status, notes)
     VALUES (:application_id, :student_id, :company_id, :job_id, '2026-10-14', '10:30', 'Online', 'https://meet.example/technova-aarav', 'Technical Round', 'SCHEDULED', 'Prepare project walkthrough.')`,
    { application_id: application.id, student_id: aarav.id, company_id: frontendJob.company_id, job_id: frontendJob.id }
  );
  await insertIgnore(
    `INSERT INTO notifications (role, title, message, type, is_read)
     SELECT 'all', 'Welcome to SmartPlacify', 'Your backend database is ready.', 'Announcement', FALSE
     WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Welcome to SmartPlacify')`,
    {}
  );

  console.log("Database seed completed.");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
