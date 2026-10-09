const DB_KEY = "smartplacify_mock_db_v4";
const LATENCY = 180;

export const roles = ["student", "company", "tpo"];

const studentNames = [
  "Aarav Mehta",
  "Nisha Rao",
  "Kabir Sethi",
  "Meera Iyer",
  "Rohan Malhotra",
  "Sara Khan",
  "Devika Menon",
  "Vihaan Batra",
  "Ananya Sen",
  "Ishaan Gill",
  "Tanvi Arora",
  "Kunal Verma",
  "Riya Kapoor",
  "Aditya Nair",
  "Sanya Sharma",
  "Arjun Reddy",
  "Pooja Chauhan",
  "Yash Khanna",
  "Maya Thomas",
  "Neel Joshi"
];

const branches = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Business Analytics"];
const skillSets = [
  "React, Node.js, SQL, DSA",
  "Python, Django, PostgreSQL, Cloud",
  "Java, Spring Boot, Microservices",
  "Power BI, Excel, SQL, Product Strategy",
  "AutoCAD, Python, Operations",
  "Machine Learning, Python, React",
  "Cybersecurity, Linux, Networking",
  "Data Structures, C++, System Design",
  "UI Design, React, Analytics",
  "AWS, Docker, Terraform",
  "JavaScript, Testing, Accessibility",
  "Finance, SQL, Tableau",
  "HR Analytics, Excel, Communication",
  "Flutter, Firebase, REST APIs",
  "DevOps, Kubernetes, Python",
  "Salesforce, CRM, Business Analysis",
  "C, Embedded Systems, IoT",
  "Product Management, Research, SQL",
  "NLP, Python, Data Science",
  "QA Automation, Selenium, Java"
];

const placementStatuses = ["SHORTLISTED", "APPLIED", "ELIGIBLE", "SELECTED", "ELIGIBLE", "INTERVIEW_SCHEDULED", "ON_HOLD"];

const students = studentNames.map((name, index) => ({
  id: index + 1,
  full_name: name,
  email: `${name.toLowerCase().replaceAll(" ", ".")}@gurugram.edu`,
  college_roll_no: `SP${2026 + (index % 2)}${String(index + 1).padStart(3, "0")}`,
  phone: `+91 98765 10${String(index + 1).padStart(3, "0")}`,
  college: "Gurugram University",
  course: index % 5 === 3 ? "MBA" : "B.Tech",
  branch: branches[index % branches.length],
  graduation_year: index % 4 === 0 ? 2026 : 2027,
  cgpa: Number((7 + (index % 8) * 0.25).toFixed(2)),
  percentage: 68 + (index % 12) * 2,
  backlogs: index % 9 === 0 ? 1 : 0,
  skills: skillSets[index],
  certifications: index % 2 === 0 ? "AWS Cloud Practitioner, React Fundamentals" : "Google Data Analytics, SQL Advanced",
  projects: index % 2 === 0 ? "Placement analytics dashboard, AI resume scorer" : "Campus helpdesk, recruiter funnel analysis",
  experience: index % 3 === 0 ? "6 month internship" : index % 4 === 0 ? "1 year project experience" : "Fresher",
  placement_status: placementStatuses[index % placementStatuses.length],
  resume_name: index % 4 === 0 ? "" : `${name.replaceAll(" ", "_")}_Resume.${index % 3 === 0 ? "docx" : "pdf"}`,
  resume_updated_at: index % 4 === 0 ? "" : `2026-09-${String(10 + (index % 18)).padStart(2, "0")}`
}));

