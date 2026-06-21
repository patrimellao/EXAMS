import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for /wireframes specs (public mock pages).
 * Unlike the main config, this has NO globalSetup / DB seeding — wireframe
 * routes render from in-component mock data, so they need neither Postgres nor auth.
 *
 *   npx playwright test --config=playwright.wireframe.config.ts
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*wireframe.*\.spec\.ts|lesson-plate-editor\.spec\.ts/,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
