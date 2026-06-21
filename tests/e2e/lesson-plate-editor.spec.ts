/**
 * Lesson Plate Editor (Phase 2B wireframe)
 *
 * Verifies the Plate block editor mounted in the teacher lesson builder
 * (components/teach/lesson-editor/*). The /wireframes route is public mock data,
 * so no auth / DB seeding is required.
 *
 * Asserts:
 * - The editor deserializes the seeded markdown into rich text
 *   (heading, bold run, list, blockquote) — not raw markdown text.
 * - The WYSIWYG toolbar (incl. custom block buttons) is present.
 */
import { test, expect } from '@playwright/test';

const BUILDER_URL = '/wireframes/teach/build/lessons?subject=1&unit=1&lesson=1';

test.describe('Lesson Plate editor', () => {
  test('renders seeded markdown as rich text with toolbar', async ({ page }) => {
    await page.goto(BUILDER_URL);

    // Plate editable surface
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();

    // Markdown was deserialized into real nodes (not shown as literal markdown)
    await expect(editor.getByRole('heading', { name: 'Capacidad de obrar' })).toBeVisible();
    await expect(editor.locator('strong', { hasText: 'capacidad de obrar' }).first()).toBeVisible();
    await expect(editor.locator('ul li').first()).toBeVisible();
    await expect(editor.locator('blockquote')).toContainText('Código Civil');

    // No raw markdown tokens leaked into the rendered text
    await expect(editor).not.toContainText('**capacidad de obrar**');

    // WYSIWYG toolbar incl. custom block inserters
    await expect(page.getByRole('button', { name: 'Negrita (⌘B)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bloque de Objetivos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bloque de Idea Clave' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Insertar vídeo' })).toBeVisible();
  });
});
