import test from "node:test";
import assert from "node:assert/strict";
import { draftSchema, saveSchema, completeSchema } from "../src/modules/onboarding/onboarding.validation.js";
const course = { id: crypto.randomUUID(), name: "Math", code: "ma1" };
const draft = { step: 1, semester: "Term 1", academicYear: "2026", program: "", yearOfStudy: "", courses: [course], classes: [], goals: [] };
test("optional setup can all be skipped", () => assert(draftSchema.safeParse({ ...draft, courses: [] }).success));
test("course codes normalize and duplicates are rejected", () => {
  assert.equal(draftSchema.parse(draft).courses[0].code, "MA1");
  assert(!draftSchema.safeParse({ ...draft, courses: [course, { ...course, id: crypto.randomUUID(), code: "MA1" }] }).success);
});
test("foreign course references and invalid time ranges are rejected", () => {
  const item = { courseId: course.id, dayOfWeek: "MONDAY", startTime: "10:00", endTime: "11:00" };
  assert(draftSchema.safeParse({ ...draft, classes: [item] }).success);
  for (const altered of [{ courseId: crypto.randomUUID() }, { endTime: "09:00" }, { startTime: "25:00" }]) assert(!draftSchema.safeParse({ ...draft, classes: [{ ...item, ...altered }] }).success);
  assert(!draftSchema.safeParse({ ...draft, classes: [item, item] }).success);
});
test("identity and completion flags cannot be supplied by clients", () => {
  assert(!saveSchema.safeParse({ revision: 0, draft, userId: crypto.randomUUID() }).success);
  assert(!completeSchema.safeParse({ revision: 0, onboardingCompleted: true }).success);
  assert(!saveSchema.safeParse({ revision: -1, draft }).success);
});
test("bounded preferences and setup reject arbitrary data", () => {
  assert(!draftSchema.safeParse({ ...draft, goals: ["arbitrary"] }).success);
  assert(!draftSchema.safeParse({ ...draft, program: "x".repeat(121) }).success);
  assert(!draftSchema.safeParse({ ...draft, step: 5 }).success);
});
