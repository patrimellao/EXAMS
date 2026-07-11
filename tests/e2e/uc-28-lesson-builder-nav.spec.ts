/**
 * UC-28 · Teacher Backoffice — lesson row navigates into the wired Plate builder.
 * The subject-page lesson actions must deep-link to ?tab=lessons&lessonId=,
 * opening the real MDX editor (not a textarea dialog). "Nueva lección" creates a
 * lesson (via ?new=1 auto-create) and opens it in the builder.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';
const TEST_SUBJECT_ID = process.env.TEST_SUBJECT_ID ?? '1';

async function signInAs(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  await page.waitForURL('**/teach', { timeout: 10000 });
}

test.describe('UC-28 · lesson row → Plate builder', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL/TEACHER_PASSWORD (run `npm run seed`)');

  test('clicking Editar on a lesson opens the lesson builder', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);

    // First lesson row's primary action links into the builder.
    await page.getByRole('link', { name: 'Editar', exact: true }).first().click();

    await page.waitForURL('**/teach/**/**\\?tab=lessons**', { timeout: 10000 });
    // The Plate lesson editor is present (a contenteditable/textbox), not a modal.
    await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 10000 });
  });

  test('Nueva lección creates a lesson and opens it in the builder', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);

    await page.getByRole('button', { name: /nueva lección/i }).click();
    // With no unit filter active, the unit-picker dialog opens. Scope to it so
    // the Select isn't confused with the page's "Filtrar por unidad" control.
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Nueva lección')).toBeVisible();
    await dialog.getByRole('combobox').click();
    await page.getByRole('option').first().click();
    await dialog.getByRole('button', { name: /crear/i }).click();

    await page.waitForURL('**/teach/**/**\\?tab=lessons**', { timeout: 15000 });
    await expect(page.getByText(/nueva lección/i).first()).toBeVisible({ timeout: 10000 });
  });
});
