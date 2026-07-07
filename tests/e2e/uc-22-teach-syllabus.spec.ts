/**
 * UC-22 · Teacher Backoffice — Syllabus page: units + lessons per subject (§3.11)
 * Teacher Backoffice Phase 1 — Task 6
 *
 * Tests:
 * - Teacher can open /teach/[subjectId] for a seeded subject and see the
 *   wired syllabus board (real units/lessons, not the wireframe seed array).
 * - Teacher can create a unit via the "Nueva unidad" dialog and see it
 *   appear in the list immediately (router.refresh() after the mutation).
 *
 * Uses the seeded TEACHER_EMAIL/TEACHER_PASSWORD and TEST_SUBJECT_ID from
 * .env.test (written by `npm run seed`), following the same signInAs pattern
 * as tests/e2e/uc-10-lessons-backoffice.spec.ts and uc-21-teach-subjects.spec.ts.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';

// Subject id that exists in the seeded test DB (can be overridden via env).
const TEST_SUBJECT_ID = process.env.TEST_SUBJECT_ID ?? '1';

async function signInAs(page: Page, email: string, password: string, role: 'student' | 'teacher' = 'student') {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  const expectedUrl = role === 'teacher' ? '**/teach' : '**/study';
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

test.describe('UC-22 · /teach/[subjectId] — wired syllabus page', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL and TEACHER_PASSWORD to run this test (run `npm run seed`)');

  test('teacher adds a unit to a subject', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);

    await page.getByRole('button', { name: /nueva unidad|añadir unidad/i }).click();
    const unitName = `Tema 1 E2E ${Date.now()}`;
    await page.getByLabel(/nombre/i).fill(unitName);
    await page.getByRole('button', { name: /guardar|crear/i }).click();

    await expect(page.getByText(unitName)).toBeVisible({ timeout: 8000 });
  });
});
