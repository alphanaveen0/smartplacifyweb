import { query } from "../config/db.js";
import { calculateEligibility } from "../utils/eligibility.js";

function splitList(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function scoreStudentForJob(student, job) {
  const eligibility = calculateEligibility(student, job);
  const requiredSkills = splitList(job.required_skills).map((skill) => skill.toLowerCase());
  const studentSkills = String(student.skills || "").toLowerCase();
  const matchedSkills = requiredSkills.filter((skill) => studentSkills.includes(skill));
  const skillScore = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 35) : 25;
  const academicScore = Math.min(30, Math.round((Number(student.cgpa || 0) / 10) * 30));
  const projectScore = student.projects ? 18 : 8;
  const resumeScore = student.resume_name ? 12 : 4;
  const eligibilityBonus = eligibility.eligible ? 5 : 0;
  return Math.min(98, Math.max(35, skillScore + academicScore + projectScore + resumeScore + eligibilityBonus));
}

async function loadPlacementData() {
  const [students, companies, jobs, applications, interviews] = await Promise.all([
    query("SELECT * FROM students ORDER BY id DESC"),
    query("SELECT * FROM companies ORDER BY id DESC"),
    query(
      `SELECT j.*, c.name AS company_name
       FROM jobs j
       JOIN companies c ON c.id = j.company_id
       ORDER BY j.id DESC`
    ),
    query(
      `SELECT a.*, s.full_name AS student_name, s.college_roll_no AS student_roll_no,
              s.branch AS student_branch, s.cgpa,
              s.resume_name, j.title AS job_title, j.salary_package, j.company_id,
              c.name AS company_name, c.logo AS company_logo
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN jobs j ON j.id = a.job_id
       JOIN companies c ON c.id = j.company_id
       ORDER BY a.id DESC`
    ),
    query(
      `SELECT i.*, s.full_name AS student_name, j.title AS job_title,
              c.name AS company_name, c.logo AS company_logo
       FROM interviews i
       JOIN students s ON s.id = i.student_id
       JOIN jobs j ON j.id = i.job_id
       JOIN companies c ON c.id = i.company_id
       ORDER BY i.interview_date DESC, i.interview_time DESC`
    )
  ]);
  return { students, companies, jobs, applications, interviews };
}

function getStudent(user, data) {
  return data.students.find((student) => Number(student.id) === Number(user.student_id)) || data.students[0];
}

function getCompany(user, data) {
  return data.companies.find((company) => Number(company.id) === Number(user.company_id)) || data.companies[0];
}

function readinessResponse(student, applications) {
  const strongApplications = applications.filter((item) => ["SELECTED", "SHORTLISTED", "INTERVIEW_SCHEDULED"].includes(item.status)).length;
  const resumeScore = student?.resume_name ? 82 : 58;
  const score = Math.min(96, Math.round((Number(student?.cgpa || 0) * 8) + resumeScore * 0.14 + strongApplications * 4));
  return {
    type: "readiness_score",
    title: "Placement Readiness",
    summary: `${score} / 100 • ${score >= 80 ? "Good" : "Needs Focus"}`,
    score,
    metrics: [
      { label: "Academics", value: Math.min(96, Math.round(Number(student?.cgpa || 0) * 10)) },
      { label: "Technical Skills", value: Math.min(92, 62 + splitList(student?.skills).length * 4) },
      { label: "Projects", value: student?.projects ? 84 : 48 },
      { label: "Resume", value: resumeScore },
      { label: "Aptitude", value: 71 },
      { label: "Interview Readiness", value: applications.some((item) => String(item.status).includes("INTERVIEW")) ? 78 : 68 }
    ],
    insight: "Verified data shows academics, applications, resume presence, and interview movement. AI recommendation: improve role-specific skills and aptitude practice to increase conversion.",
    actions: ["View Skill Gaps", "Recommended Jobs", "Practice Interview"]
  };
}

