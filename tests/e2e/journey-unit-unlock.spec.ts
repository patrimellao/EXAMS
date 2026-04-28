/**
 * Journey test — unit unlock triggered by lesson completion
 *
 * Gap this closes: UC-12 only verifies the static "lock icon is rendered"
 * state. It never exercises the trigger — completing all lessons in unit N
 * should unlock unit N+1. This test marks every lesson of the first unit
 * complete via the real lesson reader UI, then revisits /study/<id> and
 * asserts unit 2's lock icon is gone and its lesson links are clickable.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

const uniqueEmail = () => `unlock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;

async function registerAndSignIn(page: Page, email: string, password: string) {
  await page.goto('/sign-up');
  await page.getByLabel('First name').fill('Unlock');
  await page.getByLabel('Last name').fill('Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/sign-in', { timeout: 10000 });

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/study', { timeout: 12000 });
}

type SubjectLayout = {
  subjectId: number;
  unit1Id: number;
  unit1Lessons: number[];
  unit2Id: number;
  unit2FirstLessonId: number | null;
};

async function fetchSubjectLayout(): Promise<SubjectLayout> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    // Find a subject whose first two units both have lessons and unit 2 requires unlock.
    const { rows: subj } = await client.query(`
      SELECT s.id as subject_id, u1.id as u1_id, u2.id as u2_id
        FROM subjects s
        JOIN units u1 ON u1.subject_id = s.id AND u1."order" = 1 AND u1.active = true
        JOIN units u2 ON u2.subject_id = s.id AND u2."order" = 2 AND u2.active = true
                    AND u2.unlock_previous_required = true
       WHERE EXISTS (SELECT 1 FROM lessons l WHERE l.unit_id = u1.id AND l.active = true)
         AND EXISTS (SELECT 1 FROM lessons l WHERE l.unit_id = u2.id AND l.active = true)
       ORDER BY s.id
       LIMIT 1
    `);
    if (!subj.length) {
      throw new Error('No subject with unit-1 and locked unit-2 both having lessons — reseed DB');
    }
    const subjectId = Number(subj[0].subject_id);
    const unit1Id = Number(subj[0].u1_id);
    const unit2Id = Number(subj[0].u2_id);

    const { rows: u1Lessons } = await client.query(
      `SELECT id FROM lessons WHERE unit_id = $1 AND active = true ORDER BY "order"`,
      [unit1Id]
    );
    const { rows: u2Lessons } = await client.query(
      `SELECT id FROM lessons WHERE unit_id = $1 AND active = true ORDER BY "order" LIMIT 1`,
      [unit2Id]
    );

    return {
      subjectId,
      unit1Id,
      unit1Lessons: u1Lessons.map((r) => Number(r.id)),
      unit2Id,
      unit2FirstLessonId: u2Lessons[0] ? Number(u2Lessons[0].id) : null,
    };
  } finally {
    await client.end();
  }
}

async function isUnit2Unlocked(userId: string, unit2Id: number): Promise<boolean> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT is_unlocked FROM unit_progress WHERE user_id = $1 AND unit_id = $2`,
      [userId, unit2Id]
    );
    return rows[0]?.is_unlocked === true;
  } finally {
    await client.end();
  }
}

async function userIdForEmail(email: string): Promise<string> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    return rows[0].id as string;
  } finally {
    await client.end();
  }
}

test.describe('Journey · unit unlock on lesson completion', () => {
  const createdEmails: string[] = [];

  test.afterAll(async () => {
    if (!createdEmails.length) return;
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      await client.query(`DELETE FROM users WHERE email = ANY($1)`, [createdEmails]);
    } finally {
      await client.end();
    }
  });

  test('completing every lesson in unit 1 unlocks unit 2', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass1!';
    createdEmails.push(email);

    const layout = await fetchSubjectLayout();
    test.skip(
      !layout.unit2FirstLessonId,
      'Layout requires unit 2 to have at least one lesson'
    );

    await registerAndSignIn(page, email, password);
    const userId = await userIdForEmail(email);

    // Enroll by clicking the subject that matches `subjectId`.
    // Seed uses stable subject ids, but its position in the [cmdk-item]
    // list varies; filter directly by the href pattern after click.
    const subjectItems = page.locator('[cmdk-item]');
    await expect(subjectItems.first()).toBeVisible({ timeout: 10000 });
    const count = await subjectItems.count();
    expect(count).toBeGreaterThan(0);

    // Click items until the URL contains the target subjectId.
    let enrolled = false;
    for (let i = 0; i < count; i++) {
      await subjectItems.nth(i).click();
      await page.waitForURL(/\/study\/\d+/, { timeout: 10000 }).catch(() => {});
      if (page.url().endsWith(`/study/${layout.subjectId}`)) {
        enrolled = true;
        break;
      }
      // Otherwise go back to /study and try the next one.
      await page.goto('/study');
      await page.waitForLoadState('networkidle');
    }
    expect(enrolled, `Never landed on /study/${layout.subjectId}`).toBe(true);

    // Verify unit 2 starts LOCKED (no progress row yet).
    expect(await isUnit2Unlocked(userId, layout.unit2Id)).toBe(false);

    // Walk each lesson of unit 1 and mark complete.
    for (const lessonId of layout.unit1Lessons) {
      await page.goto(`/study/${layout.subjectId}/lessons/${lessonId}`);
      await expect(page.getByTestId('mark-complete-btn')).toBeVisible({ timeout: 8000 });
      const btn = page.getByTestId('mark-complete-btn');
      // If already completed on a previous test iteration, button is disabled — skip.
      const disabled = await btn.isDisabled();
      if (!disabled) {
        await btn.click();
        await expect(btn).toBeDisabled({ timeout: 8000 });
      }
    }

    // Allow the server-action unlock to persist.
    await page.waitForTimeout(1000);

    // DB-level assertion: unit 2 is now unlocked.
    expect(await isUnit2Unlocked(userId, layout.unit2Id)).toBe(true);

    // UI-level assertion: unit 2's first lesson link is now navigable.
    await page.goto(`/study/${layout.subjectId}`);
    await page.waitForLoadState('networkidle');
    const u2LessonLink = page.locator(`[data-testid="lesson-link-${layout.unit2FirstLessonId}"]`);
    await expect(u2LessonLink).toBeVisible({ timeout: 8000 });
    const ariaDisabled = await u2LessonLink.getAttribute('aria-disabled');
    expect(
      ariaDisabled === null || ariaDisabled === 'false',
      `unit 2 first lesson link should not be aria-disabled, got ${ariaDisabled}`
    ).toBe(true);
  });
});