const companies = [
  {
    id: 1,
    name: "TechNova Solutions",
    email: "placements@technova.com",
    phone: "+91 124 400 1100",
    website: "https://technova.example",
    industry: "Software",
    location: "Gurugram",
    description: "Enterprise product engineering and cloud transformation partner.",
    logo: "TN",
    verified: true
  },
  {
    id: 2,
    name: "FinEdge Analytics",
    email: "campus@finedge.com",
    phone: "+91 80 4100 2200",
    website: "https://finedge.example",
    industry: "FinTech",
    location: "Bengaluru",
    description: "Analytics platform for banks and NBFCs.",
    logo: "FE",
    verified: true
  },
  {
    id: 3,
    name: "Northstar Consulting",
    email: "talent@northstar.com",
    phone: "+91 11 4200 3300",
    website: "https://northstar.example",
    industry: "Consulting",
    location: "Delhi NCR",
    description: "Strategy and digital operations consulting.",
    logo: "NC",
    verified: false
  },
  {
    id: 4,
    name: "CloudArc Systems",
    email: "hiring@cloudarc.com",
    phone: "+91 20 4300 4400",
    website: "https://cloudarc.example",
    industry: "Cloud",
    location: "Pune",
    description: "Cloud reliability, DevOps, and managed infrastructure.",
    logo: "CA",
    verified: true
  },
  {
    id: 5,
    name: "PeopleFirst Labs",
    email: "campus@peoplefirst.com",
    phone: "+91 22 4500 5500",
    website: "https://peoplefirst.example",
    industry: "HR Tech",
    location: "Mumbai",
    description: "People analytics and hiring automation platform.",
    logo: "PF",
    verified: true
  }
];

const jobs = [
  ["Frontend Engineer", 1, "Gurugram", "Full-time", "12 LPA", 7.5, 0, "Computer Science, Information Technology", "React, JavaScript, CSS", 0, "ACTIVE"],
  ["Data Analyst", 2, "Bengaluru", "Full-time", "10 LPA", 7.8, 0, "Computer Science, Information Technology, Business Analytics", "SQL, Python, Power BI", 0, "ACTIVE"],
  ["Business Analyst", 3, "Delhi NCR", "Full-time", "9 LPA", 7, 1, "Business Analytics, Computer Science, Mechanical", "Excel, SQL, Communication", 0, "ACTIVE"],
  ["Cloud Operations Intern", 4, "Pune", "Internship", "35 K/month", 7.2, 1, "Computer Science, Information Technology, Electronics", "Linux, AWS, Networking", 0, "ACTIVE"],
  ["Backend Engineer", 1, "Hybrid", "Full-time", "13 LPA", 8, 0, "Computer Science, Information Technology", "Node.js, Java, SQL", 0, "CLOSED"],
  ["Product Associate", 5, "Mumbai", "Full-time", "8 LPA", 7, 0, "Business Analytics, Computer Science", "Research, SQL, Communication", 0, "ACTIVE"],
  ["QA Automation Engineer", 1, "Noida", "Full-time", "8.5 LPA", 7, 1, "Computer Science, Information Technology, Electronics", "Selenium, Java, Testing", 0, "ACTIVE"],
  ["DevOps Trainee", 4, "Pune", "Full-time", "9.5 LPA", 7.4, 0, "Computer Science, Information Technology", "Docker, Kubernetes, Python", 0, "ACTIVE"],
  ["HR Analytics Associate", 5, "Mumbai", "Internship", "28 K/month", 6.8, 1, "Business Analytics", "Excel, HR Analytics, Tableau", 0, "DRAFT"],
  ["Embedded Systems Engineer", 3, "Chennai", "Full-time", "7.8 LPA", 7.1, 1, "Electronics, Mechanical", "C, Embedded Systems, IoT", 1, "ACTIVE"]
].map(([title, company_id, location, job_type, salary_package, minimum_cgpa, maximum_backlogs, eligible_branches, required_skills, experience_years, status], index) => ({
  id: index + 1,
  company_id,
  title,
  description: `${title} role focused on real campus hiring outcomes, strong ownership, and professional delivery.`,
  location,
  job_type,
  salary_package,
  experience: experience_years ? `${experience_years}+ years preferred` : "Fresher eligible",
  experience_years,
  required_skills,
  minimum_cgpa,
  maximum_backlogs,
  eligible_branches,
  graduation_year: index % 4 === 0 ? 2026 : 2027,
  application_deadline: `2026-${index < 6 ? "11" : "12"}-${String(8 + index).padStart(2, "0")}`,
  openings: 4 + (index % 9),
  status
}));

