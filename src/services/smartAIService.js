import { apiClient, USE_MOCKS } from "./apiClient.js";
import { calculateEligibility, delay, enrichApplication, enrichInterview, loadDb } from "./mockData.js";

function normalizeSkills(value = "") {
  return String(value)
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function scoreStudentForJob(student, job) {
  const eligibility = calculateEligibility(student, job);
  const requiredSkills = normalizeSkills(job.required_skills).map((skill) => skill.toLowerCase());
  const studentSkills = String(student.skills || "").toLowerCase();
  const matchedSkills = requiredSkills.filter((skill) => studentSkills.includes(skill));
  const skillScore = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 35) : 25;
  const academicScore = Math.min(30, Math.round((Number(student.cgpa || 0) / 10) * 30));
  const projectScore = student.projects ? 18 : 8;
  const resumeScore = student.resume_name ? 12 : 4;
  const eligibilityBonus = eligibility.eligible ? 5 : 0;

  return Math.min(98, Math.max(35, skillScore + academicScore + projectScore + resumeScore + eligibilityBonus));
}

function getStudent(user, db) {
  return db.students.find((student) => student.id === Number(user.student_id)) || db.students[0];
}

function getCompany(user, db) {
  return db.companies.find((company) => company.id === Number(user.company_id)) || db.companies[0];
}

function readinessResponse(student, applications) {
  const selectedOrShortlisted = applications.filter((item) => ["SELECTED", "SHORTLISTED", "INTERVIEW_SCHEDULED"].includes(item.status)).length;
  const resumeScore = student.resume_name ? 82 : 58;
  const score = Math.min(96, Math.round((Number(student.cgpa || 0) * 8) + resumeScore * 0.14 + selectedOrShortlisted * 4));

  return {
    type: "readiness_score",
    title: "Placement Readiness",
    summary: `${score} / 100 • ${score >= 80 ? "Good" : "Needs Focus"}`,
    score,
    metrics: [
      { label: "Academics", value: Math.min(96, Math.round(Number(student.cgpa || 0) * 10)) },
      { label: "Technical Skills", value: Math.min(92, 62 + normalizeSkills(student.skills).length * 4) },
      { label: "Projects", value: student.projects ? 84 : 48 },
      { label: "Resume", value: resumeScore },
      { label: "Aptitude", value: 71 },
      { label: "Interview Readiness", value: applications.some((item) => item.status.includes("INTERVIEW")) ? 78 : 68 }
    ],
    insight: "Verified data shows strong academics and project depth. AI recommendation: improve SQL/aptitude practice to widen eligible software and analyst roles.",
    actions: ["View Skill Gaps", "Recommended Jobs", "Practice Interview"]
  };
}

