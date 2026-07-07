# Teacher Backoffice — Phase 1 (wire wireframes to backend + DB)

**Date:** 2026-07-07
**Branch:** `feature/phase-2b` (worktree, based on `phase-2b-rebranding`)
**Status:** Design — awaiting user review before writing implementation plan

## Goal

Ship a teacher backoffice good enough that collaborators can start entering real
course content (subjects, units, questions, lessons). The Phase-2B teacher
wireframes are the design target; the job is mostly **data + route wiring**, not
new UI, because the wireframe components already embed the real rich editor.

### Why this is mostly wiring, not redesign

The static wireframe `components/teach/BuilderWorkspace.tsx` (3564 lines) already
imports and uses the **real** `LessonPlateEditor`, `LessonPreview`, and
`QuoteSidebar`. It only differs from production by loading hard-coded seed arrays
(`initialQuestions`, `initialLessons`, `MEDIA_ASSETS`) instead of calling
controllers. The old live `(main)/build` `LessonBuilder` (360 lines) does not even
use the Plate editor — so the wireframes are *ahead* of production. We promote the
wireframes and retire the old screens.

## Scope

### In scope (Phase 1)

- §3.10 **Subjects list** — `/teach`
- §3.11 **Syllabus / units + lessons table** — `/teach/[subjectId]`
- §3.12 **Content builder** — questions + lessons authoring — `/teach/[subjectId]/[unitId]`
  - Includes **`lessonRef` quote-anchor persistence** (question ↔ lesson passage).

### Out of scope (later phases)

- §3.13 **Media library** (global reusable asset catalog) — Phase 2. Needs a
  net-new `media_assets` table + M2M relations. Lessons keep using the existing
  per-lesson R2 upload flow (`lesson_resources`) in Phase 1.
- Teacher dashboard / overview, roster/enrollment management, per-subject
  analytics — remain "Próximamente" (disabled sidebar items), no wireframe yet.
- Self-serve teacher onboarding / role-request screen.

## Approach: A — Promote the wireframes

Move `app/wireframes/(teach)/*` into a real `(teach)` route group, wire the
components to existing controllers, apply additive schema changes, gate by role,
and retire the old `(main)/teach` + `(main)/build` screens.

## Architecture

### Route map

Promote the wireframe `(teach)` group to a real top-level route group with its own
slate "no-gamification" shell (TeachSidebar). The builder is **scoped to a unit**
(questions and lessons both belong to a unit), replacing the flat `/teach/build`
of the wireframe.

| New real route | Wireframe source | Replaces |
|---|---|---|
| `app/(teach)/layout.tsx` — teacher shell + sidebar, role gate | `(teach)` layout | — |
| `app/(teach)/teach/page.tsx` — Subjects (§3.10) | `(teach)/teach/page.tsx` | `(main)/teach/page.tsx` |
| `app/(teach)/teach/[subjectId]/page.tsx` — Syllabus: units + lessons (§3.11) | `(teach)/teach/[id]/page.tsx` | `(main)/teach/[id]/page.tsx` |
| `app/(teach)/teach/[subjectId]/[unitId]/page.tsx` — Builder, tabs Preguntas/Lecciones (§3.12) | `(teach)/teach/build/*` + `BuilderWorkspace` | `(main)/build/[id]/[unitId]/*` |

Retire `app/(main)/build/*` and the old `(main)/teach` pages. Media stays a
"Próximamente" sidebar item.

Route-group note: the URL paths stay `/teach/...`, so `middleware.ts` gating of
`/teach` is unaffected. `/build` disappears (its middleware matcher can be
removed).

### Data wiring pattern

Each page splits into a **Server Component** that loads data via existing
controllers and passes it as **props** to the client component; persistence goes
through existing **server actions**, extended with the new fields. The hard-coded
seed arrays are deleted.

| Page | Load (server) | Persist (server actions) |
|---|---|---|
| Subjects | `getSubjects` / `allSubjects` | `addSubject`, `updateSubject`, `activateSubject`, `deleteSubject` |
| Syllabus | `getSubject`, `getUnits`, `getLessonsForUnit` | `addUnit`, `updateUnit`, `deleteUnit`, `addLesson`, `updateLesson`, `deleteLesson` |
| Builder | `getQuestionsFromUnit`, `getLessonsForUnit` | `addQuestionWithAnswers`, `updateQuestionWithAnswers`, `deleteQuestion`, answers CRUD, lesson CRUD + resources |

### Schema changes (all additive + nullable → safe migration)

