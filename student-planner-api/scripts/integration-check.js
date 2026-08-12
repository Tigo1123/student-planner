import { app } from "../src/app.js";
import { prisma } from "../src/config/database.js";

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
  assert(response.status === expected, `${options.method || "GET"} ${path}: expected ${expected}, received ${response.status}`);
  return { response, payload };
}

async function register(label) {
  const suffix = `${Date.now()}-${crypto.randomUUID()}`;
  const result = await request("/api/auth/register", {
    expected: 201,
    method: "POST",
    body: JSON.stringify({
      name: `Test ${label}`,
      email: `phase8-${label}-${suffix}@example.com`,
      password: "test-password-123",
    }),
  });
  const cookie = result.response.headers.get("set-cookie")?.split(";")[0];
  assert(cookie, `${label} registration did not return a session cookie`);
  const setCookie = result.response.headers.get("set-cookie");
  assert(/HttpOnly/i.test(setCookie), `${label} session cookie is not HttpOnly`);
  if (process.env.NODE_ENV === "production") {
    assert(/SameSite=None/i.test(setCookie), `${label} production cookie is not SameSite=None`);
    assert(/Secure/i.test(setCookie), `${label} production cookie is not Secure`);
  }
  return { cookie, user: result.payload.user };
}

try {
  const userA = await register("a");
  const userB = await register("b");

  const taskA = (await request("/api/tasks", {
    cookie: userA.cookie,
    expected: 201,
    method: "POST",
    body: JSON.stringify({
      text: "Task A",
      date: "2026-08-12",
      completed: false,
      category: "Homework",
      color: "#4f46e5",
    }),
  })).payload.task;
  const eventA = (await request("/api/events", {
    cookie: userA.cookie,
    expected: 201,
    method: "POST",
    body: JSON.stringify({ text: "Event A", date: "2026-09-01", completed: false }),
  })).payload.event;

  await request("/api/tasks", {
    cookie: userB.cookie,
    expected: 201,
    method: "POST",
    body: JSON.stringify({ text: "Task B", date: "2026-08-13", completed: false, category: "General", color: "#64748b" }),
  });
  await request("/api/events", {
    cookie: userB.cookie,
    expected: 201,
    method: "POST",
    body: JSON.stringify({ text: "Event B", date: "2026-10-01", completed: false }),
  });

  const recordsA = await Promise.all([
    request("/api/tasks", { cookie: userA.cookie }),
    request("/api/events", { cookie: userA.cookie }),
  ]);
  const recordsB = await Promise.all([
    request("/api/tasks", { cookie: userB.cookie }),
    request("/api/events", { cookie: userB.cookie }),
  ]);
  assert(recordsA[0].payload.tasks.every((task) => task.text !== "Task B"), "User A received User B task");
  assert(recordsA[1].payload.events.every((event) => event.text !== "Event B"), "User A received User B event");
  assert(recordsB[0].payload.tasks.every((task) => task.text !== "Task A"), "User B received User A task");
  assert(recordsB[1].payload.events.every((event) => event.text !== "Event A"), "User B received User A event");

  for (const [path, method, body] of [
    [`/api/tasks/${taskA.id}`, "PATCH", { text: "Stolen" }],
    [`/api/tasks/${taskA.id}`, "DELETE", undefined],
    [`/api/events/${eventA.id}`, "PATCH", { text: "Stolen" }],
    [`/api/events/${eventA.id}`, "DELETE", undefined],
  ]) {
    await request(path, {
      cookie: userB.cookie,
      expected: 404,
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  const movedTask = (await request(`/api/tasks/${taskA.id}`, {
    cookie: userA.cookie,
    method: "PATCH",
    body: JSON.stringify({ date: "2027-01-02", completed: true }),
  })).payload.task;
  assert(movedTask.date === "2027-01-02" && movedTask.completed, "Task date/completion update failed");
  assert(movedTask.category === "Homework" && movedTask.color === "#4f46e5", "Task metadata was not preserved");

  const movedEvent = (await request(`/api/events/${eventA.id}`, {
    cookie: userA.cookie,
    method: "PATCH",
    body: JSON.stringify({ text: "Event A edited", date: "2027-02-03", completed: true }),
  })).payload.event;
  assert(movedEvent.date === "2027-02-03" && movedEvent.completed, "Event edit/date update failed");

  const duplicateTasks = await Promise.all([1, 2].map(() => request("/api/tasks", {
    cookie: userA.cookie,
    expected: 201,
    method: "POST",
    body: JSON.stringify({ text: "Duplicate text", date: "2026-12-01", completed: false, category: "General", color: "#64748b" }),
  })));
  await request(`/api/tasks/${duplicateTasks[0].payload.task.id}`, {
    cookie: userA.cookie,
    expected: 204,
    method: "DELETE",
  });
  const afterDelete = await request("/api/tasks", { cookie: userA.cookie });
  assert(
    afterDelete.payload.tasks.some((task) => task.id === duplicateTasks[1].payload.task.id),
    "Deleting one duplicate task removed the other",
  );

  const imported = await request("/api/planner/import", {
    cookie: userA.cookie,
    expected: 201,
    method: "POST",
    body: JSON.stringify({
      tasks: [{ text: "Legacy task", date: "2026-11-02", completed: true, category: "Exam", color: "#ef4444" }],
      events: [{ text: "Legacy event", date: "2026-11-03", completed: false }],
    }),
  });
  assert(imported.payload.tasks.some((task) => task.text === "Legacy task"), "Legacy task was not imported");
  await request("/api/planner/import", {
    cookie: userA.cookie,
    expected: 409,
    method: "POST",
    body: JSON.stringify({ tasks: [{ text: "Duplicate", date: "2026-11-04" }], events: [] }),
  });

  await request("/api/tasks", {
    cookie: userA.cookie,
    expected: 400,
    method: "POST",
    body: JSON.stringify({ text: "Invalid", date: "2026-02-30", completed: false, category: "General", color: "#64748b" }),
  });
  await request("/api/tasks", { expected: 401 });
  if (process.env.NODE_ENV === "production") {
    await request("/api/auth/login", {
      expected: 403,
      method: "POST",
      headers: { Origin: "https://untrusted.example" },
      body: JSON.stringify({ email: "nobody@example.com", password: "wrong-password" }),
    });
  }
  await request("/api/auth/logout", { cookie: userA.cookie, expected: 204, method: "POST" });

  process.stdout.write("Phase 8 integration checks passed: isolation, ownership, validation, updates, import, and auth.\n");
} finally {
  await prisma.user.deleteMany({ where: { email: { startsWith: "phase8-" } } });
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
}
