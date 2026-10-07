import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { DataTable } from "./components/DataTable.jsx";
import { Layout } from "./components/Layout.jsx";
import { ModalForm } from "./components/ModalForm.jsx";
import { SmartAIButton, SmartAIDrawer, SmartAIPagePanel, SmartAIResponse } from "./components/SmartAI.jsx";
import { StatCard } from "./components/StatCard.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { RoleRoute } from "./routes/RoleRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { API_URL, USE_MOCKS } from "./services/apiClient.js";
import { aiService } from "./services/aiService.js";
import { authService } from "./services/authService.js";
import { applicationService } from "./services/applicationService.js";
import { companyService } from "./services/companyService.js";
import { dashboardService } from "./services/dashboardService.js";
import { interviewService } from "./services/interviewService.js";
import { jobService } from "./services/jobService.js";
import { notificationService } from "./services/notificationService.js";
import { reportService } from "./services/reportService.js";
import { resetDb } from "./services/mockData.js";
import { smartAIService } from "./services/smartAIService.js";
import { studentService } from "./services/studentService.js";

const branchOptions = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Business Analytics"
];

const placementStatusOptions = ["PROFILE_PENDING", "ELIGIBLE", "APPLIED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED", "ON_HOLD"];
const jobStatusOptions = ["ACTIVE", "CLOSED", "DRAFT"];
const jobTypeOptions = ["Full-time", "Internship", "Contract"];
const applicationStatusOptions = ["APPLIED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED", "ON_HOLD"];
const interviewStatusOptions = ["SCHEDULED", "COMPLETED", "CANCELLED"];
const interviewModeOptions = ["Online", "Offline", "Hybrid"];
const notificationRoles = ["all", "student", "company", "tpo"];
const allowedResumeTypes = [".pdf", ".doc", ".docx"];
const THEME_KEY = "smartplacify_theme";

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

const navByRole = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: "D" },
    { id: "profile", label: "Profile", icon: "P" },
    { id: "jobs", label: "Jobs", icon: "J" },
    { id: "applications", label: "Applications", icon: "A" },
    { id: "interviews", label: "Interviews", icon: "I" },
    { id: "ai", label: "AI Assistant", icon: "AI" },
    { id: "notifications", label: "Notifications", icon: "N" },
    { id: "settings", label: "Settings", icon: "S" }
  ],
  company: [
    { id: "dashboard", label: "Dashboard", icon: "D" },
    { id: "profile", label: "Profile", icon: "P" },
    { id: "jobs", label: "Jobs", icon: "J" },
    { id: "applications", label: "Applications", icon: "A" },
    { id: "interviews", label: "Interviews", icon: "I" },
    { id: "ai", label: "AI Assistant", icon: "AI" },
    { id: "notifications", label: "Notifications", icon: "N" },
    { id: "settings", label: "Settings", icon: "S" }
  ],
  tpo: [
    { id: "dashboard", label: "Dashboard", icon: "D" },
    { id: "students", label: "Students", icon: "S" },
    { id: "companies", label: "Companies", icon: "C" },
    { id: "jobs", label: "Jobs", icon: "J" },
    { id: "applications", label: "Applications", icon: "A" },
    { id: "interviews", label: "Interviews", icon: "I" },
    { id: "reports", label: "Reports", icon: "R" },
    { id: "ai", label: "AI Assistant", icon: "AI" },
    { id: "notifications", label: "Notifications", icon: "N" },
    { id: "settings", label: "Settings", icon: "S" }
  ]
};

const studentFields = [
  { name: "full_name", label: "Full name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "college_roll_no", label: "College Roll No." },
  { name: "phone", label: "Phone" },
  { name: "college", label: "College" },
  { name: "course", label: "Course" },
  { name: "branch", label: "Branch", type: "select", options: branchOptions },
  { name: "graduation_year", label: "Graduation year", type: "number", min: 2024, max: 2035 },
  { name: "cgpa", label: "CGPA", type: "number", min: 0, max: 10 },
  { name: "percentage", label: "Percentage", type: "number", min: 0, max: 100 },
  { name: "backlogs", label: "Backlogs", type: "number", min: 0, max: 20 },
  { name: "skills", label: "Skills", placeholder: "React, SQL, DSA" },
  { name: "certifications", label: "Certifications" },
  { name: "experience", label: "Experience" },
  { name: "placement_status", label: "Status", type: "select", options: placementStatusOptions },
  { name: "projects", label: "Projects", type: "textarea" }
];

const companyFields = [
  { name: "name", label: "Company name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone" },
  { name: "website", label: "Website" },
  { name: "industry", label: "Industry" },
  { name: "location", label: "Location" },
  { name: "logo", label: "Logo initials" },
  {
    name: "verified",
    label: "Verification",
    type: "select",
    valueType: "boolean",
    options: [
      { label: "Verified", value: true },
      { label: "Pending", value: false }
    ]
  },
  { name: "description", label: "Description", type: "textarea" }
];

function optionRows(rows, labelKey = "name") {
  return rows.map((row) => ({ value: row.id, label: row[labelKey] || row.title || `#${row.id}` }));
}

function normalizeValues(fields, values) {
  return fields.reduce((payload, field) => {
    const value = values[field.name];

    if (field.type === "file") {
      payload[field.name] = value;
    } else if (field.valueType === "boolean") {
      payload[field.name] = value === true || value === "true";
    } else if (field.valueType === "number" || field.type === "number" || field.name.endsWith("_id")) {
      payload[field.name] = value === "" || value === undefined || value === null ? "" : Number(value);
    } else {
      payload[field.name] = value ?? "";
    }

    return payload;
  }, {});
}

function hasValidRole(user) {
  return Boolean(user && navByRole[user.role]);
}

function roleUrl(user, routeId) {
  return `/${hasValidRole(user) ? user.role : "tpo"}/${routeId}`;
}

function dashboardUrl(user) {
  return hasValidRole(user) ? `/${user.role}/dashboard` : "/login";
}

function activeRouteFromPath(pathname) {
  return pathname.split("/")[2] || "dashboard";
}

function compactInitials(name = "SmartPlacify User") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SP";
}

function useToast() {
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return { toast, notify, clearToast: () => setToast(null) };
}

