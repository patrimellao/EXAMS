# Lesson Quote Anchors + Management Sidebar — Design

**Date:** 2026-06-24
**Branch:** phase-2b-rebranding
**Scope:** Builder wireframe (`components/teach/BuilderWorkspace.tsx`, `components/teach/lesson-editor/`). State-only prototype — no database persistence in this pass.

## Problem

The builder already lets a teacher select lesson text and push it as a *quote* onto a question of the same lesson (commit `d21a5ce` and earlier). Today a quote is a **copied snapshot** — three strings (`quote`, `sentence`, `section`) plus a `color`, stored on the question's `lessonRef`. There is **no link back** to where that text lives in the editor.

Consequence: when the teacher edits the source paragraph, the quote on the question silently goes stale. Nobody is told. On an exam platform, a question can end up showing a quote that no longer matches the lesson.

## Goal

Make a quote a **live annotation** of the lesson text (not a frozen copy), and give the teacher a **sidebar** to see and manage every quote in the lesson — surfacing the ones that have drifted from their source so they can be reviewed deliberately.

This is **Option B** (live annotation) chosen over Option A (a pure reconciliation panel over copied strings).

## Non-goals (this pass)

- Database persistence of quotes/anchors (`lessonRef` is not yet in the Drizzle schema). Wireframe stays in component state.
- Changing the existing "select text → push to question" capture flow itself (toolbar button + right-click menu stay as-is).
- Touching the student-facing `LessonQuoteCard` rendering.

## Core model: the anchor

A quote stops being a free-floating string copy and gains an **anchor** into the Plate editor: a mark riding on the quoted text *range* (a Plate/Slate leaf mark, e.g. `quoteAnchor: <anchorId>`), not a line number or offset.

Why a mark on the range, not a position:
- **Edits inside the range** keep the mark; we compare the marked text against the stored `quote` to detect drift.
- **Cut + paste elsewhere in the lesson** carries the mark with the text — the quote stays **synced**, it just re-sorts to its new lesson position. The "moved" case self-heals; it is *not* a problem state.
- **Deleting the range** drops the mark — the quote becomes an **orphan** (the only genuinely broken state).

`lessonRef` gains two fields:

```ts
lessonRef: {
  anchorId: string;        // NEW — matches the quoteAnchor mark in the editor
  status: "synced" | "drift" | "orphan";  // NEW — derived, see below
  section: string;
  quote: string;
  sentence?: string;
  color: string;
} | null
```

`status` is **derived**, recomputed when the lesson editor changes (and on sidebar open):

- **synced** — a mark with `anchorId` exists and its current text still matches the stored `quote` (after whitespace-normalised comparison; trivial edits like whitespace/single-character corrections are absorbed without flagging).
- **drift** — the mark exists but its current text differs substantively from the stored `quote` (edited in place).
- **orphan** — no mark with `anchorId` exists in the editor. The sidebar then **searches the current lesson text** for the stored `quote` words; if found, it records the candidate location for a re-link suggestion.

## In-body anchor visual (chosen style: "A")

The quoted fragment renders as a **dotted underline + a superscript question chip** — deliberately *not* a fill, so it never collides with the editor's existing fill-style highlight leaf (commits `5a3366a`, `d695a28`).

- **Synced:** `border-bottom: 2px dotted` in teal (`#0d9488`) + teal `Q{n}` chip.
- **Drift:** `border-bottom: 2px dashed` in amber (`#d97706`) + faint amber wash (`rgba(217,119,6,.07)`) + amber `Q{n}` chip.
- **Active (selected in sidebar):** soft teal background flash (`rgba(13,148,136,.1)`).
- Clicking the chip / the mark → jump to that question.

## The sidebar

Docked on the **right** of the builder, toggleable. One card per quote.

**Header:** title "Citas de la lección" + count ("4 · 2 a revisar"); filter pills **Todas / ⚠ A revisar**. An amber state is reflected in the count, not a separate banner (kept minimal).

**Order:** by **lesson position** (top-to-bottom as the quotes appear in the lesson body), shown with a faint `§` position marker. Not grouped by question.

**Row anatomy:**
- Status dot (teal synced / amber drift / gray orphan), `Pregunta {n}` ref, `§` position.
- The fragment, in serif, dotted-underlined.

**Per-status content & actions:**

| Status | Body | Actions |
|--------|------|---------|
| **synced** | "Sincronizada · clic para resaltar en el texto" | (row click → scroll editor + flash anchor) |
| **drift** (edited in place) | Collapsible **"▸ ver cambios"** → expands a `was → now` diff (collapsed by default) | **Usar texto actual** (adopt new wording into the quote) · **Mantener redacción** (keep original quote words, clear the flag) · **Ir a pregunta** |
| **orphan, words found elsewhere** | "↪ Parece estar ahora en §{section}" | **Re-vincular a §{section}** (one-click re-anchor, keep wording) · **Quitar cita** |
| **orphan, not found** | "El texto de origen ya no existe en la lección" | **Quitar cita** |

**Resolution semantics:**
- *Usar texto actual* — copy the current marked text into `lessonRef.quote`/`sentence`, set status `synced`.
- *Mantener redacción* — leave `lessonRef.quote` unchanged, set status `synced` (the teacher has consciously decided the edit was around the fragment, not its meaning). The in-body mark reverts to teal.
- *Re-vincular a §X* — bind the quote's `anchorId` to a fresh mark dropped on the found location, set status `synced`.
- *Quitar cita* — null out `lessonRef` on the question.

## Components / files

- **`LessonPlateEditor.tsx`** — add the `quoteAnchor` leaf mark (render = dotted underline + chip), apply it on quote creation, and emit anchor/text state on change so status can be derived. Add scroll-to-anchor + flash on demand.
- **`BuilderWorkspace.tsx`** — owns `questionsList`; add derived-status computation, the relocate search, and the resolution handlers. Hosts the sidebar panel and its open/close state.
- **New: `components/teach/lesson-editor/QuoteSidebar.tsx`** — the panel: header, filters, rows, per-status actions, collapsible diff. Kept as its own focused component rather than swelling `BuilderWorkspace`.
- **Reuse:** `components/lesson/quote-reference.tsx` (`QuoteSentence` normalisation logic) for the diff/preview rendering where useful.

## Drift detection (wireframe)

Whitespace-normalised string comparison between the anchor's current text and the stored `quote` (same `norm()` approach already in `quote-reference.tsx`). Substantive difference → `drift`; absent mark → search lesson text for the stored words → `orphan` (+ candidate) or `orphan` (none). No fuzzy/semantic matching in this pass.

## Testing

Per the project policy, add Playwright coverage before/with implementation: `tests/e2e/uc-{N}-quote-sidebar.spec.ts`.

1. Create a quote → it appears in the sidebar, synced, with an in-body dotted anchor + chip.
2. Edit the quoted text in place → sidebar row flips to drift (amber), "ver cambios" reveals the diff; *Usar texto actual* re-syncs; *Mantener redacción* clears the flag without changing the quote.
3. Delete the quoted text → row becomes orphan; if the same words exist elsewhere, the re-link suggestion appears and re-anchors on click.
4. Click a synced row → editor scrolls and flashes the anchor; click a chip → jumps to the question.
5. Sidebar rows are ordered by lesson position; filter "A revisar" shows only drift/orphan.

## Open question deferred to implementation

When this graduates from wireframe to real data, `lessonRef` (incl. `anchorId`) must be added to the Drizzle `questions` schema and the anchor mark must be serialised with the lesson MDX/Plate content. Tracked, not built here.
