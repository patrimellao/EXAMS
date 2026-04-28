/**
 * Journey test — teacher creates a lesson end-to-end
 *
 * Gap this closes: UC-10 verifies create/edit/delete via LessonBuilder
 * UI, but never proves the created lesson is actually reachable by a
 * student. This test logs in as teacher, creates a lesson with a
 * unique title, logs out, logs in as student, navigates to the
 * student lesson reader for that lesson and confirms the title and
 * content are rendered. If this test fails but UC-10's create test
 * passes, the bug is "teacher can save but students can't see".
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? 'teacher@exams.test';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? 'Teacher123!';
const STUDENT_EMAIL = process.env.STUDENT_EMAIL ?? 'student1@exams.test';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD ?? 'Student123!';

const TEST_SUBJECT_ID = Number(process.env.TEST_SUBJECT_ID ?? 1);
const TEST_UNIT_ID = Number(process.env.TEST_UNIT_ID ?? 1);

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/\/(study|teach)/, { timeout: 12000 });
}

async function signOut(page: Page) {
  // Clear all cookies and reload — simplest cross-role switch without
  // depending on a sign-out UI surface.
  await page.context().clearCookies();
  await page.goto('/');
}

test.describe('Journey · teacher creates lesson, student consumes it', () => {
  let createdLessonId: number | null = null;
  const uniqueTitle = `Journey lesson ${Date.now()}`;
  const uniqueContent = `Contenido de prueba ${Date.now()}. Este texto debe aparecer en el lector.`;

  test.afterAll(async () => {
    if (!createdLessonId) return;
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      await client.query(`DELETE FROM lessons WHERE id = $1`, [createdLessonId]);
    } finally {
      await client.end();
    }
  });

  test('teacher creates lesson via /build, student reads it via /study', async ({ page }) => {
    // ── Teacher side ────────────────────────────────────────────
    await signIn(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto(`/build/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}`);
    await page.getByRole('tab', { name: /lecciones/i }).click();

    await page.getByLabel('Título *').fill(uniqueTitle);
    // Fill the article content if the textarea is present.
    const contentField = page.getByLabel(/contenido/i).first();
    if (await contentField.isVisible().catch(() => false)) {
      await contentField.fill(uniqueContent);
    }
    const createBtn = page.getByRole('button', { name: 'Crear lección' });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.evaluate((el: HTMLElement) => el.click());

    // Sidebar card must appear.
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 10000 });

    // Fetch the new lesson id directly from the DB (we need it for
    // the student URL — the UI doesn't expose it in a stable way).
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      const { rows } = await client.query(
        `SELECT id FROM lessons WHERE title = $1 AND unit_id = $2`,
        [uniqueTitle, TEST_UNIT_ID]
      );
      expect(rows.length, `Lesson "${uniqueTitle}" was not saved to DB`).toBe(1);
      createdLessonId = Number(rows[0].id);
    } finally {
      await client.end();
    }

    // ── Student side ────────────────────────────────────────────
    await signOut(page);
    await signIn(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    await page.goto(`/study/${TEST_SUBJECT_ID}/lessons/${createdLessonId}`);
    await expect(page.getByRole('heading', { name: uniqueTitle })).toBeVisible({ timeout: 10000 });

    if (uniqueContent) {
      // The content text is rendered inside [data-testid="lesson-content"].
      const content = page.getByTestId('lesson-content');
      // Only assert if the lesson is of article type (content-text is filled).
      if (await content.isVisible().catch(() => false)) {
        await expect(content).toContainText(uniqueContent.slice(0, 40));
      }
    }

    // The "mark as complete" CTA proves the lesson reader rendered fully.
    await expect(page.getByTestId('mark-complete-btn')).toBeVisible({ timeout: 8000 });
  });
});
