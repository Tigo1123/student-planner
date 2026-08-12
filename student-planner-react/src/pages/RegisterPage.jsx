import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../auth/authContext.js";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError("Complete all fields to create your account.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/app", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Create your space"
      title="Start planning with clarity"
      description="Create an account to access your Student Planner."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="register-name" label="Name" value={form.name} autoComplete="name" error={error} onChange={(value) => updateField("name", value)} />
        <AuthField id="register-email" label="Email" type="email" value={form.email} autoComplete="email" inputMode="email" error={error} onChange={(value) => updateField("email", value)} />
        <AuthField id="register-password" label="Password" type="password" value={form.password} autoComplete="new-password" error={error} onChange={(value) => updateField("password", value)} />
        <AuthField id="register-confirm-password" label="Confirm password" type="password" value={form.confirmPassword} autoComplete="new-password" error={error} onChange={(value) => updateField("confirmPassword", value)} />
        {error && <p className="auth-error" id="register-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

function AuthField({ id, label, type = "text", value, autoComplete, inputMode, error, onChange }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-describedby={error ? "register-error" : undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default RegisterPage;
