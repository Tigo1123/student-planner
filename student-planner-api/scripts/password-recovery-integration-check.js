import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
process.env.EMAIL_PROVIDER = "resend";
process.env.EMAIL_FROM = "planner@example.com";
process.env.RESEND_API_KEY = "test-only-not-a-real-key";
const originalFetch = globalThis.fetch;
const emails = [];
let providerFails = false;
globalThis.fetch = (url, options) => {
  if (url === "https://api.resend.com/emails") {
    if (providerFails) return Promise.resolve({ ok: false });
    emails.push(JSON.parse(options.body));
    return Promise.resolve({ ok: true });
  }
  return originalFetch(url, options);
};
const { app } = await import("../src/app.js");
const { prisma } = await import("../src/config/database.js");
const { env } = await import("../src/config/env.js");
const { requestPasswordReset } = await import("../src/modules/auth/passwordRecovery.service.js");
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const ids = [];
async function request(path, body, cookie) {
  const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: { Origin: env.FRONTEND_ORIGIN, ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
const rawToken = message => new URL(message.text.match(/https?:\/\/\S+/)[0]).searchParams.get("token");
const reset = (token, password = "new-password-123", confirmPassword = password) => request("/api/auth/reset-password", { token, password, confirmPassword });
async function issue(email) { await requestPasswordReset(email); return rawToken(emails.at(-1)); }
try {
  const email = `recovery-${crypto.randomUUID()}@example.com`;
  const registered = await request("/api/auth/register", { name: "Recovery test", email, password: "old-password-123" });
  assert.equal(registered.status, 201); ids.push(registered.body.user.id);
  const legacy = `student_planner_session=${jwt.sign({}, env.JWT_SECRET, { subject: ids[0], expiresIn: "1h", issuer: "student-planner-api", audience: "student-planner-web" })}`;
  assert.equal((await request("/api/auth/me", null, legacy)).status, 200, "Legacy sessions must remain valid until reset");
  const other = await request("/api/auth/register", { name: "Other user", email: `recovery-other-${crypto.randomUUID()}@example.com`, password: "other-password-123" });
  ids.push(other.body.user.id);
  const known = await request("/api/auth/forgot-password", { email });
  const token = rawToken(emails.at(-1));
  const unknown = await request("/api/auth/forgot-password", { email: "unknown-recovery@example.com" });
  assert.equal(known.status, 200); assert.deepEqual(known.body, unknown.body);
  assert.equal(emails.length, 1);
  const record = await prisma.user.findUnique({ where: { id: ids[0] } });
  assert.equal(record.resetPasswordTokenHash, createHash("sha256").update(token).digest("hex"));
  assert.notEqual(record.resetPasswordTokenHash, token);
  assert(!JSON.stringify(record).includes(token));
  assert(record.resetPasswordExpiresAt > new Date());
  assert(record.resetPasswordExpiresAt <= new Date(Date.now() + 20 * 60 * 1000));
  assert(!JSON.stringify(registered.body).includes("sessionVersion"));
  assert.equal((await reset(token, "short")).status, 400);
  assert.equal((await reset(token, "valid-password", "different-password")).status, 400);
  assert.equal((await reset("malformed")).status, 400);
  assert.equal((await reset("0".repeat(64))).body.error.code, "INVALID_RESET_TOKEN");
  assert.equal((await reset(token)).status, 200);
  assert.equal((await reset(token)).body.error.code, "INVALID_RESET_TOKEN");
  const consumed = await prisma.user.findUnique({ where: { id: ids[0] } });
  assert.equal(consumed.resetPasswordTokenHash, null); assert.equal(consumed.resetPasswordExpiresAt, null); assert.equal(consumed.sessionVersion, 1);
  assert.equal((await request("/api/auth/me", null, registered.cookie)).status, 401);
  assert.equal((await request("/api/auth/me", null, legacy)).status, 401);
  assert.equal((await request("/api/auth/me", null, other.cookie)).status, 200);
  assert.equal((await request("/api/auth/login", { email, password: "old-password-123" })).status, 401);
  const loggedIn = await request("/api/auth/login", { email, password: "new-password-123" });
  assert.equal(loggedIn.status, 200);
  assert.equal((await request("/api/auth/me", null, loggedIn.cookie)).status, 200);
  const expired = await issue(email);
  await prisma.user.update({ where: { id: ids[0] }, data: { resetPasswordExpiresAt: new Date(Date.now() - 1) } });
  assert.equal((await reset(expired)).body.error.code, "INVALID_RESET_TOKEN");
  const replaced = await issue(email); const current = await issue(email);
  assert.equal((await reset(replaced)).body.error.code, "INVALID_RESET_TOKEN");
  const concurrent = await Promise.all([reset(current), reset(current)]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 400]);
  providerFails = true;
  const failed = await request("/api/auth/forgot-password", { email });
  assert.deepEqual(failed.body, known.body);
  assert.equal((await prisma.user.findUnique({ where: { id: ids[0] } })).resetPasswordTokenHash, null);
  assert.equal((await request("/api/auth/forgot-password", { email: "invalid" })).status, 400);
  await request("/api/auth/forgot-password", { email: "unknown-recovery@example.com" });
  assert.equal((await request("/api/auth/forgot-password", { email })).status, 429);
  const { forgotPasswordRateLimit } = await import("../src/middleware/rateLimit.js");
  forgotPasswordRateLimit.resetKey("127.0.0.1");
  providerFails = false;
  await request("/api/auth/forgot-password", { email });
  const deliveredCount = emails.length;
  const latestHash = (await prisma.user.findUnique({ where: { id: ids[0] } })).resetPasswordTokenHash;
  const throttledEmail = await request("/api/auth/forgot-password", { email });
  assert.deepEqual(throttledEmail.body, known.body);
  assert.equal(emails.length, deliveredCount);
  assert.equal((await prisma.user.findUnique({ where: { id: ids[0] } })).resetPasswordTokenHash, latestHash);
  console.log("Password recovery integration passed: generic responses, delivery failure, hashed tokens, single use, expiry, replacement, policy, concurrent reset, login, session revocation, rate limit.");
} finally {
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
  await new Promise(resolve => server.close(resolve));
  globalThis.fetch = originalFetch;
}
