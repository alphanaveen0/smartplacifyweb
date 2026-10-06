import { useMemo, useState } from "react";

function validateField(field, value) {
  if (field.required && (value === undefined || value === null || value === "")) {
    return `${field.label} is required.`;
  }

  if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Enter a valid email address.";
  }

  if (field.type === "number" && value !== "" && Number.isNaN(Number(value))) {
    return `${field.label} must be a number.`;
  }

  if (field.min !== undefined && value !== "" && Number(value) < Number(field.min)) {
    return `${field.label} must be at least ${field.min}.`;
  }

  if (field.max !== undefined && value !== "" && Number(value) > Number(field.max)) {
    return `${field.label} must be ${field.max} or lower.`;
  }

  return "";
}

export function ModalForm({ title, fields, values, setValues, onSubmit, onClose, submitLabel = "Save", busy = false }) {
  const [errors, setErrors] = useState({});
  const requiredCount = useMemo(() => fields.filter((field) => field.required).length, [fields]);

  function updateValue(field, value) {
    setValues({ ...values, [field.name]: value });
    setErrors((current) => ({ ...current, [field.name]: "" }));
  }

  function submit(event) {
    event.preventDefault();

    const nextErrors = fields.reduce((accumulator, field) => {
      const error = validateField(field, values[field.name]);
      return error ? { ...accumulator, [field.name]: error } : accumulator;
    }, {});

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(values);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <form className="modal-card" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            <small>{requiredCount ? `${requiredCount} required field${requiredCount === 1 ? "" : "s"}` : "Optional details"}</small>
          </div>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
        <div className="form-grid">
          {fields.map((field) => (
            <label key={field.name}>
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea value={values[field.name] || ""} onChange={(event) => updateValue(field, event.target.value)} placeholder={field.placeholder} />
              ) : field.type === "select" ? (
                <select value={values[field.name] ?? ""} onChange={(event) => updateValue(field, event.target.value)} required={field.required}>
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {(field.options || []).map((option) => (
                    <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>
                  ))}
                </select>
              ) : field.type === "file" ? (
                <input type="file" accept={field.accept} onChange={(event) => updateValue(field, event.target.files?.[0] || null)} required={field.required} />
              ) : (
                <input
                  type={field.type || "text"}
                  min={field.min}
                  max={field.max}
                  value={values[field.name] ?? ""}
                  onChange={(event) => updateValue(field, field.type === "number" ? event.target.value : event.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
              {field.helper ? <small>{field.helper}</small> : null}
              {errors[field.name] ? <em className="field-error">{errors[field.name]}</em> : null}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="link-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-action" type="submit" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
