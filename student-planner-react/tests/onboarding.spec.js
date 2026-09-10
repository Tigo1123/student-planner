import { test, expect } from "@playwright/test";
async function fixture(page, completed = false) {
  const state = { user: { id: "a", name: "Student", email: "a@example.com", onboardingCompleted: completed }, draft: {}, revision: 0, saves: 0, completions: 0, fail: false, expired: false };
  await page.route("http://127.0.0.1:4000/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const json = body => route.fulfill({ json: body });
    if (path === "/api/auth/me") return json({ user: state.user });
    if (path.startsWith("/api/onboarding") && state.expired) return route.fulfill({ status: 401, json: { error: { code: "UNAUTHENTICATED", message: "Authentication is required." } } });
    if (path === "/api/onboarding" && method === "GET") return json({ onboardingDraft: state.draft, onboardingRevision: state.revision, onboardingCompleted: state.user.onboardingCompleted });
    if (path === "/api/onboarding" && method === "PATCH") {
      if (state.fail) return route.fulfill({ status: 503, json: { error: { message: "Please try again." } } });
      state.saves++;
      state.draft = route.request().postDataJSON().draft;
      return json({ revision: ++state.revision });
    }
    if (path.endsWith("/complete")) { state.completions++; state.user = { ...state.user, onboardingCompleted: true, academicProfile: { goals: state.draft.goals } }; return json({ user: state.user }); }
    if (path === "/api/tasks") return json({ tasks: [] });
    if (path === "/api/events") return json({ events: [] });
    if (path === "/api/academic/calendar") return json({ items: [] });
    if (path === "/api/academic/dashboard") return json({});
    return json({ reminders: [], courses: [], schedules: [], items: [] });
  });
  return state;
}
const noOverflow = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
test("incomplete users redirect on direct routes and saved setup survives refresh", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/app/timetable");
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Welcome to Student Planner" })).toBeVisible();
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your academic workspace" })).toBeVisible();
  expect(state.draft.step).toBe(1);
});
test("completed and existing users enter dashboard across refresh and onboarding URL", async ({ page }) => {
  await fixture(page, true);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator("#dashboard-title")).toBeVisible();
  await page.reload();
  await expect(page.locator("#dashboard-title")).toBeVisible();
  await page.goto("/login");
  await expect(page).toHaveURL(/\/app$/);
});
for (const width of [320, 390, 768, 1280]) test(`course, timetable, goals, completion at ${width}px without overflow`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = await fixture(page);
  await page.goto("/app");
  await page.getByRole("button", { name: "Get Started" }).click();
  await noOverflow(page);
  await page.getByLabel("Current semester or term").fill("Semester 1");
  await page.getByLabel("Course name", { exact: true }).fill("Database Systems");
  await page.getByLabel("Course code", { exact: true }).fill("CS101");
  await page.getByRole("button", { name: "Add course", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove CS101" })).toBeVisible();
  await page.getByLabel("Course name", { exact: true }).fill("Duplicate");
  await page.getByLabel("Course code", { exact: true }).fill("cs101");
  await page.getByRole("button", { name: "Add course", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already in your setup");
  await page.getByRole("button", { name: "Clear fields" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Add another class" }).click();
  await page.getByLabel("Course *", { exact: true }).selectOption(state.draft.courses[0].id);
  await page.getByLabel("Start Time *", { exact: true }).fill("10:00");
  await page.getByLabel("End Time *", { exact: true }).fill("09:00");
  await page.getByRole("button", { name: "Add class", exact: true }).click();
  await expect(page.getByText("End time must be later than start time.")).toBeVisible();
  await page.getByLabel("End Time *", { exact: true }).fill("11:00");
  await noOverflow(page);
  await page.getByRole("button", { name: "Add class", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove class 1" })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Never miss deadlines", { exact: true }).check();
  await noOverflow(page);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("1 courses added")).toBeVisible();
  await expect(page.getByText("1 classes scheduled")).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: "Go to Dashboard" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("link", { name: "Never miss deadlines", exact: true })).toBeVisible();
  expect(state.completions).toBe(1);
  await page.reload();
  await expect(page.locator("#dashboard-title")).toBeVisible();
  await page.goBack();
  await expect(page).not.toHaveURL(/\/onboarding$/);
});
test("optional setup can be skipped, errors keep current step and expired sessions offer login", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/onboarding");
  state.fail = true;
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page.getByRole("alert")).toContainText("Please try again");
  await expect(page.getByRole("heading", { name: "Welcome to Student Planner" })).toBeVisible();
  state.fail = false;
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page.getByText("0 courses added")).toBeVisible();
  state.expired = true;
  await page.getByRole("button", { name: "Go to Dashboard" }).click();
  await expect(page.getByRole("link", { name: "Sign in again" })).toBeVisible();
});
test("logged out direct navigation uses existing authentication flow", async ({ page }) => {
  await page.route("http://127.0.0.1:4000/api/**", route => route.fulfill({ status: 401, json: { error: { code: "UNAUTHENTICATED" } } }));
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login$/);
});
test("repeated clicks save once and auth restoration never mounts dashboard", async ({ page }) => {
  const state = await fixture(page);
  await page.route("http://127.0.0.1:4000/api/auth/me", async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.fulfill({ json: { user: state.user } });
  });
  await page.goto("/app");
  await expect(page.getByText("Preparing your academic workspace…")).toBeVisible();
  await expect(page.locator("#dashboard-title")).toHaveCount(0);
  await page.getByRole("button", { name: "Get Started" }).evaluate(button => { button.click(); button.click(); });
  await expect(page.getByRole("heading", { name: "Your academic workspace" })).toBeVisible();
  expect(state.saves).toBe(1);
});
