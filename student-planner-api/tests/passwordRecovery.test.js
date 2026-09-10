import test from "node:test";
import assert from "node:assert/strict";
import { forgotPasswordSchema, registerSchema, resetPasswordSchema } from "../src/modules/auth/auth.validation.js";
import { sendEmail, passwordResetMessage } from "../src/services/email.js";
const token = "a".repeat(64);
test("registration and reset enforce the same password limits", () => {
  for (const length of [0, 7, 8, 72, 128, 129]) {
    const password = "p".repeat(length);
    assert.equal(resetPasswordSchema.safeParse({ token, password, confirmPassword: password }).success, registerSchema.safeParse({ name: "Test", email: "test@example.com", password }).success);
  }
});
test("email normalization, confirmation, token syntax, and unknown fields", () => {
  assert.equal(forgotPasswordSchema.parse({ email: " TEST@example.com " }).email, "test@example.com");
  assert(!forgotPasswordSchema.safeParse({ email: "not-email" }).success);
  for (const changes of [{ token: "invalid" }, { confirmPassword: "different" }, { userId: "other-user" }]) assert(!resetPasswordSchema.safeParse({ token, password: "password123", confirmPassword: "password123", ...changes }).success);
});
test("email template includes branding, frontend URL, expiry, and ignore guidance", () => {
  const message = passwordResetMessage("test@example.com", token, "https://planner.example");
  assert(message.text.includes(`https://planner.example/reset-password?token=${token}`));
  assert(message.html.includes("Reset Password"));
  assert(message.text.includes("20 minutes"));
  assert(message.text.includes("ignore this email"));
  assert(!message.text.includes("password123"));
});
test("email transport is configurable and redacts provider failures", async () => {
  const config = { EMAIL_PROVIDER: "resend", EMAIL_FROM: "planner@example.com", RESEND_API_KEY: "test-only-key" };
  let sent;
  await sendEmail({ to: ["test@example.com"], subject: "Test", text: "Test" }, { config, fetchImpl: async (url, options) => { sent = { url, ...options }; return { ok: true }; } });
  assert.equal(sent.url, "https://api.resend.com/emails");
  assert.equal(sent.headers.Authorization, "Bearer test-only-key");
  await assert.rejects(sendEmail({}, { config, fetchImpl: async () => ({ ok: false, text: () => "sensitive-provider-data" }) }), { message: "Email provider rejected delivery." });
  await assert.rejects(sendEmail({}, { config: { EMAIL_PROVIDER: "disabled" } }), { message: "Email delivery is not configured." });
});