function validateResume(file) {
  if (!file) return "Choose a resume file.";
  const fileName = file.name.toLowerCase();
  const validExtension = allowedResumeTypes.some((extension) => fileName.endsWith(extension));

  if (!validExtension) {
    return "Upload a PDF, DOC, or DOCX resume.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Resume must be under 5 MB.";
  }

  return "";
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (["active", "selected", "verified", "scheduled", "shortlisted", "interview_scheduled", "eligible"].includes(value)) return "success";
  if (["rejected", "closed", "cancelled", "not_eligible"].includes(value)) return "danger";
  if (["interview", "applied", "on_hold", "not_applied"].includes(value)) return "info";
  return "neutral";
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`global-toast ${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}

function ConfirmDialog({ confirm, onCancel, onConfirm }) {
  if (!confirm) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={confirm.title}>
      <section className="confirm-card">
        <h2>{confirm.title}</h2>
        <p>{confirm.message}</p>
        <div className="modal-actions">
          <button className="link-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-action danger-action" type="button" onClick={onConfirm}>{confirm.confirmLabel || "Confirm"}</button>
        </div>
      </section>
    </div>
  );
}

function useConfirm() {
  const [confirm, setConfirm] = useState(null);

  const ask = useCallback((options) =>
    new Promise((resolve) => {
      setConfirm({
        ...options,
        resolve
      });
    }), []);

  function onCancel() {
    confirm?.resolve(false);
    setConfirm(null);
  }

  function onConfirm() {
    confirm?.resolve(true);
    setConfirm(null);
  }

  return { confirm, ask, onCancel, onConfirm };
}

function LoadingPanel({ label = "Loading..." }) {
  return <div className="empty-state loading-state">{label}</div>;
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="empty-state error-panel">
      <strong>{message}</strong>
      {onRetry ? <button type="button" onClick={onRetry}>Retry</button> : null}
    </div>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <small className="breadcrumb">SmartPlacify / {title}</small>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </div>
  );
}

function FilterBar({ children }) {
  return <div className="filter-bar">{children}</div>;
}

function DetailsModal({ title, item, onClose }) {
  if (!item) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <section className="modal-card details-card">
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            <small>Record #{item.id}</small>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="details-grid">
          {Object.entries(item)
            .filter(([key]) => !["password"].includes(key))
            .map(([key, value]) => (
              <div key={key}>
                <small>{key.replaceAll("_", " ")}</small>
                <strong>{value === true ? "Yes" : value === false ? "No" : value === "" || value === null || value === undefined ? "-" : value}</strong>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function AuthScreen({ initialMode = "login" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    email: "admin@test.com",
    password: "password123",
    name: "Dr. Anjali Sharma",
    role: "tpo"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      setError("Complete all required fields.");
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        const loggedInUser = await login(form.email, form.password);
        navigate(`/${loggedInUser.role}/dashboard`, { replace: true });
      } else {
        const registeredUser = await register(form);
        navigate(`/${registeredUser.role}/dashboard`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function useDemo(email, name, role) {
    setMode("login");
    setForm({ email, password: "password123", name, role });
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="brand-mark">S</span>
        <div>
          <h1>{mode === "login" ? "Welcome back" : "Create SmartPlacify account"}</h1>
          <p>Sign in with a role-based demo account or create a local account.</p>
        </div>
        {mode === "register" ? (
          <input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        ) : null}
        <input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <label className="password-field">
          <input placeholder="Password" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "Hide" : "Show"}</button>
        </label>
        {mode === "register" ? (
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="student">Student</option>
            <option value="company">Company</option>
            <option value="tpo">TPO/Admin</option>
          </select>
        ) : null}
        {error ? <div className="toast error">{error}</div> : null}
        <button className="primary-action" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}</button>
        <button className="link-button" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Create account" : "Already have an account?"}
        </button>
        <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
        <div className="demo-grid">
          <button type="button" onClick={() => useDemo("admin@test.com", "Dr. Anjali Sharma", "tpo")}>TPO demo</button>
          <button type="button" onClick={() => useDemo("student@test.com", "Aarav Mehta", "student")}>Student demo</button>
          <button type="button" onClick={() => useDemo("company@test.com", "Priya Kapoor", "company")}>Company demo</button>
        </div>
        <small>Password for demo accounts: <strong>password123</strong></small>
      </form>
    </main>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid registered email address.");
      return;
    }

    setLoading(true);
    authService.requestPasswordReset(email)
      .then((result) => setMessage(result.message))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="brand-mark">S</span>
        <div>
          <h1>Reset password</h1>
          <p>Enter your email to receive mock reset instructions.</p>
        </div>
        <input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {error ? <div className="toast error">{error}</div> : null}
        {message ? <div className="toast">{message}</div> : null}
        <button className="primary-action" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button>
        <Link className="auth-link" to="/login">Back to login</Link>
      </form>
    </main>
  );
}

function Hero({ data }) {
  return (
    <section className="hero-panel">
      <div>
        <h1>{data.greeting}</h1>
        <p>{data.subtitle}</p>
      </div>
      <div className="season-card">
        <span>SP</span>
        <strong>{data.season}</strong>
        <small>{data.campus}</small>
      </div>
    </section>
  );
}

function niceChartAxis(maxValue) {
  const safeMax = Math.max(1, Math.ceil(Number(maxValue) || 0));
  const roughStep = safeMax / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, Math.round(niceFactor * magnitude));
  const max = Math.max(step, Math.ceil(safeMax / step) * step);
  const ticks = [];

  for (let value = max; value >= 0; value -= step) {
    ticks.push(value);
  }

  if (ticks[ticks.length - 1] !== 0) ticks.push(0);
  return { max, ticks };
}

function monthlyMax(monthly = [], series = []) {
  return Math.max(1, ...monthly.flatMap((item) => series.map((entry) => Number(item[entry.key] || 0))));
}

function PlacementSeriesChart({ monthly = [], series: customSeries }) {
  const rows = monthly.length ? monthly : [];
  const series = customSeries || [
    { key: "applications", label: "Applications" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "interviews", label: "Interviews" },
    { key: "offers", label: "Offers" }
  ];
  const axis = niceChartAxis(monthlyMax(rows, series));
  const gridStep = `${100 / Math.max(1, axis.ticks.length - 1)}%`;

  return (
    <div className="placement-chart-wrap">
      <div className="placement-chart-legend">
        {series.map((item) => <span key={item.key} className={item.key}>{item.label}</span>)}
      </div>
      <div className="smart-chart-frame">
        <div className="chart-y-axis" aria-hidden="true">
          {axis.ticks.map((tick) => <span key={tick}>{tick}</span>)}
        </div>
        <div className="placement-series-chart" style={{ "--chart-count": rows.length || 1, "--grid-step": gridStep }}>
          {rows.map((item) => {
            const tooltip = [`${item.month} 2026`, ...series.map((entry) => `${entry.label}: ${item[entry.key] ?? 0}`)].join("\n");
            return (
              <div className="placement-month" key={item.month} title={tooltip}>
                <div className="placement-bars">
                  {series.map((entry) => {
                    const fallbackRatio = ["shortlisted"].includes(entry.key) ? 0.62 : ["interviews", "interviewed"].includes(entry.key) ? 0.38 : ["offers", "hired"].includes(entry.key) ? 0.22 : 1;
                    const value = Number(item[entry.key] ?? Math.max(0, Math.round((item.applications || 0) * fallbackRatio)));
                    return (
                      <span
                        key={entry.key}
                        className={`placement-bar ${entry.key}`}
                        style={{ height: `${Math.max(3, Math.round((value / axis.max) * 100))}%` }}
                        title={`${item.month} ${entry.label}: ${value}`}
                        aria-label={`${item.month} ${entry.label}: ${value}`}
                      >
                        <b>{value}</b>
                      </span>
                    );
                  })}
                </div>
                <small>{item.month}</small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkillDemandBars({ skills = [] }) {
  const fallback = [
    { name: "Python", demand: 88 },
    { name: "SQL", demand: 82, match: true },
    { name: "React", demand: 76, match: true },
    { name: "AWS", demand: 68 },
    { name: "Java", demand: 61 },
    { name: "DSA", demand: 57 }
  ];
  const rows = (skills.length ? skills : fallback).slice(0, 6).map((skill) => ({
    ...skill,
    demand: Number(skill.demand) <= 10 ? Number(skill.demand) * 12 : Number(skill.demand)
  }));

  return (
    <div className="skill-demand-list">
      {rows.map((skill) => (
        <div className="skill-demand-row" key={skill.name}>
          <div>
            <strong>{skill.name}</strong>
            <small>{skill.match ? "Profile Match" : "Market Demand"} {Math.min(100, skill.demand)}%</small>
          </div>
          <span className="skill-track" title={`${skill.name}: ${Math.min(100, skill.demand)}% demand`}><b style={{ width: `${Math.min(100, skill.demand)}%` }} /></span>
          <em>{Math.min(100, skill.demand)}%</em>
        </div>
      ))}
    </div>
  );
}

function StudentAIInsightPanel({ data, onOpen }) {
  const readiness = data.readiness || { score: 82, ats: 86, skills: 78, interview: 80 };

  return (
    <article className="panel student-ai-insight">
      <div className="ai-insight-main">
        <span className="smart-ai-spark">AI</span>
        <div>
          <h2>Smart AI Insights</h2>
          <p>{data.aiInsight || "Your profile is placement-ready. Improve role keywords, project metrics, and interview stories to increase shortlist chances."}</p>
        </div>
        <strong>{readiness.score}/100</strong>
      </div>
      <div className="readiness-mini-grid">
        <button type="button" onClick={() => onOpen({ page: "dashboard", prompt: "Placement readiness" })}>
          <span>{readiness.ats}%</span>
          <small>ATS Ready</small>
        </button>
        <button type="button" onClick={() => onOpen({ page: "jobs", prompt: "Recommended jobs" })}>
          <span>{readiness.skills}%</span>
          <small>Recommended Jobs</small>
        </button>
        <button type="button" onClick={() => onOpen({ page: "profile", prompt: "Skill gaps" })}>
          <span>{readiness.interview}%</span>
          <small>Skill Gaps</small>
        </button>
      </div>
    </article>
  );
}

function CompanyMark({ logo, name }) {
  return <span className="company-mark">{logo || String(name || "SP").slice(0, 2).toUpperCase()}</span>;
}

function StudentApplicationsPanel({ applications = [], onViewAll }) {
  return (
    <article className="panel wide recent-applications-panel">
      <div className="panel-head">
        <h2>Recent Applications</h2>
        <button type="button" onClick={onViewAll}>View All</button>
      </div>
      <div className="application-list">
        {applications.length ? applications.slice(0, 5).map((application) => (
          <div className="application-card-row" key={application.id}>
            <CompanyMark logo={application.company_logo} name={application.company_name} />
            <p>
              <strong>{application.company_name}</strong>
              <small>{application.job_title} • {application.location || "Campus"} • {application.salary_package || "Package TBA"}</small>
            </p>
            <span>{application.applied_at || "Recently"}</span>
            <Badge tone={statusTone(application.status)}>{application.status}</Badge>
          </div>
        )) : <div className="empty-state">No applications yet.</div>}
      </div>
    </article>
  );
}

function StudentInterviewsPanel({ interviews = [], onViewAll, onPrepare }) {
  return (
    <article className="panel upcoming-interviews-panel">
      <div className="panel-head">
        <h2>Upcoming Interviews</h2>
        <button type="button" onClick={onViewAll}>View All</button>
      </div>
      <ul className="activity-list interview-list polished-interviews">
        {interviews.length ? interviews.map((interview) => (
          <li className="interview-card" key={interview.id}>
            <span className="interview-date">
              <strong>{interview.interview_date?.slice(-2) || "—"}</strong>
              <small>{interview.interview_date?.slice(5, 7) || "OCT"}</small>
            </span>
            <CompanyMark logo={interview.company_logo} name={interview.company_name} />
            <p>
              <strong>{interview.company_name}</strong>
              <small>{interview.round_name} • {interview.interview_time || "Time TBA"} • {interview.mode || "Online"}</small>
            </p>
            <button type="button" className="prepare-ai-btn" onClick={() => onPrepare(interview)}>Prepare with AI</button>
          </li>
        )) : <li className="empty-state">No interviews scheduled.</li>}
      </ul>
    </article>
  );
}

function Dashboard({ user, navigate, notify, openSmartAI }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await dashboardService.getDashboard(user));
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function exportPlacementReport() {
    if (user.role !== "tpo" || exporting) return;
    try {
      setExporting(true);
      notify("Preparing report...");
      await reportService.exportFullPlacementReport(user);
      notify("Placement report exported successfully");
    } catch (err) {
      notify(err.message || "Unable to export report. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  if (error) return <ErrorPanel message={error} onRetry={load} />;
  if (!data) return <LoadingPanel label="Loading dashboard..." />;

  return (
    <>
      <Hero data={data} />
      {user.role === "student" ? (
        <StudentAIInsightPanel data={data} onOpen={openSmartAI} />
      ) : (
        <SmartAIPagePanel user={user} page="dashboard" context={{ label: `${user.name} • Main Dashboard` }} onOpen={openSmartAI} />
      )}
      {user.role === "tpo" ? (
        <section className="dashboard-actions panel">
          <div>
            <h2>Post a campus job</h2>
            <p>Create a role, choose the company, set eligibility, and publish it to students.</p>
          </div>
          <div className="header-actions">
            <button type="button" className="link-button" onClick={exportPlacementReport} disabled={exporting}>{exporting ? "Preparing report..." : "Export Excel"}</button>
            <button type="button" className="primary-action" onClick={() => navigate("jobs/create")}>Create Job</button>
            <button type="button" className="link-button" onClick={() => navigate("jobs")}>Manage Jobs</button>
          </div>
        </section>
      ) : null}
      <section className="kpi-grid">
        {data.stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} tone={item.tone} trend={item.trend} />
        ))}
      </section>
      <section className="content-grid">
        <article className="panel wide">
          <div className="panel-head">
            <div>
              <h2>{data.chartTitle || "Placement Funnel Trend"}</h2>
              <small>{data.chartSubtitle || (data.placement_percentage !== undefined ? `${data.placement_percentage}% placed` : "Live hiring activity")}</small>
            </div>
            <button type="button" onClick={() => navigate(user.role === "tpo" ? "reports" : "applications")}>View All</button>
          </div>
          <div className="placement-chart-shell">
            <PlacementSeriesChart monthly={data.monthly || []} series={data.chartSeries} />
          </div>
        </article>
        <article className="panel skills-panel">
          <div className="panel-head">
            <h2>{user.role === "company" ? "Candidate Pipeline" : user.role === "student" ? "Skills & Market Fit" : "Top Skills in Demand"}</h2>
            <button type="button" onClick={() => navigate(user.role === "tpo" ? "students" : "applications")}>View All</button>
          </div>
          {user.role === "company" ? (
            (data.recentApplications || []).slice(0, 6).map((item, index) => (
              <div className="activity-mini" key={item.id || index}>
                <strong>{item.student_name}</strong>
                <small>{item.job_title} - {item.status}</small>
              </div>
            ))
          ) : <SkillDemandBars skills={data.skill_demand || data.skills || []} />}
        </article>
      </section>
      <section className="content-grid">
        {user.role === "student" ? (
          <>
            <StudentApplicationsPanel applications={data.recentApplications || []} onViewAll={() => navigate("applications")} />
            <StudentInterviewsPanel
              interviews={data.interviews || []}
              onViewAll={() => navigate("interviews")}
              onPrepare={(interview) => openSmartAI({ page: "interviews", context: { label: `${interview.company_name} • ${interview.round_name}` }, prompt: "Prepare for my upcoming interview" })}
            />
          </>
        ) : (
          <>
            <article className="panel wide">
              <div className="panel-head">
                <h2>Recent Applications</h2>
                <button type="button" onClick={() => navigate("applications")}>View All</button>
              </div>
              <DataTable
                rows={data.recentApplications || []}
                pageSize={4}
                columns={[
                  { key: "student_name", label: "Student" },
                  { key: "job_title", label: "Job" },
                  { key: "company_name", label: "Company" },
                  { key: "status", label: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> }
                ]}
                emptyText="No applications yet."
              />
            </article>
            <article className="panel upcoming-interviews-panel">
              <div className="panel-head">
                <h2>Upcoming Interviews</h2>
                <button type="button" onClick={() => navigate("interviews")}>View All</button>
              </div>
              <ul className="activity-list interview-list">
                {(data.interviews || []).length ? data.interviews.map((interview) => (
                  <li className="interview-card" key={interview.id}>
                    <span className="interview-date">{interview.interview_date?.slice(-2) || "I"}</span>
                    <p>
                      <strong>{interview.student_name}</strong>
                      <small>{interview.company_name} • {interview.round_name}</small>
                    </p>
                    <Badge tone={statusTone(interview.status)}>{interview.status}</Badge>
                  </li>
                )) : <li className="empty-state">No interviews scheduled.</li>}
              </ul>
            </article>
          </>
        )}
      </section>
    </>
  );
}

function ResumeUploadModal({ student, onClose, onUploaded, notify }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(payload) {
    const file = payload.resume;
    const validationError = validateResume(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setBusy(true);
      await studentService.uploadResume(student.id, file);
      notify("Resume uploaded successfully.");
      onUploaded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ModalForm
        title={`Upload resume for ${student.full_name}`}
        fields={[{
          name: "resume",
          label: "Resume file",
          type: "file",
          accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          required: true,
          helper: "PDF, DOC, or DOCX up to 5 MB."
        }]}
        values={values}
        setValues={setValues}
        onSubmit={upload}
        onClose={onClose}
        submitLabel="Upload Resume"
        busy={busy}
      />
      {error ? <div className="global-toast error"><span>{error}</span><button type="button" onClick={() => setError("")}>Close</button></div> : null}
    </>
  );
}

function StudentsView({ search, notify, askConfirm, user, openSmartAI }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ branch: "All", placement_status: "All" });
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [resumeStudent, setResumeStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await studentService.list({ search, filters, pageSize: 100 });
      setRows(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(values) {
    try {
      setSaving(true);
      const payload = normalizeValues(studentFields, { ...editing, ...values });
      if (editing?.id) payload.id = editing.id;
      await studentService.save(payload);
      notify(editing?.id ? "Student updated successfully." : "Student created successfully.");
      setEditing(null);
      await load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    const ok = await askConfirm({
      title: "Delete student?",
      message: `${row.full_name} will be removed from the local placement records.`,
      confirmLabel: "Delete"
    });

    if (!ok) return;

    await studentService.remove(row.id);
    notify("Student deleted.");
    load();
  }

  async function exportStudents() {
    if (user.role !== "tpo" || exporting) return;
    try {
      setExporting(true);
      reportService.exportStudents(rows, "SmartPlacify_Students.xlsx");
      notify("Students exported successfully");
    } catch (err) {
      notify(err.message || "Unable to export students. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Manage student profiles, eligibility, placement status, and resumes."
        actions={(
          <>
            <button type="button" className="link-button" onClick={() => openSmartAI({ page: "students", context: { label: "TPO • Student Intelligence" } })}>Analyze with Smart AI</button>
            {user.role === "tpo" ? <button type="button" className="link-button" onClick={exportStudents} disabled={exporting}>{exporting ? "Exporting..." : "Export Students"}</button> : null}
            <button type="button" className="primary-action" onClick={() => setEditing({ placement_status: "ELIGIBLE", graduation_year: 2027, backlogs: 0 })}>Create Student</button>
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="students" context={{ label: "Student profiles • Placement risk" }} onOpen={openSmartAI} />
      <section className="panel">
        <FilterBar>
          <label>
            <span>Branch</span>
            <select value={filters.branch} onChange={(event) => setFilters({ ...filters, branch: event.target.value })}>
              <option>All</option>
              {branchOptions.map((branch) => <option key={branch}>{branch}</option>)}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={filters.placement_status} onChange={(event) => setFilters({ ...filters, placement_status: event.target.value })}>
              <option>All</option>
              {placementStatusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setFilters({ branch: "All", placement_status: "All" })}>Clear Filters</button>
        </FilterBar>
        {loading ? <LoadingPanel label="Loading students..." /> : null}
        {error ? <ErrorPanel message={error} onRetry={load} /> : null}
        {!loading && !error ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "full_name", label: "Name" },
              { key: "college_roll_no", label: "Roll No.", render: (row) => row.college_roll_no || `SP${String(row.id).padStart(4, "0")}` },
              { key: "branch", label: "Branch" },
              { key: "cgpa", label: "CGPA" },
              { key: "backlogs", label: "Backlogs" },
              { key: "placement_status", label: "Status", render: (row) => <Badge tone={statusTone(row.placement_status)}>{row.placement_status}</Badge> },
              { key: "resume_name", label: "Resume", render: (row) => row.resume_name || "Missing" }
            ]}
            emptyText="No students match the current search."
            actions={(row) => (
              <>
                <button type="button" onClick={() => setDetails(row)}>View</button>
                <button type="button" onClick={() => setEditing(row)}>Edit</button>
                <button type="button" onClick={() => setResumeStudent(row)}>Resume</button>
                <button type="button" onClick={() => remove(row)}>Delete</button>
              </>
            )}
          />
        ) : null}
      </section>
      {editing ? (
        <ModalForm title={editing.id ? "Edit Student" : "Create Student"} fields={studentFields} values={editing} setValues={setEditing} onSubmit={save} onClose={() => setEditing(null)} busy={saving} />
      ) : null}
      {details ? <DetailsModal title={details.full_name} item={details} onClose={() => setDetails(null)} /> : null}
      {resumeStudent ? <ResumeUploadModal student={resumeStudent} onClose={() => setResumeStudent(null)} onUploaded={load} notify={notify} /> : null}
    </>
  );
}

function CompaniesView({ search, notify, askConfirm, currentCompanyId, user, openSmartAI }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ verified: "All" });
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await companyService.list({ search, filters, pageSize: 100 });
      setRows(currentCompanyId ? result.data.filter((company) => company.id === currentCompanyId) : result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, filters, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(values) {
    try {
      setSaving(true);
      const payload = normalizeValues(companyFields, { ...editing, ...values });
      if (editing?.id) payload.id = editing.id;
      await companyService.save(payload);
      notify(editing?.id ? "Company updated successfully." : "Company created successfully.");
      setEditing(null);
      await load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    const ok = await askConfirm({
      title: "Delete company?",
      message: `${row.name} will be removed from local company records.`,
      confirmLabel: "Delete"
    });

    if (!ok) return;

    await companyService.remove(row.id);
    notify("Company deleted.");
    load();
  }

  async function verify(row) {
    await companyService.verify(row.id, !row.verified);
    notify(row.verified ? "Company moved to pending." : "Company verified.");
    load();
  }

  return (
    <>
      <PageHeader
        title={currentCompanyId ? "Company Profile" : "Companies"}
        subtitle={currentCompanyId ? "Keep employer profile details ready for TPO approval." : "Manage recruiters, verification, and hiring partners."}
        actions={(
          <>
            <button type="button" className="link-button" onClick={() => openSmartAI({ page: "companies", context: { label: currentCompanyId ? "Company Profile • Candidate Match" : "Companies • Partner Intelligence" } })}>AI Candidate Match</button>
            {!currentCompanyId ? <button type="button" className="primary-action" onClick={() => setEditing({ verified: false })}>Create Company</button> : null}
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="companies" context={{ label: currentCompanyId ? "Company Profile" : "Company partners" }} onOpen={openSmartAI} />
      <section className="panel">
        {!currentCompanyId ? (
          <FilterBar>
            <label>
              <span>Verification</span>
              <select value={filters.verified} onChange={(event) => setFilters({ verified: event.target.value })}>
                <option>All</option>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </label>
            <button type="button" onClick={() => setFilters({ verified: "All" })}>Clear Filters</button>
          </FilterBar>
        ) : null}
        {loading ? <LoadingPanel label="Loading companies..." /> : null}
        {error ? <ErrorPanel message={error} onRetry={load} /> : null}
        {!loading && !error ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "name", label: "Company" },
              { key: "industry", label: "Industry" },
              { key: "location", label: "Location" },
              { key: "email", label: "Email" },
              { key: "verified", label: "Verified", render: (row) => <Badge tone={row.verified ? "success" : "neutral"}>{row.verified ? "Verified" : "Pending"}</Badge> }
            ]}
            emptyText="No companies found."
            actions={(row) => (
              <>
                <button type="button" onClick={() => setDetails(row)}>View</button>
                <button type="button" onClick={() => setEditing(row)}>Edit</button>
                {!currentCompanyId ? <button type="button" onClick={() => verify(row)}>{row.verified ? "Unverify" : "Verify"}</button> : null}
                {!currentCompanyId ? <button type="button" onClick={() => remove(row)}>Delete</button> : null}
              </>
            )}
          />
        ) : null}
      </section>
      {editing ? (
        <ModalForm title={editing.id ? "Edit Company" : "Create Company"} fields={companyFields} values={editing} setValues={setEditing} onSubmit={save} onClose={() => setEditing(null)} busy={saving} />
      ) : null}
      {details ? <DetailsModal title={details.name} item={details} onClose={() => setDetails(null)} /> : null}
    </>
  );
}

function buildJobFields(companies, user) {
  const fields = [
    { name: "title", label: "Job title", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "location", label: "Location" },
    { name: "job_type", label: "Job type", type: "select", options: jobTypeOptions },
    { name: "salary_package", label: "Salary/package" },
    { name: "experience", label: "Experience" },
    { name: "experience_years", label: "Experience years", type: "number", min: 0, max: 10 },
    { name: "required_skills", label: "Required skills", helper: "Comma-separated skills." },
    { name: "minimum_cgpa", label: "Eligibility Criteria - Minimum CGPA", type: "number", min: 0, max: 10 },
    { name: "maximum_backlogs", label: "Eligibility Criteria - Maximum backlogs", type: "number", min: 0, max: 20 },
    { name: "eligible_branches", label: "Eligibility Criteria - Eligible branches", helper: "Comma-separated branch names." },
    { name: "graduation_year", label: "Eligibility Criteria - Graduation year", type: "number", min: 2024, max: 2035 },
    { name: "application_deadline", label: "Deadline", type: "date" },
    { name: "openings", label: "Openings", type: "number", min: 1 },
    { name: "status", label: "Status", type: "select", options: jobStatusOptions }
  ];

  if (user.role === "tpo") {
    return [{ name: "company_id", label: "Company", type: "select", valueType: "number", options: optionRows(companies), required: true }, ...fields];
  }

  return fields;
}

function EligibilityCheckList({ checks = [] }) {
  return (
    <div className="eligibility-check-list">
      {checks.map((check) => (
        <p key={check.criterion || check.label} className={check.passed ? "pass" : "fail"}>
          <span>{check.passed ? "✓" : "✕"}</span>
          <strong>{check.criterion || check.label}</strong>
          <small>{check.message}</small>
        </p>
      ))}
    </div>
  );
}

function JobsView({ user, search, notify, askConfirm, goTo, openSmartAI }) {
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "All", job_type: "All" });
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityRoster, setEligibilityRoster] = useState(null);
  const [eligibilityFilters, setEligibilityFilters] = useState({ eligibility: "All", application: "All", department: "All", batch: "All" });
  const [exportingEligibility, setExportingEligibility] = useState(false);
  const canManage = user.role !== "student";

  const jobFields = useMemo(() => buildJobFields(companies, user), [companies, user]);
  const jobColumns = useMemo(() => [
    { key: "title", label: "Job" },
    { key: "company_name", label: "Company" },
    { key: "location", label: "Location" },
    { key: "minimum_cgpa", label: "CGPA" },
    { key: "salary_package", label: "Package" },
    ...(user.role === "student" ? [
      { key: "eligibility_status", label: "Eligibility", render: (row) => <Badge tone={statusTone(row.eligibility_status)}>{row.eligibility_status === "ELIGIBLE" ? "✓ Eligible" : "Not Eligible"}</Badge> }
    ] : [
      { key: "eligible_count", label: "Eligible", render: (row) => row.eligibility_summary ? `${row.eligibility_summary.eligible}/${row.eligibility_summary.total}` : "-" },
      { key: "applied_count", label: "Applied", render: (row) => row.eligibility_summary?.applied ?? "-" }
    ]),
    { key: "status", label: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> }
  ], [user.role]);
  const jobsForYou = user.role === "student" ? rows.filter((row) => row.eligibility?.eligible) : rows;
  const notEligibleJobs = user.role === "student" ? rows.filter((row) => row.eligibility && !row.eligibility.eligible) : [];
  const eligibilityDepartments = [...new Set((eligibilityRoster?.students || []).map((row) => row.department).filter(Boolean))];
  const eligibilityBatches = [...new Set((eligibilityRoster?.students || []).map((row) => row.batch).filter(Boolean))];
  const filteredEligibilityStudents = (eligibilityRoster?.students || []).filter((row) => {
    const eligibilityOk = eligibilityFilters.eligibility === "All" || row.eligibility_status === eligibilityFilters.eligibility;
    const applicationOk = eligibilityFilters.application === "All" || row.application_status === eligibilityFilters.application;
    const departmentOk = eligibilityFilters.department === "All" || row.department === eligibilityFilters.department;
    const batchOk = eligibilityFilters.batch === "All" || String(row.batch) === String(eligibilityFilters.batch);
    return eligibilityOk && applicationOk && departmentOk && batchOk;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobsResult, companyRows] = await Promise.all([
        jobService.list({
          search,
          filters,
          companyId: user.role === "company" ? user.company_id : undefined,
          activeOnly: user.role === "student",
          studentId: user.role === "student" ? user.student_id : undefined,
          includeEligibilitySummary: canManage,
          pageSize: 100
        }),
        companyService.all()
      ]);
      setRows(jobsResult.data);
      setCompanies(companyRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [canManage, filters, search, user.company_id, user.role, user.student_id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(values) {
    try {
      const payload = normalizeValues(jobFields, { ...editing, ...values });
      if (editing?.id) payload.id = editing.id;
      if (user.role === "company") payload.company_id = user.company_id;
      const saved = await jobService.save(payload);
      if (canManage && saved?.id) {
        const summary = await jobService.eligibilitySummary(saved.id);
        notify(`${editing?.id ? "Job updated" : "Job created"}: ${summary.eligible} of ${summary.total} students are eligible.`);
      } else {
        notify(editing?.id ? "Job updated successfully." : "Job created successfully.");
      }
      setEditing(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function remove(row) {
    const ok = await askConfirm({
      title: "Delete job?",
      message: `${row.title} will be removed from job listings.`,
      confirmLabel: "Delete"
    });

    if (!ok) return;

    await jobService.remove(row.id);
    notify("Job deleted.");
    load();
  }

  async function check(row) {
    try {
      const result = await jobService.checkEligibility(row.id, user.student_id);
      setEligibility({ job: row, ...result });
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function apply(row) {
    if (row.eligibility && !row.eligibility.eligible) {
      setEligibility({ job: row, ...row.eligibility });
      notify("You are not eligible for this job yet.", "error");
      return;
    }

    try {
      await applicationService.apply(user.student_id, row.id);
      notify("Application submitted successfully.");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function viewEligibility(row) {
    try {
      setEligibilityRoster(await jobService.eligibilitySummary(row.id));
      setEligibilityFilters({ eligibility: "All", application: "All", department: "All", batch: "All" });
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function toggleStatus(row) {
    try {
      await jobService.save({
        ...row,
        status: row.status === "ACTIVE" ? "CLOSED" : "ACTIVE"
      });
      notify(row.status === "ACTIVE" ? "Job deactivated." : "Job activated.");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function exportEligibleStudents() {
    if (!eligibilityRoster || exportingEligibility) return;
    try {
      setExportingEligibility(true);
      reportService.exportEligibleStudents(eligibilityRoster, filteredEligibilityStudents, `SmartPlacify_${eligibilityRoster.job.title}_Eligibility.xlsx`);
      notify("Eligible-student report exported successfully");
    } catch (err) {
      notify(err.message || "Unable to export eligible students. Please try again.", "error");
    } finally {
      setExportingEligibility(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle={canManage ? "Create, edit, publish, and manage campus hiring roles." : "Discover eligible jobs and apply directly from the portal."}
        actions={(
          <>
            <button type="button" className="link-button" onClick={() => openSmartAI({ page: "jobs", context: { label: canManage ? "Jobs • Matching students" : "Jobs • Eligibility and fit" } })}>{canManage ? "Find Matching Students" : "AI Job Match"}</button>
            {canManage ? <button type="button" className="primary-action" onClick={() => setEditing({ status: "ACTIVE", job_type: "Full-time", maximum_backlogs: 0, graduation_year: 2027 })}>Create Job</button> : null}
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="jobs" context={{ label: canManage ? "Job pipeline • Candidate matching" : "Student jobs • Recommendations" }} onOpen={openSmartAI} />
      <section className="panel">
        <FilterBar>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option>All</option>
              {jobStatusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            <span>Type</span>
            <select value={filters.job_type} onChange={(event) => setFilters({ ...filters, job_type: event.target.value })}>
              <option>All</option>
              {jobTypeOptions.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setFilters({ status: "All", job_type: "All" })}>Clear Filters</button>
        </FilterBar>
        {loading ? <LoadingPanel label="Loading jobs..." /> : null}
        {error ? <ErrorPanel message={error} onRetry={load} /> : null}
        {!loading && !error && user.role !== "student" ? (
          <DataTable
            rows={rows}
            columns={jobColumns}
            emptyText="No jobs found."
            actions={(row) => (
              <>
                <button type="button" onClick={() => setDetails(row)}>View</button>
                {canManage ? <button type="button" onClick={() => viewEligibility(row)}>View Eligible Students</button> : null}
                {canManage ? <button type="button" onClick={() => toggleStatus(row)}>{row.status === "ACTIVE" ? "Deactivate" : "Activate"}</button> : null}
                {canManage ? <button type="button" onClick={() => setEditing(row)}>Edit</button> : null}
                {canManage ? <button type="button" onClick={() => remove(row)}>Delete</button> : null}
              </>
            )}
          />
        ) : null}
        {!loading && !error && user.role === "student" ? (
          <div className="job-eligibility-groups">
            <section>
              <div className="panel-head">
                <h2>Jobs For You</h2>
                <Badge tone="success">{jobsForYou.length} eligible</Badge>
              </div>
              <DataTable
                rows={jobsForYou}
                columns={jobColumns}
                emptyText="No eligible jobs found yet."
                actions={(row) => (
                  <>
                    <button type="button" onClick={() => setDetails(row)}>View</button>
                    <button type="button" onClick={() => setEligibility({ job: row, ...row.eligibility })}>Why eligible?</button>
                    <button type="button" className="apply-action" onClick={() => apply(row)} disabled={row.application_status !== "NOT_APPLIED"}>{row.application_status === "NOT_APPLIED" ? "Apply" : row.application_status}</button>
                  </>
                )}
              />
            </section>
            <section>
              <div className="panel-head">
                <h2>Not Eligible</h2>
                <Badge tone="danger">{notEligibleJobs.length} jobs</Badge>
              </div>
              <DataTable
                rows={notEligibleJobs}
                columns={jobColumns}
                emptyText="No ineligible jobs."
                actions={(row) => (
                  <>
                    <button type="button" onClick={() => setDetails(row)}>View</button>
                    <button type="button" onClick={() => setEligibility({ job: row, ...row.eligibility })}>Why not?</button>
                    <button type="button" className="apply-action" disabled>Apply</button>
                  </>
                )}
              />
            </section>
          </div>
        ) : null}
      </section>
      {eligibilityRoster ? (
        <section className="panel eligibility-roster-panel">
          <div className="panel-head">
            <div>
              <h2>{eligibilityRoster.job.company_name} - {eligibilityRoster.job.title}</h2>
              <small>Total {eligibilityRoster.total} • Eligible {eligibilityRoster.eligible} • Not Eligible {eligibilityRoster.notEligible} • Applied {eligibilityRoster.applied}</small>
            </div>
            <div className="header-actions">
              <button type="button" className="link-button" onClick={exportEligibleStudents} disabled={exportingEligibility}>{exportingEligibility ? "Exporting..." : "Export Eligible Students"}</button>
              <button type="button" onClick={() => setEligibilityRoster(null)}>Close</button>
            </div>
          </div>
          <FilterBar>
            <label><span>Eligibility</span><select value={eligibilityFilters.eligibility} onChange={(event) => setEligibilityFilters({ ...eligibilityFilters, eligibility: event.target.value })}><option>All</option><option value="ELIGIBLE">Eligible</option><option value="NOT_ELIGIBLE">Not Eligible</option></select></label>
            <label><span>Application</span><select value={eligibilityFilters.application} onChange={(event) => setEligibilityFilters({ ...eligibilityFilters, application: event.target.value })}><option>All</option><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="SELECTED">Selected</option><option value="NOT_APPLIED">Not Applied</option></select></label>
            <label><span>Department</span><select value={eligibilityFilters.department} onChange={(event) => setEligibilityFilters({ ...eligibilityFilters, department: event.target.value })}><option>All</option>{eligibilityDepartments.map((department) => <option key={department}>{department}</option>)}</select></label>
            <label><span>Batch</span><select value={eligibilityFilters.batch} onChange={(event) => setEligibilityFilters({ ...eligibilityFilters, batch: event.target.value })}><option>All</option>{eligibilityBatches.map((batch) => <option key={batch}>{batch}</option>)}</select></label>
          </FilterBar>
          <DataTable
            rows={filteredEligibilityStudents}
            columns={[
              { key: "student_roll_no", label: "Roll No.", render: (row) => row.student_roll_no || "-" },
              { key: "student_name", label: "Student" },
              { key: "department", label: "Department" },
              { key: "cgpa", label: "CGPA" },
              { key: "batch", label: "Batch" },
              { key: "backlogs", label: "Backlogs" },
              { key: "eligibility_status", label: "Eligibility", render: (row) => <Badge tone={statusTone(row.eligibility_status)}>{row.eligibility_status === "ELIGIBLE" ? "Eligible" : "Not Eligible"}</Badge> },
              { key: "application_status", label: "Application", render: (row) => <Badge tone={statusTone(row.application_status)}>{row.application_status.replace("_", " ")}</Badge> }
            ]}
            emptyText="No students match these filters."
            actions={(row) => <button type="button" onClick={() => setEligibility({ job: eligibilityRoster.job, studentName: row.student_name, ...row.eligibility })}>Inspect Why</button>}
            pageSize={8}
          />
        </section>
      ) : null}
      {eligibility ? (
        <section className={`panel eligibility-box ${eligibility.eligible ? "ok" : "bad"}`}>
          <div className="panel-head">
            <div>
              <h2>{eligibility.studentName ? `${eligibility.studentName} • ` : ""}{eligibility.job.title}</h2>
              <small>{eligibility.eligible ? "Eligible" : "Not eligible"} - {eligibility.score}% match</small>
            </div>
            <button type="button" onClick={() => setEligibility(null)}>Close</button>
          </div>
          <EligibilityCheckList checks={eligibility.checks} />
          {!eligibility.eligible && eligibility.failedReasons?.length ? <p><strong>Reason:</strong> {eligibility.failedReasons.join(" ")}</p> : null}
        </section>
      ) : null}
      {editing ? (
        <ModalForm title={editing.id ? "Edit Job" : "Create Job"} fields={jobFields} values={editing} setValues={setEditing} onSubmit={save} onClose={() => setEditing(null)} />
      ) : null}
      {details ? <DetailsModal title={details.title} item={details} onClose={() => setDetails(null)} /> : null}
    </>
  );
}

function JobDetailsPage({ user, notify, navigate, openSmartAI }) {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eligibility, setEligibility] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loadedJob = await jobService.get(id);
      setJob(loadedJob);
      if (user.role === "student") {
        setEligibility(await jobService.checkEligibility(Number(id), user.student_id));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, user.role, user.student_id]);

  useEffect(() => {
    load();
  }, [load]);

  async function apply() {
    if (eligibility && !eligibility.eligible) {
      notify("You are not eligible for this job yet.", "error");
      return;
    }

    try {
      await applicationService.apply(user.student_id, Number(id));
      notify("Application submitted successfully.");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function checkEligibility() {
    try {
      setEligibility(await jobService.checkEligibility(Number(id), user.student_id));
    } catch (err) {
      notify(err.message, "error");
    }
  }

  if (loading) return <LoadingPanel label="Loading job details..." />;
  if (error) return <ErrorPanel message={error} onRetry={load} />;
  if (!job) return <ErrorPanel message="Job not found." />;

  return (
    <>
      <PageHeader
        title={job.title}
        subtitle={`${job.company_name} - ${job.location} - ${job.salary_package}`}
        actions={(
          <>
            <button className="link-button" type="button" onClick={() => navigate("jobs")}>Back to Jobs</button>
            <button className="link-button" type="button" onClick={() => openSmartAI({ page: "job detail", context: { label: `${job.company_name} • ${job.title}`, entityType: "job", entity: job } })}>{user.role === "student" ? "Prepare with AI" : "Find Matching Students"}</button>
            {user.role === "student" ? <button className="link-button" type="button" onClick={checkEligibility}>Check Eligibility</button> : null}
            {user.role === "student" ? <button className="primary-action apply-action" type="button" onClick={apply} disabled={eligibility && !eligibility.eligible}>Apply</button> : null}
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="job detail" context={{ label: `${job.company_name} • ${job.title}`, entityType: "job", entity: job }} onOpen={openSmartAI} />
      <section className="profile-summary">
        <article className="panel">
          <div className="panel-head">
            <h2>Role Overview</h2>
            <Badge tone={statusTone(job.status)}>{job.status}</Badge>
          </div>
          <p>{job.description}</p>
          <div className="summary-grid">
            <span><small>Job type</small><strong>{job.job_type}</strong></span>
            <span><small>Openings</small><strong>{job.openings}</strong></span>
            <span><small>Deadline</small><strong>{job.application_deadline}</strong></span>
            <span><small>Experience</small><strong>{job.experience}</strong></span>
          </div>
        </article>
        <article className="panel">
          <h2>Eligibility</h2>
          <div className="summary-grid">
            <span><small>Minimum CGPA</small><strong>{job.minimum_cgpa}</strong></span>
            <span><small>Maximum Backlogs</small><strong>{job.maximum_backlogs}</strong></span>
            <span><small>Branches</small><strong>{job.eligible_branches}</strong></span>
            <span><small>Skills</small><strong>{job.required_skills}</strong></span>
          </div>
        </article>
      </section>
      {eligibility ? (
        <section className={`panel eligibility-box ${eligibility.eligible ? "ok" : "bad"}`}>
          <div className="panel-head">
            <h2>{eligibility.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}</h2>
            <strong>{eligibility.score}% match</strong>
          </div>
          <EligibilityCheckList checks={eligibility.checks} />
          {!eligibility.eligible && eligibility.failedReasons?.length ? <p><strong>Reason:</strong> {eligibility.failedReasons.join(" ")}</p> : null}
        </section>
      ) : null}
    </>
  );
}

function JobCreatePage({ user, notify, navigate }) {
  const [companies, setCompanies] = useState([]);
  const [values, setValues] = useState({
    status: "ACTIVE",
    job_type: "Full-time",
    maximum_backlogs: 0,
    graduation_year: 2027,
    experience_years: 0
  });

  useEffect(() => {
    companyService.all().then(setCompanies).catch((err) => notify(err.message, "error"));
  }, [notify]);

  const fields = useMemo(() => buildJobFields(companies, user), [companies, user]);

  async function save(payloadValues) {
    try {
      const payload = normalizeValues(fields, payloadValues);
      if (user.role === "company") payload.company_id = user.company_id;
      await jobService.save(payload);
      notify("Job created successfully.");
      navigate("jobs");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <>
      <PageHeader title="Create Job" subtitle="Publish a placement opportunity with eligibility and role details." />
      <ModalForm title="Create Job" fields={fields} values={values} setValues={setValues} onSubmit={save} onClose={() => navigate("jobs")} submitLabel="Create Job" />
    </>
  );
}

function ApplicationsView({ user, search, notify, askConfirm, openSmartAI }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "All", dateFrom: "", dateTo: "" });
  const [details, setDetails] = useState(null);
  const [scheduling, setScheduling] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await applicationService.list({
        search,
        filters,
        studentId: user.role === "student" ? user.student_id : undefined,
        companyId: user.role === "company" ? user.company_id : undefined,
        pageSize: 100
      });
      setRows(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, search, user.company_id, user.role, user.student_id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(row, status) {
    const ok = await askConfirm({
      title: `${status} application?`,
      message: `${row.student_name} will be marked as ${status} for ${row.job_title}.`,
      confirmLabel: status
    });

    if (!ok) return;

    await applicationService.updateStatus(row.id, status, status === "SELECTED" ? { result: "SELECTED", package_offered: row.salary_package || "8 LPA" } : {});
    notify(`Application marked as ${status}.`);
    load();
  }

  async function schedule(values) {
    try {
      await interviewService.save(normalizeValues(interviewFields([], [], [], []), { ...scheduling, ...values }));
      notify("Interview scheduled successfully.");
      setScheduling(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function exportApplications() {
    if (user.role !== "tpo" || exporting) return;
    try {
      setExporting(true);
      reportService.exportApplications(rows, "SmartPlacify_Applications.xlsx");
      notify("Applications exported successfully");
    } catch (err) {
      notify(err.message || "Unable to export applications. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function exportSelections() {
    if (user.role !== "tpo" || exporting) return;
    try {
      setExporting(true);
      reportService.exportSelections(rows, "SmartPlacify_Selection_Report.xlsx");
      notify("Selection report exported successfully");
    } catch (err) {
      notify(err.message || "Unable to export selection report. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  const canDecide = user.role !== "student";

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Track student applications and move candidates through the placement funnel."
        actions={(
          <>
            <button type="button" className="link-button" onClick={() => openSmartAI({ page: "applications", context: { label: "Applications • Conversion insights" } })}>AI Application Insights</button>
            {user.role === "tpo" ? <button type="button" className="link-button" onClick={exportApplications} disabled={exporting}>{exporting ? "Exporting..." : "Export Applications"}</button> : null}
            {user.role === "tpo" ? <button type="button" className="link-button" onClick={exportSelections} disabled={exporting}>Export Selection Report</button> : null}
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="applications" context={{ label: "Applications • Progression and risk" }} onOpen={openSmartAI} />
      <section className="panel">
        <FilterBar>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option>All</option>
              {applicationStatusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setFilters({ status: "All" })}>Clear Filters</button>
        </FilterBar>
        {loading ? <LoadingPanel label="Loading applications..." /> : null}
        {error ? <ErrorPanel message={error} onRetry={load} /> : null}
        {!loading && !error ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "student_name", label: "Student" },
              ...(user.role === "tpo" ? [{ key: "student_roll_no", label: "Roll No.", render: (row) => row.student_roll_no || "-" }] : []),
              { key: "job_title", label: "Job" },
              { key: "company_name", label: "Company" },
              { key: "resume_name", label: "Resume", render: (row) => row.resume_name || "Preview missing" },
              { key: "eligibility_score", label: "Score" },
              { key: "status", label: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> }
            ]}
            emptyText="No applications found."
            actions={(row) => (
              <>
                <button type="button" onClick={() => setDetails(row)}>View</button>
                <button type="button" onClick={() => setDetails({ ...row, resume_preview: row.resume_name || "No resume uploaded" })}>Resume</button>
                {canDecide ? <button type="button" onClick={() => updateStatus(row, "SHORTLISTED")}>Shortlist</button> : null}
                {canDecide ? <button type="button" onClick={() => updateStatus(row, "REJECTED")}>Reject</button> : null}
                {canDecide ? <button type="button" onClick={() => updateStatus(row, "SELECTED")}>Select</button> : null}
                {canDecide ? <button type="button" onClick={() => setScheduling({
                  application_id: row.id,
                  student_id: row.student_id,
                  company_id: row.company_id,
                  job_id: row.job_id,
                  mode: "Online",
                  status: "SCHEDULED",
                  round_name: "Technical Round"
                })}>Schedule</button> : null}
              </>
            )}
          />
        ) : null}
      </section>
      {details ? <DetailsModal title={`${details.student_name} - ${details.job_title}`} item={details} onClose={() => setDetails(null)} /> : null}
      {scheduling ? (
        <ModalForm
          title="Schedule Interview"
          fields={interviewFields([], [], [], [])}
          values={scheduling}
          setValues={setScheduling}
          onSubmit={schedule}
          onClose={() => setScheduling(null)}
          submitLabel="Schedule"
        />
      ) : null}
    </>
  );
}

function interviewFields(applications, students, companies, jobs) {
  return [
    { name: "application_id", label: "Application", type: applications.length ? "select" : "number", valueType: "number", options: optionRows(applications, "job_title"), required: true },
    { name: "student_id", label: "Student", type: students.length ? "select" : "number", valueType: "number", options: optionRows(students, "full_name"), required: true },
    { name: "company_id", label: "Company", type: companies.length ? "select" : "number", valueType: "number", options: optionRows(companies), required: true },
    { name: "job_id", label: "Job", type: jobs.length ? "select" : "number", valueType: "number", options: optionRows(jobs, "title"), required: true },
    { name: "interview_date", label: "Interview date", type: "date", required: true },
    { name: "interview_time", label: "Interview time", type: "time", required: true },
    { name: "mode", label: "Mode", type: "select", options: interviewModeOptions, required: true },
    { name: "location_or_link", label: "Location/link" },
    { name: "round_name", label: "Round" },
    { name: "status", label: "Status", type: "select", options: interviewStatusOptions },
    { name: "notes", label: "Notes", type: "textarea" }
  ];
}

function InterviewsView({ user, search, notify, askConfirm, openSmartAI }) {
  const [rows, setRows] = useState([]);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "All" });
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const fields = useMemo(() => interviewFields(applications, students, companies, jobs), [applications, companies, jobs, students]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [interviewResult, applicationRows, studentRows, companyRows, jobRows] = await Promise.all([
        interviewService.list({
          search,
          filters,
          studentId: user.role === "student" ? user.student_id : undefined,
          companyId: user.role === "company" ? user.company_id : undefined,
          pageSize: 100
        }),
        applicationService.all(),
        studentService.all(),
        companyService.all(),
        jobService.all()
      ]);
      setRows(interviewResult.data);
      setApplications(applicationRows);
      setStudents(studentRows);
      setCompanies(companyRows);
      setJobs(jobRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, search, user.company_id, user.role, user.student_id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(values) {
    try {
      const payload = normalizeValues(fields, { ...editing, ...values });
      if (editing?.id) payload.id = editing.id;
      await interviewService.save(payload);
      notify(editing?.id ? "Interview updated successfully." : "Interview scheduled successfully.");
      setEditing(null);
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function remove(row) {
    const ok = await askConfirm({
      title: "Cancel interview?",
      message: `${row.round_name || "Interview"} for ${row.student_name} will be removed.`,
      confirmLabel: "Delete"
    });

    if (!ok) return;

    await interviewService.remove(row.id);
    notify("Interview deleted.");
    load();
  }

  const canSchedule = user.role !== "student";

  return (
    <>
      <PageHeader
        title="Interviews"
        subtitle="Schedule, edit, and monitor interview rounds across companies."
        actions={(
          <>
            <button type="button" className="link-button" onClick={() => openSmartAI({ page: "interviews", context: { label: user.role === "student" ? "Interview Prep" : "Interview Performance Insights" } })}>{user.role === "student" ? "Prepare with AI" : "AI Interview Insights"}</button>
            {canSchedule ? <button type="button" className="primary-action" onClick={() => setEditing({ mode: "Online", status: "SCHEDULED" })}>Schedule Interview</button> : null}
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="interviews" context={{ label: user.role === "student" ? "Student interviews • Preparation" : "Interview funnel • Performance" }} onOpen={openSmartAI} />
      <section className="panel">
        <FilterBar>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option>All</option>
              {interviewStatusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setFilters({ status: "All" })}>Clear Filters</button>
        </FilterBar>
        {loading ? <LoadingPanel label="Loading interviews..." /> : null}
        {error ? <ErrorPanel message={error} onRetry={load} /> : null}
        {!loading && !error ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "student_name", label: "Student" },
              { key: "company_name", label: "Company" },
              { key: "job_title", label: "Job" },
              { key: "interview_date", label: "Date" },
              { key: "mode", label: "Mode" },
              { key: "status", label: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> }
            ]}
            emptyText="No interviews scheduled."
            actions={(row) => (
              <>
                <button type="button" onClick={() => setDetails(row)}>View</button>
                {canSchedule ? <button type="button" onClick={() => setEditing(row)}>Edit</button> : null}
                {canSchedule ? <button type="button" onClick={() => remove(row)}>Delete</button> : null}
              </>
            )}
          />
        ) : null}
      </section>
      {editing ? <ModalForm title={editing.id ? "Edit Interview" : "Schedule Interview"} fields={fields} values={editing} setValues={setEditing} onSubmit={save} onClose={() => setEditing(null)} submitLabel="Schedule" /> : null}
      {details ? <DetailsModal title={details.round_name || "Interview Details"} item={details} onClose={() => setDetails(null)} /> : null}
    </>
  );
}

function NotificationsView({ user, search, notify }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(null);
  const [details, setDetails] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await notificationService.list(user, { search, pageSize: 100 });
      setRows(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(row) {
    await notificationService.markRead(row.id);
    notify("Notification marked as read.");
    load();
  }

  async function markAllRead() {
    await notificationService.markAllRead(user);
    notify("All notifications marked as read.");
    load();
  }

  async function create(values) {
    await notificationService.create(values);
    notify("Notification sent.");
    setCreating(null);
    load();
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Review placement updates, interview alerts, and role-specific announcements."
        actions={(
          <>
            <button type="button" className="link-button" onClick={markAllRead}>Mark All Read</button>
            {user.role === "tpo" ? <button type="button" className="primary-action" onClick={() => setCreating({ role: "all", type: "Announcement" })}>Send Notification</button> : null}
          </>
        )}
      />
      <section className="panel">
        {loading ? <LoadingPanel label="Loading notifications..." /> : null}
        {error ? <ErrorPanel message={error} onRetry={load} /> : null}
        {!loading && !error ? (
          <ul className="activity-list notification-list">
            {rows.length ? rows.map((row) => (
              <li key={row.id} className={row.is_read ? "" : "unread"}>
                <span className={row.is_read ? "violet-dot" : "green-dot"}>{row.type?.slice(0, 1) || "N"}</span>
                <p>{row.title}<small>{row.message} - {row.created_at}</small></p>
                <button type="button" onClick={() => setDetails(row)}>View</button>
                <button type="button" disabled={row.is_read} onClick={() => markRead(row)}>{row.is_read ? "Read" : "Mark read"}</button>
              </li>
            )) : <li className="empty-state">No notifications found.</li>}
          </ul>
        ) : null}
      </section>
      {creating ? (
        <ModalForm
          title="Send Notification"
          fields={[
            { name: "role", label: "Audience", type: "select", options: notificationRoles, required: true },
            { name: "type", label: "Type", required: true },
            { name: "title", label: "Title", required: true },
            { name: "message", label: "Message", type: "textarea", required: true }
          ]}
          values={creating}
          setValues={setCreating}
          onSubmit={create}
          onClose={() => setCreating(null)}
          submitLabel="Send"
        />
      ) : null}
      {details ? <DetailsModal title={details.title} item={details} onClose={() => setDetails(null)} /> : null}
    </>
  );
}

function ReportsView({ user, navigate, notify, openSmartAI }) {
  const [data, setData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "All" });
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const report = await reportService.summary(user, filters);
      setData(report.dashboard);
      setApplications(report.applications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function exportFullReport() {
    if (exporting) return;
    try {
      setExporting(true);
      notify("Preparing report...");
      await reportService.exportFullPlacementReport(user, filters);
      notify("Placement report exported successfully");
    } catch (err) {
      notify(err.message || "Unable to export report. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <LoadingPanel label="Loading reports..." />;
  if (error) return <ErrorPanel message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Data-driven placement progress, company activity, and candidate movement."
        actions={(
          <>
            <button type="button" className="link-button" onClick={() => openSmartAI({ page: "reports", context: { label: "Reports • Placement analytics" } })}>Ask Smart AI</button>
            <button type="button" className="primary-action" onClick={exportFullReport} disabled={exporting}>{exporting ? "Preparing report..." : "Export Full Report"}</button>
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="reports" context={{ label: "Placement report • Trends" }} onOpen={openSmartAI} />
      <section className="panel">
        <FilterBar>
          <label>
            <span>Application status</span>
            <select value={filters.status} onChange={(event) => setFilters({ status: event.target.value })}>
              <option>All</option>
              {applicationStatusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            <span>From</span>
            <input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
          </label>
          <button type="button" onClick={() => setFilters({ status: "All", dateFrom: "", dateTo: "" })}>Clear Filters</button>
        </FilterBar>
      </section>
      <section className="kpi-grid">
        {data.stats.map((item) => <StatCard key={item.label} {...item} />)}
      </section>
      <section className="content-grid">
        <article className="panel wide">
          <div className="panel-head">
            <h2>Monthly Application Trend</h2>
            <button type="button" onClick={() => navigate("applications")}>View All</button>
          </div>
          <div className="placement-chart-shell">
            <PlacementSeriesChart monthly={data.monthly || []} series={data.chartSeries} />
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <h2>Skill Demand</h2>
            <button type="button" onClick={() => navigate("students")}>View All</button>
          </div>
          {(data.skill_demand || []).map((skill) => (
            <div className="skill-row" key={skill.name}>
              <span>{skill.name}</span>
              <b style={{ width: `${Math.min(100, skill.demand * 24)}%` }} />
              <em>{skill.demand}</em>
            </div>
          ))}
        </article>
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Application Register</h2>
          <button type="button" onClick={() => navigate("applications")}>View All</button>
        </div>
        <DataTable
          rows={applications}
          columns={[
            { key: "student_name", label: "Student" },
            { key: "job_title", label: "Job" },
            { key: "company_name", label: "Company" },
            { key: "status", label: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            { key: "eligibility_score", label: "Score" }
          ]}
        />
      </section>
    </>
  );
}

function StudentProfileView({ user, notify, openSmartAI }) {
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [resumeStudent, setResumeStudent] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setStudent(await studentService.get(user.student_id));
    } catch (err) {
      setError(err.message);
    }
  }, [user.student_id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(values) {
    const payload = normalizeValues(studentFields, { ...editing, ...values });
    if (editing?.id) payload.id = editing.id;
    await studentService.save(payload);
    notify("Profile updated successfully.");
    setEditing(null);
    load();
  }

  if (error) return <ErrorPanel message={error} onRetry={load} />;
  if (!student) return <LoadingPanel label="Loading profile..." />;

  return (
    <>
      <PageHeader
        title="Student Profile"
        subtitle="Keep academic, skill, and resume details ready for campus hiring."
        actions={(
          <>
            <button type="button" className="link-button" onClick={() => openSmartAI({ page: "profile", context: { label: `${student.full_name} • ${student.branch} • Student Profile`, entityType: "student", entity: student } })}>Analyze with Smart AI</button>
            <button type="button" className="link-button" onClick={() => setResumeStudent(student)}>Upload Resume</button>
            <button type="button" className="primary-action" onClick={() => setEditing(student)}>Edit Profile</button>
          </>
        )}
      />
      <SmartAIPagePanel user={user} page="profile" context={{ label: `${student.full_name} • ${student.branch} • Student Profile`, entityType: "student", entity: student }} onOpen={openSmartAI} />
      <section className="profile-summary">
        <article className="panel">
          <h2>{student.full_name}</h2>
          <p>{student.course} - {student.branch}</p>
          <div className="summary-grid">
            <span><small>CGPA</small><strong>{student.cgpa}</strong></span>
            <span><small>Roll No.</small><strong>{student.college_roll_no || `SP${String(student.id).padStart(4, "0")}`}</strong></span>
            <span><small>Backlogs</small><strong>{student.backlogs}</strong></span>
            <span><small>Status</small><strong>{student.placement_status}</strong></span>
            <span><small>Resume</small><strong>{student.resume_name || "Missing"}</strong></span>
          </div>
        </article>
        <article className="panel">
          <h2>Skills & Projects</h2>
          <p>{student.skills || "Add technical and soft skills to improve matching."}</p>
          <p>{student.projects || "Add project details to strengthen recruiter visibility."}</p>
        </article>
      </section>
      {editing ? <ModalForm title="Edit Student Profile" fields={studentFields} values={editing} setValues={setEditing} onSubmit={save} onClose={() => setEditing(null)} /> : null}
      {resumeStudent ? <ResumeUploadModal student={resumeStudent} onClose={() => setResumeStudent(null)} onUploaded={load} notify={notify} /> : null}
    </>
  );
}

function SettingsView({ user, updateProfile, notify, askConfirm }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, quietHours: "Off", compactTables: "Off" });
  const showDeveloperSettings = localStorage.getItem("smartplacify_show_dev_settings") === "true";

  async function save(event) {
    event.preventDefault();
    await updateProfile({ name: form.name, email: form.email });
    localStorage.setItem("smartplacify_settings", JSON.stringify(form));
    notify("Settings saved successfully.");
  }

  async function resetDemoData() {
    const ok = await askConfirm({
      title: "Reset demo data?",
      message: "This resets only the local browser demo data used by the frontend.",
      confirmLabel: "Reset"
    });

    if (!ok) return;

    resetDb();
    notify("Local demo data reset.");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage account, notifications, appearance, privacy, placement preferences, and security." />
      <section className="settings-grid">
        <form className="panel settings-form" onSubmit={save}>
          <div className="panel-head"><h2>Account</h2><Badge tone="info">{user.role.toUpperCase()}</Badge></div>
          <label><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
          <label><span>Quiet hours</span><select value={form.quietHours} onChange={(event) => setForm({ ...form, quietHours: event.target.value })}><option>Off</option><option>9 PM - 8 AM</option></select></label>
          <label><span>Compact tables</span><select value={form.compactTables} onChange={(event) => setForm({ ...form, compactTables: event.target.value })}><option>Off</option><option>On</option></select></label>
          <button className="primary-action" type="submit">Save Settings</button>
        </form>
        <article className="panel settings-form">
          <div className="panel-head"><h2>Profile</h2><Badge tone="success">{user.role === "tpo" ? "Placement Officer" : user.role === "company" ? "Recruiter" : "Student"}</Badge></div>
          <p>Keep your SmartPlacify identity, communication preferences, and dashboard experience up to date.</p>
          <div className="settings-option-list">
            <span><strong>Notifications</strong><small>Interview alerts, application updates, and AI recommendations.</small></span>
            <span><strong>Appearance</strong><small>Theme is controlled from the top navigation switch.</small></span>
            <span><strong>Privacy</strong><small>Profile visibility and placement communication preferences.</small></span>
            <span><strong>Security</strong><small>Password changes and account recovery settings.</small></span>
          </div>
        </article>
        <article className="panel settings-form">
          <div className="panel-head"><h2>Placement Preferences</h2><Badge tone="neutral">Role specific</Badge></div>
          <p>{user.role === "student" ? "Tune job recommendations, skill-gap alerts, resume reminders, and interview preparation nudges." : user.role === "company" ? "Manage candidate matching, pipeline alerts, interview reminders, and hiring report preferences." : "Control placement monitoring, department reports, eligibility alerts, and intervention reminders."}</p>
          <div className="settings-option-list compact">
            <span><strong>{user.role === "student" ? "Job Recommendations" : user.role === "company" ? "Candidate Matching" : "Placement Reports"}</strong><small>Enabled</small></span>
            <span><strong>{user.role === "student" ? "Skill Gap Alerts" : user.role === "company" ? "Pipeline Alerts" : "Risk Alerts"}</strong><small>Enabled</small></span>
          </div>
        </article>
        {showDeveloperSettings ? (
          <article className="panel settings-form">
            <div className="panel-head"><h2>API Client</h2><Badge tone={USE_MOCKS ? "neutral" : "success"}>{USE_MOCKS ? "Mock mode" : "REST mode"}</Badge></div>
            <p>The frontend is wired through centralized services and can switch to REST by setting `VITE_USE_MOCKS=false` with `VITE_API_URL`.</p>
            <div className="api-box">
              <small>VITE_API_URL</small>
              <strong>{API_URL || "Not configured"}</strong>
            </div>
            <button className="link-button" type="button" onClick={resetDemoData}>Reset Demo Data</button>
          </article>
        ) : null}
      </section>
    </>
  );
}

function AIAssistantView({ user, notify }) {
  const suggestions = user.role === "tpo"
    ? ["Students At Risk", "Placement Summary", "Eligible Students", "Company Performance", "Generate Report"]
    : user.role === "company"
      ? ["Rank Applicants", "Find Matching Candidates", "Strong Python Candidates", "Compare Candidates"]
      : ["Check My Eligibility", "Find Best Jobs", "Analyze Placement Readiness", "Prepare for Interview", "Analyze Resume"];
  const [analyses, setAnalyses] = useState([]);
  const [activeResponse, setActiveResponse] = useState(null);
  const [input, setInput] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const workspaceContext = useMemo(() => ({ label: `${user.name} • Smart AI Workspace` }), [user.name]);

  async function send(text = input) {
    if (!text.trim()) return;
    setInput("");
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await smartAIService.askAI({ user, page: "ai workspace", prompt: text, context: workspaceContext });
      setActiveResponse(response);
      setAnalyses((current) => [{ id: Date.now(), prompt: text, response }, ...current].slice(0, 8));
    } catch (err) {
      setErrorMessage(err.message);
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErrorMessage("");
    smartAIService.getContextualInsights({ user, page: "ai workspace", context: workspaceContext })
      .then((result) => {
        if (!alive) return;
        setActiveResponse(result.response);
        setAnalyses((current) => current.length ? current : [{ id: Date.now(), prompt: "Smart AI overview", response: result.response }]);
      })
      .catch((err) => {
        if (!alive) return;
        setErrorMessage(err.message);
        notify(err.message, "error");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [notify, user, workspaceContext]);

  async function analyzeResume() {
    const error = validateResume(resumeFile);
    if (error) {
      notify(error, "error");
      return;
    }

    try {
      setLoading(true);
      const result = await aiService.analyzeResume(resumeFile);
      const response = {
        type: "readiness_score",
        title: "Resume Readiness",
        summary: `${result.score} / 100 • Resume analysis`,
        score: result.score,
        metrics: [
          { label: "ATS Structure", value: 82 },
          { label: "Role Keywords", value: 76 },
          { label: "Projects", value: 84 },
          { label: "Readability", value: 88 }
        ],
        insight: result.feedback,
        actions: ["Improve Resume", "Find Matching Jobs"]
      };
      setActiveResponse(response);
      setAnalyses((current) => [{ id: Date.now(), prompt: `Analyze ${resumeFile.name}`, response }, ...current].slice(0, 8));
      notify("Resume analysis completed.");
    } catch (err) {
      setErrorMessage(err.message);
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Smart AI Workspace" subtitle="Analyze placement data, eligibility, candidates, reports, and interview readiness with context-aware AI." />
      <section className="smart-ai-workspace">
        <aside className="panel smart-ai-saved">
          <h2>Saved Analyses</h2>
          {analyses.length ? analyses.map((item) => (
            <button type="button" key={item.id} onClick={() => setActiveResponse(item.response)}>
              <strong>{item.prompt}</strong>
              <small>{item.response.title}</small>
            </button>
          )) : <p>No analyses yet. Start with a suggested card.</p>}
        </aside>

        <article className="panel smart-ai-main">
          <div className="smart-ai-hero">
            <span className="smart-ai-spark">AI</span>
            <h2>Good morning, {user.name.split(" ")[0]}.</h2>
            <p>What would you like Smart AI to analyze?</p>
          </div>
          <div className="smart-ai-card-grid">
            {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}
          </div>
          {loading ? <div className="ai-thinking">Smart AI is analyzing verified placement data...</div> : <SmartAIResponse response={activeResponse} />}
          {errorMessage ? <div className="toast error">{errorMessage}</div> : null}
          <form className="chat-input smart-ai-workspace-input" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Smart AI about placements, jobs, candidates, or reports..." />
            <button type="submit">Analyze</button>
          </form>
        </article>

        <aside className="panel smart-ai-context">
          <h2>Context</h2>
          <div className="api-box">
            <small>Role</small>
            <strong>{user.role.toUpperCase()}</strong>
          </div>
          <div className="api-box">
            <small>Data Source</small>
            <strong>{USE_MOCKS ? "Mock service layer" : "REST API"}</strong>
          </div>
          <h3>Resume Checker</h3>
          <p>Upload a PDF, DOC, or DOCX file to receive readiness feedback.</p>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
          <button className="primary-action" type="button" onClick={analyzeResume}>Analyze Resume</button>
        </aside>
      </section>
    </>
  );
}

function AuthRedirect({ children }) {
  const { user } = useAuth();

  if (hasValidRole(user)) {
    return <Navigate to={dashboardUrl(user)} replace />;
  }

  return children;
}

function EntryRedirect() {
  const { user } = useAuth();
  return <Navigate to={dashboardUrl(user)} replace />;
}

function NotFound() {
  const { user } = useAuth();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="brand-mark">S</span>
        <h1>Page not found</h1>
        <p>The requested SmartPlacify route does not exist.</p>
        <Link className="primary-action auth-link" to={dashboardUrl(user)}>Go Home</Link>
      </section>
    </main>
  );
}

function RoleShell({ children }) {
  const { user, updateProfile, logout } = useAuth();
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(getStoredTheme);
  const [aiDrawer, setAiDrawer] = useState({ open: false, page: "dashboard", context: {} });
  const { toast, notify, clearToast } = useToast();
  const { confirm, ask, onCancel, onConfirm } = useConfirm();

  if (!hasValidRole(user)) {
    return <Navigate to="/login" replace />;
  }

  const activeRoute = activeRouteFromPath(location.pathname);
  const navItems = useMemo(() => navByRole[user.role] || [], [user.role]);
  const navigate = useCallback((routeId) => {
    routerNavigate(roleUrl(user, routeId));
  }, [routerNavigate, user]);

  const navigateProfile = useCallback(() => {
    navigate(user.role === "tpo" ? "settings" : "profile");
  }, [navigate, user.role]);

  const openSmartAI = useCallback((options = {}) => {
    setAiDrawer({
      open: true,
      page: options.page || activeRoute || "dashboard",
      context: options.context || {},
      prompt: options.prompt || ""
    });
  }, [activeRoute]);

  const refreshUnread = useCallback(async () => {
    if (!user) return;
    const count = await notificationService.unreadCount(user);
    setUnreadCount(count);
  }, [user]);

  useEffect(() => {
    refreshUnread();
  }, [activeRoute, refreshUnread]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const sharedProps = {
    user,
    search,
    notify,
    askConfirm: ask,
    navigate,
    goTo: routerNavigate,
    updateProfile,
    openSmartAI
  };

  const view = typeof children === "function" ? children({
    ...sharedProps,
    notify: (message, type) => {
      notify(message, type);
      refreshUnread();
    }
  }) : children;

  const header = (
    <Topbar
      search={search}
      setSearch={setSearch}
      user={user}
      unreadCount={unreadCount}
      onNotifications={() => navigate("notifications")}
      onSettings={() => navigate("settings")}
      onProfile={navigateProfile}
      onLogout={logout}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
    />
  );

  const mobileActions = (
    <>
      <button className="top-action notification-action" type="button" aria-label="Notifications" onClick={() => navigate("notifications")}>
        <span className="bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 ? <sup>{unreadCount}</sup> : null}
      </button>
      <button className="profile-trigger" type="button" aria-label="Open profile" onClick={navigateProfile}>
        <span className="profile-dp initials-avatar">{compactInitials(user?.name || user?.email)}</span>
      </button>
    </>
  );

  return (
    <Layout navItems={navItems} activeRoute={activeRoute} onNavigate={navigate} header={header} mobileActions={mobileActions}>
      {view}
      <SmartAIButton onClick={() => openSmartAI()} />
      <SmartAIDrawer
        user={user}
        page={aiDrawer.page}
        context={aiDrawer.context}
        initialPrompt={aiDrawer.prompt}
        open={aiDrawer.open}
        onClose={() => setAiDrawer((current) => ({ ...current, open: false }))}
      />
      <Toast toast={toast} onClose={clearToast} />
      <ConfirmDialog confirm={confirm} onCancel={onCancel} onConfirm={onConfirm} />
    </Layout>
  );
}

function RolePage({ roles, children }) {
  return (
    <RoleRoute roles={roles}>
      <RoleShell>{children}</RoleShell>
    </RoleRoute>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.dataset.theme = getStoredTheme();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<EntryRedirect />} />
      <Route path="/login" element={<AuthRedirect><AuthScreen initialMode="login" /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><AuthScreen initialMode="register" /></AuthRedirect>} />
      <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />

      <Route path="/student/dashboard" element={<RolePage roles={["student"]}>{(props) => <Dashboard {...props} />}</RolePage>} />
      <Route path="/student/profile" element={<RolePage roles={["student"]}>{(props) => <StudentProfileView {...props} />}</RolePage>} />
      <Route path="/student/jobs" element={<RolePage roles={["student"]}>{(props) => <JobsView {...props} />}</RolePage>} />
      <Route path="/student/jobs/:id" element={<RolePage roles={["student"]}>{(props) => <JobDetailsPage {...props} />}</RolePage>} />
      <Route path="/student/applications" element={<RolePage roles={["student"]}>{(props) => <ApplicationsView {...props} />}</RolePage>} />
      <Route path="/student/interviews" element={<RolePage roles={["student"]}>{(props) => <InterviewsView {...props} />}</RolePage>} />
      <Route path="/student/notifications" element={<RolePage roles={["student"]}>{(props) => <NotificationsView {...props} />}</RolePage>} />
      <Route path="/student/ai" element={<RolePage roles={["student"]}>{(props) => <AIAssistantView {...props} />}</RolePage>} />
      <Route path="/student/settings" element={<RolePage roles={["student"]}>{(props) => <SettingsView {...props} />}</RolePage>} />

      <Route path="/company/dashboard" element={<RolePage roles={["company"]}>{(props) => <Dashboard {...props} />}</RolePage>} />
      <Route path="/company/profile" element={<RolePage roles={["company"]}>{(props) => <CompaniesView {...props} currentCompanyId={props.user.company_id} />}</RolePage>} />
      <Route path="/company/jobs" element={<RolePage roles={["company"]}>{(props) => <JobsView {...props} />}</RolePage>} />
      <Route path="/company/jobs/create" element={<RolePage roles={["company"]}>{(props) => <JobCreatePage {...props} />}</RolePage>} />
      <Route path="/company/jobs/:id" element={<RolePage roles={["company"]}>{(props) => <JobDetailsPage {...props} />}</RolePage>} />
      <Route path="/company/applications" element={<RolePage roles={["company"]}>{(props) => <ApplicationsView {...props} />}</RolePage>} />
      <Route path="/company/interviews" element={<RolePage roles={["company"]}>{(props) => <InterviewsView {...props} />}</RolePage>} />
      <Route path="/company/ai" element={<RolePage roles={["company"]}>{(props) => <AIAssistantView {...props} />}</RolePage>} />
      <Route path="/company/notifications" element={<RolePage roles={["company"]}>{(props) => <NotificationsView {...props} />}</RolePage>} />
      <Route path="/company/settings" element={<RolePage roles={["company"]}>{(props) => <SettingsView {...props} />}</RolePage>} />

      <Route path="/tpo/dashboard" element={<RolePage roles={["tpo"]}>{(props) => <Dashboard {...props} />}</RolePage>} />
      <Route path="/tpo/students" element={<RolePage roles={["tpo"]}>{(props) => <StudentsView {...props} />}</RolePage>} />
      <Route path="/tpo/companies" element={<RolePage roles={["tpo"]}>{(props) => <CompaniesView {...props} />}</RolePage>} />
      <Route path="/tpo/jobs" element={<RolePage roles={["tpo"]}>{(props) => <JobsView {...props} />}</RolePage>} />
      <Route path="/tpo/jobs/create" element={<RolePage roles={["tpo"]}>{(props) => <JobCreatePage {...props} />}</RolePage>} />
      <Route path="/tpo/jobs/:id" element={<RolePage roles={["tpo"]}>{(props) => <JobDetailsPage {...props} />}</RolePage>} />
      <Route path="/tpo/applications" element={<RolePage roles={["tpo"]}>{(props) => <ApplicationsView {...props} />}</RolePage>} />
      <Route path="/tpo/interviews" element={<RolePage roles={["tpo"]}>{(props) => <InterviewsView {...props} />}</RolePage>} />
      <Route path="/tpo/reports" element={<RolePage roles={["tpo"]}>{(props) => <ReportsView {...props} />}</RolePage>} />
      <Route path="/tpo/ai" element={<RolePage roles={["tpo"]}>{(props) => <AIAssistantView {...props} />}</RolePage>} />
      <Route path="/tpo/notifications" element={<RolePage roles={["tpo"]}>{(props) => <NotificationsView {...props} />}</RolePage>} />
      <Route path="/tpo/settings" element={<RolePage roles={["tpo"]}>{(props) => <SettingsView {...props} />}</RolePage>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
