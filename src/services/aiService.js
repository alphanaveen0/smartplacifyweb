import { apiClient, USE_MOCKS } from "./apiClient.js";
import { delay } from "./mockData.js";

function mockAnswer(prompt) {
  const text = prompt.toLowerCase();

  if (text.includes("resume")) {
    return "Resume readiness: keep it one page, quantify two projects, include role-specific keywords, and move your strongest skills above the fold.";
  }

  if (text.includes("interview")) {
    return "Interview prep: revise fundamentals, prepare two project walkthroughs, practice STAR answers, and close with questions about the role.";
  }

  if (text.includes("job") || text.includes("match")) {
    return "Job matching: prioritize roles where your branch, CGPA, skills, and deadline checks are already green before applying.";
  }

  if (text.includes("ats")) {
    return "ATS tip: mirror exact job keywords, avoid tables in resumes, and use standard headings like Skills, Projects, Education, and Experience.";
  }

  return "Suggested next step: choose one target role, improve the matching resume section, and track the application outcome in SmartPlacify.";
}

export const aiService = {
  async sendMessage(message) {
    if (!USE_MOCKS) {
      return apiClient("/ai/chat", { method: "POST", body: { message } });
    }

    return delay({
      role: "assistant",
      text: mockAnswer(message)
    }, 520);
  },

  async analyzeResume(file) {
    if (!USE_MOCKS) {
      const formData = new FormData();
      formData.append("resume", file);
      return apiClient("/ai/resume-check", { method: "POST", body: formData });
    }

    return delay({
      score: 84,
      feedback: "Strong profile. Add measurable outcomes, align skills with target jobs, and keep the layout ATS-friendly."
    }, 680);
  }
};

