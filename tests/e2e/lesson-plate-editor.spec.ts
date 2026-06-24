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
    await expect(page.getByRole('button', { name: 'Insertar diagrama' })).toBeVisible();
  });

  test('inserts a Mermaid diagram from the form builder', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();

    // Open the diagram dialog from the toolbar. Scope by accessible name — a
    // cookie-consent banner on the page also has role="dialog".
    await page.getByRole('button', { name: 'Insertar diagrama' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insertar diagrama' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Formulario' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Avanzado' })).toBeVisible();

    // The starter outline renders a live Mermaid preview (client-side SVG).
    await expect(dialog.locator('svg[id^="mmd-"]').first()).toBeVisible({ timeout: 15000 });

    // Insert it — a diagram block (SVG) now lives in the editor surface.
    await dialog.getByRole('button', { name: 'Insertar diagrama' }).click();
    await expect(dialog).toBeHidden();
    await expect(editor.locator('svg[id^="mmd-"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('keeps an editable paragraph after a trailing void block', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();

    // Insert a diagram — a void block — as the last thing in the document.
    await page.getByRole('button', { name: 'Insertar diagrama' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insertar diagrama' });
    await dialog.getByRole('button', { name: 'Insertar diagrama' }).click();
    await expect(dialog).toBeHidden();
    await expect(editor.locator('svg[id^="mmd-"]').first()).toBeVisible({ timeout: 15000 });

    // Regression: the document must always end with an editable (non-void) block,
    // otherwise the cursor cannot be placed after the trailing diagram and no more
    // text can be typed.
    const lastBlockIsEditable = await editor.evaluate((el) => {
      const blocks = el.querySelectorAll(':scope > [data-slate-node="element"]');
      const last = blocks[blocks.length - 1];
      return !!last && last.getAttribute('data-slate-void') !== 'true';
    });
    expect(lastBlockIsEditable).toBe(true);
  });

  test('keeps an editable trailing paragraph after a preview round-trip', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();

    // Insert a diagram as the trailing block, then bounce through the live preview.
    await page.getByRole('button', { name: 'Insertar diagrama' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insertar diagrama' });
    await dialog.getByRole('button', { name: 'Insertar diagrama' }).click();
    await expect(dialog).toBeHidden();
    await expect(editor.locator('svg[id^="mmd-"]').first()).toBeVisible({ timeout: 15000 });

    // The toolbar's insert buttons only exist in edit mode, so use them to confirm
    // the mode actually switched (the preview also renders a [data-slate-editor]).
    await page.getByRole('button', { name: 'Vista previa' }).click();
    await expect(page.getByRole('button', { name: 'Insertar diagrama' })).toBeHidden();
    await page.getByRole('button', { name: 'Escribir' }).click();
    await expect(page.getByRole('button', { name: 'Insertar diagrama' })).toBeVisible();

    // The editor remounts from the saved markdown (which ends in the diagram void
    // block). Init normalization must restore the trailing editable paragraph, or
    // there is nowhere to type after the diagram.
    const editor2 = page.locator('[data-slate-editor="true"]');
    await expect(editor2.locator('svg[id^="mmd-"]').first()).toBeVisible({ timeout: 15000 });
    const lastBlockIsEditable = await editor2.evaluate((el) => {
      const blocks = el.querySelectorAll(':scope > [data-slate-node="element"]');
      const last = blocks[blocks.length - 1];
      return !!last && last.getAttribute('data-slate-void') !== 'true';
    });
    expect(lastBlockIsEditable).toBe(true);
  });

  test('inserts an image then replaces it via the "Editar imagen" button', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();

    // Dismiss the cookie-consent modal — it otherwise intercepts the dropdown menu.
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // Insert an image from the media library (Paperclip → Insertar imagen).
    await page.getByRole('button', { name: 'Adjuntar media' }).click();
    await page.getByRole('menuitem', { name: 'Insertar imagen' }).click();
    const insertDialog = page.getByRole('dialog', { name: 'Insertar imagen desde la biblioteca' });
    await expect(insertDialog).toBeVisible();
    await insertDialog.getByRole('button', { name: /civil-portada\.jpg/ }).click();
    await insertDialog.getByRole('button', { name: 'Insertar imagen' }).click();
    await expect(insertDialog).toBeHidden();

    // The image block renders with its caption (an editable field), plus the edit
    // affordance. The non-remote placeholder shows the asset's storage path.
    const caption = editor.getByRole('textbox', { name: 'Pie de foto' });
    await expect(caption).toHaveValue('Mazo de juez sobre un código civil abierto');
    await expect(editor).toContainText('storage.r2/civil/portada.jpg');
    const editButton = editor.getByRole('button', { name: 'Editar imagen' });
    await expect(editButton).toBeAttached();

    // Replace the asset, keeping the caption (preserve is on by default). The
    // preserve option sits beside the replace button — visible after selecting.
    await editButton.click();
    const replaceDialog = page.getByRole('dialog', { name: 'Reemplazar imagen desde la biblioteca' });
    await expect(replaceDialog).toBeVisible();
    await replaceDialog.getByRole('button', { name: /esquema-personalidad\.png/ }).click();
    await expect(replaceDialog.getByRole('checkbox', { name: /Conservar el pie de foto/ })).toBeChecked();
    await replaceDialog.getByRole('button', { name: 'Reemplazar imagen' }).click();
    await expect(replaceDialog).toBeHidden();

    // Image swapped in place; the hand-kept caption survived.
    await expect(editor).toContainText('storage.r2/shared/esquema-personalidad.png');
    await expect(caption).toHaveValue('Mazo de juez sobre un código civil abierto');

    // Replace again, this time unchecking preserve → caption refreshes from the asset.
    await editButton.click();
    const replaceDialog2 = page.getByRole('dialog', { name: 'Reemplazar imagen desde la biblioteca' });
    await replaceDialog2.getByRole('button', { name: /linea-temporal-constitucion\.png/ }).click();
    await replaceDialog2.getByRole('checkbox', { name: /Conservar el pie de foto/ }).uncheck();
    await replaceDialog2.getByRole('button', { name: 'Reemplazar imagen' }).click();
    await expect(replaceDialog2).toBeHidden();
    await expect(caption).toHaveValue('Línea temporal de las constituciones españolas, 1812–1978');
  });

  test('edits an image caption inline and it round-trips into the preview', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // Insert an image (its caption defaults to the asset's alt text).
    await page.getByRole('button', { name: 'Adjuntar media' }).click();
    await page.getByRole('menuitem', { name: 'Insertar imagen' }).click();
    const insertDialog = page.getByRole('dialog', { name: 'Insertar imagen desde la biblioteca' });
    await insertDialog.getByRole('button', { name: /civil-portada\.jpg/ }).click();
    await insertDialog.getByRole('button', { name: 'Insertar imagen' }).click();
    await expect(insertDialog).toBeHidden();

    // Edit the caption inline and commit it (blur).
    const caption = editor.getByRole('textbox', { name: 'Pie de foto' });
    await expect(caption).toHaveValue('Mazo de juez sobre un código civil abierto');
    await caption.fill('Mi pie de foto personalizado');
    await caption.blur();

    // Round-trips through serialization: the student preview shows the new caption.
    await page.getByRole('button', { name: 'Vista previa' }).click();
    await expect(page.getByText('Mi pie de foto personalizado')).toBeVisible();
  });

  test('edits a video label inline and it round-trips into the preview', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // Insert a video from the media library.
    await page.getByRole('button', { name: 'Adjuntar media' }).click();
    await page.getByRole('menuitem', { name: 'Insertar vídeo' }).click();
    const insertDialog = page.getByRole('dialog', { name: 'Insertar vídeo desde la biblioteca' });
    await insertDialog.getByRole('button', { name: /video-emancipacion\.mp4/ }).click();
    await insertDialog.getByRole('button', { name: 'Insertar vídeo' }).click();
    await expect(insertDialog).toBeHidden();

    // Edit the label inline and commit it (blur).
    const videoLabel = editor.getByRole('textbox', { name: 'Etiqueta del vídeo' });
    await expect(videoLabel).toBeVisible();
    await videoLabel.fill('Mi etiqueta de vídeo');
    await videoLabel.blur();

    // Round-trips through serialization: the student preview shows the new label.
    await page.getByRole('button', { name: 'Vista previa' }).click();
    await expect(page.getByText('Mi etiqueta de vídeo')).toBeVisible();
  });

  test('inserts a downloadable resource and attaches it to the sidebar', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // The resource (e.g. a PDF) is not yet attached to the lesson's R2 files. That
    // list lives in the "Configurar lección" sheet ("Archivos en R2" box).
    const openConfig = async () => {
      await page.getByRole('button', { name: 'Configurar lección' }).click();
      return page.getByRole('dialog');
    };
    let configSheet = await openConfig();
    await expect(configSheet.getByText('casos-practicos.docx')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(configSheet).toBeHidden();

    // Insert a downloadable resource from the media library.
    await page.getByRole('button', { name: 'Adjuntar media' }).click();
    await page.getByRole('menuitem', { name: 'Recurso descargable' }).click();
    const insertDialog = page.getByRole('dialog', {
      name: 'Insertar recurso desde la biblioteca',
    });
    await expect(insertDialog).toBeVisible();
    await insertDialog.getByRole('button', { name: /casos-practicos\.docx/ }).click();
    await insertDialog.getByRole('button', { name: 'Insertar recurso' }).click();
    await expect(insertDialog).toBeHidden();

    // The download card renders inline: file name, the PDF format badge and size,
    // and a "Descargar" button — mirroring the wireframe reader's download card.
    const card = editor.locator('[data-resource-url]');
    await expect(card).toContainText('casos-practicos.docx');
    await expect(card).toContainText('DOCX');
    await expect(card).toContainText('320 KB');
    await expect(card.getByText('Descargar')).toBeVisible();

    // Insertion attached the file to the lesson's R2 files (insertion-time linking).
    configSheet = await openConfig();
    await expect(configSheet.getByText('casos-practicos.docx')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(configSheet).toBeHidden();

    // It round-trips through serialization into the student preview.
    await page.getByRole('button', { name: 'Vista previa' }).click();
    const previewCard = page.locator('[data-resource-url]');
    await expect(previewCard).toContainText('casos-practicos.docx');
    await expect(previewCard.getByText('Descargar')).toBeVisible();
  });

  test('links a selected run of text via the toolbar', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // Select a word, then link it.
    await editor.getByText('obrar', { exact: false }).first().dblclick();
    await page.getByRole('button', { name: 'Insertar enlace' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insertar enlace' });
    await expect(dialog).toBeVisible();
    // With a range selected, the text comes from the selection (field disabled).
    const textField = dialog.getByLabel('Texto');
    await expect(textField).toBeDisabled();
    const selectedWord = (await textField.inputValue()).trim();
    expect(selectedWord.length).toBeGreaterThan(0);
    await dialog.getByLabel('URL').fill('https://example.com');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();

    // The selected text is now a link, and it survives into the student preview.
    await expect(editor.locator('a[href="https://example.com"]')).toContainText(selectedWord);
    await page.getByRole('button', { name: 'Vista previa' }).click();
    await expect(page.locator('a[href="https://example.com"]')).toBeVisible();
  });

  test('inserts a new link with custom text at the caret', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // Place a collapsed caret, then add a link with its own text.
    await editor.getByText('obrar', { exact: false }).first().click();
    await page.getByRole('button', { name: 'Insertar enlace' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insertar enlace' });
    await dialog.getByLabel('Texto').fill('Más información');
    await dialog.getByLabel('URL').fill('https://nuevo.test');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();

    await expect(editor.locator('a[href="https://nuevo.test"]')).toContainText('Más información');
  });

  test('marks a selection as a definition term with a hover box', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // Select a word in the body paragraph, then attach a definition to it.
    // (Definitions belong in body text, not headings — a heading would leak the
    // tag into the section-navigation slug. "aptitud" first appears in the body.)
    await editor.getByText('aptitud', { exact: false }).first().dblclick();
    await page.getByRole('button', { name: 'Definición' }).click();
    const dialog = page.getByRole('dialog', { name: 'Añadir definición' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Término')).toBeDisabled();
    const term = (await dialog.getByLabel('Término').inputValue()).trim();
    expect(term.length).toBeGreaterThan(0);

    // Format the definition with the buttons: bold, then highlight (nested).
    const defField = dialog.getByLabel('Definición', { exact: true });
    await defField.fill('Aptitud legal');
    await defField.selectText();
    await dialog.getByRole('button', { name: 'Negrita' }).click();
    await defField.selectText();
    await dialog.getByRole('button', { name: 'Resaltar' }).click();
    await expect(defField).toHaveValue('==**Aptitud legal**==');

    // The live preview beside the field renders the formatting as you type.
    const preview = dialog.getByLabel('Vista previa de la definición');
    await expect(preview.locator('mark', { hasText: 'Aptitud legal' })).toBeVisible();
    await expect(preview.locator('strong', { hasText: 'Aptitud legal' })).toBeVisible();

    // The link button drops in a [texto](url) template.
    await defField.fill('');
    await dialog.getByRole('button', { name: 'Enlace' }).click();
    await expect(defField).toHaveValue('[texto](url)');

    // Keep the highlighted-bold definition and save.
    await defField.fill('==**Aptitud legal**==');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();

    // The term carries the dotted-underline styling, and the definition renders its
    // nested highlight + bold formatting (in the hover box, present in the DOM).
    await expect(editor.locator('span.cursor-help').filter({ hasText: term })).toBeVisible();
    await expect(editor.locator('mark', { hasText: 'Aptitud legal' }).first()).toBeAttached();
    await expect(editor.locator('strong', { hasText: 'Aptitud legal' }).first()).toBeAttached();

    // It round-trips through serialization into the student preview, formatting kept.
    await page.getByRole('button', { name: 'Vista previa' }).click();
    await expect(page.locator('mark', { hasText: 'Aptitud legal' }).first()).toBeAttached();
  });

  test('adds a citation from a selection, reuses it, and lists references', async ({ page }) => {
    await page.goto(BUILDER_URL);
    const editor = page.locator('[data-slate-editor="true"]');
    await expect(editor).toBeVisible();
    await page.getByRole('button', { name: 'Solo necesarias' }).click().catch(() => {});

    // Cite a body word.
    await editor.getByText('aptitud', { exact: false }).first().dblclick();
    await page.getByRole('button', { name: 'Referencia / cita' }).click();
    const dialog = page.getByRole('dialog', { name: 'Añadir referencia' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Fuente').fill('STS 1234/2020, FJ 3');
    await dialog.getByLabel('URL (opcional)').fill('https://example.com');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog).toBeHidden();

    // A superscript [1] marker appears, and a Referencias list with the source.
    await expect(editor.locator('sup', { hasText: '[1]' })).toHaveCount(1);
    const refs = page.locator('section[aria-label="Referencias"]');
    await expect(refs).toContainText('STS 1234/2020, FJ 3');
    await expect(refs.locator('li')).toHaveCount(1);

    // Reuse the same reference elsewhere → a second [1] marker, still one entry.
    await editor.getByText('realizar', { exact: false }).first().dblclick();
    await page.getByRole('button', { name: 'Referencia / cita' }).click();
    const dialog2 = page.getByRole('dialog', { name: 'Añadir referencia' });
    await dialog2.getByRole('button', { name: /STS 1234\/2020/ }).click();
    await expect(dialog2).toBeHidden();
    await expect(editor.locator('sup', { hasText: '[1]' })).toHaveCount(2);
    await expect(refs.locator('li')).toHaveCount(1);

    // Usage count reflects the reuse, and the entry is clickable (jumps to marker).
    await expect(refs).toContainText('2 usos');
    await refs.getByRole('button', { name: /STS 1234\/2020/ }).click();

    // Round-trips into the student preview — but the usage count is editor-only.
    await page.getByRole('button', { name: 'Vista previa' }).click();
    const previewRefs = page.locator('section[aria-label="Referencias"]');
    await expect(previewRefs).toContainText('STS 1234/2020, FJ 3');
    await expect(previewRefs).not.toContainText('usos');
  });

  test('advanced tab renders custom raw Mermaid source', async ({ page }) => {
    await page.goto(BUILDER_URL);
    await expect(page.locator('[data-slate-editor="true"]')).toBeVisible();

    await page.getByRole('button', { name: 'Insertar diagrama' }).click();
    const dialog = page.getByRole('dialog', { name: 'Insertar diagrama' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('tab', { name: 'Avanzado' }).click();

    const source = dialog.getByLabel('Código Mermaid');
    await source.fill('graph LR\n  Alfa --> Beta\n  Beta --> Gamma');
    // The custom graph renders in the preview.
    await expect(dialog.locator('svg[id^="mmd-"]').first()).toBeVisible({ timeout: 15000 });
    await expect(dialog.locator('svg[id^="mmd-"]').first()).toContainText('Gamma');
  });
});