const applications = [
  [1, 1, "SHORTLISTED", 95],
  [2, 2, "APPLIED", 86],
  [4, 3, "SELECTED", 92],
  [6, 4, "INTERVIEW_SCHEDULED", 90],
  [7, 8, "APPLIED", 84],
  [8, 5, "REJECTED", 78],
  [9, 1, "SHORTLISTED", 88],
  [10, 8, "APPLIED", 82],
  [11, 7, "ON_HOLD", 76],
  [12, 2, "APPLIED", 80],
  [13, 9, "SHORTLISTED", 89],
  [14, 6, "APPLIED", 83],
  [15, 8, "INTERVIEW_SCHEDULED", 91],
  [16, 6, "SELECTED", 93],
  [17, 10, "APPLIED", 81],
  [19, 2, "SHORTLISTED", 94]
].map(([student_id, job_id, status, eligibility_score], index) => ({
  id: index + 1,
  student_id,
  job_id,
  status,
  eligibility_score,
  applied_at: `2026-09-${String(12 + (index % 18)).padStart(2, "0")}`,
  result: status === "SELECTED" ? "SELECTED" : "",
  package_offered: status === "SELECTED" ? jobs.find((job) => job.id === job_id)?.salary_package || "" : ""
}));

const interviews = [
  [1, 1, 1, 1, "2026-10-14", "10:30", "Online", "https://meet.example/technova-aarav", "Technical Round", "SCHEDULED"],
  [4, 6, 4, 4, "2026-10-12", "14:00", "Hybrid", "CloudArc Pune + online panel", "SRE Fundamentals", "SCHEDULED"],
  [3, 4, 3, 3, "2026-09-29", "11:00", "Offline", "Northstar Delhi office", "Case Interview", "COMPLETED"],
  [13, 15, 4, 8, "2026-10-18", "15:00", "Online", "https://meet.example/cloudarc-sanya", "DevOps Panel", "SCHEDULED"],
  [16, 19, 2, 2, "2026-10-20", "12:00", "Online", "https://meet.example/finedge-maya", "Analytics Case", "SCHEDULED"]
].map(([application_id, student_id, company_id, job_id, interview_date, interview_time, mode, location_or_link, round_name, status], index) => ({
  id: index + 1,
  application_id,
  student_id,
  company_id,
  job_id,
  interview_date,
  interview_time,
  mode,
  location_or_link,
  round_name,
  status,
  notes: "Prepare project summary, fundamentals, and role-specific questions."
}));

const notifications = [
  ["student", 2, "Interview scheduled", "TechNova scheduled your Frontend Engineer technical round.", "Interview", false],
  ["tpo", 1, "New company pending verification", "Northstar Consulting is waiting for profile verification.", "Company", false],
  ["company", 3, "Applications updated", "3 new students applied to active TechNova jobs this week.", "Applications", false],
  ["all", null, "Placement season is live", "All departments can now publish jobs and schedule interviews.", "Announcement", true],
  ["student", 2, "Resume reminder", "Upload the latest resume before applying to premium roles.", "Resume", false],
  ["tpo", 1, "Report ready", "September placement report can be exported from Reports.", "Reports", true]
].map(([role, user_id, title, message, type, is_read], index) => ({
  id: index + 1,
  role,
  user_id,
  title,
  message,
  type,
  is_read,
  created_at: `2026-10-0${Math.min(index + 1, 6)}`
}));

const seed = {
  users: [
    {
      id: 1,
      name: "Dr. Anjali Sharma",
      email: "admin@test.com",
      password: "password123",
      role: "tpo",
      department: "Training & Placement",
      location: "Gurugram, Haryana",
      mobile: "+91 98765 43210"
    },
    {
      id: 2,
      name: "Aarav Mehta",
      email: "student@test.com",
      password: "password123",
      role: "student",
      student_id: 1
    },
    {
      id: 3,
      name: "Priya Kapoor",
      email: "company@test.com",
      password: "password123",
      role: "company",
      company_id: 1
    }
  ],
  students,
  companies,
  jobs,
  applications,
  interviews,
  notifications
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function delay(value, ms = LATENCY) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), ms);
  });
}

