import process from "node:process";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:4179", launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"] } },
  webServer: { command: "VITE_API_URL=http://127.0.0.1:4000 npm run dev -- --host 127.0.0.1 --port 4179", url: "http://127.0.0.1:4179", reuseExistingServer: false },
});
