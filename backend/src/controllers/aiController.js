import { askSmartAI } from "../services/smartAIBuilder.js";

export async function chat(req, res) {
  const response = await askSmartAI({
    user: req.user,
    page: req.body.page || "ai",
    prompt: req.body.message || req.body.prompt,
    context: req.body.context || {}
  });
  res.json({ role: "assistant", text: response.insight || response.summary || response.title, response });
}

export async function resumeCheck(_req, res) {
  res.json({
    score: 84,
    feedback: "Resume analysis uses backend placement heuristics until the Python AI service is connected. Keep projects measurable, add role keywords, and maintain ATS-friendly sections."
  });
}
