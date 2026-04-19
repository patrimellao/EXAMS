/**
 * UC-01 · Sign Up
 * Phase 0 — Foundation
 *
 * Tests the student registration flow:
 * form renders correctly, validation errors, successful registration,
 * duplicate email, and redirect to /sign-in after success.
 * Also verifies the user is persisted in the DB with the correct schema.
 */
import { test, expect } from '../fixtures';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

const SIGN_UP_URL = '/sign-up';

// Unique email per test run to avoid conflicts
const uniqueEmail = () => `test_${Date.now()}@example.com`;

// Track the email used in the successful-registration test for DB verification
let registeredEmail: string;

test.describe('UC-01 · Sign Up', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie-consent', 'necessary'));
  });

  test.afterAll(async () => {
    if (!registeredEmail) return;
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      await client.query(`DELETE FROM users WHERE email = $1`, [registeredEmail]);
    } finally {
      await client.end();
    }
  });

  test('renders sign-up form with all required fields', async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await expect(page.getByLabel('First name')).toBeVisible();
    await expect(page.getByLabel('Last name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await page.getByLabel('First name').fill('Ana');
    await page.getByLabel('Last name').fill('García');
    await page.getByLabel('Email').fill(uniqueEmail());
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm password').fill('different456');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Passwords do not match').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error for invalid email format (HTML5 validation)', async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await page.getByLabel('First name').fill('Ana');
    await page.getByLabel('Last name').fill('García');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm password').fill('password123');

    await page.getByRole('button', { name: 'Create account' }).click();

    // HTML5 validation prevents submission — page stays
    await expect(page).toHaveURL(new RegExp(SIGN_UP_URL));
  });

  test('successfully registers a new user and redirects to /sign-in', async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    registeredEmail = uniqueEmail();

    await page.getByLabel('First name').fill('Carlos');
    await page.getByLabel('Last name').fill('López');
    await page.getByLabel('Email').fill(registeredEmail);
    await page.getByLabel('Password', { exact: true }).fill('SecurePass1!');
    await page.getByLabel('Confirm password').fill('SecurePass1!');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Account created successfully').first()).toBeVisible({ timeout: 10000 });
    await page.waitForURL('**/sign-in', { timeout: 10000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('user is persisted in DB with correct schema after sign-up', async () => {
    // Depends on the previous test having registered registeredEmail
    if (!registeredEmail) return;

    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
      const result = await client.query(
        `SELECT id, email, role FROM users WHERE email = $1`,
        [registeredEmail]
      );

      expect(
        result.rows.length,
        `User ${registeredEmail} was not found in the DB after sign-up`
      ).toBe(1);

      const user = result.rows[0];
      expect(user.email).toBe(registeredEmail);
      expect(user.role).toBe('student');
      // id must be a non-empty text string (Better Auth alphanumeric ID, not UUID)
      expect(typeof user.id).toBe('string');
      expect(user.id.length).toBeGreaterThan(0);
    } finally {
      await client.end();
    }
  });

  test('shows error when email is already registered', async ({ page }) => {
    const email = `duplicate_${Date.now()}@example.com`;

    // Register once
    await page.goto(SIGN_UP_URL);
    await page.getByLabel('First name').fill('Pedro');
    await page.getByLabel('Last name').fill('Martínez');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('SecurePass1!');
    await page.getByLabel('Confirm password').fill('SecurePass1!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL('**/sign-in', { timeout: 10000 });

    // Try to register again with same email
    await page.goto(SIGN_UP_URL);
    await page.getByLabel('First name').fill('Pedro');
    await page.getByLabel('Last name').fill('Martínez');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('SecurePass1!');
    await page.getByLabel('Confirm password').fill('SecurePass1!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(
      page.locator('[data-state="open"]').filter({ hasText: /already|taken|exist|registered/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('link to sign-in page is visible and functional', async ({ page }) => {
    await page.goto(SIGN_UP_URL);
    const link = page.getByRole('link', { name: 'Sign in' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
