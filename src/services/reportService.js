import { apiClient, toQueryString, USE_MOCKS } from "./apiClient.js";
import { applicationService } from "./applicationService.js";
import { dashboardService } from "./dashboardService.js";
import { interviewService } from "./interviewService.js";
import { jobService } from "./jobService.js";
import { companyService } from "./companyService.js";
import { studentService } from "./studentService.js";
import { exportXlsxWorkbook } from "./exportService.js";

function toCsv(rows, columns) {
  const header = columns.map((column) => column.label).join(",");
  const body = rows.map((row) =>
    columns.map((column) => `"${String(row[column.key] ?? "").replaceAll('"', '""')}"`).join(",")
  );
  return [header, ...body].join("\n");
}

const generatedMetadata = () => [
  { label: "College Name", value: "Gurugram University" },
  { label: "Placement Season", value: "2026-27" },
  { label: "Generated Date", value: new Date().toLocaleString() }
];

const asList = (value) => Array.isArray(value) ? value.join(", ") : (value || "");
const percent = (value, total) => total ? Number((Number(value || 0) / total).toFixed(4)) : 0;

function placementSummary({ dashboard, students, companies, jobs, applications, interviews }) {
  const placedStudents = new Set(applications.filter((row) => row.status === "SELECTED" || row.result === "SELECTED").map((row) => row.student_id));
  const eligibleStudents = students.filter((row) => row.placement_status !== "PROFILE_PENDING");
  const activeJobs = jobs.filter((row) => row.status === "ACTIVE");
  const activeCompanies = new Set(activeJobs.map((row) => row.company_id));
  const shortlisted = applications.filter((row) => ["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED"].includes(row.status));

  return [
    { metric: "Total Students", value: students.length },
    { metric: "Eligible Students", value: eligibleStudents.length },
    { metric: "Placed Students", value: placedStudents.size },
    { metric: "Unplaced Students", value: Math.max(0, students.length - placedStudents.size) },
    { metric: "Placement Percentage", value: percent(placedStudents.size, students.length), type: "percent" },
    { metric: "Total Companies", value: companies.length },
    { metric: "Active Companies", value: activeCompanies.size },
    { metric: "Total Jobs", value: jobs.length },
    { metric: "Active Jobs", value: activeJobs.length },
    { metric: "Total Applications", value: applications.length },
    { metric: "Shortlisted Students", value: new Set(shortlisted.map((row) => row.student_id)).size },
    { metric: "Interviews", value: interviews.length },
    { metric: "Offers", value: applications.filter((row) => ["SELECTED"].includes(row.status)).length },
    { metric: "Selected Students", value: placedStudents.size },
    { metric: "Dashboard Placement Rate", value: dashboard?.placement_percentage ? Number(dashboard.placement_percentage) / 100 : percent(placedStudents.size, students.length), type: "percent" }
  ];
}

function eligibilitySheets(eligibilityReports) {
  const eligible = [];
  const notEligible = [];

  eligibilityReports.forEach((report) => {
    report.students.forEach((student) => {
      const base = {
        company: report.job.company_name,
        role: report.job.title,
        student_id: student.student_id,
        student_roll_no: student.student_roll_no || "",
        student_name: student.student_name,
        department: student.department,
        batch: student.batch,
        cgpa: student.cgpa,
        backlogs: student.backlogs,
        eligibility_status: student.eligibility_status === "ELIGIBLE" ? "ELIGIBLE" : "NOT ELIGIBLE",
        applied_status: student.application_status?.replaceAll("_", " ") || "NOT APPLIED"
      };

      if (student.eligibility?.eligible) {
        eligible.push(base);
      } else {
        const failed = (student.eligibility?.checks || []).filter((check) => !check.passed);
        notEligible.push({
          ...base,
          failed_criteria: failed.map((check) => check.criterion || check.label).join(", "),
          reason: failed.map((check) => check.message).join("; ")
        });
      }
    });
  });

  return { eligible, notEligible };
}

function departmentAnalytics(students, applications) {
  const departments = [...new Set(students.map((row) => row.branch).filter(Boolean))];
  return departments.map((department) => {
    const departmentStudents = students.filter((row) => row.branch === department);
    const studentIds = new Set(departmentStudents.map((row) => row.id));
    const departmentApplications = applications.filter((row) => studentIds.has(Number(row.student_id)));
    const selectedIds = new Set(departmentApplications.filter((row) => row.status === "SELECTED").map((row) => row.student_id));
    return {
      department,
      total: departmentStudents.length,
      eligible: departmentStudents.filter((row) => row.placement_status !== "PROFILE_PENDING").length,
      placed: selectedIds.size,
      unplaced: Math.max(0, departmentStudents.length - selectedIds.size),
      applications: departmentApplications.length,
      selections: selectedIds.size,
      placement: percent(selectedIds.size, departmentStudents.length)
    };
  });
}