| Table | Change | Notes |
|---|---|---|
| `questions` | persist `explanation` | Column already exists; controllers currently drop it — fix the controller, no migration |
| `questions` | add `difficulty` enum `facil\|normal\|dificil` | Backfill from `hard`; on every write also set `hard = (difficulty === 'dificil')` so the existing quiz path keeps working |
| `questions` | add `label` varchar, nullable | Short question name |
| `questions` | add `lessonId` FK → lessons, nullable, `on delete set null` | Question still belongs to a unit via `unitId`; optionally also associated to a lesson |
| `questions` | add `lessonRef` jsonb, nullable | `{section, quote, color, sentence?, anchorId?, frozen?}` — the quote-anchor link |
| `lessons` | add `subtitle` varchar, nullable | |
| `lessons` | add `hero` jsonb, nullable | `{type, gradient, color, image:{url, alt}}` — display-only, never filtered |
| `lesson_resources` | add `size` int + `status` varchar, nullable | Upload size + status for lesson attachments |

Migration via `npm run generate` + `npm run push`. No data destruction; existing
rows get NULL/defaults and are backfilled where noted.

### `lessonRef` quote-anchor persistence

- `lessonRef` is **1:1 with a question** — stored as the `questions.lessonRef`
  jsonb column above.
- The `anchorId` markers live **inside the lesson markdown** (`wrapAnchorAt` /
  `unwrapAnchor` in `lib/lesson-quotes.ts`), so they persist automatically when
  `lessons.contentText` is saved. No separate anchor store.
- On load, reuse `lib/lesson-quotes.ts` (`findAnchors`, `deriveQuoteStatus`) to
  recompute `synced | drift | orphan` status. No redesign of the quote feature;
  Phase 1 only adds persistence.
- Thread `lessonId` + `lessonRef` through `addQuestionWithAnswers` /
  `updateQuestionWithAnswers`.

### Authorization

`middleware.ts` already blocks `role="student"` from `/teach` (and `/build`,
which is being removed). Collaborators need `role="teacher"`. There is no
self-serve onboarding screen (out of scope), so Phase 1 assumes **manual role
assignment** via a small seed/script. The `(teach)/layout.tsx` also re-checks the
teacher role server-side as defense in depth.

## Components affected

- **Reused as-is (already embed real editor):** `BuilderWorkspace.tsx`,
  `LessonPlateEditor.tsx`, `LessonPreview.tsx`, `QuoteSidebar.tsx`,
  `TeachSidebar.tsx`, `MediaLibraryPanel.tsx` (its in-builder picker usage only;
  the standalone library page is Phase 2).
- **Rewired:** the wireframe page shells (`(teach)/teach/*`) become server
  components loading real data.
- **Retired:** `(main)/build/[id]/[unitId]/{QuestionBuilder,LessonBuilder,questionForm,SidebarQuestions}.tsx`,
  old `(main)/teach/[id]/{data-table,columns}.tsx` DataTable screens.
- **Controllers extended:** `questions.ts` (explanation, difficulty, label,
  lessonId, lessonRef), `lessons.ts` (subtitle, hero), resource handling (size,
  status).

## Testing

Per `CLAUDE.md`, Playwright tests are written before implementation. New/updated
specs under `tests/e2e/`:

- Subjects: create / edit / publish-unpublish / delete, list rendering.
- Units: create / reorder / edit access rules (secuencial/libre, gratis) / delete.
- Questions: author question with label, difficulty (3-level), explanation,
  answers + correct flag; edit; delete; verify `hard` stays consistent.
- Lessons: author lesson with subtitle, hero, XP, duration, markdown body,
  attachment upload; edit; delete.
- Quote-anchor: attach a question to a lesson passage, save, reload, verify
  `lessonRef` persists and status derives correctly (synced/drift/orphan).
- Role gate: student blocked from `/teach`; teacher allowed.

Validation order: `npm run typecheck` → `npm run build` → `npm run test:ralph`.

## Risks / edge cases

- **`hard` ↔ `difficulty` consistency:** always derive `hard` on write; verify the
  quiz/grading path (`quizzes.ts`, `unit.ts`) still reads `hard` correctly.
- **Anchor drift on lesson edit:** editing lesson markdown can orphan a question's
  `lessonRef`; status derivation must surface drift/orphan rather than silently
  breaking.
- **Deleting a lesson** with `on delete set null` leaves questions with a stale
  `lessonRef` object but null `lessonId` — treat as orphan in status derivation.
- **Retiring old routes:** ensure no student-facing links point at `/build/*`;
  update any internal navigation.
- **Route-group migration:** moving pages between groups must preserve the
  `/teach` URL and middleware matcher.

## Open items deferred (not blockers)

- Media library (§3.13) — Phase 2.
- Teacher dashboard, roster, analytics — future, no wireframe.
- Self-serve teacher onboarding — future.