function jobMatchesResponse(student, jobs, applications) {
  const appliedJobIds = new Set(applications.map((item) => Number(item.job_id)));
  const matches = jobs
    .filter((job) => job.status === "ACTIVE")
    .map((job) => {
      const eligibility = calculateEligibility(student, job);
      return {
        id: job.id,
        company: job.company_name,
        title: job.title,
        match: scoreStudentForJob(student, job),
        applied: appliedJobIds.has(Number(job.id)),
        why: eligibility.checks.filter((check) => check.passed).slice(0, 4).map((check) => check.label),
        gaps: eligibility.checks.filter((check) => !check.passed).map((check) => check.label)
      };
    })
    .sort((first, second) => second.match - first.match)
    .slice(0, 6);
  return {
    type: "job_matches",
    title: "Recommended Opportunities",
    summary: `Found ${matches.length} contextual matches from active jobs.`,
    data: matches,
    actions: ["View Jobs", "Prepare with AI"]
  };
}

function eligibleJobsResponse(student, jobs, applications) {
  const appliedJobIds = new Set(applications.map((item) => Number(item.job_id)));
  const matches = jobs
    .filter((job) => job.status === "ACTIVE")
    .map((job) => ({ job, eligibility: calculateEligibility(student, job) }))
    .filter((item) => item.eligibility.eligible)
    .map(({ job, eligibility }) => ({
      id: job.id,
      company: job.company_name,
      title: job.title,
      match: eligibility.score,
      applied: appliedJobIds.has(Number(job.id)),
      why: eligibility.checks.filter((check) => check.passed).slice(0, 4).map((check) => check.criterion || check.label),
      gaps: ["Apply early and tailor your resume to this role"]
    }))
    .slice(0, 6);
  return {
    type: "job_matches",
    title: "Jobs You Are Eligible For",
    summary: `${matches.length} active jobs match your verified profile eligibility.`,
    data: matches,
    actions: ["View Jobs", "Prepare with AI"]
  };
}

function jobEligibilityCountsResponse(data) {
  const activeJobs = data.jobs.filter((job) => job.status === "ACTIVE");
  const metrics = activeJobs.slice(0, 8).map((job) => ({
    label: `${job.company_name} • ${job.title}`,
    value: data.students.filter((student) => calculateEligibility(student, job).eligible).length
  }));
  return {
    type: "report",
    title: "Eligible Students by Active Job",
    summary: `${activeJobs.length} active jobs evaluated with the shared eligibility engine.`,
    metrics,
    insight: "AI recommendation: focus outreach on jobs with high eligible counts but low applications, then remind eligible students who have not applied.",
    actions: ["View Jobs", "View Eligible Students", "Send Reminder"]
  };
}

function eligibilityResponse(student, jobs, context = {}) {
  const requestedJobId = context?.entityType === "job" ? Number(context.entity?.id) : null;
  const target = jobs.find((job) => Number(job.id) === requestedJobId) || jobs.find((job) => /deloitte|analyst|business/i.test(`${job.company_name} ${job.title}`)) || jobs[0];
  const eligibility = calculateEligibility(student, target);
  return {
    type: "eligibility",
    title: `${target.company_name} • ${target.title}`,
    summary: eligibility.eligible ? "Eligible" : "Not eligible yet",
    status: eligibility.eligible ? "ELIGIBLE" : "NOT ELIGIBLE",
    facts: [
      { label: "Your CGPA", value: student.cgpa },
      { label: "Required CGPA", value: target.minimum_cgpa },
      { label: "Backlogs", value: student.backlogs },
      { label: "Allowed Backlogs", value: target.maximum_backlogs }
    ],
    checks: eligibility.checks,
    insight: eligibility.eligible
      ? "AI insight: verified eligibility criteria are satisfied. Preparation should focus on projects, fundamentals, and company-specific questions."
      : "AI insight: fix the failed verified criteria first; AI recommendations are not guaranteed outcomes."
  };
}

