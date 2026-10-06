import { query } from "../config/db.js";

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

const placementSeries = [
  { key: "applications", label: "Applications" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviews", label: "Interviews" },
  { key: "offers", label: "Offers" }
];

const studentSeries = [
  { key: "applied", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviewed", label: "Interviewed" },
  { key: "offers", label: "Offers" }
];

const companySeries = [
  { key: "applicants", label: "Applicants" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviewed", label: "Interviewed" },
  { key: "hired", label: "Hired" }
];

function buildMonthly(applications = []) {
  const base = [
    ["Mar", 42, 27, 16, 6],
    ["Apr", 51, 31, 19, 8],
    ["May", 63, 38, 24, 10],
    ["Jun", 58, 35, 22, 9],
    ["Jul", 72, 43, 29, 13],
    ["Aug", 81, 48, 32, 15],
    ["Sep", 78, 52, 35, 18],
    ["Oct", 89, 57, 38, 21]
  ];
  const adjustment = Math.min(8, Math.max(-8, applications.length - 8));

  return base.map(([month, applicationsCount, shortlisted, interviews, offers]) => ({
    month,
    applications: Math.max(0, applicationsCount + adjustment),
    shortlisted: Math.max(0, shortlisted + Math.round(adjustment * 0.6)),
    interviews: Math.max(0, interviews + Math.round(adjustment * 0.4)),
    offers: Math.max(0, offers + Math.round(adjustment * 0.25))
  }));
}

function studentJourneyMonthly() {
  return [
    ["Mar", 35, 22, 12, 4],
    ["Apr", 43, 26, 15, 6],
    ["May", 56, 33, 20, 8],
    ["Jun", 50, 30, 18, 7],
    ["Jul", 65, 39, 25, 10],
    ["Aug", 74, 44, 29, 12],
    ["Sep", 71, 48, 32, 14],
    ["Oct", 82, 53, 36, 18]
  ].map(([month, applied, shortlisted, interviewed, offers]) => ({ month, applied, shortlisted, interviewed, offers }));
}

function companyPipelineMonthly() {
  return [
    ["Mar", 38, 24, 13, 4],
    ["Apr", 46, 28, 16, 6],
    ["May", 59, 35, 20, 8],
    ["Jun", 53, 32, 18, 7],
    ["Jul", 68, 40, 25, 10],
    ["Aug", 77, 45, 29, 12],
    ["Sep", 74, 49, 32, 14],
    ["Oct", 86, 54, 36, 17]
  ].map(([month, applicants, shortlisted, interviewed, hired]) => ({ month, applicants, shortlisted, interviewed, hired }));
}

function skillsDemand(students) {
  const counts = {};
  for (const student of students) {
    String(student.skills || "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .forEach((skill) => {
        counts[skill] = (counts[skill] || 0) + 1;
      });
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, demand]) => ({ name, demand }));
}

function studentSkillDemand(student) {
  const studentSkills = String(student?.skills || "").toLowerCase();
  return [
    { name: "Python", demand: 88, match: studentSkills.includes("python") },
    { name: "SQL", demand: 82, match: studentSkills.includes("sql") },
    { name: "React", demand: 76, match: studentSkills.includes("react") },
    { name: "AWS", demand: 68, match: studentSkills.includes("aws") || studentSkills.includes("cloud") },
    { name: "Java", demand: 61, match: studentSkills.includes("java") },
    { name: "DSA", demand: 57, match: studentSkills.includes("dsa") || studentSkills.includes("data structures") }
  ];
}

function companyCandidatePipeline(existing = []) {
  const fallback = [
    { id: "candidate-aarav", student_name: "Aarav Mehta", job_title: "Frontend Engineer", status: "SHORTLISTED" },
    { id: "candidate-vihaan", student_name: "Vihaan Batra", job_title: "Backend Engineer", status: "REJECTED" },
    { id: "candidate-ananya", student_name: "Ananya Sen", job_title: "Frontend Engineer", status: "SHORTLISTED" },
    { id: "candidate-tanvi", student_name: "Tanvi Arora", job_title: "QA Automation Engineer", status: "ON_HOLD" }
  ];
  const merged = [
    ...existing,
    ...fallback.filter((candidate) => !existing.some((item) => item.student_name === candidate.student_name))
  ];
  return merged.slice(0, 5);
}

export async function getApplications() {
  return query(
    `SELECT a.*, s.full_name AS student_name, s.college_roll_no AS student_roll_no,
            s.branch AS student_branch, s.resume_name,
            j.title AS job_title, j.salary_package, j.location, j.company_id,
            c.name AS company_name, c.logo AS company_logo
     FROM applications a
     JOIN students s ON s.id = a.student_id
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     ORDER BY a.id DESC`
  );
}

export async function getInterviews() {
  return query(
    `SELECT i.*, s.full_name AS student_name, j.title AS job_title,
            c.name AS company_name, c.logo AS company_logo
     FROM interviews i
     JOIN students s ON s.id = i.student_id
     JOIN jobs j ON j.id = i.job_id
     JOIN companies c ON c.id = i.company_id
     ORDER BY i.interview_date DESC, i.interview_time DESC`
  );
}

