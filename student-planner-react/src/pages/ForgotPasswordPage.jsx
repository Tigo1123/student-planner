import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { forgotPassword } from "../auth/authApi.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) { setError(e.details?.map(item => item.message).join(" ") || e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <AuthLayout eyebrow="Let’s get you back" title="Forgot your password?" description="A fresh password, and back to your plans.">
    {sent ? <div role="status" className="auth-success"><h3>Check your inbox</h3><p>If an account exists for this email, a password reset link has been sent.</p><p>Check your spam folder too. Links expire in 20 minutes. If nothing arrives, wait a few minutes before trying again.</p><button className="outline-button" onClick={() => setSent(false)}>Request another link</button></div> : <form className="auth-form" onSubmit={submit} aria-busy={busy}>
      <div className="auth-field"><label htmlFor="recovery-email">Email</label><input id="recovery-email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={e => { setEmail(e.target.value); setError(""); }} disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? "recovery-error" : "recovery-hint"} /></div>
      <p id="recovery-hint">Enter the email you use for Student Planner.</p>
      {error && <p className="auth-error" id="recovery-error" role="alert">{error}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? "Sending… Please wait." : "Send reset link"}</button>
    </form>}
    <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
  </AuthLayout>;
}
