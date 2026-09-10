import { useState } from "react";

export default function PasswordInput({ visibilityLabel = "password", ...props }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input">
    <input {...props} type={visible ? "text" : "password"} />
    <button type="button" className="password-input__toggle" disabled={props.disabled}
      aria-label={`${visible ? "Hide" : "Show"} ${visibilityLabel}`} aria-pressed={visible}
      aria-controls={props.id} onClick={() => setVisible(value => !value)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  </div>;
}
