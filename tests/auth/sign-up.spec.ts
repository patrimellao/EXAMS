/**
 * Sign-up E2E test
 * ================
 * Verifies the full registration flow:
 *  - Page renders correctly
 *  - Form can be filled and submitted
 *  - On success, redirected to /sign-in with a success toast
 *  - User actually exists in the DB after sign-up
 */

import { test, expect } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

// Generate a unique email per test run so we never clash with existing rows
const uniqueEmail = `playwright-signup-${Date.now()}@test.com`;

test.describe('Sign-up flow', () => {
  test.afterAll(async () => {
    // Clean up the test user
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      await client.query(`DELETE FROM users WHERE email = $1`, [uniqueEmail]);
    } finally {
      await client.end();
    }
  });

  test('sign-up page renders required fields', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page.getByLabel('First name')).toBeVisible();
    await expect(page.getByLabel('Last name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    // Password fields (both Password and Confirm password)
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('successful sign-up redirects to /sign-in', async ({ page }) => {
    await page.goto('/sign-up');

    await page.getByLabel('First name').fill('Playwright');
    await page.getByLabel('Last name').fill('Test');
    await page.getByLabel('Email').fill(uniqueEmail);

    // Fill Password field (first password input)
    const passwordInputs = page.getByRole('textbox').filter({ hasText: '' });
    await page.locator('input[name="password"]').fill('playwright123');
    await page.locator('input[name="confirm-password"]').fill('playwright123');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
  });

  test('user is persisted in the database after sign-up', async ({ page }) => {
    // sign-up page was already submitted in the previous test, user exists
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
      const result = await client.query(
        `SELECT id, email, role FROM users WHERE email = $1`,
        [uniqueEmail]
      );

      expect(
        result.rows.length,
        `User ${uniqueEmail} was not found in the DB after sign-up`
      ).toBe(1);

      const user = result.rows[0];
      expect(user.email).toBe(uniqueEmail);
      expect(user.role).toBe('student');
      // id must be a non-empty string (Better Auth alphanumeric ID, not UUID)
      expect(typeof user.id).toBe('string');
      expect(user.id.length).toBeGreaterThan(0);
    } finally {
      await client.end();
    }
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/sign-up');

    await page.getByLabel('First name').fill('Bad');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email').fill(`mismatch-${Date.now()}@test.com`);
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="confirm-password"]').fill('different456');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show an error toast, not redirect
    await expect(
      page.getByText(/passwords do not match/i).first()
    ).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/sign-up/);
  });
});
