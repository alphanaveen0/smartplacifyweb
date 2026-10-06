export function ConfirmDialogView({ confirm, onCancel, onConfirm }) {
  if (!confirm) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={confirm.title}>
      <section className="confirm-card">
        <h2>{confirm.title}</h2>
        <p>{confirm.message}</p>
        <div className="modal-actions">
          <button className="link-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-action danger-action" type="button" onClick={onConfirm}>{confirm.confirmLabel || "Confirm"}</button>
        </div>
      </section>
    </div>
  );
}