export function loadDb() {
  const stored = localStorage.getItem(DB_KEY);

  if (!stored) {
    localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return clone(seed);
  }

  try {
    const parsed = JSON.parse(stored);
    const merged = {
      ...clone(seed),
      ...parsed
    };
    merged.students = (merged.students || []).map((student) => ({
      ...student,
      college_roll_no: student.college_roll_no || `SP${student.graduation_year || 2027}${String(student.id).padStart(3, "0")}`
    }));
    return {
      ...merged
    };
  } catch (_error) {
    localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return clone(seed);
  }
}

export function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return clone(db);
}

export function resetDb() {
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return clone(seed);
}

export function nextId(rows) {
  return rows.length ? Math.max(...rows.map((row) => Number(row.id) || 0)) + 1 : 1;
}

export function searchRows(rows, search, keys) {
  const term = String(search || "").trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => keys.some((key) => String(row[key] ?? "").toLowerCase().includes(term)));
}

export function filterRows(rows, filters = {}) {
  return rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value || value === "All") return true;
      return String(row[key] ?? "").toLowerCase() === String(value).toLowerCase();
    })
  );
}

export function sortRows(rows, sortKey, sortDir = "asc") {
  if (!sortKey) return rows;
  const direction = sortDir === "desc" ? -1 : 1;

  return [...rows].sort((first, second) => {
    const left = first[sortKey];
    const right = second[sortKey];

    if (Number.isFinite(Number(left)) && Number.isFinite(Number(right))) {
      return (Number(left) - Number(right)) * direction;
    }

    return String(left ?? "").localeCompare(String(right ?? "")) * direction;
  });
}

export function paginateRows(rows, page = 1, pageSize = 8) {
  const safePageSize = Number(pageSize) || 8;
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * safePageSize;

  return {
    data: rows.slice(start, start + safePageSize),
    page: currentPage,
    pageSize: safePageSize,
    total,
    totalPages
  };
}

export function upsertRow(collection, payload) {
  const db = loadDb();
  const rows = db[collection] || [];
  const id = payload.id || nextId(rows);
  const record = { ...payload, id };

  if (payload.id) {
    db[collection] = rows.map((row) => (row.id === payload.id ? { ...row, ...record } : row));
  } else {
    db[collection] = [record, ...rows];
  }

  saveDb(db);
  return record;
}

export function deleteRow(collection, id) {
  const db = loadDb();
  db[collection] = (db[collection] || []).filter((row) => row.id !== Number(id));
  saveDb(db);
}

export function addNotification(payload) {
  const db = loadDb();
  const notification = {
    id: nextId(db.notifications),
    role: payload.role || "all",
    user_id: payload.user_id || null,
    title: payload.title,
    message: payload.message,
    type: payload.type || "Update",
    is_read: false,
    created_at: new Date().toISOString().slice(0, 10)
  };

  db.notifications = [notification, ...db.notifications];
  saveDb(db);
  return notification;
}

export function enrichApplication(application, db = loadDb()) {
  const student = db.students.find((row) => row.id === application.student_id);
  const job = db.jobs.find((row) => row.id === application.job_id);
  const company = db.companies.find((row) => row.id === job?.company_id);

  return {
    ...application,
    student_name: student?.full_name || "Unknown student",
    student_roll_no: student?.college_roll_no || "",
    student_branch: student?.branch || "",
    resume_name: student?.resume_name || "",
    job_title: job?.title || "Unknown job",
    company_id: company?.id || job?.company_id,
    company_name: company?.name || "Unknown company",
    company_logo: company?.logo || (company?.name || "SP").slice(0, 2).toUpperCase(),
    location: job?.location || "",
    job_type: job?.job_type || "",
    salary_package: job?.salary_package || ""
  };
}

