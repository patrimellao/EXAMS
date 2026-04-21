/**
 * Journey test — quiz end-to-end
 *
 * Gap this closes: UC-06/07/09 test the quiz UI in isolation and skip
 * whenever a fresh user has no quiz history (which is always, because
 * nothing in the product UI lets a fresh user START a quiz — quiz
 * records must pre-exist). This test pre-seeds a quiz record for the
 * test student, then walks the full /quiz/<id> flow: answer each
 * question → submit → results page → DB score updated.
 */
import { test, expect } from '../fixtures';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

const STUDENT_EMAIL = process.env.STUDENT_EMAIL ?? 'student1@exams.test';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD ?? 'Student123!';

type QuizSetup = { quizId: number; unitId: number; questionCount: number };

async function seedQuizForStudent(): Promise<QuizSetup> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    // Grab the student's user id.
    const { rows: userRows } = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [STUDENT_EMAIL]
    );
    if (!userRows.length) throw new Error(`Student ${STUDENT_EMAIL} missing — run npm run seed`);
    const userId = userRows[0].id as string;

    // Find a unit with at least 5 questions.
    const { rows: unitRows } = await client.query(`
      SELECT u.id as unit_id, count(q.id) as qcount
        FROM units u
        JOIN questions q ON q.unit_id = u.id
       GROUP BY u.id
       HAVING count(q.id) >= 5
       ORDER BY u.id
       LIMIT 1
    `);
    if (!unitRows.length) throw new Error('No unit with ≥ 5 questions — reseed DB');
    const unitId = Number(unitRows[0].unit_id);

    // Clear any existing in-progress quiz for this user+unit to keep the test idempotent.
    await client.query(
      `DELETE FROM quiz_details WHERE "user_Id" = $1 AND unit_id = $2`,
      [userId, unitId]
    );
    await client.query(
      `DELETE FROM quizzes WHERE user_id = $1 AND unit_id = $2 AND score IS NULL`,
      [userId, unitId]
    );

    // Create a fresh quiz with score NULL (not yet taken).
    const now = new Date().toISOString();
    const { rows: quizRows } = await client.query(
      `INSERT INTO quizzes (user_id, unit_id, score, started_at, created_at, updated_at)
       VALUES ($1, $2, NULL, $3, $3, $3)
       RETURNING id`,
      [userId, unitId, now]
    );
    const quizId = Number(quizRows[0].id);

    // Pick first 5 questions and insert quiz_details rows (the quiz UI reads these).
    const { rows: qRows } = await client.query(
      `SELECT id FROM questions WHERE unit_id = $1 ORDER BY id LIMIT 5`,
      [unitId]
    );
    for (const q of qRows) {
      await client.query(
        `INSERT INTO quiz_details (quiz_id, "user_Id", question_id, unit_id, correct, created_at)
         VALUES ($1, $2, $3, $4, false, $5)`,
        [quizId, userId, Number(q.id), unitId, now]
      );
    }

    return { quizId, unitId, questionCount: qRows.length };
  } finally {
    await client.end();
  }
}

async function fetchScore(quizId: number): Promise<number | null> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(`SELECT score FROM quizzes WHERE id = $1`, [quizId]);
    return rows[0]?.score ?? null;
  } finally {
    await client.end();
  }
}

test.describe('Journey · quiz end-to-end', () => {
  let setup: QuizSetup;

  test.beforeAll(async () => {
    setup = await seedQuizForStudent();
  });

  test('student answers every question, submits, and the score is persisted', async ({ page }) => {
    // Login via UI.
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(STUDENT_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/study', { timeout: 12000 });

    // Navigate directly to the seeded quiz.
    await page.goto(`/quiz/${setup.quizId}`);
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 });

    // For each question: pick the first answer, then click Next.
    // Answer options live in the `grid.grid-cols-1` container inside the
    // question view; Next is a separate button that only becomes visible
    // after an answer is selected.
    for (let i = 0; i < setup.questionCount; i++) {
      const answersGrid = page.locator('div.grid.grid-cols-1').first();
      await expect(answersGrid).toBeVisible({ timeout: 8000 });
      await answersGrid.locator('button').first().click();

      const nextBtn = page.getByRole('button', { name: /^next$/i });
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await nextBtn.click();
    }

    // Results page shows a "score%" heading and "Try again" / "Finish" buttons.
    await expect(page.getByRole('button', { name: /finish|try again/i }).first()).toBeVisible({ timeout: 10000 });

    // DB must have a score now (0-100, possibly 0 if all wrong — but no longer NULL).
    // Allow a moment for submitQuiz to persist.
    await page.waitForTimeout(1500);
    const finalScore = await fetchScore(setup.quizId);
    expect(
      finalScore,
      `Quiz score was not persisted. Expected 0..100, got ${finalScore}`
    ).not.toBeNull();
    expect(typeof finalScore).toBe('number');
    expect(finalScore).toBeGreaterThanOrEqual(0);
    expect(finalScore).toBeLessThanOrEqual(100);
  });
});
