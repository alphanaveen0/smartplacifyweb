export function StatCard({ label, value, icon, tone = "purple", trend }) {
  const isTextValue = typeof value === "string" && value.length > 6;

  return (
    <article className={`kpi-card ${tone}`}>
      <span className="icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong className={isTextValue ? "text-value" : undefined}>{value}</strong>
        <em>{trend || "Updated now"}</em>
      </div>
    </article>
  );
}
