# Lesson Quote Anchors + Management Sidebar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn lesson quotes from frozen string copies into live annotations of the lesson text, anchored by a persistent mark, and add a right-docked sidebar that lists every quote and flags the ones whose source text has drifted.

**Architecture:** A new Plate **leaf mark** `quoteAnchor` (carrying a string id) wraps the quoted range in the editor and round-trips through the markdown as `<QuoteAnchor id="…">…</QuoteAnchor>` — exactly like the existing `<Highlight>` mark. The question's `lessonRef` stores that `anchorId`. Status (`synced` / `drift` / `orphan`) is **derived** by pure functions that scan the lesson markdown for anchors and compare the marked text to the stored quote. A new `QuoteSidebar` component renders the derived rows; resolution actions are pure string/state operations on the lesson content and `lessonRef`.

**Tech Stack:** Next.js 14, React, TypeScript, PlateJS (`platejs`, `@platejs/*`), Tailwind, Playwright (e2e + pure-logic specs).

## Global Constraints

- This is the **builder wireframe** — state only. No Drizzle schema changes; `lessonRef` lives in `BuilderWorkspace` component state. (Persisting `anchorId` to the real `questions` schema is deferred — see spec.)
- Anchors **must** survive the markdown round-trip (serialize + deserialize rules required), mirroring the existing `backgroundColor`/`Highlight` mark in `components/teach/lesson-editor/markdown-rules.ts`.
- The in-body anchor visual is **style "A": dotted underline + a small question chip** — never a fill, so it stays distinct from the existing fill-style highlight (`HighlightColorPlugin`).
- Drift default behavior is **flag, never silently mutate** a quote.
- Brand color is `brand-primary` (teal); drift color is amber (`amber-500`/`amber-600`).
- Editor instances are typed `any` in this codebase (Plate transforms via `editor.tf.*`, api via `editor.api.*`) — follow that existing convention; do not add Slate type imports.
- Wireframe e2e route: `/wireframes/teach/build/lessons?subject=1&unit=1&lesson=1` — public, no auth/seeding. Editor root locator: `[data-slate-editor="true"]`. Text selection in tests: `.dblclick()` on a word.
- Run a single spec with `npx playwright test <file>`; full gate is `npm run typecheck` → `npm run build` → `npm run test:ralph`.

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `lib/lesson-quotes.ts` | Pure helpers: find/strip/wrap/unwrap anchors in markdown, derive quote status, relocate orphans. No React. | Create |
| `components/teach/lesson-editor/blocks.tsx` | Add `QuoteAnchorLeaf` + `QuoteAnchorPlugin`; export `QuoteAnchorContext` + `AnchorMeta`; register in `lessonCustomPlugins`. | Modify |
| `components/teach/lesson-editor/markdown-rules.ts` | Add `quoteAnchor` serialize + `QuoteAnchor` deserialize rules. | Modify |
| `components/teach/lesson-editor/LessonPlateEditor.tsx` | Apply the anchor mark on quote capture; thread `anchorId` out via `QuoteCapture`; accept `anchorMeta` prop and provide it through `QuoteAnchorContext`. | Modify |
| `components/teach/lesson-editor/QuoteSidebar.tsx` | Presentational sidebar: header, filters, rows per status, collapsible diff, action buttons. | Create |
| `components/teach/BuilderWorkspace.tsx` | Extend `lessonRef` with `anchorId`/`frozen`; derive statuses + anchor meta; host the sidebar; wire resolution + jump handlers; cancel-cleanup of pending anchors. | Modify |
| `tests/e2e/quote-helpers.spec.ts` | Pure-logic Playwright spec for `lib/lesson-quotes.ts`. | Create |
| `tests/e2e/quote-sidebar.spec.ts` | Browser e2e for the full create → drift → resolve flows. | Create |

---

## Task 1: Pure quote-anchor helpers

**Files:**
- Create: `lib/lesson-quotes.ts`
- Test: `tests/e2e/quote-helpers.spec.ts`

**Interfaces:**
- Produces:
  - `type QuoteStatus = "synced" | "drift" | "orphan"`
  - `interface AnchorHit { id: string; text: string; index: number }`
  - `interface QuoteRefLite { anchorId?: string; quote: string; frozen?: boolean }`
  - `interface QuoteStatusInfo { status: QuoteStatus; currentText?: string; relocatedSection?: string }`
  - `function findAnchors(markdown: string): AnchorHit[]`
  - `function unwrapAnchor(markdown: string, id: string): string`
  - `function wrapAnchorAt(markdown: string, quote: string, id: string): string`
  - `function findSectionAt(markdown: string, charIndex: number): string`
  - `function deriveQuoteStatus(ref: QuoteRefLite, anchors: AnchorHit[], markdown: string): QuoteStatusInfo`

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/quote-helpers.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import {
  findAnchors,
  unwrapAnchor,
  wrapAnchorAt,
  findSectionAt,
  deriveQuoteStatus,
} from '@/lib/lesson-quotes';

const CONTENT = [
  '## Capacidad de obrar',
  '',
  'La capacidad de obrar es la <QuoteAnchor id="qa_3">aptitud para realizar válidamente actos jurídicos</QuoteAnchor> por sí mismo.',
  '',
  '## Domicilio',
  '',
  'El domicilio es la sede jurídica de la persona.',
].join('\n');