function companyAnalytics(companies, jobs, applications, interviews, eligibilityReports) {
  return companies.map((company) => {
    const companyJobs = jobs.filter((job) => Number(job.company_id) === Number(company.id));
    const jobIds = new Set(companyJobs.map((job) => Number(job.id)));
    const companyApplications = applications.filter((row) => jobIds.has(Number(row.job_id)));
    const selected = companyApplications.filter((row) => row.status === "SELECTED");
    const eligible = eligibilityReports
      .filter((report) => Number(report.job.company_id) === Number(company.id))
      .reduce((total, report) => total + report.eligible, 0);
    return {
      company: company.name,
      jobs: companyJobs.length,
      eligible,
      applicants: companyApplications.length,
      shortlisted: companyApplications.filter((row) => ["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED"].includes(row.status)).length,
      interviewed: interviews.filter((row) => Number(row.company_id) === Number(company.id)).length,
      selected: selected.length,
      selection_rate: percent(selected.length, companyApplications.length),
      average_ctc: companyJobs[0]?.salary_package || ""
    };
  });
}

function skillsAnalytics(students, jobs, applications) {
  const skills = new Set();
  students.forEach((student) => String(student.skills || "").split(",").forEach((skill) => skills.add(skill.trim())));
  jobs.forEach((job) => String(job.required_skills || "").split(",").forEach((skill) => skills.add(skill.trim())));

  return [...skills].filter(Boolean).sort().map((skill) => {
    const studentCount = students.filter((student) => String(student.skills || "").toLowerCase().includes(skill.toLowerCase())).length;
    const jobCount = jobs.filter((job) => String(job.required_skills || "").toLowerCase().includes(skill.toLowerCase())).length;
    const relatedApplications = applications.filter((application) => String(application.job_title || "").toLowerCase().includes(skill.toLowerCase()));
    return {
      skill,
      students: studentCount,
      jobs: jobCount,
      usage: studentCount + jobCount,
      ats_match: relatedApplications.length ? Math.round(relatedApplications.reduce((sum, row) => sum + Number(row.eligibility_score || 0), 0) / relatedApplications.length) : ""
    };
  });
}