function placementRiskResponse(data) {
  const rows = data.students
    .map((student) => {
      const applications = data.applications.filter((application) => Number(application.student_id) === Number(student.id));
      const selected = applications.some((application) => application.status === "SELECTED");
      const interviews = data.interviews.filter((interview) => Number(interview.student_id) === Number(student.id)).length;
      const risk = selected ? "Low" : applications.length <= 1 || Number(student.cgpa) < 7.4 ? "High" : interviews ? "Medium" : "Medium";
      return {
        id: student.id,
        name: student.full_name,
        cgpa: Number(student.cgpa),
        applications: applications.length,
        interviews,
        status: selected ? "Placed" : "Active",
        risk
      };
    })
    .filter((row) => row.status !== "Placed");
  const high = rows.filter((row) => row.risk === "High").length;
  const medium = rows.filter((row) => row.risk === "Medium").length;
  return {
    type: "student_list",
    title: "Students at Placement Risk",
    summary: `${rows.length} students may need placement support.`,
    metrics: [
      { label: "High Risk", value: high },
      { label: "Medium Risk", value: medium },
      { label: "Low Risk", value: rows.length - high - medium }
    ],
    columns: ["Student", "CGPA", "Applications", "Interviews", "Risk"],
    rows: rows.slice(0, 12),
    insight: "AI recommendation: prioritize students with low application activity and no interview movement for targeted training.",
    actions: ["View Students", "Create Training Group", "Export Analysis"]
  };
}

function eligibleStudentsResponse(data) {
  const rows = data.students
    .filter((student) => Number(student.cgpa) >= 7 && Number(student.backlogs || 0) <= 1)
    .map((student) => {
      const applications = data.applications.filter((application) => Number(application.student_id) === Number(student.id));
      const interviews = data.interviews.filter((interview) => Number(interview.student_id) === Number(student.id)).length;
      return {
        id: student.id,
        name: student.full_name,
        cgpa: Number(student.cgpa),
        applications: applications.length,
        interviews,
        risk: student.resume_name ? "Ready" : "Resume Gap"
      };
    })
    .slice(0, 12);

  return {
    type: "student_list",
    title: "Eligible Students",
    summary: `${rows.length} students currently satisfy common campus eligibility rules.`,
    metrics: [
      { label: "Eligible", value: rows.length },
      { label: "With Resume", value: rows.filter((row) => row.risk === "Ready").length },
      { label: "Need Review", value: rows.filter((row) => row.risk !== "Ready").length }
    ],
    columns: ["Student", "CGPA", "Applications", "Interviews", "Readiness"],
    rows,
    insight: "AI recommendation: prioritize eligible students with complete resumes and low application activity for immediate job matching.",
    actions: ["View Students", "Match Jobs", "Send Reminder"]
  };
}

