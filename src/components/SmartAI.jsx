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
      <p className="ai-insight-text">{response.insight}</p>
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
      <p className="ai-insight-text">{response.insight}</p>
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
      <p className="ai-insight-text">{response.insight}</p>
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
      <p className="ai-insight-text">{response.insight || response.text}</p>
    </SmartAIInsightCard>
  );
}

export function SmartAIDrawer({ user, page, context, initialPrompt = "", open, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const suggestions = useMemo(() => defaultSuggestions(user.role, page), [user.role, page]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const request = initialPrompt
      ? smartAIService.askAI({ user, page, prompt: initialPrompt, context })
      : smartAIService.getContextualInsights({ user, page, context }).then((result) => result.response);
    request
      .then((result) => {
        setResponse(result);
        if (initialPrompt) {
          setHistory((current) => [{ prompt: initialPrompt, response: result }, ...current].slice(0, 5));
        }
      })
      .finally(() => setLoading(false));
  }, [context, initialPrompt, open, page, user]);

  async function ask(text = prompt) {
    if (!text.trim()) return;
    setPrompt("");
    setLoading(true);
    try {
      const result = await smartAIService.askAI({ user, page, prompt: text, context });
      setResponse(result);
      setHistory((current) => [{ prompt: text, response: result }, ...current].slice(0, 5));
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
