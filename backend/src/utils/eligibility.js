function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function calculateEligibility(student, job) {
  const studentCgpa = Number(student.cgpa || 0);
  const minimumCgpa = Number(job.minimum_cgpa || 0);
  const studentBacklogs = Number(student.backlogs || 0);
  const maximumBacklogs = Number(job.maximum_backlogs || 0);
  const branchAllowed = !job.eligible_branches || splitList(job.eligible_branches).includes(String(student.branch || "").toLowerCase());
  const yearAllowed = !job.graduation_year || Number(job.graduation_year) === Number(student.graduation_year);
  const studentSkills = splitList(student.skills);
  const requiredSkills = splitList(job.required_skills);
  const matchedSkills = requiredSkills.filter((skill) => studentSkills.some((studentSkill) => studentSkill.includes(skill) || skill.includes(studentSkill)));

  const checks = [
    {
      criterion: "CGPA",
      label: "CGPA",
      required: `>= ${minimumCgpa || 0}`,
      actual: studentCgpa || 0,
      passed: studentCgpa >= minimumCgpa,
      message: `CGPA ${studentCgpa || 0} / required ${minimumCgpa || 0}`
    },
    {
      criterion: "Active Backlogs",
      label: "Backlogs",
      required: `<= ${maximumBacklogs}`,
      actual: studentBacklogs,
      passed: studentBacklogs <= maximumBacklogs,
      message: `${studentBacklogs} backlogs / allowed ${maximumBacklogs}`
    },
    {
      criterion: "Department",
      label: "Branch",
      required: job.eligible_branches || "Any",
      actual: student.branch || "-",
      passed: branchAllowed,
      message: branchAllowed ? `${student.branch || "Any"} branch accepted` : `${student.branch || "Student branch"} is not eligible`
    },
    {
      criterion: "Batch",
      label: "Graduation Year",
      required: job.graduation_year || "Any",
      actual: student.graduation_year || "-",
      passed: yearAllowed,
      message: yearAllowed ? `${student.graduation_year || "Any"} batch accepted` : `Requires ${job.graduation_year}`
    },
    {
      criterion: "Skills",
      label: "Skills",
      required: job.required_skills || "No strict skill requirement",
      actual: student.skills || "-",
      passed: !requiredSkills.length || matchedSkills.length > 0,
      message: requiredSkills.length ? `${matchedSkills.length}/${requiredSkills.length} key skills matched` : "No strict skill requirement"
    }
  ];

  const baseScore = Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);
  const skillBonus = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 10) : 10;
  return {
    eligible: checks.every((check) => check.passed),
    score: Math.min(100, baseScore + skillBonus),
    checks,
    failedReasons: checks.filter((check) => !check.passed).map((check) => `${check.criterion} requirement not met.`)
  };
}
