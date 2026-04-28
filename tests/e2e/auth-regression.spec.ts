/**
 * Regression tests for auth runtime-error bugs.
 *
 * Covers two real-world failures reported in production builds:
 *
 *   1. Sign-in success triggers `SyntaxError: "undefined" is not valid JSON`
 *      because the server action calls `redirect()` and returns nothing,
 *      so `JSON.parse(result)` on the client receives `undefined`.
 *
 *   2. Sign-up with an email that causes a non-APIError (duplicate,
 *      unexpected server error) leaves a blank screen because the server
 *      `throw`s and the client receives `undefined` → same JSON.parse crash,
 *      which bubbles past React's error boundary inside startTransition.
 *
 * These tests attach page.on('pageerror', ...) + console-error listeners
 * and assert zero uncaught exceptions during the flow. They are the
 * canonical regression guard for the fix in commit e108988.
 */
import { test, expect } from '../fixtures';
import { request } from '@playwright/test';
import { Client } from 'pg';
import type { Page } from '@playwright/test';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

const TEST_EMAIL = `authreg_${Date.now()}@example.com`;
const TEST_PASSWORD = 'SecurePass1!';

function watchRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Skip harmless dev-only warnings; flag real exceptions.
      if (
        /SyntaxError|TypeError|ReferenceError|Uncaught|not valid JSON/i.test(text)
      ) {
        errors.push(`[console.error] ${text}`);
      }
    }
  });
  return errors;
}

/**
 * Assert the Next.js dev error overlay (<nextjs-portal> + shadow DOM) is
 * NOT visible. This is the exact signal the user sees when React's
 * transition error is unhandled — e.g. JSON.parse(undefined) inside
 * startTransition surfaces as "Unhandled Runtime Error" dialog in dev.
 */
async function expectNoNextErrorOverlay(page: Page) {
  const overlay = await page.evaluate(() => {
    const portal = document.querySelector('nextjs-portal');
    if (!portal) return null;
    const root = (portal as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
    const dlg = root?.querySelector('[data-nextjs-dialog]');
    if (!dlg) return null;
    return (dlg.textContent ?? '').slice(0, 600);
  });
  expect(
    overlay,
    overlay
      ? `Next.js dev error overlay is showing:\n${overlay}`
      : 'Next.js dev error overlay should not be shown'
  ).toBeNull();
}

test.beforeAll(async () => {
  const ctx = await request.newContext({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100',
  });
  const res = await ctx.post('/api/auth/sign-up/email', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Auth Regression' },
  });
  expect([200, 422]).toContain(res.status());
  await ctx.dispose();
});

test.afterAll(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`DELETE FROM users WHERE email LIKE 'authreg_%'`);
  } finally {
    await client.end();
  }
});

test.describe('Auth regression — no runtime crashes on login/signup', () => {
  test('successful login does NOT throw JSON.parse(undefined) runtime error', async ({ page }) => {
    const runtimeErrors = watchRuntimeErrors(page);

    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('**/study', { timeout: 12000 });
    // Let any queued microtasks / JSON.parse fire before asserting.
    await page.waitForLoadState('networkidle');
    // Deferred transition callbacks may schedule after navigation — wait.
    await page.waitForTimeout(1500);

    await expectNoNextErrorOverlay(page);
    expect(
      runtimeErrors,
      `login flow leaked runtime errors:\n${runtimeErrors.join('\n')}`
    ).toEqual([]);
  });

  test('sign-up with duplicate email shows toast, never blanks the screen', async ({ page }) => {
    const runtimeErrors = watchRuntimeErrors(page);

    // Pre-register a user so the second attempt hits the "already registered" path,
    // which historically threw a non-APIError on some configurations.
    const dupEmail = `authreg_dup_${Date.now()}@example.com`;
    const ctx = await request.newContext({
      baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100',
    });
    await ctx.post('/api/auth/sign-up/email', {
      data: { email: dupEmail, password: TEST_PASSWORD, name: 'Dup User' },
    });
    await ctx.dispose();

    await page.goto('/sign-up');
    await page.getByLabel('First name').fill('Dup');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email').fill(dupEmail);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    // The form card MUST remain visible (i.e. the page is not blank).
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible({
      timeout: 8000,
    });
    // And a destructive toast MUST appear.
    await expect(
      page.locator('[data-state="open"]').filter({ hasText: /already|taken|exist|registered|error/i })
    ).toBeVisible({ timeout: 8000 });

    await expectNoNextErrorOverlay(page);
    expect(
      runtimeErrors,
      `sign-up flow leaked runtime errors:\n${runtimeErrors.join('\n')}`
    ).toEqual([]);
  });

  test('sign-in with wrong password shows toast, never blanks the screen', async ({ page }) => {
    const runtimeErrors = watchRuntimeErrors(page);

    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill('DefinitelyWrong1!');
    await page.getByRole('button', { name: 'Login' }).click();

    // Form must stay mounted — no blank page.
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 8000 });
    await expect(
      page.locator('[data-state="open"]').filter({ hasText: /invalid|incorrect|wrong|fail/i })
    ).toBeVisible({ timeout: 8000 });

    await expectNoNextErrorOverlay(page);
    expect(
      runtimeErrors,
      `sign-in error flow leaked runtime errors:\n${runtimeErrors.join('\n')}`
    ).toEqual([]);
  });
});