function jobMatchesResponse(student, jobs, applications) {
  const appliedJobIds = new Set(applications.map((item) => Number(item.job_id)));
  const matches = jobs
    .filter((job) => job.status === "ACTIVE")
    .map((job) => {
      const eligibility = calculateEligibility(student, job);
      const match = scoreStudentForJob(student, job);
      const missing = eligibility.checks.filter((check) => !check.passed).map((check) => check.label);
      return {
        id: job.id,
        company: job.company_name,
        title: job.title,
        match,
        applied: appliedJobIds.has(job.id),
        why: eligibility.checks.filter((check) => check.passed).slice(0, 4).map((check) => check.label),
        gaps: missing.length ? missing : ["Add one role-specific project for stronger ranking"]
      };
    })
    .sort((first, second) => second.match - first.match)
    .slice(0, 4);

  return {
    type: "job_matches",
    title: "Recommended Opportunities",
    summary: `Found ${matches.length} strong contextual matches for ${student.full_name}.`,
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
      applied: appliedJobIds.has(job.id),
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

function jobEligibilityCountsResponse(db) {
  const activeJobs = db.jobs.filter((job) => job.status === "ACTIVE");
  const metrics = activeJobs.slice(0, 6).map((job) => ({
    label: `${db.companies.find((company) => company.id === job.company_id)?.name || "Company"} • ${job.title}`,
    value: db.students.filter((student) => calculateEligibility(student, job).eligible).length
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

function eligibilityResponse(student, jobs) {
  const target = jobs.find((job) => /deloitte|analyst|business/i.test(`${job.company_name} ${job.title}`)) || jobs[0];
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
      ? "AI insight: you meet the verified eligibility criteria. Preparing examples around projects and fundamentals can improve conversion."
      : "AI insight: focus on the failed criteria first; most other requirements are already close or satisfied."
  };
}

function placementRiskResponse(db) {
  const applications = db.applications.map((application) => enrichApplication(application, db));
  const rows = db.students.map((student) => {
    const studentApps = applications.filter((application) => application.student_id === student.id);
    const selected = studentApps.some((application) => application.status === "SELECTED");
    const risk = selected ? "Low" : studentApps.length <= 1 || Number(student.cgpa) < 7.4 ? "High" : "Medium";
    return {
      id: student.id,
      name: student.full_name,
      cgpa: student.cgpa,
      applications: studentApps.length,
      interviews: db.interviews.filter((interview) => interview.student_id === student.id).length,
      status: selected ? "Placed" : "Active",
      risk
    };
  }).filter((row) => row.status !== "Placed");

  const high = rows.filter((row) => row.risk === "High").length;
  const medium = rows.filter((row) => row.risk === "Medium").length;

  return {
    type: "student_list",
    title: "Students at Placement Risk",
    summary: `${rows.length} students may need placement support.` ,
    metrics: [
      { label: "High Risk", value: high },
      { label: "Medium Risk", value: medium },
      { label: "Low Risk", value: rows.length - high - medium }
    ],
    columns: ["Student", "CGPA", "Applications", "Interviews", "Risk"],
    rows: rows.slice(0, 6),
    insight: "AI recommendation: prioritize students with low application activity and no interviews for targeted training.",
    actions: ["View Students", "Create Training Group", "Export Analysis"]
  };
}

function eligibleStudentsResponse(db) {
  const applications = db.applications.map((application) => enrichApplication(application, db));
  const rows = db.students
    .filter((student) => Number(student.cgpa) >= 7 && Number(student.backlogs || 0) <= 1)
    .map((student) => {
      const studentApps = applications.filter((application) => application.student_id === student.id);
      return {
        id: student.id,
        name: student.full_name,
        cgpa: student.cgpa,
        applications: studentApps.length,
        interviews: db.interviews.filter((interview) => interview.student_id === student.id).length,
        risk: student.resume_name ? "Ready" : "Resume Gap"
      };
    })
    .slice(0, 8);

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

function candidateRankingResponse(user, db, context = {}) {
  const company = getCompany(user, db);
  const jobs = db.jobs.filter((job) => job.company_id === company.id);
  const targetJob = context.entityType === "job" && context.entity ? context.entity : jobs[0] || db.jobs[0];
  const ranked = db.students
    .map((student) => ({
      id: student.id,
      name: student.full_name,
      cgpa: student.cgpa,
      skills: normalizeSkills(student.skills).slice(0, 4).join(", "),
      projects: student.projects ? 2 + (student.id % 3) : 0,
      score: scoreStudentForJob(student, targetJob),
      why: ["Academic profile", "Relevant skills", "Project evidence"],
      gap: student.skills?.includes("Cloud") ? "Limited interview data" : "Cloud exposure"
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);

  return {
    type: "candidate_ranking",
    title: `AI Candidate Ranking • ${targetJob.title}`,
    summary: `${ranked.length} candidates ranked for ${company.name}.`,
    data: ranked,
    actions: ["View Profile", "Shortlist"]
  };
}

function reportResponse(db) {
  const applications = db.applications.map((application) => enrichApplication(application, db));
  const selected = applications.filter((application) => application.status === "SELECTED").length;
  const placementRate = db.students.length ? Math.round((selected / db.students.length) * 100) : 0;

  return {
    type: "report",
    title: "Placement Summary Insight",
    summary: `${placementRate}% placement rate with ${applications.length} tracked applications.`,
    metrics: [
      { label: "Applications", value: applications.length },
      { label: "Selected", value: selected },
      { label: "Companies", value: db.companies.length }
    ],
    insight: "Verified data shows application volume is healthy. AI recommendation: improve interview conversion for students with repeated shortlists.",
    actions: ["Export Report", "View Applications"]
  };
}

function interviewPrepResponse(user, db, context = {}) {
  const interviews = db.interviews.map((interview) => enrichInterview(interview, db));
  const interview = context.entity || interviews.find((item) => item.student_id === Number(user.student_id)) || interviews[0];

  return {
    type: "interview_prep",
    title: `Interview Prep • ${interview.company_name}`,
    summary: `${interview.round_name || "Interview"} preparation plan`,
    sections: [
      { title: "Likely Technical Topics", items: ["Core role fundamentals", "Project walkthrough", "Data structures basics", "SQL or API design"] },
      { title: "Behavioral Questions", items: ["Describe a difficult project", "Explain a team conflict", "Why this company?"] },
      { title: "Checklist", items: ["Revise two projects", "Prepare 60-second intro", "Keep resume examples ready"] }
    ],
    actions: ["Start Practice", "View Interview"]
  };
}

function defaultResponse(user, db, context = {}) {
  if (user.role === "student") {
    const student = getStudent(user, db);
    const applications = db.applications.filter((application) => application.student_id === student.id);
    return readinessResponse(student, applications);
  }
  if (user.role === "company") return candidateRankingResponse(user, db, context);
  return placementRiskResponse(db);
}

function routePrompt(user, prompt, db, context = {}) {
  const text = String(prompt || "").toLowerCase();
  const student = user.role === "student" ? getStudent(user, db) : db.students[0];
  const applications = db.applications.map((application) => enrichApplication(application, db));
  const studentApplications = applications.filter((application) => application.student_id === student.id);
  const jobs = db.jobs.map((job) => ({ ...job, company_name: db.companies.find((company) => company.id === job.company_id)?.name || "Unknown company" }));

  if (user.role === "tpo" && text.includes("how many") && text.includes("eligible")) return jobEligibilityCountsResponse(db);
  if (user.role === "tpo" && text.includes("eligible")) return eligibleStudentsResponse(db);
  if (user.role === "tpo" && text.includes("company")) return reportResponse(db);
  if (user.role === "student" && text.includes("which") && text.includes("eligible")) return eligibleJobsResponse(student, jobs, studentApplications);
  if (user.role === "student" && text.includes("eligible for")) return eligibleJobsResponse(student, jobs, studentApplications);
  if (text.includes("eligible") || text.includes("why")) return eligibilityResponse(student, jobs);
  if (text.includes("job") || text.includes("match") || text.includes("company")) return user.role === "company" ? candidateRankingResponse(user, db, context) : jobMatchesResponse(student, jobs, studentApplications);
  if (text.includes("risk") || text.includes("unplaced") || text.includes("department")) return placementRiskResponse(db);
  if (text.includes("report") || text.includes("summary") || text.includes("placement rate")) return reportResponse(db);
  if (text.includes("interview") || text.includes("prepare")) return interviewPrepResponse(user, db, context);
  if (text.includes("resume") || text.includes("readiness") || text.includes("skill")) return readinessResponse(student, studentApplications);

  return {
    type: "insight",
    title: "Smart AI Insight",
    summary: "I analyzed the current SmartPlacify context and found the next best action.",
    insight: user.role === "tpo"
      ? "Focus on students with no recent applications, then match them to active drives where they already satisfy eligibility."
      : user.role === "company"
        ? "Rank candidates by verified eligibility first, then use AI fit signals as a recommendation layer."
        : "Your verified data suggests improving role-specific skills and interview readiness will increase your opportunity fit.",
    actions: user.role === "tpo" ? ["View Analysis", "Export"] : ["View Recommendations", "Prepare with AI"]
  };
}

export const smartAIService = {
  async getContextualInsights({ user, page, context = {} }) {
    if (!USE_MOCKS) {
      return apiClient("/smart-ai/insights", { method: "POST", body: { page, context } });
    }

    const db = loadDb();
    const response = defaultResponse(user, db, context);
    return delay({ page, context, response }, 420);
  },

  async askAI({ user, page, prompt, context = {} }) {
    if (!USE_MOCKS) {
      return apiClient("/smart-ai/ask", { method: "POST", body: { page, prompt, context } });
    }

    const db = loadDb();
    return delay(routePrompt(user, prompt, db, context), 520);
  },

  async getStudentInsights(user) {
    const db = loadDb();
    const student = getStudent(user, db);
    const applications = db.applications.filter((application) => application.student_id === student.id);
    return delay(readinessResponse(student, applications), 360);
  },

  async getJobMatches(user) {
    const db = loadDb();
    const student = getStudent(user, db);
    const applications = db.applications.filter((application) => application.student_id === student.id);
    const jobs = db.jobs.map((job) => ({ ...job, company_name: db.companies.find((company) => company.id === job.company_id)?.name || "Unknown company" }));
    return delay(jobMatchesResponse(student, jobs, applications), 360);
  },

  async explainEligibility(user) {
    const db = loadDb();
    const jobs = db.jobs.map((job) => ({ ...job, company_name: db.companies.find((company) => company.id === job.company_id)?.name || "Unknown company" }));
    return delay(eligibilityResponse(getStudent(user, db), jobs), 360);
  },

  async getCandidateMatches(user, context = {}) {
    return delay(candidateRankingResponse(user, loadDb(), context), 360);
  },

  async getPlacementRisk() {
    return delay(placementRiskResponse(loadDb()), 360);
  },

  async generateReportInsights() {
    return delay(reportResponse(loadDb()), 360);
  },

  async getInterviewPreparation(user, context = {}) {
    return delay(interviewPrepResponse(user, loadDb(), context), 360);
  }
};
