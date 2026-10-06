import React from "react";

export function BarChart({ items = [] }) {
  const rawMax = Math.max(1, ...items.map((item) => Number(item.applications || item.value || 0)));
  const roughStep = rawMax / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, Math.round(niceFactor * magnitude));
  const maxValue = Math.max(step, Math.ceil(rawMax / step) * step);
  const ticks = [];

  for (let value = maxValue; value >= 0; value -= step) ticks.push(value);

  return (
    <div className="line-chart legacy-smart-chart" style={{ "--grid-step": `${100 / Math.max(1, ticks.length - 1)}%` }}>
      <div className="chart-y-axis" aria-hidden="true">
        {ticks.map((tick) => <span key={tick}>{tick}</span>)}
      </div>
      {items.map((item) => (
        <span
          key={item.month || item.label}
          style={{ height: `${Math.max(3, Math.round((Number(item.applications || item.value || 1) / maxValue) * 100))}%` }}
          title={`${item.month || item.label}: ${item.applications || item.value || 0}`}
        />
      ))}
    </div>
  );
}
