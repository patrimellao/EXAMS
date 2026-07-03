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

  // Open the sidebar BEFORE creating any quote.
  // The pre-seeded Q1 row is an ORPHAN (no anchorId), so "Sincronizada" must be absent.
  await page.getByRole('button', { name: /Citas de la lección/i }).click();
  const panel = page.getByRole('complementary', { name: /Citas de la lección/i });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(/Sincronizada/i)).toHaveCount(0);

  // Now create a quote — this is the only path that produces a SYNCED row.
  await quoteWord(page, 'aptitud');

  // After creation exactly one SYNCED row must appear.
  await expect(panel.getByText(/Sincronizada/i)).toHaveCount(1);
});

test('"Usar texto actual" re-syncs a drifted quote', async ({ page }) => {
  await page.goto(BUILDER_URL);
  await quoteWord(page, 'aptitud');
  const anchor = page.locator('[data-quote-anchor]').first();
  await anchor.click();
  await page.keyboard.type('XYZ');

  await page.getByRole('button', { name: /Citas de la lección/i }).click();
  const panel = page.getByRole('complementary', { name: /Citas de la lección/i });
  await expect(panel.getByText(/A revisar \(1\)/)).toBeVisible();

  await panel.getByRole('button', { name: 'Usar texto actual' }).click();
  await expect(panel.getByText(/A revisar \(0\)/)).toBeVisible();
  await expect(anchor).toHaveClass(/border-dotted/);
});

test('"Quitar cita" removes the quote row and its anchor from the editor', async ({ page }) => {
  await page.goto(BUILDER_URL);

  // Create a synced quote on "aptitud".
  await quoteWord(page, 'aptitud');
  const anchor = page.locator('[data-quote-anchor]');
  await expect(anchor).toHaveCount(1);

  // Open the sidebar.
  await page.getByRole('button', { name: /Citas de la lección/i }).click();
  const panel = page.getByRole('complementary', { name: /Citas de la lección/i });

  // Make the quote orphan by deleting its anchored text from the Plate editor.
  // A quote is ORPHAN when its <QuoteAnchor id="…"> tag no longer exists in the
  // serialized markdown — which happens when the wrapped text is fully deleted.
  await page.locator('[data-quote-anchor]').first().click();
  await page.evaluate(() => {
    const el = document.querySelector('[data-quote-anchor]') as HTMLElement | null;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });
  await page.keyboard.press('Delete');

  // Wait for the anchor to disappear from the editor DOM and the row to turn orphan.
  await expect(page.locator('[data-quote-anchor]')).toHaveCount(0);

  // The sidebar row is now orphan — "Quitar cita" button must be visible.
  const removeBtn = panel.getByRole('button', { name: 'Quitar cita' }).first();
  await expect(removeBtn).toBeVisible();

  // Click it.
  await removeBtn.click();

  // The row must be gone from the sidebar and no anchor remains in the body.
  await expect(panel.getByRole('button', { name: 'Quitar cita' })).toHaveCount(0);
  await expect(page.locator('[data-quote-anchor]')).toHaveCount(0);
});

test('"Citas" is a view mode showing the editor and quote panel together', async ({ page }) => {
  await page.goto(BUILDER_URL);

  // Dismiss cookie banner if present so it doesn't block UI interactions.
  const cookieDismiss = page.getByRole('button', { name: /Solo necesarias/i });
  if (await cookieDismiss.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieDismiss.click();
  }

  const citas = page.getByRole('button', { name: /Citas de la lección/i });
  const escribir = page.getByRole('button', { name: 'Escribir' });
  await expect(escribir).toHaveAttribute('aria-pressed', 'true');

  await citas.click();

  // It's a mutually-exclusive mode, not an independent toggle: selecting Citas
  // un-presses the other view modes.
  await expect(citas).toHaveAttribute('aria-pressed', 'true');
  await expect(escribir).toHaveAttribute('aria-pressed', 'false');

  // Panel and editor are visible at the same time (co-visibility).
  await expect(
    page.getByRole('complementary', { name: /Citas de la lección/i }),
  ).toBeVisible();
  await expect(page.locator('[data-slate-editor="true"]')).toBeVisible();
});
