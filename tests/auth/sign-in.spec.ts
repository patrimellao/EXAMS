/**
 * Sign-in E2E test
 * ================
 * Verifies the full login flow:
 *  - Page renders correctly
 *  - Valid credentials → redirect to /study + session cookie set
 *  - Invalid credentials → error toast shown
 */

import { test, expect, request } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

const TEST_EMAIL = `playwright-signin-${Date.now()}@test.com`;
const TEST_PASSWORD = 'playwright123';

test.describe('Sign-in flow', () => {
  // Register a fresh user via the API before running sign-in tests
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
    // 200 = user created; 422 = already exists (ok for re-runs)
    expect([200, 422]).toContain(res.status());
    await ctx.dispose();
  });

  test.afterAll(async () => {
    // Clean up
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      await client.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL]);
    } finally {
      await client.end();
    }
  });

  test('sign-in page renders correctly', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    // Sign-up link
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('valid credentials redirect to /study and set session cookie', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();

    // Should land on /study (or a sub-path)
    await expect(page).toHaveURL(/\/study/, { timeout: 12_000 });

    // Session cookie must be present
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('session') || c.name.includes('better-auth')
    );
    expect(
      sessionCookie,
      'No session cookie found after login — Better Auth session was not established'
    ).toBeDefined();
  });

  test('wrong password shows error toast and stays on /sign-in', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill('WRONG_PASSWORD');
    await page.getByRole('button', { name: /login/i }).click();

    // Error toast should appear
    await expect(
      page.getByText(/invalid email or password|authentication failed|invalid credentials/i).first()
    ).toBeVisible({ timeout: 8_000 });

    // Should remain on sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('unauthenticated access to /study redirects to /sign-in', async ({ page }) => {
    // Fresh context = no session cookies
    await page.goto('/study');
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 8_000 });
  });
});
