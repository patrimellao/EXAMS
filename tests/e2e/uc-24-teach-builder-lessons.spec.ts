/**
 * UC-24 · Teacher Backoffice — wired Content Builder: lessons (§3.12)
 * Teacher Backoffice Phase 1 — Task 7
 *
 * A teacher creates a lesson, gives it a title/subtitle/XP and a body, saves it,
 * reloads, and the lesson persists (loaded back from the DB).
 *
 * Follows the same local signInAs + env-creds pattern as uc-22-teach-syllabus.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';
const TEST_SUBJECT_ID = process.env.TEST_SUBJECT_ID ?? '1';
const TEST_UNIT_ID = process.env.TEST_UNIT_ID ?? '1';

async function signInAs(
  page: Page,
  email: string,
  password: string,
  role: 'student' | 'teacher' = 'student',
) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  const expectedUrl = role === 'teacher' ? '**/teach' : '**/study';
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

test.describe('UC-24 · /teach/[subjectId]/[unitId]?tab=lessons — wired builder', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL and TEACHER_PASSWORD to run this test (run `npm run seed`)');

  test('teacher authors a lesson with subtitle, XP and body', async ({ page }) => {
    const stamp = Date.now();
    const title = `Lección E2E ${stamp}`;
    const subtitle = `Subtítulo E2E ${stamp}`;

    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/teach/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}?tab=lessons`);

    // Create a fresh lesson (persisted immediately with defaults) and edit it.
    // The create is async and updates the URL with ?lessonId= once the new lesson
    // is the active one — wait for that so the edits below target the new lesson.
    await page.getByRole('button', { name: /nueva lección/i }).click();
    await page.waitForURL(/[?&]lessonId=\d+/, { timeout: 10000 });

    // Title / subtitle / XP live in the "Configurar lección" side panel.
    await page.getByRole('button', { name: /configurar lección/i }).click();
    await page.getByLabel('Título', { exact: true }).fill(title);
    await page.getByLabel(/subtítulo/i).fill(subtitle);
    await page.getByLabel(/xp/i).fill('20');
    await page.keyboard.press('Escape'); // close the config sheet

    // Type a body into the Plate editor.
    await page.locator('[data-slate-editor="true"]').click();
    await page.keyboard.type('Cuerpo de la lección E2E.');

    await page.getByRole('button', { name: /guardar lección/i }).click();
    // Deterministic post-save signal (button flips to "¡Guardado!").
    await expect(page.getByRole('button', { name: /guardado/i })).toBeVisible();

    // Persisted to the DB: it shows up on a fresh server render of the syllabus
    // (search by the unique title to avoid pagination).
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);
    await page.getByRole('searchbox', { name: /buscar lección/i }).fill(title);
    await expect(page.getByText(title)).toBeVisible();
  });
});