function buildFullReportSheets(report, eligibilityReports) {
  const { dashboard, applications, interviews, students, companies, jobs } = report;
  const { eligible, notEligible } = eligibilitySheets(eligibilityReports);
  const selectedApplications = applications.filter((row) => row.status === "SELECTED" || row.result === "SELECTED");
  const selectedIds = new Set(selectedApplications.map((row) => row.student_id));
  const unplacedStudents = students.filter((student) => !selectedIds.has(student.id));
  const funnel = [
    { stage: "Eligible", count: eligible.length, conversion: 1 },
    { stage: "Applied", count: applications.length, conversion: percent(applications.length, Math.max(1, eligible.length)) },
    { stage: "Shortlisted", count: applications.filter((row) => ["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED"].includes(row.status)).length, conversion: percent(applications.filter((row) => ["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED"].includes(row.status)).length, applications.length) },
    { stage: "Interviewed", count: interviews.length, conversion: percent(interviews.length, applications.length) },
    { stage: "Offered", count: selectedApplications.length, conversion: percent(selectedApplications.length, interviews.length) },
    { stage: "Selected", count: selectedIds.size, conversion: percent(selectedIds.size, students.length) }
  ];

  return [
    {
      name: "Placement Summary",
      title: "SmartPlacify Placement Summary",
      metadata: generatedMetadata(),
      allowEmpty: true,
      columns: [{ key: "metric", label: "Metric", width: 30 }, { key: "value", label: "Value", width: 24, value: (row) => row.type === "percent" ? `${Math.round(Number(row.value || 0) * 100)}%` : row.value }],
      rows: placementSummary(report)
    },
    {
      name: "Student Master",
      title: "Student Master",
      metadata: generatedMetadata(),
      columns: [
        { key: "id", label: "Student ID", type: "number" }, { key: "college_roll_no", label: "College Roll No.", width: 18 }, { key: "full_name", label: "Student Name", width: 24 }, { key: "email", label: "Email", width: 32 },
        { key: "branch", label: "Department", width: 24 }, { key: "graduation_year", label: "Batch", type: "number" }, { key: "cgpa", label: "CGPA", type: "number" },
        { key: "percentage", label: "12th %", type: "number" }, { key: "backlogs", label: "Active Backlogs", type: "number" }, { key: "skills", label: "Skills", width: 34 },
        { key: "ats_score", label: "ATS Score", type: "number" }, { key: "resume_status", label: "Resume Status", status: true, value: (row) => row.resume_name ? "Available" : "Missing" },
        { key: "placement_status", label: "Placement Status", status: true }, { key: "selected_company", label: "Selected Company", value: (row) => selectedApplications.find((item) => item.student_id === row.id)?.company_name || "" },
        { key: "selected_role", label: "Selected Role", value: (row) => selectedApplications.find((item) => item.student_id === row.id)?.job_title || "" },
        { key: "package", label: "Package / CTC", value: (row) => selectedApplications.find((item) => item.student_id === row.id)?.package_offered || "" }
      ],
      rows: students
    },
    {
      name: "Eligible Students",
      title: "Job-wise Eligible Students",
      metadata: generatedMetadata(),
      columns: [
        { key: "company", label: "Company", width: 24 }, { key: "role", label: "Job Role", width: 24 }, { key: "student_id", label: "Student ID" }, { key: "student_roll_no", label: "College Roll No.", width: 18 },
        { key: "student_name", label: "Student Name", width: 24 }, { key: "department", label: "Department", width: 24 }, { key: "batch", label: "Batch", type: "number" },
        { key: "cgpa", label: "CGPA", type: "number" }, { key: "backlogs", label: "Backlogs", type: "number" }, { key: "eligibility_status", label: "Eligibility Status", status: true },
        { key: "applied_status", label: "Applied Status", status: true }
      ],
      rows: eligible
    },
    {
      name: "Not Eligible Students",
      title: "Job-wise Not Eligible Students",
      metadata: generatedMetadata(),
      columns: [
        { key: "company", label: "Company", width: 24 }, { key: "role", label: "Job Role", width: 24 }, { key: "student_id", label: "Student ID" }, { key: "student_roll_no", label: "College Roll No.", width: 18 },
        { key: "student_name", label: "Student Name", width: 24 }, { key: "department", label: "Department", width: 24 }, { key: "cgpa", label: "CGPA", type: "number" },
        { key: "eligibility_status", label: "Eligibility Status", status: true }, { key: "failed_criteria", label: "Failed Criteria", width: 24 }, { key: "reason", label: "Reason", width: 52 }
      ],
      rows: notEligible
    },
    {
      name: "Applications",
      title: "Applications",
      metadata: generatedMetadata(),
      columns: [
        { key: "id", label: "Application ID", type: "number" }, { key: "student_roll_no", label: "College Roll No.", width: 18 }, { key: "student_name", label: "Student", width: 24 }, { key: "student_branch", label: "Department", width: 22 },
        { key: "company_name", label: "Company", width: 24 }, { key: "job_title", label: "Job Role", width: 24 }, { key: "applied_at", label: "Applied Date" },
        { key: "eligibility_score", label: "Eligibility", type: "number" }, { key: "status", label: "Application Status", status: true },
        { key: "shortlisted", label: "Shortlisted", status: true, value: (row) => ["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED"].includes(row.status) ? "Yes" : "No" },
        { key: "interview", label: "Interview Status", status: true, value: (row) => row.status === "INTERVIEW_SCHEDULED" ? "Scheduled" : "" },
        { key: "result", label: "Final Status", status: true, value: (row) => row.result || row.status }
      ],
      rows: applications
    },
    {
      name: "Interviews",
      title: "Interviews",
      metadata: generatedMetadata(),
      columns: [
        { key: "student_name", label: "Student", width: 24 }, { key: "student_branch", label: "Department", width: 22 }, { key: "company_name", label: "Company", width: 24 },
        { key: "job_title", label: "Job Role", width: 24 }, { key: "round_name", label: "Interview Round" }, { key: "interview_date", label: "Interview Date" },
        { key: "interview_time", label: "Interview Time" }, { key: "mode", label: "Interview Mode" }, { key: "status", label: "Interview Status", status: true },
        { key: "result", label: "Result", value: (row) => row.status === "COMPLETED" ? "Completed" : "" }
      ],
      rows: interviews
    },
    {
      name: "Selections",
      title: "Selections",
      metadata: generatedMetadata(),
      columns: [
        { key: "student_id", label: "Student ID", type: "number" }, { key: "student_roll_no", label: "College Roll No.", width: 18 }, { key: "student_name", label: "Student Name", width: 24 }, { key: "student_branch", label: "Department", width: 22 },
        { key: "company_name", label: "Company", width: 24 }, { key: "job_title", label: "Job Role", width: 24 }, { key: "package_offered", label: "Package / CTC" },
        { key: "applied_at", label: "Selection Date" }, { key: "status", label: "Placement Status", status: true }
      ],
      rows: selectedApplications
    },
    {
      name: "Unplaced Students",
      title: "Unplaced Students",
      metadata: generatedMetadata(),
      columns: [
        { key: "id", label: "Student ID", type: "number" }, { key: "college_roll_no", label: "College Roll No.", width: 18 }, { key: "full_name", label: "Student Name", width: 24 }, { key: "branch", label: "Department", width: 24 },
        { key: "cgpa", label: "CGPA", type: "number" }, { key: "ats_score", label: "ATS Score", type: "number" },
        { key: "eligible_jobs", label: "Eligible Jobs", type: "number", value: (row) => eligibilityReports.filter((report) => report.students.some((student) => student.student_id === row.id && student.eligibility_status === "ELIGIBLE")).length },
        { key: "applications_made", label: "Applications Made", type: "number", value: (row) => applications.filter((item) => item.student_id === row.id).length },
        { key: "shortlisted", label: "Shortlisted Count", type: "number", value: (row) => applications.filter((item) => item.student_id === row.id && ["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED"].includes(item.status)).length },
        { key: "interviews", label: "Interviews Attended", type: "number", value: (row) => interviews.filter((item) => item.student_id === row.id).length },
        { key: "placement_status", label: "Current Status", status: true }
      ],
      rows: unplacedStudents
    },
    {
      name: "Companies",
      title: "Companies",
      metadata: generatedMetadata(),
      columns: [
        { key: "company", label: "Company", width: 24 }, { key: "industry", label: "Industry" }, { key: "hiring_status", label: "Hiring Status", status: true },
        { key: "jobs", label: "Jobs Posted", type: "number" }, { key: "active_jobs", label: "Active Jobs", type: "number" }, { key: "openings", label: "Total Openings", type: "number" },
        { key: "applicants", label: "Applicants", type: "number" }, { key: "shortlisted", label: "Shortlisted", type: "number" }, { key: "interviewed", label: "Interviewed", type: "number" },
        { key: "selected", label: "Selected", type: "number" }, { key: "highest_ctc", label: "Highest CTC" }, { key: "average_ctc", label: "Average CTC" }
      ],
      rows: companyAnalytics(companies, jobs, applications, interviews, eligibilityReports).map((row) => ({ ...row, industry: companies.find((company) => company.name === row.company)?.industry || "", hiring_status: row.jobs ? "ACTIVE" : "INACTIVE", active_jobs: jobs.filter((job) => job.company_name === row.company && job.status === "ACTIVE").length, openings: jobs.filter((job) => job.company_name === row.company).reduce((sum, job) => sum + Number(job.openings || 0), 0), highest_ctc: row.average_ctc }))
    },
    {
      name: "Jobs",
      title: "Jobs",
      metadata: generatedMetadata(),
      columns: [
        { key: "company_name", label: "Company", width: 24 }, { key: "title", label: "Job Role", width: 24 }, { key: "salary_package", label: "Package / CTC" },
        { key: "openings", label: "Openings", type: "number" }, { key: "minimum_cgpa", label: "Minimum CGPA", type: "number" }, { key: "eligible_branches", label: "Eligible Departments", width: 34 },
        { key: "graduation_year", label: "Batch", type: "number" }, { key: "maximum_backlogs", label: "Maximum Backlogs", type: "number" }, { key: "required_skills", label: "Required Skills", width: 34 },
        { key: "eligible_students", label: "Eligible Students", type: "number", value: (row) => eligibilityReports.find((report) => report.job.id === row.id)?.eligible || 0 },
        { key: "applicants", label: "Applicants", type: "number", value: (row) => applications.filter((item) => item.job_id === row.id).length },
        { key: "shortlisted", label: "Shortlisted", type: "number", value: (row) => applications.filter((item) => item.job_id === row.id && ["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED"].includes(item.status)).length },
        { key: "selected", label: "Selected", type: "number", value: (row) => applications.filter((item) => item.job_id === row.id && item.status === "SELECTED").length },
        { key: "status", label: "Job Status", status: true }
      ],
      rows: jobs
    },
    {
      name: "Department Analytics",
      title: "Department Analytics",
      metadata: generatedMetadata(),
      columns: [
        { key: "department", label: "Department", width: 24 }, { key: "total", label: "Total Students", type: "number" }, { key: "eligible", label: "Eligible Students", type: "number" },
        { key: "placed", label: "Placed Students", type: "number" }, { key: "unplaced", label: "Unplaced Students", type: "number" }, { key: "applications", label: "Total Applications", type: "number" },
        { key: "selections", label: "Total Selections", type: "number" }, { key: "placement", label: "Placement %", type: "percent" }
      ],
      rows: departmentAnalytics(students, applications)
    },
    {
      name: "Company Analytics",
      title: "Company Analytics",
      metadata: generatedMetadata(),
      columns: [
        { key: "company", label: "Company", width: 24 }, { key: "jobs", label: "Jobs", type: "number" }, { key: "eligible", label: "Eligible Students", type: "number" },
        { key: "applicants", label: "Applicants", type: "number" }, { key: "shortlisted", label: "Shortlisted", type: "number" }, { key: "interviewed", label: "Interviewed", type: "number" },
        { key: "selected", label: "Selected", type: "number" }, { key: "selection_rate", label: "Selection Rate", type: "percent" }, { key: "average_ctc", label: "Average CTC" }
      ],
      rows: companyAnalytics(companies, jobs, applications, interviews, eligibilityReports)
    },
    {
      name: "Placement Funnel",
      title: "Placement Funnel",
      metadata: generatedMetadata(),
      columns: [{ key: "stage", label: "Stage" }, { key: "count", label: "Count", type: "number" }, { key: "conversion", label: "Conversion %", type: "percent" }],
      rows: funnel
    },
    {
      name: "Skills Analytics",
      title: "Skills Analytics",
      metadata: generatedMetadata(),
      columns: [
        { key: "skill", label: "Skill", width: 24 }, { key: "students", label: "Students Having Skill", type: "number" },
        { key: "jobs", label: "Jobs Requiring Skill", type: "number" }, { key: "usage", label: "Market Demand / Usage", type: "number" },
        { key: "ats_match", label: "Average ATS Match", type: "number" }
      ],
      rows: skillsAnalytics(students, jobs, applications)
    },
    {
      name: "ATS Resume Report",
      title: "ATS / Resume Report",
      metadata: generatedMetadata(),
      columns: [
        { key: "full_name", label: "Student", width: 24 }, { key: "branch", label: "Department", width: 24 }, { key: "ats_score", label: "ATS Score", type: "number" },
        { key: "resume_completeness", label: "Resume Completeness", status: true, value: (row) => row.resume_name ? "Available" : "Missing" },
        { key: "skills", label: "Matched Skills", width: 34 }, { key: "missing", label: "Missing Skills / Keywords", value: () => "" },
        { key: "recommended", label: "Recommended Improvement", width: 42, value: (row) => row.resume_name ? "Keep resume updated with role keywords." : "Upload a current resume before drives." }
      ],
      rows: students
    }
  ];
}

