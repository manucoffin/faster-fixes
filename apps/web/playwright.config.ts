import { defineConfig, devices } from "@playwright/test";

import { WIDGET_API_ORIGIN, WIDGET_PROJECT_ID } from "./e2e/widget-api-stub";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `next dev --turbopack --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    // A developer's own dev server carries their env, not the stubbed API origin below.
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_FF_API_KEY: WIDGET_PROJECT_ID,
      // Unresolvable on purpose: every widget request is answered by the route stub,
      // and one the stub misses fails instead of reaching a real backend.
      NEXT_PUBLIC_FF_API_ORIGIN: WIDGET_API_ORIGIN,
      // The homepage demo is a cloud-only route; self-hosted redirects it to /login.
      NEXT_PUBLIC_IS_CLOUD: "true",
      // Placeholders for the modules the auth pages evaluate at import. No database
      // is reached: the specs answer the session request in the browser.
      RESEND_API_KEY: "re_e2e",
      BETTER_AUTH_SECRET: "e2e-only-secret-not-used-outside-the-suite",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
    },
  },
});
