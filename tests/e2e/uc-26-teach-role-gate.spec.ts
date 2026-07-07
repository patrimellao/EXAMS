/**
 * UC-26 · Teach Route Group — Server-Side Role Gate
 * Teacher Backoffice Phase 1 — Task 4
 *
 * Tests:
 * - Student signed in and navigating to /teach is redirected away (middleware
 *   already handles this; the `(teach)` layout gate is defense-in-depth).
 * - Teacher can open /teach and sees the new slate shell (TeachSidebar).
 *
 * Uses the seeded TEACHER_EMAIL/TEACHER_PASSWORD/STUDENT_EMAIL/STUDENT_PASSWORD
 * from .env.test (written by `npm run seed`), following the same signInAs
 * pattern as tests/e2e/uc-10-lessons-backoffice.spec.ts.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';
const STUDENT_EMAIL = process.env.STUDENT_EMAIL ?? '';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD ?? '';

async function signInAs(page: Page, email: string, password: string, role: 'student' | 'teacher' = 'student') {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  const expectedUrl = role === 'teacher' ? '**/teach' : '**/study';
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

test.describe('UC-26 · (teach) route group — role gate', () => {
  test.skip(!STUDENT_EMAIL || !TEACHER_EMAIL, 'Set STUDENT_EMAIL/PASSWORD and TEACHER_EMAIL/PASSWORD (run `npm run seed`)');

  test('student is blocked from /teach', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD, 'student');
    await page.goto('/teach');
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/\/teach/);
  });

  test('teacher can open /teach and sees the TeachSidebar shell', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto('/teach');
    await expect(page).toHaveURL(/\/teach/);
    // The subjects page itself doesn't exist yet (Task 5); assert on the
    // shell that the (teach) layout renders around it instead.
    await expect(page.getByRole('link', { name: /asignaturas/i })).toBeVisible();
    await expect(page.getByText('TuFolio')).toBeVisible();
  });
});
