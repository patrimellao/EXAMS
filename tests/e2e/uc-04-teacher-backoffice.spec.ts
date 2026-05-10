/**
 * UC-04 · Teacher Manages Content (Backoffice)
 * Phase 0 — Foundation
 *
 * Tests:
 * - Student (role=student) is blocked from /teach and /build
 * - Teacher role can access /teach
 *
 * NOTE: Teacher account must be created directly in the DB (no UI flow yet).
 * If TEACHER_EMAIL / TEACHER_PASSWORD env vars are not set, teacher tests are skipped.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const STUDENT_EMAIL = `teacher_test_student_${Date.now()}@example.com`;
const STUDENT_PASSWORD = 'SecurePass1!';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';

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
  await page.getByLabel('Nombre').fill('Estudiante');
  await page.getByLabel('Apellidos').fill('Test');
  await page.getByLabel('Email').fill(STUDENT_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(STUDENT_PASSWORD);
  await page.getByLabel('Confirma la contraseña').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.waitForURL('**/sign-in', { timeout: 10000 });
  await context.close();
});

test.describe('UC-04 · Teacher Backoffice — Role-based access control', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie-consent', 'necessary'));
  });

  test('student cannot access /teach — redirected', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/teach');
    // Middleware should redirect students away from /teach
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/\/teach$/);
  });

  test('student cannot access /build — redirected', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/build/1/1');
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/\/build/);
  });

  test.describe('Teacher role', () => {
    test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL and TEACHER_PASSWORD env vars to run teacher tests');

    test('teacher can access /teach', async ({ page }) => {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill(TEACHER_EMAIL);
      await page.getByLabel('Contraseña', { exact: true }).fill(TEACHER_PASSWORD);
      await page.getByRole('button', { name: 'Inicia sesión' }).click();
      // Teacher redirects to /teach
      await page.waitForURL('**/teach', { timeout: 10000 });
      await expect(page).toHaveURL(/\/teach/);
    });

    test('teacher sees subject list on /teach', async ({ page }) => {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill(TEACHER_EMAIL);
      await page.getByLabel('Contraseña', { exact: true }).fill(TEACHER_PASSWORD);
      await page.getByRole('button', { name: 'Inicia sesión' }).click();
      await page.waitForURL('**/teach', { timeout: 10000 });

      // Should see the main teacher page content
      await expect(page.locator('main')).toBeVisible();
    });
  });
});
