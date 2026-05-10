/**
 * UC-03 · Student Enrolls in a Subject
 * Phase 0 — Foundation
 *
 * Tests that after signing in, a student sees the subject selection screen
 * and can click a subject to enroll and navigate to it.
 *
 * NOTE: This test requires at least one active subject in the DB.
 * If the DB is fresh/empty, subject-related assertions are skipped.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const STUDENT_EMAIL = `enroll_${Date.now()}@example.com`;
const STUDENT_PASSWORD = 'SecurePass1!';

async function signInAs(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  await page.waitForURL('**/study', { timeout: 10000 });
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'necessary'));
  await page.goto('/sign-up');
  await page.getByLabel('Nombre').fill('Laura');
  await page.getByLabel('Apellidos').fill('Torres');
  await page.getByLabel('Email').fill(STUDENT_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(STUDENT_PASSWORD);
  await page.getByLabel('Confirma la contraseña').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.waitForURL('**/sign-in', { timeout: 10000 });
  await context.close();
});

test.describe('UC-03 · Student Enrolls in a Subject', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie-consent', 'necessary'));
  });

  test('study page shows subject selection card after login', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    await expect(page).toHaveURL(/\/study/);
    // Subject selection card title
    await expect(page.getByText('Select subject')).toBeVisible({ timeout: 8000 });
    // Search input
    await expect(page.getByPlaceholder('Search subject...')).toBeVisible();
  });

  test('student can search subjects', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    const searchInput = page.getByPlaceholder('Search subject...');
    await expect(searchInput).toBeVisible({ timeout: 8000 });
    await searchInput.fill('Civil');
    // Just verify search doesn't crash
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('Civil');
  });

  test('clicking an unenrolled subject enrolls and navigates to it', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    // Wait for subjects to load
    await page.waitForTimeout(1500);

    const subjectItems = page.locator('[cmdk-item]');
    const count = await subjectItems.count();

    if (count === 0) {
      test.skip(true, 'No active subjects in DB — skipping enrollment test');
      return;
    }

    // Click the first subject
    await subjectItems.first().click();

    // Should navigate to /study/{id}
    await page.waitForURL('**/study/**', { timeout: 8000 });
    await expect(page).toHaveURL(/\/study\/\w+/);
  });
});
