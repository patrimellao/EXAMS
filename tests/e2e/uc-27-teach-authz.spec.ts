/**
 * UC-27 · Server-side teacher-role enforcement on content-authoring mutations
 * Teacher Backoffice Phase 1 — Final whole-branch review fix
 *
 * The /teach route group is gated by PATH only (middleware + (teach)/layout.tsx
 * redirect students away from the pages). But the authoring mutations are
 * "use server" actions / API routes that call controllers directly — an
 * authenticated STUDENT could replay a server-action POST, or hit the REST
 * endpoint directly (e.g. POST /api/subjects), to create/modify/delete course
 * content, bypassing the path-based gate entirely.
 *
 * This test proves the controller-layer guard (lib/assertTeacher.ts) blocks
 * the API-route vector for a signed-in student, and that the block is a real
 * no-op — no content is actually created — not just a client-visible error.
 *
 * Uses the seeded STUDENT_EMAIL/STUDENT_PASSWORD/TEACHER_EMAIL/TEACHER_PASSWORD
 * from .env.test (written by `npm run seed`), following the same signInAs
 * pattern as tests/e2e/uc-21-teach-subjects.spec.ts and uc-26-teach-role-gate.spec.ts.
 *
 * `page.request` shares the browser context's cookie jar, so once signed in
 * via the UI, `page.request.post(...)` carries the student's session cookie —
 * exactly the "replay a server-action POST" attack vector this guards against.
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

test.describe('UC-27 · content-authoring mutations reject non-teacher callers', () => {
  test.skip(!STUDENT_EMAIL || !TEACHER_EMAIL, 'Set STUDENT_EMAIL/PASSWORD and TEACHER_EMAIL/PASSWORD (run `npm run seed`)');

  test('signed-in STUDENT POSTing /api/subjects directly is rejected and creates nothing', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD, 'student');

    const maliciousName = `PWNED by student ${Date.now()}`;

    // Replay the server-action-equivalent POST directly, carrying the
    // student's session cookie (page.request shares the browser context jar).
    const res = await page.request.post('/api/subjects', {
      data: {
        name: maliciousName,
        description: 'Created by a student replaying the authoring endpoint.',
        active: true,
      },
    });

    expect(res.ok(), `expected a rejected (non-2xx) response, got ${res.status()}`).toBeFalsy();
    expect(res.status()).toBeGreaterThanOrEqual(400);

    // Prove the guard actually blocked the write, not just the response code —
    // the subject must not exist when listed.
    const list = await page.request.get('/api/subjects');
    expect(list.ok()).toBeTruthy();
    const subjects: Array<{ name: string }> = await list.json();
    expect(subjects.some((s) => s.name === maliciousName)).toBe(false);
  });

  test('signed-in TEACHER can still create a subject via the same endpoint', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');

    const teacherSubjectName = `UC-27 teacher OK ${Date.now()}`;

    const res = await page.request.post('/api/subjects', {
      data: {
        name: teacherSubjectName,
        description: 'Created by a teacher — the guard must not block this.',
        active: true,
      },
    });

    expect(res.ok(), `expected the teacher's request to succeed, got ${res.status()}`).toBeTruthy();

    const list = await page.request.get('/api/subjects');
    const subjects: Array<{ name: string }> = await list.json();
    expect(subjects.some((s) => s.name === teacherSubjectName)).toBe(true);
  });
});