function exportWorkbook(filename, sheets) {
  exportXlsxWorkbook({ filename, sheets });
}

export const reportService = {
  async summary(user, filters = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/reports/summary${toQueryString(filters)}`);
    }

    const [dashboard, applications, interviews, students, companies, jobs] = await Promise.all([
      dashboardService.getDashboard(user),
      applicationService.all(),
      interviewService.list({ pageSize: 200 }),
      studentService.all(),
      companyService.all(),
      jobService.all()
    ]);

    const status = filters.status && filters.status !== "All" ? filters.status : "";
    const filteredApplications = applications.filter((row) => {
      const statusMatches = status ? row.status === status : true;
      const afterStart = filters.dateFrom ? row.applied_at >= filters.dateFrom : true;
      const beforeEnd = filters.dateTo ? row.applied_at <= filters.dateTo : true;
      return statusMatches && afterStart && beforeEnd;
    });

    return {
      dashboard,
      applications: filteredApplications,
      interviews: interviews.data,
      students,
      companies,
      jobs
    };
  },

  exportCsv(rows, columns, filename = "smartplacify-report.csv") {
    const blob = new Blob([toCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  async exportFullPlacementReport(user, filters = {}) {
    if (user.role !== "tpo") throw new Error("Only TPO users can export placement reports.");
    const report = await this.summary(user, filters);
    const eligibilityReports = await Promise.all(report.jobs.map((job) => jobService.eligibilitySummary(job.id)));
    exportWorkbook("SmartPlacify_Placement_Report_2026-27.xlsx", buildFullReportSheets(report, eligibilityReports));
  },

  exportStudents(rows, filename = "SmartPlacify_Students.xlsx") {
    exportWorkbook(filename, [{
      name: "Students",
      title: "SmartPlacify Student Export",
      metadata: generatedMetadata(),
      allowEmpty: true,
      columns: [
        { key: "id", label: "Student ID", type: "number" }, { key: "college_roll_no", label: "College Roll No.", width: 18 }, { key: "full_name", label: "Student Name", width: 24 }, { key: "email", label: "Email", width: 32 },
        { key: "branch", label: "Department" }, { key: "graduation_year", label: "Batch", type: "number" }, { key: "cgpa", label: "CGPA", type: "number" },
        { key: "backlogs", label: "Active Backlogs", type: "number" }, { key: "skills", label: "Skills", width: 34 }, { key: "resume_name", label: "Resume Status", status: true, value: (row) => row.resume_name ? "Available" : "Missing" },
        { key: "placement_status", label: "Placement Status", status: true }
      ],
      rows
    }]);
  },

  exportApplications(rows, filename = "SmartPlacify_Applications.xlsx") {
    exportWorkbook(filename, [{
      name: "Applications",
      title: "SmartPlacify Applications Export",
      metadata: generatedMetadata(),
      allowEmpty: true,
      columns: [
        { key: "id", label: "Application ID", type: "number" }, { key: "student_roll_no", label: "College Roll No.", width: 18 }, { key: "student_name", label: "Student", width: 24 }, { key: "student_branch", label: "Department" },
        { key: "company_name", label: "Company", width: 24 }, { key: "job_title", label: "Job Role", width: 24 }, { key: "applied_at", label: "Applied Date" },
        { key: "eligibility_score", label: "Eligibility Score", type: "number" }, { key: "status", label: "Application Status", status: true },
        { key: "result", label: "Final Status", status: true, value: (row) => row.result || row.status }
      ],
      rows
    }]);
  },

  exportSelections(rows, filename = "SmartPlacify_Selection_Report.xlsx") {
    const selected = rows.filter((row) => row.status === "SELECTED" || row.result === "SELECTED");
    exportWorkbook(filename, [{
      name: "Selections",
      title: "SmartPlacify Selection Report",
      metadata: generatedMetadata(),
      allowEmpty: true,
      columns: [
        { key: "student_id", label: "Student ID", type: "number" }, { key: "student_roll_no", label: "College Roll No.", width: 18 }, { key: "student_name", label: "Student Name", width: 24 }, { key: "student_branch", label: "Department" },
        { key: "company_name", label: "Company", width: 24 }, { key: "job_title", label: "Job Role", width: 24 }, { key: "package_offered", label: "Package / CTC" },
        { key: "applied_at", label: "Selection Date" }, { key: "status", label: "Placement Status", status: true }
      ],
      rows: selected
    }]);
  },

  exportEligibleStudents(report, rows, filename = "SmartPlacify_Eligible_Students.xlsx") {
    exportWorkbook(filename, [{
      name: "Eligible Students",
      title: `${report.job.company_name} - ${report.job.title}`,
      metadata: generatedMetadata(),
      allowEmpty: true,
      columns: [
        { key: "student_id", label: "Student ID", type: "number" }, { key: "student_roll_no", label: "College Roll No.", width: 18 }, { key: "student_name", label: "Student Name", width: 24 },
        { key: "department", label: "Department", width: 24 }, { key: "batch", label: "Batch", type: "number" }, { key: "cgpa", label: "CGPA", type: "number" },
        { key: "backlogs", label: "Backlogs", type: "number" }, { key: "eligibility_status", label: "Eligibility Status", status: true },
        { key: "application_status", label: "Applied Status", status: true, value: (row) => row.application_status?.replaceAll("_", " ") || "NOT APPLIED" },
        { key: "reason", label: "Reason", width: 48, value: (row) => asList((row.eligibility?.checks || []).filter((check) => !check.passed).map((check) => check.message)) }
      ],
      rows
    }]);
  }
};
