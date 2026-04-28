import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — runs the smoke + accessibility suites in CI.
 *
 * The web is started on :3000 by `pnpm dev`. In CI we use `pnpm build && pnpm start`
 * to exercise the production bundle (caching headers, ISR, font preloads all behave
 * differently in dev). Locally, set `PW_USE_DEV=1` to skip the production build and
 * run against `pnpm dev` for fast iteration.
 */
const useDev = process.env.PW_USE_DEV === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: process.env.PW_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "en-GB",
    timezoneId: "Europe/London",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: useDev ? "pnpm dev" : "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
