import React, { useEffect, useMemo, useState } from "react";
import { smartAIService } from "../services/smartAIService.js";

function roleLabel(role) {
  if (role === "tpo") return "Placement Officer";
  if (role === "company") return "Recruiter";
  return "Student";
}

function defaultSuggestions(role, page) {
  if (role === "tpo") {
    return ["Students at risk", "Eligible students", "Generate report", "Upcoming interviews"];
  }

  if (role === "company") {
    return ["Rank applicants", "Find matching candidates", "Strong Python candidates", "Summarize candidate"];
  }

  if (page === "interviews") return ["Prepare me for interview", "Likely technical topics", "Practice questions"];
  if (page === "jobs") return ["Which jobs match me?", "Why am I not eligible?", "High selection probability"];
  return ["Placement readiness", "Recommended jobs", "Skill gaps", "Analyze resume"];
}

function contextLabel(user, page, context) {
  if (context?.label) return context.label;
  if (context?.entity?.full_name) return `${context.entity.full_name} • ${page}`;
  if (context?.entity?.title) return `${context.entity.title} • ${page}`;
  if (context?.entity?.name) return `${context.entity.name} • ${page}`;
  return `${roleLabel(user.role)} • ${page || "Dashboard"}`;
}

function responseText(response) {
  if (!response) return "";
  return response.insight || response.text || response.summary || response.title || "";
}

function splitInsightBullets(text = "") {
  const normalized = String(text)
    .replace(/\\n/g, "\n")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!normalized) return [];

  const headingChunks = normalized
    .split(/(?=\*\*[^*]+\*\*:)/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const lines = (headingChunks.length > 1 ? headingChunks : normalized.split(/\n+/))
    .map((item) => item
      .replace(/^\s*[-*•]\s*/, "")
      .replace(/\*\*/g, "")
      .trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return normalized
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((item) => item.replace(/\*\*/g, "").trim())
    .filter(Boolean)
    .slice(0, 7);
}

function InsightBullets({ text }) {
  const bullets = splitInsightBullets(text);
  if (!bullets.length) return null;
  return (
    <ul className="ai-bullet-list">
      {bullets.map((bullet, index) => <li key={`${bullet}-${index}`}>{bullet}</li>)}
    </ul>
  );
}

function welcomeMessage(user) {
  if (user.role === "tpo") {
    return "Hi, I can help with student risk, eligible candidates, placement reports, interviews, and job posting strategy.";
  }
  if (user.role === "company") {
    return "Hi, I can help rank applicants, find matching candidates, improve job descriptions, and plan interviews.";
  }
  return "Hi, I can help analyze your resume readiness, suggest jobs, explain eligibility, and prepare you for interviews.";
}

export function SmartAIButton({ onClick, compact = false }) {
  return (
    <button className={compact ? "smart-ai-inline" : "smart-ai-fab"} type="button" onClick={onClick} aria-label="Open Smart AI">
      <span>AI</span>
      <strong>Smart AI</strong>
    </button>
  );
}

export function SmartAIInsightCard({ title, summary, children, actions = [] }) {
  return (
    <article className="smart-ai-card">
      <div className="smart-ai-card-head">
        <span className="smart-ai-spark">AI</span>
        <div>
          <h3>{title}</h3>
          {summary ? <p>{summary}</p> : null}
        </div>
      </div>
      {children}
      {actions.length ? <SmartAIActions actions={actions} /> : null}
    </article>
  );
}

function SmartAIActions({ actions }) {
  return (
    <div className="smart-ai-actions">
      {actions.map((action) => <button type="button" key={action}>{action}</button>)}
    </div>
  );
}

function SourceIndicator() {
  return (
    <div className="ai-source-row">
      <span>Verified Data</span>
      <span>AI Insight</span>
    </div>
  );
}

function ReadinessScore({ response }) {
  return (
    <SmartAIInsightCard title={response.title} summary={response.summary} actions={response.actions}>
      <SourceIndicator />
      <div className="ai-score-ring" style={{ "--score": `${response.score}%` }}>
        <strong>{response.score}</strong>
        <small>/ 100</small>
      </div>
      <div className="ai-metric-list">
        {response.metrics?.map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <b><i style={{ width: `${metric.value}%` }} /></b>
            <em>{metric.value}%</em>
          </div>
        ))}
      </div>
      <p className="ai-insight-text">{response.insight}</p>
    </SmartAIInsightCard>
  );
}