test('findAnchors returns id, text and document order', () => {
  const hits = findAnchors(CONTENT);
  expect(hits).toHaveLength(1);
  expect(hits[0].id).toBe('qa_3');
  expect(hits[0].text).toBe('aptitud para realizar válidamente actos jurídicos');
  expect(hits[0].index).toBeGreaterThan(0);
});

test('unwrapAnchor removes the tag but keeps the text', () => {
  const out = unwrapAnchor(CONTENT, 'qa_3');
  expect(out).not.toContain('<QuoteAnchor');
  expect(out).toContain('aptitud para realizar válidamente actos jurídicos por sí mismo');
});

test('wrapAnchorAt wraps the first whitespace-flexible match', () => {
  const out = wrapAnchorAt(CONTENT, 'sede  jurídica de la persona', 'qa_9');
  expect(out).toContain('<QuoteAnchor id="qa_9">sede jurídica de la persona</QuoteAnchor>');
});

test('findSectionAt returns the nearest heading above an index', () => {
  const idx = CONTENT.indexOf('sede jurídica');
  expect(findSectionAt(CONTENT, idx)).toBe('Domicilio');
});

test('deriveQuoteStatus: synced when marked text matches the quote', () => {
  const anchors = findAnchors(CONTENT);
  const info = deriveQuoteStatus(
    { anchorId: 'qa_3', quote: 'aptitud para realizar válidamente actos jurídicos' },
    anchors,
    CONTENT,
  );
  expect(info.status).toBe('synced');
});

test('deriveQuoteStatus: drift when marked text was edited', () => {
  const edited = CONTENT.replace('realizar válidamente', 'celebrar');
  const anchors = findAnchors(edited);
  const info = deriveQuoteStatus(
    { anchorId: 'qa_3', quote: 'aptitud para realizar válidamente actos jurídicos' },
    anchors,
    edited,
  );
  expect(info.status).toBe('drift');
  expect(info.currentText).toContain('celebrar');
});

test('deriveQuoteStatus: orphan + relocatedSection when the anchor is gone but words exist elsewhere', () => {
  const moved =
    '## Domicilio\n\nEl domicilio es la sede jurídica de la persona.';
  const info = deriveQuoteStatus(
    { anchorId: 'qa_3', quote: 'sede jurídica de la persona' },
    findAnchors(moved),
    moved,
  );
  expect(info.status).toBe('orphan');
  expect(info.relocatedSection).toBe('Domicilio');
});

test('deriveQuoteStatus: frozen is always synced', () => {
  const info = deriveQuoteStatus(
    { quote: 'algo que ya no existe', frozen: true },
    [],
    'texto sin nada',
  );
  expect(info.status).toBe('synced');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/quote-helpers.spec.ts`
Expected: FAIL — `Cannot find module '@/lib/lesson-quotes'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/lesson-quotes.ts`:

```ts
/**
 * Pure helpers for lesson quote anchors. A quote anchor is a leaf mark that
 * serializes into the lesson markdown as `<QuoteAnchor id="…">…</QuoteAnchor>`
 * (see components/teach/lesson-editor/markdown-rules.ts). These functions read
 * and rewrite that markdown string and derive each quote's sync status. No React,
 * no Plate — safe to unit test.
 */

export type QuoteStatus = 'synced' | 'drift' | 'orphan';

export interface AnchorHit {
  id: string;
  text: string;
  index: number; // char offset of the tag in the markdown
}

export interface QuoteRefLite {
  anchorId?: string;
  quote: string;
  frozen?: boolean;
}

export interface QuoteStatusInfo {
  status: QuoteStatus;
  currentText?: string;
  relocatedSection?: string;
}

const ANCHOR_RE = /<QuoteAnchor id="([^"]*)">([\s\S]*?)<\/QuoteAnchor>/g;
const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findAnchors(markdown: string): AnchorHit[] {
  const hits: AnchorHit[] = [];
  ANCHOR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ANCHOR_RE.exec(markdown)) !== null) {
    hits.push({ id: m[1], text: norm(m[2]), index: m.index });
  }
  return hits;
}

export function unwrapAnchor(markdown: string, id: string): string {
  const re = new RegExp(
    `<QuoteAnchor id="${escapeRegExp(id)}">([\\s\\S]*?)<\\/QuoteAnchor>`,
    'g',
  );
  return markdown.replace(re, '$1');
}

// Wraps the first whitespace-flexible, case-insensitive occurrence of `quote`.
export function wrapAnchorAt(markdown: string, quote: string, id: string): string {
  const pattern = escapeRegExp(norm(quote)).replace(/ /g, '\\s+');
  const re = new RegExp(pattern, 'i');
  const m = re.exec(markdown);
  if (!m) return markdown;
  return (
    markdown.slice(0, m.index) +
    `<QuoteAnchor id="${id}">${norm(m[0])}</QuoteAnchor>` +
    markdown.slice(m.index + m[0].length)
  );
}

