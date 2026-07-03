# "Citas" as a first-class editor view mode

**Date:** 2026-07-03
**Branch:** phase-2b-rebranding
**Components:** `components/teach/BuilderWorkspace.tsx`, `components/teach/lesson-editor/QuoteSidebar.tsx`
**Supersedes the shell decision in:** `2026-06-30-quote-sidebar-config-language-design.md`
(that spec's internal restyle of the panel stands; only its "keep as a floating
inline `<aside>` card" shell decision is replaced here)

## Problem

The "Citas de la lección" panel reads as **floating but not**. Root cause: it
carries floating-card chrome (`rounded-card border bg-card shadow-card
lg:max-h-[680px] lg:self-start`) while docked inside the lesson editor's
**flat, full-bleed, chrome-less canvas** (`relative -mx-4 flex … bg-card
md:-mx-8`, `BuilderWorkspace.tsx:1818`). Rounded corners + drop shadow + a
max-height shorter than the canvas signal "I float above the page," but the
panel is pinned in a flex row — the brain reads "floating," the layout says
"nailed down." (The `QuestionNavigator` reuses the same card chrome and feels
fine because it sits on the page background inside a grid, where a card is the
correct signal.)

## Decision

Make **"Citas" a first-class editor view mode**, peer to Escribir / Vista
previa / Dividido, rather than an independent floating toggle. In that mode the
canvas becomes a **divided two-pane view** — the live editor on the left, the
quote panel on the right — using the existing split-view's flat-pane grammar
(vertical border divider, no cards, full-height panes). This keeps the editor
and quotes co-visible (so drift-watching and click-to-highlight still work)
while removing the floating dissonance.

Rejected alternatives:
- **Convert to a Sheet** (like lesson settings): a modal overlay covers the
  editor, breaking the editor+quotes co-visibility this feature depends on.
- **Restyle the floating card in place**: fixes the look but leaves an
  independent toggle that can stack a 3rd pane onto Dividido (editor | preview |
  quotes) — cramped, incoherent mental model.

## Changes

### 1. Mode model — `BuilderWorkspace.tsx`
- Extend `editorMode` state (`:665`): `"edit" | "preview" | "split"` →
  `"edit" | "preview" | "split" | "quotes"`.
- Remove the standalone quote toggle button (`:1600–1609`) and the now-unused
  `quoteSidebarOpen` state (`:666`). The mode replaces both.

### 2. Segmented control — `:1610–1658`
- Add a fourth icon button after "Dividido": **Citas**, icon
  `MessageSquareQuote` (already imported; the icon this feature uses elsewhere).
  Same active/inactive treatment as its siblings.
- **`aria-label="Citas de la lección"`** on the button — preserves the
  accessible name the existing tests click, so the interaction stays
  test-compatible.
- Mobile cycle button (`:1660`) rotation gains `quotes`:
  edit → preview → split → quotes → edit.

### 3. Quotes-mode layout — `:1819–2088`
- Render the left editor when `editorMode === "edit" || editorMode ===
  "quotes"`. Same element position + `key={activeLessonId}`, so switching
  edit↔quotes does **not** remount the editor or lose its state.
- Left pane = the full rich `LessonPlateEditor` (identical to Escribir), so
  editing feels the same and `anchorMeta` highlight/jump keeps working.
- Right pane = `QuoteSidebar`, rendered only when `editorMode === "quotes"`
  (replaces the old `quoteSidebarOpen &&` render at `:2077`).

### 4. QuoteSidebar shell restyle — `QuoteSidebar.tsx:149` (the core fix)
- **Remove:** `rounded-card`, `shadow-card`, `lg:max-h-[680px]`,
  `lg:self-start`.
- **Keep/add:** `border-l` as the single vertical divider from the editor;
  stretch full-height with the canvas (default flex `stretch`); keep
  `w-80 shrink-0 bg-card` and the internal `overflow-y-auto` scroll region.
- Internals (header, segmented filter, rows, footer) unchanged — already
  normalized by the 2026-06-30 spec. Only the outer shell changes.

## Constraints (test-pinned)

- `<aside aria-label="Citas de la lección">` (`role=complementary`) preserved.
- A control with accessible name matching `/Citas de la lección/i` still opens
  the panel (now the mode button rather than a toggle).
- Filter text `A revisar (N)`, the `Sincronizada` synced-row hint, and button
  names `Usar texto actual` / `Quitar cita` all preserved.

## Test impact — `tests/e2e/quote-sidebar.spec.ts`

Expected to stay green unchanged (button name + `complementary` role
preserved). During implementation, verify:
- No test relies on **re-clicking to close** the panel — mode buttons are
  mutually exclusive (`aria-pressed`), they do not toggle-close.
- The panel is asserted as present in-mode, not as a dismissible overlay.
Adjust the spec file only if one of these assumptions turns out false. Per the
testing policy, run `npm run test:ralph` and confirm green before the PR.

## Out of scope

- Quote data model, drift/orphan derivation, resolution actions — unchanged.
- Config and history Sheets — unchanged.
- Preview and Dividido modes — unchanged.

## Verification

`npm run typecheck` → `npm run build` → `tests/e2e/quote-sidebar.spec.ts`
(and the wider suite via `npm run test:ralph`) green. Iterate on visual
feedback after first render.
