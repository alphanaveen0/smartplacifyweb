export const studentColumns = [
  "full_name",
  "email",
  "college_roll_no",
  "phone",
  "college",
  "course",
  "branch",
  "graduation_year",
  "cgpa",
  "percentage",
  "backlogs",
  "skills",
  "certifications",
  "projects",
  "experience",
  "placement_status",
  "resume_name",
  "resume_path",
  "resume_updated_at"
];

export const companyColumns = [
  "name",
  "email",
  "phone",
  "website",
  "industry",
  "location",
  "description",
  "logo",
  "verified"
];

export const jobColumns = [
  "company_id",
  "title",
  "description",
  "location",
  "job_type",
  "salary_package",
  "experience",
  "experience_years",
  "required_skills",
  "minimum_cgpa",
  "maximum_backlogs",
  "eligible_branches",
  "graduation_year",
  "application_deadline",
  "openings",
  "status"
];

export const interviewColumns = [
  "application_id",
  "student_id",
  "company_id",
  "job_id",
  "interview_date",
  "interview_time",
  "mode",
  "location_or_link",
  "round_name",
  "status",
  "notes"
];

export function insertSql(table, payload) {
  const columns = Object.keys(payload);
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map((column) => `:${column}`).join(", ")})`,
    params: payload
  };
}

export function updateSql(table, payload, id) {
  const columns = Object.keys(payload);
  return {
    sql: `UPDATE ${table} SET ${columns.map((column) => `${column} = :${column}`).join(", ")} WHERE id = :id`,
    params: { ...payload, id }
  };
}
