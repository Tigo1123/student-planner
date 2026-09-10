import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/httpError.js";
import { sendEmail, passwordResetMessage } from "../../services/email.js";
import { hashPassword } from "./auth.service.js";

export const RESET_MESSAGE = "If an account exists for this email, a password reset link has been sent.";
export const hashResetToken = token => createHash("sha256").update(token).digest("hex");
export const invalidReset = () => new HttpError(400, "INVALID_RESET_TOKEN", "This reset link is invalid or has expired. Request a new link.");

export async function requestPasswordReset(email, { database = prisma, deliver = sendEmail } = {}) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  // An atomic replacement means only the most recently issued token is active.
  const result = await database.user.updateMany({ where: { email }, data: {
    resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: new Date(Date.now() + 20 * 60 * 1000),
  } });
  if (!result.count) return;
  try {
    await deliver(passwordResetMessage(email, token));
  } catch {
    // Do not expose account existence or log addresses, links, credentials, or provider responses.
    console.warn("Password recovery email delivery failed. Check email provider configuration and health.");
    await database.user.updateMany({ where: { email, resetPasswordTokenHash: tokenHash }, data: {
      resetPasswordTokenHash: null, resetPasswordExpiresAt: null,
    } });
  }
}

export async function resetPassword({ token, password }) {
  const tokenHash = hashResetToken(token);
  const active = await prisma.user.findFirst({ where: { resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: { gt: new Date() } }, select: { id: true } });
  if (!active) throw invalidReset();
  const passwordHash = await hashPassword(password);
  // Compare-and-consume rechecks expiry after hashing and prevents simultaneous reuse.
  const result = await prisma.user.updateMany({ where: { id: active.id, resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: { gt: new Date() } }, data: {
    passwordHash, resetPasswordTokenHash: null, resetPasswordExpiresAt: null, sessionVersion: { increment: 1 },
  } });
  if (!result.count) throw invalidReset();
}
