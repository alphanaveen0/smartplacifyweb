import {
  askSmartAI,
  getCandidateMatches,
  getContextualSmartAI,
  getInterviewPreparation,
  getJobMatches,
  getPlacementRisk,
  getReportInsights,
  getStudentInsights
} from "../services/smartAIBuilder.js";

export async function contextualInsights(req, res) {
  res.json(await getContextualSmartAI({ user: req.user, page: req.body.page, context: req.body.context || {} }));
}

export async function ask(req, res) {
  res.json(await askSmartAI({ user: req.user, page: req.body.page, prompt: req.body.prompt, context: req.body.context || {} }));
}

export async function studentInsights(req, res) {
  res.json(await getStudentInsights(req.user));
}

export async function jobMatches(req, res) {
  res.json(await getJobMatches(req.user));
}

export async function placementRisk(_req, res) {
  res.json(await getPlacementRisk());
}

export async function candidateMatches(req, res) {
  res.json(await getCandidateMatches(req.user, req.body.context || {}));
}

export async function reportInsights(_req, res) {
  res.json(await getReportInsights());
}

export async function interviewPreparation(req, res) {
  res.json(await getInterviewPreparation(req.user, req.body.context || {}));
}
