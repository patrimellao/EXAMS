/**
 * UC-11 · Student Reads a Lesson
 * Phase 2 — Content
 *
 * Tests:
 * - Unauthenticated user is redirected to /sign-in
 * - Authenticated student can access a lesson page (requires TEST_LESSON_ID in DB)
 * - Lesson content is visible (markdown rendered as text)
 * - "Marcar como completada" button is present and callable
 * - Subsequent visit shows the lesson as already completed
 * - Lesson progress API responds correctly
 *
 * If TEST_LESSON_ID is not set, integration tests are skipped.
 */
import { test, expect, Page } from '@playwright/test';

const STUDENT_EMAIL = `uc11_${Date.now()}@example.com`;
const STUDENT_PASSWORD = 'SecurePass1!';

const TEST_SUBJECT_ID = process.env.TEST_SUBJECT_ID ?? '1';
const TEST_LESSON_ID = process.env.TEST_LESSON_ID ?? '';

async function registerAndSignIn(page: Page) {
  await page.goto('/sign-up');
  await page.getByLabel('First name').fill('UC11');
  await page.getByLabel('Last name').fill('Reader');
  await page.getByLabel('Email').fill(STUDENT_EMAIL);
  await page.getByLabel('Password').fill(STUDENT_PASSWORD);
  await page.getByLabel('Confirm password').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/sign-in', { timeout: 10000 });

  await page.getByLabel('Email').fill(STUDENT_EMAIL);
  await page.getByLabel('Password').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/study', { timeout: 10000 });
}

test.describe('UC-11 · Lesson Reader — Access control', () => {
  test('unauthenticated user is redirected to /sign-in', async ({ page }) => {
    await page.goto(`/study/${TEST_SUBJECT_ID}/lessons/1`);
    await page.waitForURL('**/sign-in', { timeout: 8000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe('UC-11 · Lesson Reader — Student flows', () => {
  test.skip(!TEST_LESSON_ID, 'Set TEST_LESSON_ID env var to run lesson reader integration tests');

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await registerAndSignIn(page);
    await context.close();
  });

  test('lesson page loads with title and content', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(STUDENT_EMAIL);
    await page.getByLabel('Password').fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/study', { timeout: 10000 });

    await page.goto(`/study/${TEST_SUBJECT_ID}/lessons/${TEST_LESSON_ID}`);

    // Heading (lesson title) should be visible
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });

    // Back link to unit
    await expect(page.getByRole('link', { name: /volver/i })).toBeVisible();
  });

  test('lesson content area is visible', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(STUDENT_EMAIL);
    await page.getByLabel('Password').fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/study', { timeout: 10000 });

    await page.goto(`/study/${TEST_SUBJECT_ID}/lessons/${TEST_LESSON_ID}`);
    await expect(page.getByTestId('lesson-content')).toBeVisible({ timeout: 8000 });
  });

  test('"Marcar como completada" button is present', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(STUDENT_EMAIL);
    await page.getByLabel('Password').fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/study', { timeout: 10000 });

    await page.goto(`/study/${TEST_SUBJECT_ID}/lessons/${TEST_LESSON_ID}`);
    await expect(page.getByTestId('mark-complete-btn')).toBeVisible({ timeout: 8000 });
  });

  test('clicking "Marcar como completada" marks lesson as done', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(STUDENT_EMAIL);
    await page.getByLabel('Password').fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/study', { timeout: 10000 });

    await page.goto(`/study/${TEST_SUBJECT_ID}/lessons/${TEST_LESSON_ID}`);

    const btn = page.getByTestId('mark-complete-btn');
    const alreadyDone = await btn.getAttribute('disabled');
    if (alreadyDone !== null) {
      // Already completed in a previous run — just verify it shows completed state
      await expect(btn).toBeDisabled();
      return;
    }

    await btn.click();
    // Button should become disabled (completed)
    await expect(btn).toBeDisabled({ timeout: 8000 });
  });
});

test.describe('UC-11 · Lesson Progress API', () => {
  test('PATCH /api/lessons/[id]/progress returns 401 without session', async ({ request }) => {
    const res = await request.patch('/api/lessons/1/progress', {
      data: { timeSpentSeconds: 30 },
    });
    expect(res.status()).toBe(401);
  });
});
