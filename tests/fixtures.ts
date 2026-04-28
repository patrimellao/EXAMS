import { test as base, expect, type Page } from '@playwright/test';

// Extends the base test to bypass the cookie consent dialog on every page load.
// Import { test, expect } from '../fixtures' instead of '@playwright/test'.
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookie-consent', 'accepted');
    });
    await use(page);
  },
});

export { expect };
