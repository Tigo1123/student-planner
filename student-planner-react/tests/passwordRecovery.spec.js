import { test, expect } from "@playwright/test";
const token = "a".repeat(64);
async function setup(page) {
  const state = { requests: 0, invalid: false, unavailable: false };
  await page.route("http://127.0.0.1:4000/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me") return route.fulfill({ status: 401, json: { error: { code: "UNAUTHENTICATED" } } });
    state.requests++;
    if (state.unavailable) return route.abort();
    if (path === "/api/auth/reset-password" && state.invalid) return route.fulfill({ status: 400, json: { error: { code: "INVALID_RESET_TOKEN", message: "This reset link is invalid or has expired. Request a new link." } } });
    return route.fulfill({ json: { message: "If an account exists for this email, a password reset link has been sent." } });
  });
  return state;
}
async function toggle(page, label, visibilityLabel, value = "password123") {
  const input = page.getByLabel(label, { exact: true });
  await input.fill(value);
  await expect(input).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: `Show ${visibilityLabel}`, exact: true }).click();
  await expect(input).toHaveAttribute("type", "text");
  await expect(input).toHaveValue(value);
  const hide = page.getByRole("button", { name: `Hide ${visibilityLabel}`, exact: true });
  await hide.focus();
  await page.keyboard.press("Enter");
  await expect(input).toHaveAttribute("type", "password");
  await expect(input).toHaveValue(value);
}
test("login recovery link and keyboard-accessible visibility toggle", async ({ page }) => {
  await setup(page); await page.goto("/login");
  await toggle(page, "Password", "password");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});
test("registration password and confirmation toggle independently", async ({ page }) => {
  await setup(page); await page.goto("/register");
  await toggle(page, "Password", "password");
  await toggle(page, "Confirm password", "confirm password");
});
for (const width of [320, 768, 1280]) test(`reset password toggles, mismatch and successful login handoff at ${width}px`, async ({ page }) => {
  await setup(page); await page.setViewportSize({ width, height: 900 });
  await page.goto(`/reset-password?token=${token}`);
  await page.reload();
  await toggle(page, "New password", "new password");
  await toggle(page, "Confirm new password", "confirm new password", "different123");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Passwords do not match.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Confirm new password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toContainText("Your password has been reset");
});
test("malformed and expired reset links offer recovery", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/reset-password?token=bad");
  await expect(page.getByRole("alert")).toContainText("invalid or has expired");
  expect(state.requests).toBe(0);
  await page.goto(`/reset-password?token=${token}`);
  state.invalid = true;
  await page.getByLabel("New password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm new password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(page.getByRole("link", { name: "Request a new reset link" })).toBeVisible();
});
test("forgot password validates email, prevents double-submit, and shows neutral success", async ({ page }) => {
  const state = await setup(page); await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill("not-email");
  await page.getByRole("button", { name: "Send reset link" }).click();
  expect(state.requests).toBe(0);
  await page.getByLabel("Email", { exact: true }).fill("unknown@example.com");
  await page.getByRole("button", { name: "Send reset link" }).evaluate(button => { button.click(); button.click(); });
  await expect(page.getByRole("status")).toContainText("If an account exists");
  expect(state.requests).toBe(1);
});
test("network errors preserve input and allow recovery", async ({ page }) => {
  const state = await setup(page); state.unavailable = true;
  await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill("student@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to reach");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("student@example.com");
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeEnabled();
});
test("slow recovery request keeps controls disabled until completion", async ({ page }) => {
  await setup(page);
  let pending;
  await page.route("http://127.0.0.1:4000/api/auth/forgot-password", route => { pending = route; });
  await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill("student@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("button", { name: "Sending… Please wait." })).toBeDisabled();
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await pending.fulfill({ json: { message: "Accepted" } });
  await expect(page.getByRole("status")).toContainText("If an account exists");
});
