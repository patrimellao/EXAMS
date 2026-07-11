# Lesson Authoring Builder — Design Spec

**Date:** 2026-07-11
**Branch:** `feature/phase-2b`
**Status:** Approved approach (Enfoque 1), pending spec review

## Context

The teacher backoffice already persists lessons end-to-end, but the lesson
builder is effectively unreachable and the subject page diverged from the
wireframe. This spec closes those gaps. **No new tables are required** — the
schema already supports the wireframe use cases.

### What already exists (verified in code)

- **DB:** `lessons` (incl. `content_text` markdown+MDX body, `hero` jsonb,
  `subtitle`, `type`, `order`, `estimated_duration_minutes`, `xp_reward`),
  `lesson_resources`, `lesson_progress`, and `questions.lessonId` +
  `questions.lessonRef` for quote-anchoring.
- **Controllers:** `controllers/lessons.ts` — `addLesson`, `updateLesson`,
  `deleteLesson`, `getLessonsForUnit`, resource CRUD, all `assertTeacher()`-guarded.
- **Editor:** `LessonPlateEditor` (Plate/Slate) serializes to markdown-with-MDX
  and persists via `BuilderWorkspaceLive.saveLesson()` → `updateLesson(...)`
  and `createNewLesson()` → `addLesson(...)`.
- **Builder route:** `/teach/{subjectId}/{unitId}?tab=lessons` renders the wired
  lesson builder. Default (no `?tab=`) opens the **questions** builder — which is
  why the lesson builder looked "missing".

### Problems this spec fixes

1. **Two lists** on the subject page (`SyllabusBoard`): a units table *and* a
   flattened lessons table. The wireframe intent is a **single lessons list**
   with the unit as a filter/column ("folder/metadata").
2. **Hidden lesson builder:** subject-page "Builder" links go to
   `/teach/{s}/{u}` (defaults to questions), never `?tab=lessons`, and never
   pass `?lessonId=`.
3. **Anemic duplicate editor:** "Editar lección" opens `LessonFormDialog`, a
   plain `<Textarea>` on `content_text` that duplicates and can corrupt the
   MDX-aware Plate editor.
4. **Mock media upload** (Phase B): file/image upload is a simulated
   `setTimeout`; R2 is not wired.
5. **Unconfirmed student render** (Phase C): the student lesson view is
   hardcoded JSX in the wireframe, not a renderer of `content_text`.

## Scope & Phases

- **Phase A (detailed here, implement now):** collapse to one lessons list,
  wire real navigation into the Plate builder, remove the anemic editor, add
  "Nueva lección" from the subject page.
- **Phase B (design-level):** real R2 upload for lesson media + resources.
- **Phase C (design-level):** confirm/build the student-facing MDX render of
  `content_text`.

---

## Phase A — Lessons-first subject page + wired builder (Enfoque 1)

### A1 · Single lessons list; units become filter/metadata

`components/teach/live/SyllabusBoard.tsx`:

- **Remove the standalone units table** from the primary view. The lessons
  table becomes the single primary list (it already has a **Unidad** column and
  a **unit filter** dropdown — keep both).
- **Preserve unit management** behind a secondary **"Gestionar unidades"**
  action in the `PageHeader`. It opens a dialog/sheet containing the current
  units table content: list of units with order, access (`unlockPreviousRequired`,
  `isFree`), lesson count, and edit/delete + "Nueva unidad" — reusing the
  existing `UnitFormDialog` and `addUnit/updateUnit/deleteUnit`.
- **Header actions become:** primary **"Nueva lección"**, secondary
  **"Gestionar unidades"**. (The old primary "Nueva unidad" moves inside the
  manage-units dialog.)
- Subtitle keeps the `N unidades · M lecciones` summary.

### A2 · Wire lesson-level navigation into the real builder

- Lessons table primary action **"Editar"** (was "Builder") → `Link` to
  `/teach/{subjectId}/{lesson.unit.id}?tab=lessons&lessonId={lesson.id}`.