function JobMatches({ response }) {
  return (
    <SmartAIInsightCard title={response.title} summary={response.summary} actions={response.actions}>
      <SourceIndicator />
      <div className="ai-recommendation-list">
        {response.data?.map((job) => (
          <article key={job.id} className="ai-recommendation-card">
            <div>
              <small>{job.company}</small>
              <strong>{job.title}</strong>
            </div>
            <span>{job.match}% Match</span>
            <ul>
              {job.why.map((item) => <li key={item}>✓ {item}</li>)}
              {job.gaps.slice(0, 2).map((item) => <li key={item} className="gap">• {item}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </SmartAIInsightCard>
  );
}

function EligibilityCard({ response }) {
  return (
    <SmartAIInsightCard title={response.title} summary={response.summary}>
      <SourceIndicator />
      <span className={`ai-decision ${response.status === "ELIGIBLE" ? "success" : "warning"}`}>{response.status}</span>
      <div className="ai-fact-grid">
        {response.facts?.map((fact) => <span key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></span>)}
      </div>
      <ul className="ai-check-list">
        {response.checks?.map((check) => <li key={check.label} className={check.passed ? "pass" : "fail"}>{check.passed ? "✓" : "!"} {check.message}</li>)}
      </ul>
      <InsightBullets text={response.insight} />
    </SmartAIInsightCard>
  );
}

function StudentList({ response }) {
  return (
    <SmartAIInsightCard title={response.title} summary={response.summary} actions={response.actions}>
      <SourceIndicator />
      <div className="ai-mini-metrics">
        {response.metrics?.map((metric) => <span key={metric.label}><strong>{metric.value}</strong><small>{metric.label}</small></span>)}
      </div>
      <div className="ai-table">
        <div className="ai-table-head">{response.columns?.map((column) => <span key={column}>{column}</span>)}</div>
        {response.rows?.map((row) => (
          <div className="ai-table-row" key={row.id}>
            <span>{row.name}</span><span>{row.cgpa}</span><span>{row.applications}</span><span>{row.interviews}</span><span>{row.risk}</span>
          </div>
        ))}
      </div>
      <InsightBullets text={response.insight} />
    </SmartAIInsightCard>
  );
}

function CandidateRanking({ response }) {
  return (
    <SmartAIInsightCard title={response.title} summary={response.summary} actions={response.actions}>
      <SourceIndicator />
      <div className="ai-ranking-list">
        {response.data?.map((candidate, index) => (
          <article key={candidate.id}>
            <span>#{index + 1}</span>
            <div>
              <strong>{candidate.name}</strong>
              <small>CGPA {candidate.cgpa} • {candidate.skills}</small>
              <p>Why recommended: {candidate.why.join(", ")}.</p>
              <em>Potential gap: {candidate.gap}</em>
            </div>
            <b>{candidate.score}%</b>
          </article>
        ))}
      </div>
    </SmartAIInsightCard>
  );
}

function ReportSummary({ response }) {
  return (
    <SmartAIInsightCard title={response.title} summary={response.summary} actions={response.actions}>
      <SourceIndicator />
      <div className="ai-mini-metrics">
        {response.metrics?.map((metric) => <span key={metric.label}><strong>{metric.value}</strong><small>{metric.label}</small></span>)}
      </div>
      <InsightBullets text={response.insight} />
    </SmartAIInsightCard>
  );
}

function InterviewPrep({ response }) {
  return (
    <SmartAIInsightCard title={response.title} summary={response.summary} actions={response.actions}>
      <SourceIndicator />
      <div className="ai-prep-grid">
        {response.sections?.map((section) => (
          <section key={section.title}>
            <h4>{section.title}</h4>
            <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ))}
      </div>
    </SmartAIInsightCard>
  );
}

export function SmartAIResponse({ response }) {
  if (!response) return null;
  if (response.type === "readiness_score") return <ReadinessScore response={response} />;
  if (response.type === "job_matches") return <JobMatches response={response} />;
  if (response.type === "eligibility") return <EligibilityCard response={response} />;
  if (response.type === "student_list") return <StudentList response={response} />;
  if (response.type === "candidate_ranking") return <CandidateRanking response={response} />;
  if (response.type === "report") return <ReportSummary response={response} />;
  if (response.type === "interview_prep") return <InterviewPrep response={response} />;

  return (
    <SmartAIInsightCard title={response.title || "Smart AI Insight"} summary={response.summary} actions={response.actions}>
      <SourceIndicator />
      <InsightBullets text={response.insight || response.text} />
    </SmartAIInsightCard>
  );
}

export function SmartAIDrawer({ user, page, context, initialPrompt = "", open, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const suggestions = useMemo(() => defaultSuggestions(user.role, page), [user.role, page]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setMessages([{ role: "assistant", content: welcomeMessage(user) }]);
    setLoading(true);
    const request = initialPrompt
      ? smartAIService.askAI({ user, page, prompt: initialPrompt, context, history: [] })
      : smartAIService.getContextualInsights({ user, page, context }).then((result) => result.response);
    request
      .then((result) => {
        setResponse(result);
        const text = responseText(result);
        if (text) {
          setMessages((current) => [
            ...current,
            ...(initialPrompt ? [{ role: "user", content: initialPrompt }] : []),
            { role: "assistant", content: text }
          ]);
        }
        if (initialPrompt) {
          setHistory((current) => [{ prompt: initialPrompt, response: result }, ...current].slice(0, 5));
        }
      })
      .catch((apiError) => setError(apiError.message || "Smart AI is unavailable right now."))
      .finally(() => setLoading(false));
  }, [context, initialPrompt, open, page, user]);

  async function ask(text = prompt) {
    if (!text.trim()) return;
    const question = text.trim();
    setPrompt("");
    setError("");
    const nextMessages = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const result = await smartAIService.askAI({ user, page, prompt: question, context, history: nextMessages });
      setResponse(result);
      setMessages((current) => [...current, { role: "assistant", content: responseText(result) || "I found an insight for this page." }]);
      setHistory((current) => [{ prompt: question, response: result }, ...current].slice(0, 5));
    } catch (apiError) {
      setError(apiError.message || "Smart AI is unavailable right now.");
      setMessages((current) => [...current, { role: "assistant", content: "I could not reach Smart AI right now. Please try again after checking the backend configuration." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="smart-ai-overlay" role="dialog" aria-modal="true" aria-label="Smart AI drawer">
      <aside className="smart-ai-drawer">
        <header className="smart-ai-drawer-head">
          <div>
            <span className="smart-ai-eyebrow">Smart Placify Intelligence</span>
            <h2>Smart AI</h2>
            <p>Context: {contextLabel(user, page, context)}</p>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </header>

        <section className="smart-ai-suggestions" aria-label="Suggested Smart AI actions">
          {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}
        </section>

        <section className="smart-ai-chat" aria-label="Smart AI conversation">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role === "user" ? "user" : "assistant"}`} key={`${message.role}-${index}`}>
              <span>{message.role === "user" ? "You" : "AI"}</span>
              <p>{message.content}</p>
            </div>
          ))}
          {error ? <div className="ai-error">{error}</div> : null}
        </section>

        {loading ? <div className="ai-thinking">Smart AI is analyzing verified placement data...</div> : <SmartAIResponse response={response} />}

        <form className="smart-ai-prompt" onSubmit={(event) => { event.preventDefault(); ask(); }}>
          <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask about this page..." />
          <button type="submit">Ask</button>
        </form>

        {history.length ? (
          <section className="smart-ai-history">
            <h3>Recent analyses</h3>
            {history.map((item) => <button type="button" key={item.prompt} onClick={() => setResponse(item.response)}>{item.prompt}</button>)}
          </section>
        ) : null}
      </aside>
    </div>
  );
}

export function SmartAIPagePanel({ user, page, context, onOpen }) {
  const suggestions = defaultSuggestions(user.role, page).slice(0, user.role === "company" ? 2 : 3);
  const summary = user.role === "tpo"
    ? "3 students may need placement support. Low application activity is currently the strongest risk indicator."
    : user.role === "company"
      ? "4 candidates strongly match your Frontend Engineer role. 2 exceed current React requirements."
      : "Your React + SQL profile is strongest for frontend and analyst roles. Adding AWS experience can improve current job matches.";

  return (
    <article className="panel smart-ai-strip">
      <div>
        <span className="smart-ai-spark">AI</span>
        <h2>Smart AI Insights</h2>
        <p>{summary}</p>
      </div>
      <div className="smart-ai-strip-actions">
        {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => onOpen({ page, context, prompt: suggestion })}>{suggestion}</button>)}
        <SmartAIButton compact onClick={() => onOpen({ page, context })} />
      </div>
    </article>
  );
}
