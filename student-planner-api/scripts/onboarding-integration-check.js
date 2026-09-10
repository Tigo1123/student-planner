import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { prisma } from "../src/config/database.js";
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const ids = [];
async function request(path, cookie, method = "GET", body, status = 200) {
  const res = await fetch(base + path, { method, headers: { Origin: process.env.FRONTEND_ORIGIN, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const payload = await res.json();
  assert.equal(res.status, status, JSON.stringify(payload));
  return { ...payload, cookie: res.headers.get("set-cookie")?.split(";")[0] };
}
async function register() {
  const result = await request("/api/auth/register", null, "POST", { name: "Onboarding Test", email: `onboarding-${crypto.randomUUID()}@example.com`, password: "testing-password-123" }, 201);
  ids.push(result.user.id);
  assert.equal(result.user.onboardingCompleted, false);
  return result;
}
const empty = { step: 4, semester: "Term 1", academicYear: "2026", program: "Computer Science", yearOfStudy: "Year 2", courses: [], classes: [], goals: [] };
try {
  const a = await register(), b = await register();
  assert.equal((await request("/api/auth/me", a.cookie)).user.onboardingCompleted, false);
  await request("/api/onboarding", null, "GET", undefined, 401);
  await request("/api/onboarding/complete", b.cookie, "POST", { revision: 0, userId: a.user.id }, 400);
  await request("/api/onboarding", b.cookie, "PATCH", { revision: 0, draft: empty, userId: a.user.id }, 400);
  const courseId = crypto.randomUUID();
  const draft = { ...empty, courses: [{ id: courseId, name: "Mathematics", code: "ma1", color: "#174f5c" }], classes: [{ courseId, dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", room: "A1" }], goals: ["Never miss deadlines"] };
  await request("/api/onboarding", a.cookie, "PATCH", { revision: 0, draft });
  const restored = await request("/api/onboarding", a.cookie);
  assert.equal(restored.onboardingDraft.courses[0].code, "MA1");
  assert.equal(restored.onboardingRevision, 1);
  assert.equal((await request("/api/onboarding", b.cookie)).onboardingRevision, 0);
  await request("/api/onboarding", a.cookie, "PATCH", { revision: 0, draft }, 409);
  const results = await Promise.all([1, 2].map(() => request("/api/onboarding/complete", a.cookie, "POST", { revision: 1 })));
  assert(results.every(r => r.user.onboardingCompleted));
  assert.equal(results[0].user.onboardingCompletedAt, results[1].user.onboardingCompletedAt);
  assert.equal(await prisma.course.count({ where: { userId: a.user.id } }), 1);
  assert.equal(await prisma.classSchedule.count({ where: { userId: a.user.id } }), 1);
  assert.equal(await prisma.course.count({ where: { userId: b.user.id } }), 0);
  const schedule = await prisma.classSchedule.findFirst({ where: { userId: a.user.id }, include: { course: true } });
  assert.equal(schedule.course.userId, a.user.id);
  assert.equal(schedule.course.semester, "Term 1");
  assert.equal((await request("/api/auth/me", a.cookie)).user.onboardingCompleted, true);
  assert.equal((await request("/api/auth/login", null, "POST", { email: a.user.email, password: "testing-password-123" })).user.onboardingCompleted, true);
  await request("/api/onboarding", a.cookie, "PATCH", { revision: 1, draft }, 409);
  await request("/api/onboarding", b.cookie, "PATCH", { revision: 0, draft: { ...empty, courses: [], classes: draft.classes } }, 400);
  await request("/api/onboarding", b.cookie, "PATCH", { revision: 0, draft: empty });
  assert.equal((await request("/api/onboarding/complete", b.cookie, "POST", { revision: 1 })).user.onboardingCompleted, true);
  assert.equal(await prisma.course.count({ where: { userId: b.user.id } }), 0);
  const c = await register();
  const existingCourse = await prisma.course.create({ data: { userId: c.user.id, name: "Existing", code: "OLD" } });
  await prisma.classSchedule.create({ data: { userId: c.user.id, courseId: existingCourse.id, dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:30" } });
  await request("/api/onboarding", c.cookie, "PATCH", { revision: 0, draft });
  await request("/api/onboarding/complete", c.cookie, "POST", { revision: 1 }, 409);
  assert.equal(await prisma.course.count({ where: { userId: c.user.id } }), 1, "Failed completion must roll back new courses");
  assert.equal((await request("/api/auth/me", c.cookie)).user.onboardingCompleted, false);
  console.log("Onboarding integration passed: registration, restore, isolation, stale drafts, concurrent completion, course/timetable creation, skip, login persistence.");
} finally {
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
  await new Promise(resolve => server.close(resolve));
}