export function enrichInterview(interview, db = loadDb()) {
  const student = db.students.find((row) => row.id === interview.student_id);
  const job = db.jobs.find((row) => row.id === interview.job_id);
  const company = db.companies.find((row) => row.id === interview.company_id);

  return {
    ...interview,
    student_name: student?.full_name || "Unknown student",
    student_roll_no: student?.college_roll_no || "",
    job_title: job?.title || "Unknown job",
    company_name: company?.name || "Unknown company",
    company_logo: company?.logo || (company?.name || "SP").slice(0, 2).toUpperCase()
  };
}

export function calculateEligibility(student, job) {
  const branchList = String(job.eligible_branches || "")
    .split(",")
    .map((branch) => branch.trim().toLowerCase())
    .filter(Boolean);
  const requiredSkills = String(job.required_skills || "")
    .split(",")
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean);
  const studentSkills = String(student.skills || "").toLowerCase();
  const branchMatch = !branchList.length || branchList.includes(String(student.branch || "").toLowerCase());
  const cgpaMatch = Number(student.cgpa || 0) >= Number(job.minimum_cgpa || 0);
  const backlogMatch = Number(student.backlogs || 0) <= Number(job.maximum_backlogs || 0);
  const yearMatch = !job.graduation_year || Number(student.graduation_year) === Number(job.graduation_year);
  const skillsMatch = !requiredSkills.length || requiredSkills.some((skill) => studentSkills.includes(skill));
  const experienceMatch = !Number(job.experience_years || 0) || String(student.experience || "").toLowerCase().includes("year");
  const today = new Date(new Date().toISOString().slice(0, 10));
  const deadlineMatch = !job.application_deadline || new Date(job.application_deadline) >= today;
  const checks = [
    { criterion: "CGPA", label: "CGPA", required: `>= ${job.minimum_cgpa || 0}`, actual: student.cgpa || 0, passed: cgpaMatch, message: cgpaMatch ? `CGPA ${student.cgpa || 0} / Required ${job.minimum_cgpa || 0}` : `CGPA ${student.cgpa || 0} / Required ${job.minimum_cgpa || 0}` },
    { criterion: "Department", label: "Branch", required: branchList.length ? job.eligible_branches : "Any", actual: student.branch || "-", passed: branchMatch, message: branchMatch ? `${student.branch || "Any"} department accepted` : `${student.branch || "Student department"} is not eligible` },
    { criterion: "Active Backlogs", label: "Backlogs", required: `<= ${job.maximum_backlogs || 0}`, actual: student.backlogs || 0, passed: backlogMatch, message: backlogMatch ? `${student.backlogs || 0} backlogs / Maximum ${job.maximum_backlogs || 0}` : `${student.backlogs || 0} backlogs / Maximum ${job.maximum_backlogs || 0}` },
    { criterion: "Batch", label: "Graduation year", required: job.graduation_year || "Any", actual: student.graduation_year || "-", passed: yearMatch, message: yearMatch ? `${student.graduation_year || "Any"} batch accepted` : `Requires ${job.graduation_year} batch` },
    { criterion: "Skills", label: "Skills", required: job.required_skills || "No strict skill requirement", actual: student.skills || "-", passed: skillsMatch, message: skillsMatch ? "Skills match role requirements" : `Add skills like ${job.required_skills}` },
    { criterion: "Experience", label: "Experience", required: job.experience || "Fresher eligible", actual: student.experience || "Fresher", passed: experienceMatch, message: experienceMatch ? "Experience expectation met" : `Experience expectation: ${job.experience}` },
    { criterion: "Deadline", label: "Deadline", required: job.application_deadline || "Open", actual: new Date().toISOString().slice(0, 10), passed: deadlineMatch, message: deadlineMatch ? "Application window is open" : "Application deadline has passed" }
  ];
  const passed = checks.filter((check) => check.passed).length;
  const failedReasons = checks.filter((check) => !check.passed).map((check) => `${check.criterion} requirement not met.`);

  return {
    eligible: checks.every((check) => check.passed),
    score: Math.round((passed / checks.length) * 100),
    checks,
    failedReasons
  };
}
