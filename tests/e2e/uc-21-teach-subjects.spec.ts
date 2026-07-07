/**
 * UC-21 · Teacher Backoffice — Subjects list page (§3.10)
 * Teacher Backoffice Phase 1 — Task 5
 *
 * Tests:
 * - Teacher can open /teach and see the wired subjects board (real data,
 *   not the wireframe seed array).
 * - Teacher can create a subject via the "Nueva asignatura" dialog and see
 *   it appear in the list immediately (router.refresh() after the mutation).
 *
 * Uses the seeded TEACHER_EMAIL/TEACHER_PASSWORD from .env.test (written by
 * `npm run seed`), following the same signInAs pattern as
 * tests/e2e/uc-10-lessons-backoffice.spec.ts and uc-26-teach-role-gate.spec.ts.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';

async function signInAs(page: Page, email: string, password: string, role: 'student' | 'teacher' = 'student') {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  const expectedUrl = role === 'teacher' ? '**/teach' : '**/study';
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

test.describe('UC-21 · /teach — wired subjects list page', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL and TEACHER_PASSWORD to run this test (run `npm run seed`)');

  test('teacher creates a subject and sees it listed', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto('/teach');

    await page.getByRole('button', { name: /nueva asignatura/i }).click();

    const subjectName = 'Constitución E2E';
    await page.getByLabel(/nombre/i).fill(subjectName);
    await page.getByLabel(/descripci[oó]n/i).fill('Creada por el test UC-21.');
    await page.getByRole('button', { name: /crear|guardar/i }).click();

    await expect(page.getByText(subjectName)).toBeVisible({ timeout: 8000 });
  });
});
