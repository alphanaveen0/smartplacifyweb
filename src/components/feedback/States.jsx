export function LoadingState({ label = "Loading..." }) {
  return <div className="empty-state loading-state">{label}</div>;
}

export function EmptyState({ label = "No records found." }) {
  return <div className="empty-state">{label}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state error-panel">
      <strong>{message}</strong>
      {onRetry ? <button type="button" onClick={onRetry}>Retry</button> : null}
    </div>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`global-toast ${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}

