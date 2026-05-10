/**
 * UC-10 · Teacher Creates / Edits a Lesson
 * Phase 2 — Content
 *
 * Tests:
 * - Build page shows "Preguntas" and "Lecciones" tabs (teacher only)
 * - Student cannot access /build
 * - Teacher can create, see, and delete a lesson (requires TEACHER_EMAIL + DB with at least one subject/unit)
 * - File upload flow is stubbed (presign endpoint returns 401 without credentials)
 *
 * If TEACHER_EMAIL / TEACHER_PASSWORD are not set, teacher-specific tests are skipped.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const STUDENT_EMAIL = `uc10_student_${Date.now()}@example.com`;
const STUDENT_PASSWORD = 'SecurePass1!';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';

// Subject/unit IDs that exist in the test DB (can be overridden via env)
const TEST_SUBJECT_ID = process.env.TEST_SUBJECT_ID ?? '1';
const TEST_UNIT_ID = process.env.TEST_UNIT_ID ?? '1';

async function signInAs(page: Page, email: string, password: string, role: 'student' | 'teacher' = 'student') {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  const expectedUrl = role === 'teacher' ? '**/teach' : '**/study';
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

test.beforeAll(async ({ browser }) => {
  // Create student account
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/sign-up');
  await page.getByLabel('Nombre').fill('UC10');
  await page.getByLabel('Apellidos').fill('Student');
  await page.getByLabel('Email').fill(STUDENT_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(STUDENT_PASSWORD);
  await page.getByLabel('Confirma la contraseña').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.waitForURL('**/sign-in', { timeout: 10000 });
  await context.close();
});

test.describe('UC-10 · Lessons Backoffice — Access control', () => {
  test('student is redirected away from /build', async ({ page }) => {
    await signInAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto(`/build/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}`);
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/\/build/);
  });

  test('presign endpoint rejects unauthenticated requests', async ({ request }) => {
    const res = await request.post('/api/storage/presign', {
      data: { fileName: 'test.pdf', fileType: 'application/pdf', fileSize: 1024 },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('UC-10 · Lessons Backoffice — Teacher flows', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL and TEACHER_PASSWORD to run teacher lesson tests');

  test('build page shows Preguntas and Lecciones tabs', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/build/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}`);

    await expect(page.getByRole('tab', { name: /preguntas/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('tab', { name: /lecciones/i })).toBeVisible();
  });

  test('Lecciones tab shows LessonBuilder', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/build/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}`);

    await page.getByRole('tab', { name: /lecciones/i }).click();

    await expect(page.getByLabel('Título *')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Tipo')).toBeVisible();
  });

  test('teacher can create a lesson', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/build/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}`);
    await page.getByRole('tab', { name: /lecciones/i }).click();

    const lessonTitle = `Test lesson ${Date.now()}`;
    await page.getByLabel('Título *').fill(lessonTitle);
    await page.getByLabel('Orden').fill('99');
    await page.getByLabel('Contenido (Markdown)').fill('## Intro\n\nContenido de prueba.');
    const createBtn = page.getByRole('button', { name: 'Crear lección' });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.evaluate((el: HTMLElement) => el.click());

    // Lesson should appear in the sidebar list
    await expect(page.getByText(lessonTitle)).toBeVisible({ timeout: 8000 });
  });

  test('teacher can edit an existing lesson', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/build/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}`);
    await page.getByRole('tab', { name: /lecciones/i }).click();

    // Click the first lesson in the sidebar (if any)
    const firstLesson = page.locator('[data-testid^="lesson-link-"]').first();
    const count = await firstLesson.count();
    if (count === 0) {
      test.skip(); // no lessons to edit
      return;
    }

    await firstLesson.click();
    // Form should populate
    await expect(page.getByLabel('Título *')).not.toHaveValue('');
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
  });

  test('teacher can delete a lesson', async ({ page }) => {
    // First create a lesson to delete
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/build/${TEST_SUBJECT_ID}/${TEST_UNIT_ID}`);
    await page.getByRole('tab', { name: /lecciones/i }).click();

    const lessonTitle = `Delete me ${Date.now()}`;
    await page.getByLabel('Título *').fill(lessonTitle);
    const createBtn2 = page.getByRole('button', { name: 'Crear lección' });
    await createBtn2.scrollIntoViewIfNeeded();
    await createBtn2.evaluate((el: HTMLElement) => el.click());
    await expect(page.getByText(lessonTitle)).toBeVisible({ timeout: 8000 });

    // Delete it — find the exact card (the one whose own <p> contains the title) and click its delete button
    const lessonCard = page
      .locator('[data-testid^="lesson-link-"]')
      .filter({ hasText: lessonTitle })
      .first();
    await lessonCard.getByRole('button', { name: 'Eliminar lección' }).click();
    await expect(page.getByText(lessonTitle)).not.toBeVisible({ timeout: 5000 });
  });
});
