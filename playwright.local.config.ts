import { defineConfig, devices } from "@playwright/test";

/**
 * Local development Playwright config.
 * Uses port 3001 (Vite dev server) and does NOT start its own webServer.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
