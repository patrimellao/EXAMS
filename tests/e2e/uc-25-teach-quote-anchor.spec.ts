/**
 * UC-25 · Teacher Backoffice — quote-anchor (`lessonRef`) persistence (§3.12)
 * Teacher Backoffice Phase 1 — Task 8
 *
 * A teacher links a question to a lesson passage (the "Citar de la lección"
 * picker), saves, reloads, and the link survives — the persisted quote card AND
 * its load-time-derived status chip (synced|drift|orphan) are shown again. This
 * exercises `lessonRef` + `lessonId` round-tripping through the DB and the
 * server-side status derivation added in Task 8.
 *
 * Follows the same local signInAs + env-creds pattern as uc-23/uc-24.
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

test.describe('UC-25 · /teach/[subjectId]/[unitId] — quote-anchor persistence', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL and TEACHER_PASSWORD to run this test (run `npm run seed`)');

  test('question keeps its lesson quote-anchor with a status chip after reload', async ({ page }) => {
    const stamp = Date.now();
    // A distinctive single paragraph so the picker preview has one clean <p> to
    // select and the persisted quote is uniquely findable after reload.
    const passage = `Cita anclada E2E ${stamp} sobre la capacidad juridica de la persona.`;
    const enunciado = `¿Pregunta cita E2E ${stamp}?`;

    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');

    // 1) Give the first lesson known prose so the picker has a passage to quote.
    await page.goto(`/teach/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}?tab=lessons`);
    const editor = page.locator('[data-slate-editor="true"]');
    await editor.waitFor({ state: 'visible' });
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(passage);
    await page.getByRole('button', { name: /guardar lección/i }).click();
    await expect(page.getByRole('button', { name: /guardado/i })).toBeVisible();

    // 2) Create a question in that same (first) lesson.
    await page.goto(`/teach/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}?tab=questions`);
    await page.getByRole('button', { name: /nueva pregunta/i }).first().click();
    await page.getByLabel(/enunciado/i).fill(enunciado);
    await page.getByRole('button', { name: /guardar pregunta/i }).first().click();
    await expect(page.getByRole('button', { name: /guardado/i }).first()).toBeVisible();
    // Wait for the "¡Guardado!" state to settle back to idle (the save button's
    // 2 s saved→idle timer). Doing the quote flow before it settles lets that
    // stale timer clobber the fresh "dirty" state and disable the save button.
    await expect(
      page.getByRole('button', { name: /^guardar pregunta$/i }).first(),
    ).toBeVisible({ timeout: 8000 });

    // A save triggers router.refresh(); re-select our question so the editor
    // below targets it (not whichever question the fresh render defaulted to).
    await page.getByRole('button').filter({ hasText: enunciado }).first().click();

    // 3) Attach a lesson passage through the "Citar de la lección" picker.
    await page.getByRole('button', { name: /citar de la lección/i }).click();
    const picker = page.locator('.quote-picker');
    await expect(picker).toBeVisible();
    await expect(picker.getByText(new RegExp(String(stamp)))).toBeVisible();

    // Programmatically select the passage paragraph, then fire mouseup so the
    // picker captures the selection (real drag-select is unreliable headless).
    await page.evaluate(() => {
      const root = document.querySelector('.quote-picker-doc');
      const p = root?.querySelector('p');
      if (!p) throw new Error('picker preview has no paragraph to select');
      const range = document.createRange();
      range.selectNodeContents(p);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
    await picker.dispatchEvent('mouseup', { bubbles: true });

    const useBtn = page.getByRole('button', { name: /^usar como cita$/i });
    await expect(useBtn).toBeEnabled();
    await useBtn.click();

    // 4) Persist the question — now carrying lessonRef + lessonId.
    await page.getByRole('button', { name: /guardar pregunta/i }).first().click();
    await expect(page.getByRole('button', { name: /guardado/i }).first()).toBeVisible();

    // 5) Reload: the link survives and its derived status chip is shown.
    await page.reload();
    await page.getByRole('button').filter({ hasText: enunciado }).first().click();

    // The persisted quote card renders the passage…
    await expect(page.getByText(new RegExp(String(stamp))).first()).toBeVisible();
    // …and the load-time-derived status chip (synced|drift|orphan) is visible.
    await expect(page.getByTestId('lesson-ref-status')).toBeVisible();
  });
});
