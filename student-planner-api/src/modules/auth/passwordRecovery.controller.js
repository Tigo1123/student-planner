import { setTimeout as delay } from "node:timers/promises";
import { requireInput } from "../../utils/apiValidation.js";
import { clearAuthCookie } from "../../utils/cookies.js";
import { forgotPasswordSchema, resetPasswordSchema } from "./auth.validation.js";
import { requestPasswordReset, resetPassword, RESET_MESSAGE } from "./passwordRecovery.service.js";

export async function forgotPassword(req, res) {
  const { email } = requireInput(forgotPasswordSchema, req.body);
  // Same response floor for existing/unknown accounts, including provider failures.
  // Provider I/O is bounded to 4 seconds; the 5-second floor masks normal delivery timing.
  const [result] = await Promise.allSettled([requestPasswordReset(email), delay(5000)]);
  if (result.status === "rejected") throw result.reason;
  res.set("Cache-Control", "no-store").json({ message: RESET_MESSAGE });
}

export async function completePasswordReset(req, res) {
  const input = requireInput(resetPasswordSchema, req.body);
  await resetPassword(input);
  clearAuthCookie(res);
  res.set("Cache-Control", "no-store").json({ message: "Your password has been reset. Sign in with your new password." });
}
