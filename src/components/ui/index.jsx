import React from "react";

export function Button({ className = "", variant = "primary", ...props }) {
  return <button className={`btn ${variant} ${className}`.trim()} type={props.type || "button"} {...props} />;
}

export function Card({ className = "", ...props }) {
  return <section className={`panel ${className}`.trim()} {...props} />;
}

export function Input({ label, error, ...props }) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <input {...props} />
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
}

export function Select({ label, options = [], error, ...props }) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <select {...props}>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>
        ))}
      </select>
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <textarea {...props} />
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
}

export function Skeleton() {
  return <div className="skeleton" />;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="segmented">
      {tabs.map((tab) => (
        <button key={tab} className={active === tab ? "selected" : ""} type="button" onClick={() => onChange(tab)}>{tab}</button>
      ))}
    </div>
  );
}

export function Dropdown({ label, items = [] }) {
  return (
    <details className="dropdown">
      <summary>{label}</summary>
      <div>
        {items.map((item) => <button key={item.label} type="button" onClick={item.onClick}>{item.label}</button>)}
      </div>
    </details>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <label className="search">
      <span>⌕</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type="search" placeholder={placeholder} />
    </label>
  );
}

export function FileUpload({ label, error, ...props }) {
  return (
    <label className="field file-field">
      {label ? <span>{label}</span> : null}
      <input type="file" {...props} />
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
}
