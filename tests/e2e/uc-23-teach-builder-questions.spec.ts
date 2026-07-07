/**
 * UC-23 · Teacher Backoffice — wired Content Builder: questions (§3.12)
 * Teacher Backoffice Phase 1 — Task 7
 *
 * A teacher authors a question (label + enunciado + difficulty + explanation +
 * answers, one marked correct) in the wired builder, saves it, reloads, and the
 * question persists (loaded back from the DB, not the wireframe seed array).
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

test.describe('UC-23 · /teach/[subjectId]/[unitId]?tab=questions — wired builder', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL and TEACHER_PASSWORD to run this test (run `npm run seed`)');

  test('teacher authors a question with label, difficulty and explanation', async ({ page }) => {
    const stamp = Date.now();
    const label = `Etiqueta E2E ${stamp}`;
    const enunciado = `¿Pregunta E2E ${stamp}?`;
    const explanation = `Explicación E2E ${stamp}`;

    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/teach/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}?tab=questions`);

    await page.getByRole('button', { name: /nueva pregunta/i }).first().click();

    await page.getByLabel(/etiqueta/i).fill(label);
    await page.getByLabel(/enunciado/i).fill(enunciado);
    await page.getByRole('button', { name: /^difícil$/i }).click();
    await page.getByLabel(/explicación/i).fill(explanation);

    // The new question seeds two answers with "Opción A" already marked correct,
    // which satisfies "answers, one correct".

    await page.getByRole('button', { name: /guardar pregunta/i }).first().click();
    // Deterministic post-save signal (button flips to "¡Guardado con éxito!").
    await expect(page.getByRole('button', { name: /guardado/i }).first()).toBeVisible();

    // Appears in the navigator immediately…
    await expect(page.getByText(enunciado)).toBeVisible();

    // …and survives a full reload (persisted to the DB).
    await page.reload();
    await expect(page.getByText(enunciado)).toBeVisible();

    // Re-open it and confirm the authored fields round-tripped.
    await page.getByRole('button').filter({ hasText: enunciado }).first().click();
    await expect(page.getByLabel(/etiqueta/i)).toHaveValue(label);
    await expect(page.getByLabel(/explicación/i)).toHaveValue(explanation);
  });
});