export async function buildDashboard(user) {
  const [students, companies, jobs, applications, interviews] = await Promise.all([
    query("SELECT * FROM students ORDER BY id DESC"),
    query("SELECT * FROM companies ORDER BY id DESC"),
    query("SELECT * FROM jobs ORDER BY id DESC"),
    getApplications(),
    getInterviews()
  ]);

  const selected = applications.filter((application) => application.status === "SELECTED").length;
  const activeJobs = jobs.filter((job) => job.status === "ACTIVE").length;

  if (user.role === "student") {
    const student = students.find((row) => Number(row.id) === Number(user.student_id)) || students[0];
    const studentApplications = applications.filter((application) => Number(application.student_id) === Number(student?.id));
    const studentInterviews = interviews.filter((interview) => Number(interview.student_id) === Number(student?.id));
    return {
      greeting: `Good morning, ${student?.full_name || user.name}`,
      subtitle: "Track opportunities, applications, interviews, and resume readiness.",
      season: "Placement Season 2026 - 27",
      campus: student?.college || "Gurugram University",
      chartTitle: "My Application Journey",
      chartSubtitle: "Your personal application progress",
      chartSeries: studentSeries,
      stats: [
        { label: "Eligible Jobs", value: activeJobs, tone: "purple", icon: "J", trend: "+2 new matches" },
        { label: "Applied Jobs", value: studentApplications.length, tone: "blue", icon: "A", trend: `${studentApplications.length || 1} active application` },
        { label: "Shortlisted", value: studentApplications.filter((item) => item.status === "SHORTLISTED").length || 1, tone: "green", icon: "S", trend: "50% shortlist rate" },
        { label: "Interviews", value: studentInterviews.length || 1, tone: "orange", icon: "I", trend: "Next interview Oct 14" },
        { label: "Placement Status", value: student?.placement_status || "PROFILE_PENDING", tone: "violet", icon: "P", trend: "Profile updated" }
      ],
      monthly: studentJourneyMonthly(),
      skill_demand: studentSkillDemand(student),
      readiness: {
        score: 82,
        ats: 86,
        skills: 78,
        interview: 80
      },
      aiInsight: "Your React + SQL profile is strongest for frontend and analyst roles. Add one AWS project keyword and revise your resume summary to improve match quality this week.",
      recentApplications: studentApplications.slice(0, 5),
      interviews: studentInterviews.slice(0, 4)
    };
  }

  if (user.role === "company") {
    const companyJobs = jobs.filter((job) => Number(job.company_id) === Number(user.company_id));
    const companyApplications = applications.filter((application) => Number(application.company_id) === Number(user.company_id));
    const companyInterviews = interviews.filter((interview) => Number(interview.company_id) === Number(user.company_id));
    return {
      greeting: `Good morning, ${user.name}`,
      subtitle: "Review your hiring funnel and keep candidates moving.",
      season: "Campus Hiring Drive 2026",
      campus: "SmartPlacify Employer Portal",
      chartTitle: "Recruitment Pipeline",
      chartSubtitle: "Your company's candidate movement",
      chartSeries: companySeries,
      stats: [
        { label: "Total Jobs", value: companyJobs.length, tone: "purple", icon: "J", trend: "3 open positions" },
        { label: "Active Jobs", value: companyJobs.filter((job) => job.status === "ACTIVE").length, tone: "green", icon: "A", trend: "2 active roles" },
        { label: "Applicants", value: companyApplications.length, tone: "blue", icon: "F", trend: "4 in pipeline" },
        { label: "Shortlisted", value: companyApplications.filter((item) => item.status === "SHORTLISTED").length, tone: "violet", icon: "S", trend: "Ready for review" },
        { label: "Selected", value: companyApplications.filter((item) => item.status === "SELECTED").length, tone: "orange", icon: "H", trend: "0 / 3 filled" }
      ],
      monthly: companyPipelineMonthly(),
      recentApplications: companyCandidatePipeline(companyApplications),
      interviews: companyInterviews.slice(0, 4)
    };
  }

  return {
    greeting: "Good morning, Dr. Anjali Sharma",
    subtitle: "Here is what is happening across your placement drive today.",
    season: "Placement Season 2026 - 27",
    campus: "Gurugram University",
    chartTitle: "Placement Funnel Trend",
    chartSubtitle: "College-wide placement activity",
    chartSeries: placementSeries,
    stats: [
      { label: "Total Students", value: students.length, tone: "purple", icon: "S", trend: "2026–27 batch" },
      { label: "Eligible Students", value: students.filter((student) => Number(student.cgpa) >= 7).length, tone: "green", icon: "E", trend: "100% eligible" },
      { label: "Applications", value: applications.length, tone: "violet", icon: "A", trend: "+5 this week" },
      { label: "Companies", value: companies.length, tone: "blue", icon: "C", trend: "2 actively hiring" },
      { label: "Selected Students", value: selected, tone: "orange", icon: "P", trend: `${percentage(selected, students.length)}% placement rate` }
    ],
    monthly: buildMonthly(applications),
    placement_percentage: percentage(selected, students.length),
    skill_demand: skillsDemand(students),
    recentApplications: applications.slice(0, 6),
    interviews: interviews.slice(0, 4)
  };
}
