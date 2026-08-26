import { app } from "../src/app.js";
import { prisma } from "../src/config/database.js";
import sharp from "sharp";

const server = app.listen(0);
await new Promise((resolve) => server.once("listening", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function request(path, { cookie, expected = 200, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Origin: process.env.FRONTEND_ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json();
  assert(response.status === expected, `${options.method || "GET"} ${path}: expected ${expected}, received ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}
async function register(label) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: process.env.FRONTEND_ORIGIN },
    body: JSON.stringify({ name: `Academic ${label}`, email: `phase-a-${label}-${crypto.randomUUID()}@example.com`, password: "test-password-123" }),
  });
  assert(response.status === 201, `Could not register ${label}`);
  return { cookie: response.headers.get("set-cookie").split(";")[0], payload: await response.json() };
}
const post = (path, cookie, body, expected = 201) => request(path, { cookie, expected, method: "POST", body: JSON.stringify(body) });
const patch = (path, cookie, body, expected = 200) => request(path, { cookie, expected, method: "PATCH", body: JSON.stringify(body) });
const remove = (path, cookie, expected = 204) => request(path, { cookie, expected, method: "DELETE" });

try {
  const a = await register("a");
  const b = await register("b");

  const profile = await request("/api/users/me", { cookie: a.cookie });
  assert(profile.user.profileImageUrl === null && !profile.user.profileImagePublicId, "Existing user profile defaults or safe serialization failed");
  const renamed = await patch("/api/users/me", a.cookie, { name: "  Taj   Eldin  " });
  assert(renamed.user.name === "Taj   Eldin" && renamed.user.email === a.payload.user.email, "Profile name update or email preservation failed");
  await patch("/api/users/me", a.cookie, { name: "" }, 400);
  await patch("/api/users/me", a.cookie, { name: "x".repeat(121) }, 400);
  await patch("/api/users/me", a.cookie, { name: "Valid", email: "changed@example.com" }, 400);

  async function avatarUpload(cookie, bytes, type, expected = 200) {
    const form = new FormData();
    form.append("avatar", new Blob([bytes], { type }), "avatar.bin");
    const response = await fetch(`${baseUrl}/api/users/me/avatar`, { method: "POST", headers: { Origin: process.env.FRONTEND_ORIGIN, ...(cookie ? { Cookie: cookie } : {}) }, body: form });
    const payload = await response.json();
    assert(response.status === expected, `Avatar upload expected ${expected}, received ${response.status}: ${JSON.stringify(payload)}`);
    return payload;
  }
  const jpeg = await sharp({ create: { width: 40, height: 70, channels: 3, background: "#174f5c" } }).jpeg().toBuffer();
  const png = await sharp({ create: { width: 60, height: 40, channels: 4, background: "#ffae4a" } }).png().toBuffer();
  const webp = await sharp({ create: { width: 48, height: 48, channels: 3, background: "#7c3aed" } }).webp().toBuffer();
  const firstAvatar = await avatarUpload(a.cookie, jpeg, "image/jpeg");
  assert((firstAvatar.user.profileImageUrl?.startsWith("http://") || firstAvatar.user.profileImageUrl?.startsWith("https://")) && !firstAvatar.user.profileImagePublicId, "Avatar upload response is unsafe or incomplete");
  const persistedAvatar = await request("/api/auth/me", { cookie: a.cookie });
  assert(persistedAvatar.user.profileImageUrl === firstAvatar.user.profileImageUrl, "Avatar did not persist through auth restoration");
  const secondSession = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: a.payload.user.email, password: "test-password-123" }) });
  assert(secondSession.user.profileImageUrl === firstAvatar.user.profileImageUrl, "Avatar did not persist across a second login/session");
  const replacement = await avatarUpload(a.cookie, png, "image/png");
  assert(replacement.user.profileImageUrl !== firstAvatar.user.profileImageUrl, "Avatar replacement did not return a new versioned URL");
  await avatarUpload(a.cookie, webp, "image/webp");
  await avatarUpload(a.cookie, Buffer.from("not-an-image"), "image/png", 415);
  await avatarUpload(a.cookie, Buffer.from("plain text"), "text/plain", 415);
  await avatarUpload(a.cookie, Buffer.alloc(5 * 1024 * 1024 + 1), "image/png", 413);
  const noFile = await fetch(`${baseUrl}/api/users/me/avatar`, { method: "POST", headers: { Origin: process.env.FRONTEND_ORIGIN, Cookie: a.cookie } });
  assert(noFile.status === 400, "Avatar upload without a file should be rejected");
  await avatarUpload(null, jpeg, "image/jpeg", 401);
  const removedAvatar = await request("/api/users/me/avatar", { cookie: a.cookie, method: "DELETE" });
  assert(removedAvatar.user.profileImageUrl === null, "Avatar removal did not restore initials state");

  const course = (await post("/api/courses", a.cookie, {
    name: "Database Systems", code: "csc 304", instructor: "Dr. Alex", room: "B12", credits: 3,
    semester: "Semester 1", academicYear: "2026/2027", color: "#7C3AED", icon: "database",
  })).course;
  assert(course.code === "CSC 304" && !course.userId, "Course normalization or serialization failed");
  const duplicate = (await post("/api/courses", a.cookie, {
    name: "Database Systems", code: "CSC 304", color: "#7c3aed", icon: "database",
  })).course;
  assert(duplicate.id !== course.id, "Duplicate course names/codes should be allowed");
  const edited = (await patch(`/api/courses/${course.id}`, a.cookie, { room: "C20" })).course;
  assert(edited.room === "C20", "Course update failed");
  await request(`/api/courses/${course.id}`, { cookie: b.cookie, expected: 404 });
  await patch(`/api/courses/${course.id}`, b.cookie, { room: "Stolen" }, 404);

  const assignment = (await post("/api/assignments", a.cookie, {
    courseId: course.id, title: "Schema Design", description: "Normalize schema", dueDate: "2026-08-13",
    priority: "URGENT", status: "IN_PROGRESS", completed: false,
  })).assignment;
  assert(assignment.dueDate === "2026-08-13" && assignment.status === "IN_PROGRESS", "Assignment create failed");
  await post("/api/assignments", b.cookie, {
    courseId: course.id, title: "Foreign", dueDate: "2026-08-14", priority: "LOW", status: "NOT_STARTED", completed: false,
  }, 404);
  const completed = (await patch(`/api/assignments/${assignment.id}`, a.cookie, { completed: true })).assignment;
  assert(completed.completed && completed.status === "COMPLETED", "completed=true did not synchronize status");
  const reopened = (await patch(`/api/assignments/${assignment.id}`, a.cookie, { completed: false })).assignment;
  assert(!reopened.completed && reopened.status === "NOT_STARTED", "Reopened assignment did not become NOT_STARTED");
  const statusCompleted = (await patch(`/api/assignments/${assignment.id}`, a.cookie, { status: "COMPLETED" })).assignment;
  assert(statusCompleted.completed, "COMPLETED status did not synchronize completed");
  const moved = (await patch(`/api/assignments/${assignment.id}`, a.cookie, { dueDate: "2026-08-20", status: "IN_PROGRESS" })).assignment;
  assert(moved.dueDate === "2026-08-20" && !moved.completed, "Assignment reschedule/status update failed");
  const filtered = await request(`/api/assignments?courseId=${course.id}&priority=URGENT&status=IN_PROGRESS&completed=false&from=2026-08-01&to=2026-08-31&sort=due_desc`, { cookie: a.cookie });
  assert(filtered.assignments.some((item) => item.id === assignment.id), "Assignment filtering failed");
  const duplicateAssignments = await Promise.all([1, 2].map(() => post("/api/assignments", a.cookie, {
    courseId: course.id, title: "Duplicate assignment", dueDate: "2026-08-21", priority: "MEDIUM", status: "NOT_STARTED", completed: false,
  })));
  await remove(`/api/assignments/${duplicateAssignments[0].assignment.id}`, a.cookie);
  const afterDuplicateDelete = await request("/api/assignments?limit=100", { cookie: a.cookie });
  assert(afterDuplicateDelete.assignments.some((item) => item.id === duplicateAssignments[1].assignment.id), "Deleting one duplicate assignment removed another");
  await request(`/api/assignments/${assignment.id}`, { cookie: b.cookie, expected: 404 });

  const exam = (await post("/api/exams", a.cookie, {
    courseId: course.id, title: "Final Exam", examDate: "2026-08-14", startTime: "10:00", endTime: "12:00",
    room: "B12", topics: [" SQL ", "Transactions"], notes: "Bring ID",
  })).exam;
  assert(exam.examDate === "2026-08-14" && exam.topics[0] === "SQL", "Exam date/topic normalization failed");
  await post("/api/exams", a.cookie, {
    courseId: course.id, title: "Bad time", examDate: "2026-08-14", startTime: "12:00", endTime: "10:00", topics: [],
  }, 400);
  await post("/api/exams", a.cookie, {
    courseId: course.id, title: "Bad topic", examDate: "2026-02-30", startTime: "10:00", topics: [""],
  }, 400);
  await post("/api/exams", b.cookie, {
    courseId: course.id, title: "Foreign", examDate: "2026-08-14", startTime: "10:00", topics: [],
  }, 404);
  await patch(`/api/exams/${exam.id}`, a.cookie, { examDate: "2027-01-02", endTime: "13:00" });
  await remove(`/api/exams/${exam.id}`, b.cookie, 404);
  await post("/api/exams", a.cookie, { courseId: course.id, title: "Too many topics", examDate: "2028-02-29", startTime: "09:00", topics: Array.from({ length: 51 }, (_, index) => `Topic ${index}`) }, 400);
  await post("/api/exams", a.cookie, { courseId: course.id, title: "Long topic", examDate: "2028-02-29", startTime: "09:00", topics: ["x".repeat(201)] }, 400);
  const duplicateExams = await Promise.all([1, 2].map(() => post("/api/exams", a.cookie, { courseId: course.id, title: "Duplicate exam", examDate: "2028-02-29", startTime: "09:00", topics: [] })));
  await remove(`/api/exams/${duplicateExams[0].exam.id}`, a.cookie);
  const examsAfterDuplicateDelete = await request("/api/exams?limit=100", { cookie: a.cookie });
  assert(examsAfterDuplicateDelete.exams.some((item) => item.id === duplicateExams[1].exam.id), "Deleting one duplicate exam removed another");

  const schedule = (await post("/api/schedule", a.cookie, {
    courseId: course.id, dayOfWeek: "MONDAY", startTime: "10:00", endTime: "11:00", room: "B12",
  })).schedule;
  await post("/api/schedule", a.cookie, { courseId: course.id, dayOfWeek: "MONDAY", startTime: "10:30", endTime: "12:00" }, 409);
  const touching = (await post("/api/schedule", a.cookie, { courseId: course.id, dayOfWeek: "MONDAY", startTime: "11:00", endTime: "12:00" })).schedule;
  assert(touching.id, "Boundary-touching schedule was rejected");
  await patch(`/api/schedule/${schedule.id}`, a.cookie, { room: "B14" });
  await patch(`/api/schedule/${schedule.id}`, a.cookie, { startTime: "10:30", endTime: "11:30" }, 409);
  await post("/api/schedule", b.cookie, { courseId: course.id, dayOfWeek: "TUESDAY", startTime: "10:00", endTime: "11:00" }, 404);
  await request(`/api/schedule/${schedule.id}`, { cookie: b.cookie, expected: 404 });
  for (const [index, day] of ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].entries()) {
    await post("/api/schedule", a.cookie, { courseId: course.id, dayOfWeek: day, startTime: `0${index + 8}:00`.slice(-5), endTime: `0${index + 9}:00`.slice(-5) });
  }

  const task = (await post("/api/tasks", a.cookie, { text: "Past task", date: "2026-08-12", completed: false, category: "General", color: "#64748b", courseId: course.id })).task;
  const event = (await post("/api/events", a.cookie, { text: "Tomorrow event", date: "2026-08-14", completed: false, courseId: course.id })).event;
  await post("/api/tasks", b.cookie, { text: "Foreign course task", date: "2026-08-13", courseId: course.id }, 404);
  const reminder = (await post("/api/reminders", a.cookie, { entityType: "TASK", entityId: task.id, remindAt: "2026-08-13T08:00:00.000Z" })).reminder;
  await post("/api/reminders", b.cookie, { entityType: "TASK", entityId: task.id, remindAt: "2026-08-13T08:00:00.000Z" }, 404);
  const due = await request("/api/reminders/due", { cookie: a.cookie });
  assert(due.reminders.some((item) => item.id === reminder.id), "Due reminder was not returned");
  const enrichedReminder = due.reminders.find((item) => item.id === reminder.id);
  assert(enrichedReminder.entity?.title === "Past task" && enrichedReminder.entity.course?.id === course.id, "Reminder entity context was not serialized");
  assert(!Object.hasOwn(enrichedReminder.entity, "userId"), "Reminder entity leaked userId");
  await patch(`/api/reminders/${reminder.id}`, a.cookie, { dismissed: true });
  const activeDue = await request("/api/reminders/due", { cookie: a.cookie });
  assert(!activeDue.reminders.some((item) => item.id === reminder.id), "Dismissed reminder remained active");
  const eventReminder = (await post("/api/reminders", a.cookie, { entityType: "EVENT", entityId: event.id, remindAt: "2026-08-14T08:00:00.000Z" })).reminder;
  await remove(`/api/events/${event.id}`, a.cookie);
  assert(await prisma.reminder.count({ where: { id: eventReminder.id } }) === 0, "Event reminder was orphaned");

  await patch(`/api/assignments/${assignment.id}`, a.cookie, { dueDate: "2026-08-15", status: "IN_PROGRESS" });
  const assignmentReminder = (await post("/api/reminders", a.cookie, { entityType: "ASSIGNMENT", entityId: assignment.id, remindAt: "2026-08-14T08:00:00.000Z" })).reminder;
  const deadlines = await request("/api/deadlines?today=2026-08-13", { cookie: a.cookie });
  assert(deadlines.groups.OVERDUE.some((item) => item.id === task.id && item.type === "TASK"), "Overdue deadline grouping failed");
  assert(deadlines.groups.THIS_WEEK.some((item) => item.id === assignment.id), "This-week assignment grouping failed");
  assert(Object.values(deadlines.groups).flat().every((item) => !Object.hasOwn(item, "userId")), "Deadline leaked userId");
  const calendarA = await request("/api/academic/calendar?from=2026-08-01&to=2026-08-31", { cookie: a.cookie });
  const calendarB = await request("/api/academic/calendar?from=2026-08-01&to=2026-08-31", { cookie: b.cookie });
  assert(calendarA.items.some((item) => item.id === assignment.id && item.type === "ASSIGNMENT"), "Academic calendar omitted assignment");
  assert(calendarA.items.some((item) => item.id === task.id && item.type === "TASK"), "Academic calendar omitted task");
  assert(calendarB.items.every((item) => item.id !== task.id && item.id !== assignment.id), "Academic calendar leaked another user's records");
  assert(calendarA.items.every((item) => !Object.hasOwn(item, "userId")), "Academic calendar leaked userId");
  const dashboardA = await request("/api/academic/dashboard?today=2026-08-13", { cookie: a.cookie });
  const dashboardB = await request("/api/academic/dashboard?today=2026-08-13", { cookie: b.cookie });
  assert(dashboardA.summary.tasksDue >= 1 && dashboardA.summary.assignmentsDue === 0, "Academic dashboard summary was incorrect");
  assert(dashboardA.summary.completionPercentage >= 0 && dashboardA.summary.completionPercentage <= 100, "Academic dashboard completion was invalid");
  assert(!dashboardB.upcomingDeadlines.some((item) => item.id === task.id || item.id === assignment.id), "Academic dashboard leaked another user's records");
  await remove(`/api/assignments/${assignment.id}`, a.cookie);
  assert(await prisma.reminder.count({ where: { id: assignmentReminder.id } }) === 0, "Assignment reminder was orphaned");

  const examForCleanup = (await post("/api/exams", a.cookie, { courseId: course.id, title: "Cleanup exam", examDate: "2026-08-16", startTime: "09:00", topics: [] })).exam;
  const examReminder = (await post("/api/reminders", a.cookie, { entityType: "EXAM", entityId: examForCleanup.id, remindAt: "2026-08-15T09:00:00.000Z" })).reminder;
  await remove(`/api/exams/${examForCleanup.id}`, a.cookie);
  assert(await prisma.reminder.count({ where: { id: examReminder.id } }) === 0, "Exam reminder was orphaned");

  const taskReminder = (await post("/api/reminders", a.cookie, { entityType: "TASK", entityId: task.id, remindAt: "2026-08-15T09:00:00.000Z" })).reminder;
  await remove(`/api/tasks/${task.id}`, a.cookie);
  assert(await prisma.reminder.count({ where: { id: taskReminder.id } }) === 0, "Task reminder was orphaned");

  const archived = (await post(`/api/courses/${course.id}/archive`, a.cookie, {}, 200)).course;
  assert(archived.archivedAt, "Course archive failed");
  const activeCourses = await request("/api/courses", { cookie: a.cookie });
  assert(!activeCourses.courses.some((item) => item.id === course.id), "Archived course appeared in active list");
  const archivedCourses = await request("/api/courses?archived=only", { cookie: a.cookie });
  assert(archivedCourses.courses.some((item) => item.id === course.id), "Archived-only filter failed");
  await remove(`/api/courses/${course.id}`, a.cookie);
  await remove(`/api/courses/${duplicate.id}`, a.cookie);

  process.stdout.write("Academic integration checks passed: CRUD, filtering, dates, ownership, overlap, reminders, cleanup, and deadlines.\n");
} finally {
  await prisma.user.deleteMany({ where: { email: { startsWith: "phase-a-" } } });
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
}
