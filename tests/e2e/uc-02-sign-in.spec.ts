/**
 * UC-02 · Sign In
 * Phase 0 — Foundation
 *
 * Tests the sign-in flow: form renders, invalid credentials error,
 * successful login with redirect to /study and session cookie verification,
 * and middleware protection for protected routes.
 */
import { test, expect, request } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

const SIGN_IN_URL = '/sign-in';
const TEST_EMAIL = `signin_${Date.now()}@example.com`;
const TEST_PASSWORD = 'SecurePass1!';

// Create a fresh test user via the API before running sign-in tests.
// Using the API (not the UI) makes setup faster and independent of sign-up UI changes.
test.beforeAll(async () => {
  const ctx = await request.newContext({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  });
  const res = await ctx.post('/api/auth/sign-up/email', {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Playwright Signin',
    },
  });
  // 200 = created; 422 = already exists (safe for re-runs)
  expect([200, 422]).toContain(res.status());
  await ctx.dispose();
});

test.afterAll(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL]);
  } finally {
    await client.end();
  }
});

test.describe('UC-02 · Sign In', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie-consent', 'necessary'));
  });

  test('renders sign-in form with email and password fields', async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('shows error for incorrect password', async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(
      page.locator('[data-state="open"]').filter({ hasText: /invalid|incorrect|wrong|fail/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows error for non-existent account', async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password', { exact: true }).fill('SomePassword1!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(
      page.locator('[data-state="open"]').filter({ hasText: /invalid|not found|no account|fail/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('successfully signs in, redirects to /study and sets session cookie', async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('**/study', { timeout: 12000 });
    await expect(page).toHaveURL(/\/study/);

    // Session cookie must be set by Better Auth
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('session') || c.name.includes('better-auth')
    );
    expect(
      sessionCookie,
      'No session cookie found after login — Better Auth session was not established'
    ).toBeDefined();
  });

  test('link to sign-up page is visible', async ({ page }) => {
    await page.goto(SIGN_IN_URL);
    const link = page.getByRole('link', { name: 'Sign up' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/sign-up/);
  });
});

test.describe('Middleware auth protection', () => {
  test('unauthenticated user is redirected from /study to /sign-in', async ({ page }) => {
    // Fresh context = no session cookie
    await page.goto('/study');
    await page.waitForURL('**/sign-in', { timeout: 8000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('unauthenticated user is redirected from /teach to /sign-in', async ({ page }) => {
    await page.goto('/teach');
    await page.waitForURL('**/sign-in', { timeout: 8000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