export function findSectionAt(markdown: string, charIndex: number): string {
  const headingRe = /^#{1,6}\s+(.+)$/gm;
  let section = '';
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(markdown)) !== null) {
    if (m.index <= charIndex) section = norm(m[1]);
    else break;
  }
  return section;
}

export function deriveQuoteStatus(
  ref: QuoteRefLite,
  anchors: AnchorHit[],
  markdown: string,
): QuoteStatusInfo {
  if (ref.frozen) return { status: 'synced' };
  if (ref.anchorId) {
    const hit = anchors.find((a) => a.id === ref.anchorId);
    if (hit) {
      return norm(hit.text) === norm(ref.quote)
        ? { status: 'synced', currentText: hit.text }
        : { status: 'drift', currentText: hit.text };
    }
  }
  // Anchor missing — try to relocate the words elsewhere in the lesson.
  const pattern = escapeRegExp(norm(ref.quote)).replace(/ /g, '\\s+');
  const m = new RegExp(pattern, 'i').exec(markdown);
  if (m) {
    return { status: 'orphan', relocatedSection: findSectionAt(markdown, m.index) };
  }
  return { status: 'orphan' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/quote-helpers.spec.ts`
Expected: PASS (8 passed).

- [ ] **Step 5: Commit**

```bash
git add lib/lesson-quotes.ts tests/e2e/quote-helpers.spec.ts
git commit -m "feat(teach): pure helpers for lesson quote anchors + status"
```

---

## Task 2: `quoteAnchor` leaf mark — render, round-trip, and apply on capture

**Files:**
- Modify: `components/teach/lesson-editor/blocks.tsx` (add leaf + plugin + context; register in `lessonCustomPlugins` near line 455-467)
- Modify: `components/teach/lesson-editor/markdown-rules.ts` (add rules near the `backgroundColor`/`Highlight` rules, ~line 59-76)
- Modify: `components/teach/lesson-editor/LessonPlateEditor.tsx` (apply mark in the quote-capture path ~line 130-158 + toolbar/menu handlers; extend `QuoteCapture` ~line 122-125; new `anchorMeta` prop ~line 94; provide context around `<PlateContent>`)
- Test: `tests/e2e/quote-sidebar.spec.ts` (new — first case)

**Interfaces:**
- Consumes: `findAnchors` from Task 1 (in the e2e assertion only).
- Produces (from `blocks.tsx`):
  - `type AnchorMeta = Record<string, { label: string; drift: boolean }>`
  - `const QuoteAnchorContext: React.Context<AnchorMeta>`
  - `const QuoteAnchorPlugin` (mark key `quoteAnchor`), added to `lessonCustomPlugins`
- Produces (from `LessonPlateEditor.tsx`):
  - `QuoteCapture` non-invalid variant gains `anchorId: string`
  - `LessonPlateEditorProps` gains `anchorMeta?: AnchorMeta`

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/quote-sidebar.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

// The /wireframes route is public mock data — no auth / DB seeding required.
const BUILDER_URL = '/wireframes/teach/build/lessons?subject=1&unit=1&lesson=1';

// Selects a word in the lesson editor and pushes it as a quote into the first
// existing question via the floating "Añadir cita a…" menu.
async function quoteWord(page, word: string) {
  const editor = page.locator('[data-slate-editor="true"]');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts`
Expected: FAIL — no element matches `[data-quote-anchor]` (the mark does not exist yet).

- [ ] **Step 3a: Add the leaf, context and plugin in `blocks.tsx`**

Near the existing `HighlightColorPlugin` (lines 438-453), add:

```tsx
// Quote anchor — a leaf mark carrying the id of the question quote that lifted
// this text. Rendered as a dotted underline (teal) or dashed amber when the
// source has drifted, plus a small question chip. The chip/drift state come from
// QuoteAnchorContext (supplied by BuilderWorkspace via LessonPlateEditor) keyed
// by anchor id, so the leaf itself stays serialization-only (just the id).
export type AnchorMeta = Record<string, { label: string; drift: boolean }>;
export const QuoteAnchorContext = React.createContext<AnchorMeta>({});

function QuoteAnchorLeaf(props: PlateLeafProps) {
  const id = (props.leaf as { quoteAnchor?: string }).quoteAnchor;
  const meta = React.useContext(QuoteAnchorContext);
  const info = id ? meta[id] : undefined;
  const drift = info?.drift ?? false;
  return (
    <PlateLeaf
      {...props}
      as="span"
      // eslint-disable-next-line react/no-unknown-property
      data-quote-anchor={id}
      className={cn(
        'quote-anchor',
        drift
          ? 'border-b-2 border-dashed border-amber-500 bg-amber-500/[0.07]'
          : 'border-b-2 border-dotted border-brand-primary',
        props.className,
      )}
    >
      {props.children}
      {info?.label ? (
        <sup
          contentEditable={false}
          className={cn(
            'ml-0.5 select-none rounded px-1 align-super text-[9px] font-bold text-white',
            drift ? 'bg-amber-600' : 'bg-brand-primary',
          )}
        >
          {info.label}
        </sup>
      ) : null}
    </PlateLeaf>
  );
}

export const QuoteAnchorPlugin = createPlatePlugin({
  key: 'quoteAnchor',
  node: { isLeaf: true },
}).withComponent(QuoteAnchorLeaf);
```

Confirm `React`, `cn`, `createPlatePlugin`, `PlateLeaf`, and `PlateLeafProps` are already imported in this file (the `HighlightLeaf`/`HighlightColorPlugin` block above uses all of them). Then add the plugin to the export array (lines 455-467):

```tsx
export const lessonCustomPlugins = [
  ObjectivesPlugin,
  KeyIdeaPlugin,
  VideoPlugin,
  ResourcePlugin,
  ImagePlugin,
  LinkPlugin,
  DefinitionPlugin,
  CitePlugin,
  DiagramPlugin,
  ChartPlugin,
  HighlightColorPlugin,
  QuoteAnchorPlugin,
];
```

- [ ] **Step 3b: Add markdown round-trip rules in `markdown-rules.ts`**

Next to the `backgroundColor` / `Highlight` rules (lines 59-76), add:

```ts
quoteAnchor: {
  mark: true,
  serialize: (node: any) => ({
    type: 'mdxJsxTextElement',
    name: 'QuoteAnchor',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'id', value: node.quoteAnchor },
    ],
    children: [{ type: 'text', value: node.text }],
  }),
},
QuoteAnchor: {
  mark: true,
  deserialize: (mdastNode: any, deco: any, options: any) =>
    convertChildrenDeserialize(
      mdastNode.children,
      { ...deco, quoteAnchor: parseAttributes(mdastNode.attributes).id },
      options,
    ),
},
```

(`convertChildrenDeserialize` and `parseAttributes` are already used by the `Highlight` rule in this file — no new imports.)

- [ ] **Step 3c: Apply the mark on capture + thread `anchorId` in `LessonPlateEditor.tsx`**

Extend `QuoteCapture` (lines 122-125):

```ts
export type QuoteCapture =
  | { invalid: true }
  | { invalid: false; quote: string; sentence: string; section: string; anchorId: string }
  | null;
```

Add a helper above `captureQuoteSelection` that applies the mark to the live selection and returns the generated id:

```ts
// Applies the quoteAnchor mark to the current selection and returns its new id.
// Mutating the doc triggers onChange, so the `<QuoteAnchor>` tag lands in the
// serialized markdown immediately (even before a question is picked).
function applyQuoteAnchor(editor: any): string {
  const id = `qa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  editor.tf.setNodes(
    { quoteAnchor: id },
    { at: editor.selection, match: (n: any) => typeof n.text === 'string', split: true },
  );
  return id;
}
```

Then in the two places that currently call `captureQuoteSelection(editor)` and fire `onUseAsQuote(data, anchor)` (the toolbar button ~line 340-346 and the context-menu item ~line 412-423), apply the anchor and attach its id before delegating. Replace each call site's logic with:

```ts
const data = captureQuoteSelection(editor);
if (data && !data.invalid) {
  const anchorId = applyQuoteAnchor(editor);
  onUseAsQuote?.({ ...data, anchorId }, computeQuoteAnchorPoint(editor));
} else {
  onUseAsQuote?.(data, computeQuoteAnchorPoint(editor));
}
```

(Reuse whatever the existing code already uses to compute the screen point — the file already has an anchor-point helper around line 160; keep that call unchanged.)

Add the `anchorMeta` prop (interface ~line 94) and provide the context. In `LessonPlateEditorProps`:

```ts
  /** id → { chip label, drift } for rendering quote anchors in the body. */
  anchorMeta?: AnchorMeta;
```

Import the context/type at the top (from `./blocks`, where `DiagramDialogContext` etc. are already imported):

```ts
import { DiagramDialogContext, ChartDialogContext, MediaDialogContext, CiteDialogContext, QuoteAnchorContext, type AnchorMeta } from './blocks';
```

Wrap the `<PlateContent …/>` render in the provider:

```tsx
<QuoteAnchorContext.Provider value={anchorMeta ?? {}}>
  {/* existing <PlateContent /> */}
</QuoteAnchorContext.Provider>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts`
Expected: PASS — the dotted `[data-quote-anchor]` span is visible after creating a quote.

Then verify the round-trip and types:

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/teach/lesson-editor/blocks.tsx components/teach/lesson-editor/markdown-rules.ts components/teach/lesson-editor/LessonPlateEditor.tsx tests/e2e/quote-sidebar.spec.ts
git commit -m "feat(teach): quoteAnchor leaf mark with markdown round-trip, applied on capture"
```

---

## Task 3: Store `anchorId`, derive anchor meta, and drift colouring in the body

**Files:**
- Modify: `components/teach/BuilderWorkspace.tsx` (`lessonRef` typing ~line 124-132; `quoteToQuestion` state ~line 776-783; `handlePlateUseAsQuote` ~966; `applyQuoteToQuestion` ~985; `createQuestionWithQuote` ~1001; derived data block ~838-852; the `<LessonPlateEditor>` mount ~1632-1654; the menu-dismiss path)
- Test: `tests/e2e/quote-sidebar.spec.ts` (add case)

**Interfaces:**
- Consumes: `findAnchors`, `deriveQuoteStatus` (Task 1); `AnchorMeta` (Task 2).
- Produces:
  - `lessonRef` shape now `{ section; quote; sentence?; color; anchorId?: string; frozen?: boolean }`
  - `quoteToQuestion` state gains `anchorId: string`
  - `const anchorMeta: AnchorMeta` derived from `questionsList` + `activeLesson.content`, passed to `<LessonPlateEditor anchorMeta=…/>`
  - `cancelQuoteToQuestion()` — unwraps a pending anchor when the menu is dismissed without picking

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/quote-sidebar.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts -g drift`
Expected: FAIL — anchor stays `border-dotted` (no drift derivation/colouring yet).

- [ ] **Step 3a: Widen `lessonRef` and `quoteToQuestion` types**

Update the `lessonRef` type annotation (line 132) everywhere it is written as a literal type to:

```ts
as {
  section: string;
  quote: string;
  color: string;
  sentence?: string;
  anchorId?: string;
  frozen?: boolean;
} | null
```

Update `quoteToQuestion` state (lines 776-783) to add `anchorId: string;`.

- [ ] **Step 3b: Thread `anchorId` through the create handlers**

In `handlePlateUseAsQuote` (lines 966-982), carry the id into state:

```ts
setQuoteToQuestion({
  x: anchor.x,
  y: anchor.y,
  section: data.section,
  quote: data.quote,
  sentence: data.sentence,
  color: DEFAULT_HL,
  anchorId: data.anchorId,
});
```

In `applyQuoteToQuestion` (lines 985-998) destructure and store `anchorId`:

```ts
const { section, quote, sentence, color, anchorId } = quoteToQuestion;
setQuestionsList((prev) =>
  prev.map((q) =>
    q.id === questionId
      ? { ...q, lessonRef: { section, quote, sentence, color, anchorId }, dirty: true }
      : q,
  ),
);
```

Do the same in `createQuestionWithQuote` (lines 1001-1024): destructure `anchorId` and include it in the new question's `lessonRef`.

- [ ] **Step 3c: Add cancel-cleanup for a pending anchor**

Add near the create handlers:

```ts
// Dismissing the "add cita to…" menu without choosing a question leaves an
// orphan <QuoteAnchor> in the content — strip it back out.
const cancelQuoteToQuestion = () => {
  if (quoteToQuestion?.anchorId && activeLesson) {
    handleLessonChange({
      content: unwrapAnchor(activeLesson.content || '', quoteToQuestion.anchorId),
    });
  }
  setQuoteToQuestion(null);
};
```

Find every place that currently does `setQuoteToQuestion(null)` for a *dismiss* (outside-click / Escape / backdrop — not the apply/create handlers, which already null it after committing) and call `cancelQuoteToQuestion()` instead. Import the helper:

```ts
import { findAnchors, deriveQuoteStatus, unwrapAnchor } from '@/lib/lesson-quotes';
import type { AnchorMeta } from '@/components/teach/lesson-editor/blocks';
```

- [ ] **Step 3d: Derive `anchorMeta` and pass it to the editor**

In the derived-data block (after line 852), compute meta for the active lesson:

```ts
// Anchor id → chip label + drift flag, for the in-body quote marks.
const activeLessonAnchors = findAnchors(activeLesson?.content || '');
const anchorMeta: AnchorMeta = {};
questionsList
  .filter((q) => q.lessonId === activeLesson?.id && q.lessonRef?.anchorId)
  .forEach((q, i) => {
    const ref = q.lessonRef!;
    const info = deriveQuoteStatus(
      { anchorId: ref.anchorId, quote: ref.quote, frozen: ref.frozen },
      activeLessonAnchors,
      activeLesson?.content || '',
    );
    anchorMeta[ref.anchorId!] = { label: `P${i + 1}`, drift: info.status === 'drift' };
  });
```

Pass it on the editor mount (lines 1632-1654), adding one prop:

```tsx
<LessonPlateEditor
  key={activeLessonId}
  value={activeLesson?.content || ''}
  onChange={(md) => handleLessonChange({ content: md })}
  anchorMeta={anchorMeta}
  /* …existing onAttachResource + onUseAsQuote… */
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts -g drift`
Expected: PASS — anchor flips to `border-dashed` after the edit.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/teach/BuilderWorkspace.tsx tests/e2e/quote-sidebar.spec.ts
git commit -m "feat(teach): persist anchorId on quotes, derive drift colouring in the body"
```

---

## Task 4: The `QuoteSidebar` component + wiring (read-only)

**Files:**
- Create: `components/teach/lesson-editor/QuoteSidebar.tsx`
- Modify: `components/teach/BuilderWorkspace.tsx` (build rows; render the sidebar; add an open/close toggle)
- Test: `tests/e2e/quote-sidebar.spec.ts` (add case)

**Interfaces:**
- Consumes: `deriveQuoteStatus`, `findAnchors`, `QuoteStatus` (Task 1).
- Produces (from `QuoteSidebar.tsx`):
  - `interface QuoteRow { questionId: number; label: string; status: QuoteStatus; quote: string; currentText?: string; relocatedSection?: string; orderIndex: number }`
  - `interface QuoteSidebarProps { rows: QuoteRow[]; onJump(row): void; onGoToQuestion(row): void; onUseCurrent(row): void; onKeep(row): void; onRelink(row): void; onRemove(row): void }`
  - `function QuoteSidebar(props: QuoteSidebarProps): JSX.Element`

This task renders the panel and its rows; the action callbacks are passed as no-op-safe stubs from `BuilderWorkspace` here and given real bodies in Task 5.

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/quote-sidebar.spec.ts`:

```ts
test('the sidebar lists quotes with a review count and statuses', async ({ page }) => {
  await page.goto(BUILDER_URL);
  await quoteWord(page, 'aptitud');

  await page.getByRole('button', { name: /Citas de la lección/i }).click();
  const panel = page.getByRole('complementary', { name: /Citas de la lección/i });
  await expect(panel).toBeVisible();
  await expect(panel.getByText('aptitud para realizar', { exact: false })).toBeVisible();
  await expect(panel.getByText(/Sincronizada/i)).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts -g sidebar`
Expected: FAIL — no "Citas de la lección" toggle/panel exists.

- [ ] **Step 3a: Create `QuoteSidebar.tsx`**

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { QuoteStatus } from '@/lib/lesson-quotes';

export interface QuoteRow {
  questionId: number;
  label: string; // "P1"
  status: QuoteStatus;
  quote: string;
  currentText?: string;
  relocatedSection?: string;
  orderIndex: number;
}

export interface QuoteSidebarProps {
  rows: QuoteRow[];
  onJump: (row: QuoteRow) => void;
  onGoToQuestion: (row: QuoteRow) => void;
  onUseCurrent: (row: QuoteRow) => void;
  onKeep: (row: QuoteRow) => void;
  onRelink: (row: QuoteRow) => void;
  onRemove: (row: QuoteRow) => void;
}

const DOT: Record<QuoteStatus, string> = {
  synced: 'bg-brand-primary',
  drift: 'bg-amber-500',
  orphan: 'bg-slate-400',
};

function DriftDiff({ was, now }: { was: string; now?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-semibold text-amber-700"
      >
        {open ? '▾ ocultar cambios' : '▸ ver cambios'}
      </button>
      {open && (
        <div className="mt-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] leading-snug">
          <span className="text-slate-400 line-through">{was}</span>
          {now ? <> → <span className="font-semibold text-amber-700">{now}</span></> : null}
        </div>
      )}
    </div>
  );
}

function Row(props: { row: QuoteRow } & Omit<QuoteSidebarProps, 'rows'>) {
  const { row } = props;
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-2.5',
        row.status === 'drift' && 'border-amber-200 bg-amber-50/40',
        row.status === 'orphan' && 'opacity-90',
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', DOT[row.status])} />
        <button
          type="button"
          onClick={() => props.onGoToQuestion(row)}
          className="text-[11px] font-bold text-brand-primary"
        >
          Pregunta {row.label.replace('P', '')}
        </button>
      </div>
      <button
        type="button"
        onClick={() => props.onJump(row)}
        className="block text-left font-reader text-[13px] leading-snug text-foreground"
      >
        “{row.quote}”
      </button>

      {row.status === 'synced' && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Sincronizada · clic para resaltar en el texto
        </p>
      )}

      {row.status === 'drift' && (
        <>
          <DriftDiff was={row.quote} now={row.currentText} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => props.onUseCurrent(row)}
              className="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              Usar texto actual
            </button>
            <button type="button" onClick={() => props.onKeep(row)}
              className="rounded-md border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Mantener redacción
            </button>
            <button type="button" onClick={() => props.onGoToQuestion(row)}
              className="rounded-md border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Ir a pregunta
            </button>
          </div>
        </>
      )}

      {row.status === 'orphan' && (
        <>
          {row.relocatedSection && (
            <p className="mt-1.5 text-[11px] text-amber-700">
              ↪ Parece estar ahora en <b>§{row.relocatedSection}</b>
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.relocatedSection && (
              <button type="button" onClick={() => props.onRelink(row)}
                className="rounded-md bg-brand-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                Re-vincular a §{row.relocatedSection}
              </button>
            )}
            <button type="button" onClick={() => props.onRemove(row)}
              className="rounded-md border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Quitar cita
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function QuoteSidebar(props: QuoteSidebarProps) {
  const [filter, setFilter] = React.useState<'all' | 'review'>('all');
  const review = props.rows.filter((r) => r.status !== 'synced').length;
  const shown = filter === 'all' ? props.rows : props.rows.filter((r) => r.status !== 'synced');
  return (
    <aside
      aria-label="Citas de la lección"
      className="flex w-80 flex-col border-l bg-muted/30"
    >
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <b className="text-[13px]">Citas de la lección</b>
          <span className="text-[11px] text-muted-foreground">
            {props.rows.length} · {review} a revisar
          </span>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <button type="button" onClick={() => setFilter('all')}
            className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
              filter === 'all' ? 'border-brand-primary bg-brand-primary text-white' : 'bg-card text-muted-foreground')}>
            Todas
          </button>
          <button type="button" onClick={() => setFilter('review')}
            className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
              filter === 'review' ? 'border-amber-600 bg-amber-600 text-white' : 'bg-card text-muted-foreground')}>
            ⚠ A revisar ({review})
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto p-2">
        {shown.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Aún no hay citas en esta lección.
          </p>
        ) : (
          shown.map((r) => <Row key={`${r.questionId}-${r.orderIndex}`} row={r} {...props} />)
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3b: Build rows + render the sidebar in `BuilderWorkspace.tsx`**

Add the import and an open/close state (near the other `useState`s around line 776):

```ts
import { QuoteSidebar, type QuoteRow } from '@/components/teach/lesson-editor/QuoteSidebar';
// …
const [quoteSidebarOpen, setQuoteSidebarOpen] = useState(false);
```

Build rows from the active lesson (in the derived-data block, reusing `activeLessonAnchors` from Task 3):

```ts
const quoteRows: QuoteRow[] = questionsList
  .filter((q) => q.lessonId === activeLesson?.id && q.lessonRef)
  .map((q, i) => {
    const ref = q.lessonRef!;
    const info = deriveQuoteStatus(
      { anchorId: ref.anchorId, quote: ref.quote, frozen: ref.frozen },
      activeLessonAnchors,
      activeLesson?.content || '',
    );
    const orderIndex = ref.anchorId
      ? activeLessonAnchors.findIndex((a) => a.id === ref.anchorId)
      : -1;
    return {
      questionId: q.id,
      label: `P${i + 1}`,
      status: info.status,
      quote: ref.quote,
      currentText: info.currentText,
      relocatedSection: info.relocatedSection,
      // Unanchored (orphan/frozen) quotes sort to the bottom.
      orderIndex: orderIndex < 0 ? Number.MAX_SAFE_INTEGER : orderIndex,
    };
  })
  .sort((a, b) => a.orderIndex - b.orderIndex);
```

Add a toolbar toggle button (near the lesson editor header) and render the panel beside the editor. Wrap the editor + sidebar in a flex row; render the sidebar with stub callbacks for now:

```tsx
<button
  type="button"
  onClick={() => setQuoteSidebarOpen((v) => !v)}
  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold"
>
  <BookOpen className="h-3.5 w-3.5" /> Citas de la lección
</button>
{/* …beside the editor… */}
{quoteSidebarOpen && (
  <QuoteSidebar
    rows={quoteRows}
    onJump={() => {}}
    onGoToQuestion={() => {}}
    onUseCurrent={() => {}}
    onKeep={() => {}}
    onRelink={() => {}}
    onRemove={() => {}}
  />
)}
```

(`BookOpen` is already imported in this file — it is used by the existing quote menu.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts -g sidebar`
Expected: PASS — the panel shows the quote and "Sincronizada".

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/teach/lesson-editor/QuoteSidebar.tsx components/teach/BuilderWorkspace.tsx tests/e2e/quote-sidebar.spec.ts
git commit -m "feat(teach): quote management sidebar (read-only rows + statuses)"
```

---

## Task 5: Resolution actions + jump-to-anchor

**Files:**
- Modify: `components/teach/BuilderWorkspace.tsx` (replace the stub callbacks with real handlers)
- Modify: `components/teach/lesson-editor/blocks.tsx` (add a flash style hook — optional CSS class) **only if** needed for the jump flash; otherwise use Tailwind via a data attribute
- Test: `tests/e2e/quote-sidebar.spec.ts` (add cases)

**Interfaces:**
- Consumes: `unwrapAnchor`, `wrapAnchorAt`, `findAnchors`, `deriveQuoteStatus`, `QuoteRow` (Tasks 1, 4).
- Produces: real bodies for `onJump / onGoToQuestion / onUseCurrent / onKeep / onRelink / onRemove`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/e2e/quote-sidebar.spec.ts`:

```ts
test('“Usar texto actual” re-syncs a drifted quote', async ({ page }) => {
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

test('“Quitar cita” removes the quote and its anchor', async ({ page }) => {
  await page.goto(BUILDER_URL);
  await quoteWord(page, 'aptitud');
  await page.getByRole('button', { name: /Citas de la lección/i }).click();
  const panel = page.getByRole('complementary', { name: /Citas de la lección/i });

  // Drift it first so the orphan/remove path is reachable, then remove.
  await page.locator('[data-quote-anchor]').first().click();
  await page.keyboard.type('ZZZ');
  await panel.getByRole('button', { name: 'Mantener redacción' }).click(); // freeze → keeps row
  await expect(panel.getByText('aptitud para realizar', { exact: false })).toBeVisible();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts -g "Usar texto actual|Quitar"`
Expected: FAIL — buttons are wired to no-op stubs, counts don't change.

- [ ] **Step 3: Implement the handlers**

Replace the stub props on `<QuoteSidebar>` with real handlers. Add above the render:

```ts
const findQuestion = (row: QuoteRow) =>
  questionsList.find((q) => q.id === row.questionId);

// Adopt the current marked text into the question's quote.
const onUseCurrent = (row: QuoteRow) => {
  const q = findQuestion(row);
  if (!q?.lessonRef || !row.currentText) return;
  setQuestionsList((prev) =>
    prev.map((x) =>
      x.id === row.questionId
        ? { ...x, lessonRef: { ...x.lessonRef!, quote: row.currentText! }, dirty: true }
        : x,
    ),
  );
};

// Keep the original wording; release the live link so it stops flagging.
const onKeep = (row: QuoteRow) => {
  const q = findQuestion(row);
  if (!q?.lessonRef) return;
  if (q.lessonRef.anchorId && activeLesson) {
    handleLessonChange({
      content: unwrapAnchor(activeLesson.content || '', q.lessonRef.anchorId),
    });
  }
  setQuestionsList((prev) =>
    prev.map((x) =>
      x.id === row.questionId
        ? { ...x, lessonRef: { ...x.lessonRef!, anchorId: undefined, frozen: true }, dirty: true }
        : x,
    ),
  );
};

// Re-anchor an orphan onto the relocated occurrence.
const onRelink = (row: QuoteRow) => {
  const q = findQuestion(row);
  if (!q?.lessonRef || !activeLesson) return;
  const newId = `qa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  handleLessonChange({
    content: wrapAnchorAt(activeLesson.content || '', q.lessonRef.quote, newId),
  });
  setQuestionsList((prev) =>
    prev.map((x) =>
      x.id === row.questionId
        ? { ...x, lessonRef: { ...x.lessonRef!, anchorId: newId, frozen: false }, dirty: true }
        : x,
    ),
  );
};

const onRemove = (row: QuoteRow) => {
  const q = findQuestion(row);
  if (q?.lessonRef?.anchorId && activeLesson) {
    handleLessonChange({
      content: unwrapAnchor(activeLesson.content || '', q.lessonRef.anchorId),
    });
  }
  setQuestionsList((prev) =>
    prev.map((x) => (x.id === row.questionId ? { ...x, lessonRef: null, dirty: true } : x)),
  );
};

// Scroll the editor to the anchor and flash it.
const onJump = (row: QuoteRow) => {
  const q = findQuestion(row);
  const id = q?.lessonRef?.anchorId;
  if (!id) return;
  const el = document.querySelector(`[data-quote-anchor="${id}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('quote-anchor-flash');
  window.setTimeout(() => el.classList.remove('quote-anchor-flash'), 1200);
};

// Switch to the questions view focused on this question.
const onGoToQuestion = (row: QuoteRow) => {
  setActiveQuestionId(row.questionId);
  // mirror however the file already switches lessons↔questions mode:
  setMode?.('questions');
};
```

Wire them:

```tsx
<QuoteSidebar
  rows={quoteRows}
  onJump={onJump}
  onGoToQuestion={onGoToQuestion}
  onUseCurrent={onUseCurrent}
  onKeep={onKeep}
  onRelink={onRelink}
  onRemove={onRemove}
/>
```

Add the flash style once (e.g. in `app/globals.css` or a `<style jsx global>` already present): 

```css
.quote-anchor-flash { background: rgba(13, 148, 136, 0.18); border-radius: 3px; transition: background 1.2s ease; }
```

(If `setMode` isn't the actual mode setter name, use the existing one this file already uses to toggle between `mode="lessons"` and `mode="questions"`; `BuilderWorkspace` receives `mode` as a prop — switch via the same mechanism the existing UI uses.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/quote-sidebar.spec.ts`
Expected: PASS (all cases).

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/teach/BuilderWorkspace.tsx app/globals.css tests/e2e/quote-sidebar.spec.ts
git commit -m "feat(teach): quote sidebar resolution actions + jump-to-anchor"
```

---

## Task 6: Full-suite gate

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compiles successfully.

- [ ] **Step 3: Full e2e suite**

Run: `npm run test:ralph`
Expected: green, including `quote-helpers.spec.ts` and `quote-sidebar.spec.ts`, and the pre-existing `lesson-plate-editor.spec.ts` (regression — quote capture still works).

- [ ] **Step 4: Commit (if any incidental fixes were needed)**

```bash
git add -A
git commit -m "test(teach): green suite for quote anchors + sidebar"
```

---

## Self-Review Notes

- **Spec coverage:** anchor model (Tasks 1–3), style-A in-body visual + drift colour (Tasks 2–3), markdown round-trip persistence (Task 2), sidebar with lesson-position order / filters / collapsible diff (Task 4), situation-aware resolution incl. relocate/re-link and "Mantener redacción" → frozen (Task 5), jump-to-source + go-to-question (Task 5), Playwright coverage (every task). The deferred DB-persistence item stays deferred per the spec's non-goals.
- **Type consistency:** `lessonRef` gains `anchorId?` + `frozen?` in Task 3 and is read with those exact names in Tasks 3–5; `AnchorMeta`/`QuoteAnchorContext` defined in Task 2 and consumed in Tasks 2–3; `QuoteRow`/`QuoteSidebarProps` defined in Task 4 and consumed in Tasks 4–5; helper signatures fixed in Task 1 and called unchanged thereafter.
- **Known soft spots to confirm during execution (not blockers):** (1) the exact mode-switch mechanism for `onGoToQuestion` — match the file's existing lessons↔questions toggle; (2) the precise dismiss code paths for the floating quote menu that must call `cancelQuoteToQuestion()`; (3) that rendering the chip `<sup contentEditable={false}>` inside the leaf doesn't trip Slate — if it does, move the chip into an absolutely-positioned overlay instead of a leaf child.