- Row menu **"Editar lección"** → same link (remove the `setEditingLesson`
  path).
- **Delete `LessonFormDialog`** and its `editingLesson` state/textarea. Keep the
  delete flow (`deletingLesson` → `deleteLesson`).
- `BuilderWorkspaceLive` already reads `?lessonId=` to select the lesson on
  load — no builder change needed for selection.

### A3 · "Nueva lección" from the subject page

Header primary action. A lesson requires a `unitId`, so:

- **If a unit filter is active** (`unitFilter !== "all"`): navigate straight to
  `/teach/{subjectId}/{unitFilter}?tab=lessons&new=1`.
- **Else:** open a small **unit-picker dialog** (select from existing units),
  then navigate to `/teach/{subjectId}/{chosenUnitId}?tab=lessons&new=1`.
- **If the subject has zero units:** the picker shows an empty state prompting
  "Crea una unidad primero" with a shortcut into the manage-units dialog.
- **`?new=1` handling in `BuilderWorkspaceLive`:** on mount, when `new=1` is
  present and no `lessonId`, call the existing `createNewLesson()` once, then
  `history.replaceState` to `?tab=lessons&lessonId={created.id}` (mirrors the
  existing post-create URL update) so a reload doesn't re-create.

### A4 · Data flow (unchanged plumbing)

Server page `app/(teach)/teach/[subjectId]/page.tsx` already loads
`units`, `lessonsByUnit`, and `questionCountByLesson`. It keeps passing these to
`SyllabusBoard`; only the client presentation changes. No controller or query
changes in Phase A.

### A5 · Error / edge handling

- Deep link with a stale `lessonId` (deleted lesson): builder falls back to the
  first lesson or the empty state (existing behavior).
- "Nueva lección" with no units: blocked with the picker empty state (above).
- Removing the units table must not orphan unit CRUD — verified reachable via
  "Gestionar unidades".

### A6 · Tests (write first, per repo policy)

New/updated Playwright spec `tests/e2e/uc-2X-lesson-builder-nav.spec.ts`:

1. Teacher opens a subject → sees **one** lessons list (assert the units table
   is gone; assert lessons table present).
2. "Gestionar unidades" opens the dialog and can create a unit.
3. Clicking "Editar" on a lesson lands on the **lesson** builder
   (`?tab=lessons`) with that lesson selected (assert the Plate editor shows the
   lesson title/content).
4. Editing content and saving persists (`updateLesson`) — reload shows the new
   content.
5. "Nueva lección" (with a unit chosen) creates a lesson and opens it in the
   builder; the lesson appears back on the subject list after save.

---

## Phase B — Real R2 media upload (design-level)

Replace `simulateFileUpload` (`BuilderWorkspaceLive.tsx`) with the presigned-URL
flow: `app/api/upload/presign` (`lib/r2.ts`) → PUT to R2 → persist via
`addLessonResource` (resources) or store the public URL in `hero.image.url` /
inline `<Video>`/image markdown (lesson media). Covers hero images, inline
images/video from the Media Library, and downloadable resources. Detailed spec
to be written when Phase A lands.

## Phase C — Student MDX render (design-level)

Confirm the student `(focus)`/study lesson route renders `lessons.content_text`
through a real MDX/markdown renderer with the components map (`Objectives`,
`KeyIdea`, `Video`, `Diagram`, `Chart`, `Highlight`, `QuoteAnchor`, `Cite`,
`Resource`) — reusing `lesson-editor/static-nodes.tsx` where possible — instead
of the hardcoded wireframe JSX. Wire the `?focus=&hl=` deep-link to a quoted
passage. Detailed spec to be written when Phase B lands.

---

## Out of scope

- Redesigning the lesson builder's internal UX (blocks toolbar, quote panel).
- The `type='file'` lesson variant UI (deferred; column already permits it).
- Any schema/table changes — none are needed.
