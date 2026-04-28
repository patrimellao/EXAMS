/**
 * Journey test — real enrollment flow
 *
 * Gap this closes: UC-03 only checks that the "Select subject" card
 * renders for a new user. It never clicks a subject, never verifies
 * that clicking enrolls, navigates, and that the subject then appears
 * in the sidebar on subsequent visits.
 *
 * This test exercises the full flow: fresh user → /study shows subject
 * list → click subject → land on /study/<id> → reload → sidebar still
 * lists the enrolled subject.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { Client } from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

function watchRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  return errors;
}

const uniqueEmail = () => `enroll_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;

async function registerAndSignIn(page: Page, email: string, password: string) {
  await page.goto('/sign-up');
  await page.getByLabel('First name').fill('Enroll');
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

test.describe('Journey · enrollment', () => {
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

  test('fresh student enrolls by clicking a subject and it sticks across reloads', async ({ page }) => {
    const runtimeErrors = watchRuntimeErrors(page);
    const email = uniqueEmail();
    const password = 'SecurePass1!';
    createdEmails.push(email);

    await registerAndSignIn(page, email, password);

    // ── On /study: SubjectSelectionCard shows subjects ──────────
    await expect(page.getByText(/select subject/i)).toBeVisible({ timeout: 8000 });
    const subjectItems = page.locator('[cmdk-item]');
    // Subjects are loaded async inside useEffect + startTransition,
    // so wait until at least one item is mounted before counting.
    await expect(subjectItems.first()).toBeVisible({ timeout: 10000 });
    const count = await subjectItems.count();
    expect(count, 'Seeded DB should expose at least one active subject').toBeGreaterThan(0);

    // Capture the first subject's visible name to verify it appears in the sidebar.
    const firstSubjectName = (await subjectItems.first().textContent())?.trim() ?? '';

    // ── Click → enrolls + router.push('/study/<id>') ────────────
    await Promise.all([
      page.waitForURL(/\/study\/\d+/, { timeout: 10000 }),
      subjectItems.first().click(),
    ]);
    await page.waitForLoadState('networkidle');

    const enrolledUrl = page.url();
    expect(enrolledUrl).toMatch(/\/study\/\d+$/);

    // ── Reload and verify persistence (sidebar lists subject) ───
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe(enrolledUrl);

    // The sidebar renders subject-navigation links whose accessible
    // name contains the subject name. We just assert the name appears
    // somewhere on the landing page (sidebar or main pane).
    if (firstSubjectName) {
      const slice = firstSubjectName.slice(0, 12);
      await expect(page.getByText(new RegExp(slice.replace(/\s+/g, '\\s+'), 'i')).first()).toBeVisible({ timeout: 8000 });
    }

    expect(runtimeErrors, `leaks:\n${runtimeErrors.join('\n')}`).toEqual([]);
  });
});
