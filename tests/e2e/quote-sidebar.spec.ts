import { test, expect, type Page } from '@playwright/test';

// The /wireframes route is public mock data — no auth / DB seeding required.
const BUILDER_URL = '/wireframes/teach/build/lessons?subject=1&unit=1&lesson=1';

// Selects a word in the lesson editor and pushes it as a quote into the first
// existing question via the floating "Añadir cita a…" menu.
async function quoteWord(page: Page, word: string) {
  // Dismiss cookie banner if present so it doesn't block UI interactions.
  const cookieDismiss = page.getByRole('button', { name: /Solo necesarias/i });
  if (await cookieDismiss.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieDismiss.click();
  }
  const editor = page.locator('[data-slate-editor="true"]');
  await editor.waitFor({ state: 'visible' });
  await editor.getByText(word, { exact: false }).first().dblclick();
  await page.getByRole('button', { name: /Usar como cita/i }).click();
  await page.getByRole('button', { name: /^P1/ }).first().click();
}

test('creating a quote drops a persistent dotted anchor in the lesson body', async ({ page }) => {
  await page.goto(BUILDER_URL);
  await quoteWord(page, 'aptitud');
  const anchor = page.locator('[data-quote-anchor]').first();
  await expect(anchor).toBeVisible();
  await expect(anchor).toHaveClass(/quote-anchor/);
});

test('editing the quoted text turns its anchor amber (drift)', async ({ page }) => {
  await page.goto(BUILDER_URL);
  await quoteWord(page, 'aptitud');

  const anchor = page.locator('[data-quote-anchor]').first();
  await expect(anchor).toHaveClass(/border-dotted/);

  // Edit inside the quoted range: place caret and type.
  await anchor.click();
  await page.keyboard.type('XYZ');

  await expect(anchor).toHaveClass(/border-dashed/);
});

test('the sidebar lists quotes with a review count and statuses', async ({ page }) => {
  await page.goto(BUILDER_URL);
  await quoteWord(page, 'aptitud');

  await page.getByRole('button', { name: /Citas de la lección/i }).click();
  const panel = page.getByRole('complementary', { name: /Citas de la lección/i });
  await expect(panel).toBeVisible();
  await expect(panel.getByText('aptitud para realizar', { exact: false })).toBeVisible();
  await expect(panel.getByText(/Sincronizada/i)).toBeVisible();
});
