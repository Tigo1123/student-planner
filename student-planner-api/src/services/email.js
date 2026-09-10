import { env } from "../config/env.js";

// Provider transport is injected in tests; reset tokens are never logged or written to disk.
export async function sendEmail(message, { config = env, fetchImpl = fetch } = {}) {
  if (config.EMAIL_PROVIDER !== "resend") throw new Error("Email delivery is not configured.");
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(4000),
    headers: { Authorization: `Bearer ${config.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Student Planner <${config.EMAIL_FROM}>`, ...message }),
  });
  // Never propagate provider responses: they may contain addresses or message content.
  if (!response.ok) throw new Error("Email provider rejected delivery.");
}

export function passwordResetMessage(email, token, frontendOrigin = env.FRONTEND_ORIGIN) {
  const resetUrl = new URL("/reset-password", frontendOrigin);
  resetUrl.searchParams.set("token", token);
  const url = resetUrl.href.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  return {
    to: [email], subject: "Reset your Student Planner password",
    text: `Student Planner\n\nReset your password: ${resetUrl.href}\n\nThis link expires in 20 minutes and works once. If you did not request this reset, ignore this email. Your password has not changed.`,
    html: `<div style="background:#fff5e8;padding:32px;font-family:Arial,sans-serif;color:#16363d"><h1 style="color:#174f5c">Student Planner</h1><h2>A fresh start for your password</h2><p>Use the button below to choose a new password.</p><p><a href="${url}" style="display:inline-block;background:#174f5c;color:white;padding:14px 24px;border-radius:12px;text-decoration:none">Reset Password</a></p><p>This link expires in 20 minutes and can be used only once.</p><p>If you did not request this reset, ignore this email. Your password has not changed.</p></div>`,
  };
}