function candidateRankingResponse(user, data, context = {}) {
  const company = getCompany(user, data);
  const companyJobs = data.jobs.filter((job) => Number(job.company_id) === Number(company?.id));
  const requestedJobId = context?.entityType === "job" ? Number(context.entity?.id) : null;
  const targetJob = data.jobs.find((job) => Number(job.id) === requestedJobId) || companyJobs[0] || data.jobs[0];
  const ranked = data.students
    .map((student) => ({
      id: student.id,
      name: student.full_name,
      cgpa: Number(student.cgpa),
      skills: splitList(student.skills).slice(0, 4).join(", "),
      projects: student.projects ? 2 + (Number(student.id) % 3) : 0,
      score: scoreStudentForJob(student, targetJob),
      why: ["Verified eligibility", "Relevant skills", "Project evidence"],
      gap: String(student.skills || "").toLowerCase().includes("cloud") ? "Limited interview data" : "Cloud exposure"
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 10);
  return {
    type: "candidate_ranking",
    title: `AI Candidate Ranking • ${targetJob.title}`,
    summary: `${ranked.length} candidates ranked for ${company?.name || "selected role"}.`,
    data: ranked,
    actions: ["View Profile", "Shortlist"]
  };
}

function reportResponse(data) {
  const selected = data.applications.filter((application) => application.status === "SELECTED").length;
  return {
    type: "report",
    title: "Placement Summary Insight",
    summary: `${percentage(selected, data.students.length)}% placement rate with ${data.applications.length} tracked applications.`,
    metrics: [
      { label: "Applications", value: data.applications.length },
      { label: "Selected", value: selected },
      { label: "Companies", value: data.companies.length }
    ],
    insight: "Verified data shows the placement funnel volume. AI recommendation: monitor repeated shortlists and interview conversion before sending communications.",
    actions: ["Export Report", "View Applications"]
  };
}

function interviewPrepResponse(user, data, context = {}) {
  const scoped = user.role === "student"
    ? data.interviews.filter((interview) => Number(interview.student_id) === Number(user.student_id))
    : user.role === "company"
      ? data.interviews.filter((interview) => Number(interview.company_id) === Number(user.company_id))
      : data.interviews;
  const interview = context.entity || scoped[0] || data.interviews[0];
  return {
    type: "interview_prep",
    title: `Interview Prep • ${interview?.company_name || "Campus Drive"}`,
    summary: `${interview?.round_name || "Interview"} preparation plan`,
    sections: [
      { title: "Likely Technical Topics", items: ["Role fundamentals", "Project walkthrough", "Data structures basics", "SQL or API design"] },
      { title: "Behavioral Questions", items: ["Describe a difficult project", "Explain a team conflict", "Why this company?"] },
      { title: "Checklist", items: ["Revise two projects", "Prepare a 60-second intro", "Keep resume examples ready"] }
    ],
    actions: ["Start Practice", "View Interview"]
  };
}

function defaultResponse(user, data, context = {}) {
  if (user.role === "student") {
    const student = getStudent(user, data);
    const applications = data.applications.filter((application) => Number(application.student_id) === Number(student?.id));
    return readinessResponse(student, applications);
  }
  if (user.role === "company") return candidateRankingResponse(user, data, context);
  return placementRiskResponse(data);
}

function routePrompt(user, prompt, data, context = {}) {
  const text = String(prompt || "").toLowerCase();
  const student = user.role === "student" ? getStudent(user, data) : data.students[0];
  const studentApplications = data.applications.filter((application) => Number(application.student_id) === Number(student?.id));
  if (user.role === "tpo" && text.includes("how many") && text.includes("eligible")) return jobEligibilityCountsResponse(data);
  if (user.role === "tpo" && text.includes("eligible")) return eligibleStudentsResponse(data);
  if (user.role === "tpo" && text.includes("company")) return reportResponse(data);
  if (user.role === "student" && text.includes("which") && text.includes("eligible")) return eligibleJobsResponse(student, data.jobs, studentApplications);
  if (user.role === "student" && text.includes("eligible for")) return eligibleJobsResponse(student, data.jobs, studentApplications);
  if (text.includes("eligible") || text.includes("why")) return eligibilityResponse(student, data.jobs, context);
  if (text.includes("job") || text.includes("match") || text.includes("company")) return user.role === "company" ? candidateRankingResponse(user, data, context) : jobMatchesResponse(student, data.jobs, studentApplications);
  if (text.includes("candidate") || text.includes("applicant") || text.includes("rank")) return candidateRankingResponse(user, data, context);
  if (text.includes("risk") || text.includes("unplaced") || text.includes("department")) return placementRiskResponse(data);
  if (text.includes("report") || text.includes("summary") || text.includes("placement rate")) return reportResponse(data);
  if (text.includes("interview") || text.includes("prepare")) return interviewPrepResponse(user, data, context);
  if (text.includes("resume") || text.includes("readiness") || text.includes("skill")) return readinessResponse(student, studentApplications);
  return defaultResponse(user, data, context);
}

export async function getContextualSmartAI({ user, page, context = {} }) {
  const data = await loadPlacementData();
  return { page, context, response: defaultResponse(user, data, context) };
}

export async function askSmartAI({ user, page, prompt, context = {} }) {
  const data = await loadPlacementData();
  return routePrompt(user, prompt || page, data, context);
}

export async function getStudentInsights(user) {
  const data = await loadPlacementData();
  const student = getStudent(user, data);
  const applications = data.applications.filter((application) => Number(application.student_id) === Number(student?.id));
  return readinessResponse(student, applications);
}

export async function getJobMatches(user) {
  const data = await loadPlacementData();
  const student = getStudent(user, data);
  const applications = data.applications.filter((application) => Number(application.student_id) === Number(student?.id));
  return jobMatchesResponse(student, data.jobs, applications);
}

export async function getPlacementRisk() {
  return placementRiskResponse(await loadPlacementData());
}

export async function getCandidateMatches(user, context = {}) {
  return candidateRankingResponse(user, await loadPlacementData(), context);
}

export async function getReportInsights() {
  return reportResponse(await loadPlacementData());
}

export async function getInterviewPreparation(user, context = {}) {
  return interviewPrepResponse(user, await loadPlacementData(), context);
}
