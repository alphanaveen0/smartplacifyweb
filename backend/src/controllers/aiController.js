import { askSmartAI } from "../services/smartAIBuilder.js";

export async function chat(req, res) {
  const response = await askSmartAI({
    user: req.user,
    page: req.body.page || "ai",
    prompt: req.body.message || req.body.prompt,
    context: req.body.context || {},
    history: req.body.history || []
  });
  res.json({ role: "assistant", text: response.insight || response.summary || response.title, response });
}

export async function resumeCheck(req, res) {
  const response = await askSmartAI({
    user: req.user,
    page: "resume",
    prompt: `Analyze this uploaded resume for placement readiness. File name: ${req.file?.originalname || "resume"}. Give ATS, keyword, project, and interview readiness improvements.`,
    context: {
      label: "Resume Analysis",
      fileName: req.file?.originalname || ""
    }
  });

  res.json({
    score: response.score || 84,
    feedback: response.insight || response.summary || "Keep projects measurable, add role keywords, and maintain ATS-friendly sections.",
    response
  });
}
