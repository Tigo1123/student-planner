import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { resetPassword } from "../auth/authApi.js";
import { useAuth } from "../auth/authContext.js";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const invalidLink = invalid || !/^[a-f0-9]{64}$/.test(token);

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    lock.current = true;
    setBusy(true);
    try {
      await resetPassword({ token, password, confirmPassword });
      updateUser(null);
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (e) {
      if (e.code === "INVALID_RESET_TOKEN") setInvalid(true);
      setError(e.details?.map(item => item.message).join(" ") || e.message);
    } finally { lock.current = false; setBusy(false); }
  }
  return <AuthLayout eyebrow="A secure fresh start" title="Reset your password" description="Choose a new password to get back to your academic workspace.">
    {invalidLink ? <div className="auth-error" role="alert"><h3>This reset link is invalid or has expired.</h3><p>Links work once and expire after 20 minutes. Request a new link to continue.</p><Link to="/forgot-password">Request a new reset link</Link></div> : <form className="auth-form" onSubmit={submit} aria-busy={busy}>
      <p id="password-guidance">Use 8–128 characters. All existing sessions will be signed out after your password changes.</p>
      <div className="auth-field"><label htmlFor="reset-password">New password</label><PasswordInput id="reset-password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} visibilityLabel="new password" required minLength={8} maxLength={128} autoComplete="new-password" disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? "reset-error password-guidance" : "password-guidance"} /></div>
      <div className="auth-field"><label htmlFor="reset-confirm">Confirm new password</label><PasswordInput id="reset-confirm" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }} visibilityLabel="confirm new password" required minLength={8} maxLength={128} autoComplete="new-password" disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? "reset-error" : undefined} /></div>
      {error && <p className="auth-error" id="reset-error" role="alert">{error}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? "Resetting password…" : "Reset password"}</button>
    </form>}
    <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
  </AuthLayout>;
}
