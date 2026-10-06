import { query } from "../config/db.js";
import { buildDashboard, getApplications, getInterviews } from "../services/dashboardBuilder.js";

export async function summary(req, res) {
  const [dashboard, applications, interviews, students, companies, jobs] = await Promise.all([
    buildDashboard(req.user),
    getApplications(),
    getInterviews(),
    query("SELECT * FROM students ORDER BY id DESC"),
    query("SELECT * FROM companies ORDER BY id DESC"),
    query("SELECT j.*, c.name AS company_name FROM jobs j JOIN companies c ON c.id = j.company_id ORDER BY j.id DESC")
  ]);

  const status = req.query.status && req.query.status !== "All" ? req.query.status : "";
  const filteredApplications = applications.filter((row) => {
    const statusMatches = status ? row.status === status : true;
    const afterStart = req.query.dateFrom ? row.applied_at >= req.query.dateFrom : true;
    const beforeEnd = req.query.dateTo ? row.applied_at <= req.query.dateTo : true;
    return statusMatches && afterStart && beforeEnd;
  });

  res.json({ dashboard, applications: filteredApplications, interviews, students, companies, jobs });
}
