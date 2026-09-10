import process from "node:process";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const origin = process.argv[2];
if (!origin || !/^https?:\/\//.test(origin)) throw new Error("Usage: node scripts/verify-login-link.mjs https://your-frontend-origin");
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
let failed = false;
try {
  for (const width of [320, 390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    // Only auth restoration is stubbed: HTML, JS, CSS and routing come from the URL under test.
    await page.route("**/api/auth/me", route => route.fulfill({ status: 401, json: { error: { code: "UNAUTHENTICATED" } } }));
    await page.goto(new URL("/login", origin).href);
    await page.locator("#login-password").waitFor();
    const link = page.getByRole("link", { name: "Forgot password?", exact: true });
    const assets = await page.locator('script[type="module"][src]').evaluateAll(elements => elements.map(el => new URL(el.src).pathname));
    try {
      assert.equal(await link.count(), 1, "Rendered login DOM is missing the recovery link");
      assert(await link.isVisible(), "Recovery link is hidden");
      assert.equal(await link.getAttribute("href"), "/forgot-password");
      assert.equal(await link.getAttribute("aria-label"), "Forgot password?");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.getByRole("alert").waitFor();
      const password = await page.locator("#login-password").boundingBox();
      const rect = await link.boundingBox();
      const error = await page.getByRole("alert").boundingBox();
      assert(rect.y >= password.y + password.height, "Link must follow password");
      assert(rect.y + rect.height <= error.y, "Link must precede validation error");
      assert(Math.abs(rect.x + rect.width - password.x - password.width) <= 1, "Link must align right");
      const style = await link.evaluate(el => { const s = getComputedStyle(el); return { color: s.color, opacity: s.opacity, visibility: s.visibility }; });
      assert.equal(style.color, "rgb(23, 79, 92)");
      assert.equal(style.opacity, "1");
      assert.equal(style.visibility, "visible");
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Page overflows");
      await page.getByRole("button", { name: "Show password", exact: true }).focus();
      await page.keyboard.press("Tab");
      assert(await link.evaluate(el => el === document.activeElement));
      await page.keyboard.press("Enter");
      await page.waitForURL("**/forgot-password");
      await page.getByRole("heading", { name: "Forgot your password?", exact: true }).waitFor();
      await page.reload();
      await page.getByRole("heading", { name: "Forgot your password?", exact: true }).waitFor();
      await page.goto(new URL("/login", origin).href);
      await link.click();
      await page.waitForURL("**/forgot-password");
      console.log(JSON.stringify({ width, assets, result: "PASS", verified: "visible DOM, validation placement, right alignment, teal, no overflow, keyboard/click, public route and refresh" }));
    } catch (error) {
      failed = true;
      console.error(JSON.stringify({ width, assets, result: "FAIL", reason: error.message }));
      await page.goto(new URL("/forgot-password", origin).href);
      await page.waitForFunction(() => document.querySelector("#login-password") || [...document.querySelectorAll("h2")].some(el => el.textContent === "Forgot your password?"));
      console.error(JSON.stringify({ width, recoveryRoute: new URL(page.url()).pathname, recoveryPagePresent: await page.getByRole("heading", { name: "Forgot your password?", exact: true }).count() }));
    }
    await page.close();
  }
} finally { await browser.close(); }
if (failed) process.exitCode = 1;
