# Teacher Backoffice — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Duplicate the Phase-2B teacher wireframes into real `(teach)` routes and wire them to the existing controllers + DB so collaborators can author subjects, units, questions, and lessons (incl. quote-anchor links).

**Architecture:** Duplicate `app/wireframes/(teach)/*` (left untouched) into a real `app/(teach)/*` route group with a role-gated slate shell. Each page is a Server Component that loads data via existing controllers and passes it as props to a client component; persistence goes through existing server actions extended with new fields. Additive, nullable schema changes only. The old `(main)/teach` + `(main)/build` screens are retired last.

**Tech Stack:** Next.js 14 App Router (RSC + server actions), Drizzle ORM (PostgreSQL), Better Auth, Playwright E2E.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-07-teacher-backoffice-phase-1-design.md` (authoritative).
- **TDD:** write/adjust the Playwright spec before implementing each feature task (CLAUDE.md policy). New spec files: `tests/e2e/uc-{N}-{name}.spec.ts`.
- **Validation order:** `npm run typecheck` (L1) → `npm run build` (L2) → `npm run test:ralph` (L3). A task is done only when its level-appropriate checks are green.
- **DB workflow:** schema edits in `schemas/*.ts` → `npm run generate` → `npm run push`. Never hand-edit generated SQL.
- **All schema changes are additive + nullable** (or defaulted). No column drops, no NOT NULL on existing tables without a default+backfill.
- **`app/wireframes/(teach)/*` is READ-ONLY** for this plan — copy from it, never modify it.
- **Brand copy:** user-facing strings are Spanish and use "TuFolio" (not "Jean Monnet").
- **Push after every task:** `git push origin feature/phase-2b` (branch already tracks origin) so a cutoff never loses work.
- Controllers are `"use server"`; import them directly into client components as server actions or call from RSC.

---

## File Structure

**Schema (modify):**
- `schemas/questions.ts` — add `difficulty`, `label`, `lessonId`, `lessonRef`.
- `schemas/lessons.ts` — add `subtitle`, `hero`.
- `schemas/lesson_resources.ts` — add `size`, `status`.
- `schemas/relations.ts` — add `questions ↔ lessons` relation.

**Controllers (modify):**
- `controllers/questions.ts` — thread new fields through add/update.
- `controllers/lessons.ts` — thread `subtitle`, `hero`.

**Lib (add):**
- `lib/teach/hero.ts` — `Hero` type + default.
- `lib/teach/lesson-ref.ts` — `LessonRef` type + `deriveLessonRefStatus`.

**Routes (create — copies of wireframes, wired):**
- `app/(teach)/layout.tsx`
- `app/(teach)/teach/page.tsx`
- `app/(teach)/teach/[subjectId]/page.tsx`
- `app/(teach)/teach/[subjectId]/[unitId]/page.tsx`
- `components/teach/live/SubjectsBoard.tsx`
- `components/teach/live/SyllabusBoard.tsx`
- `components/teach/live/BuilderWorkspaceLive.tsx` (wired copy of `BuilderWorkspace`)

**Retire (delete last):**
- `app/(main)/build/*`, old `app/(main)/teach/[id]/*` DataTable screens.

**Tests (create):**
- `tests/e2e/uc-21-teach-subjects.spec.ts`
- `tests/e2e/uc-22-teach-syllabus.spec.ts`
- `tests/e2e/uc-23-teach-builder-questions.spec.ts`
- `tests/e2e/uc-24-teach-builder-lessons.spec.ts`
- `tests/e2e/uc-25-teach-quote-anchor.spec.ts`
- `tests/e2e/uc-26-teach-role-gate.spec.ts`

---

## Task 1: Schema changes + migration

**Files:**
- Modify: `schemas/questions.ts`
- Modify: `schemas/lessons.ts`
- Modify: `schemas/lesson_resources.ts`
- Modify: `schemas/relations.ts`

**Interfaces:**
- Produces: new columns `questions.difficulty` (`'facil'|'normal'|'dificil'`, default `'normal'`), `questions.label` (varchar 256, null), `questions.lessonId` (int FK→lessons, null, on delete set null), `questions.lessonRef` (jsonb, null); `lessons.subtitle` (varchar 256, null), `lessons.hero` (jsonb, null); `lesson_resources.size` (int, null), `lesson_resources.status` (varchar 20, null).

- [ ] **Step 1: Edit `schemas/questions.ts`** — add columns (keep existing `hard`, `explanation`):

```typescript
import { pgTable, serial, boolean, timestamp, integer, text, varchar, jsonb } from "drizzle-orm/pg-core";
import { units } from "./units";
import { lessons } from "./lessons";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey().notNull(),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade", onUpdate: "cascade" }),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "set null", onUpdate: "cascade" }),
  label: varchar("label", { length: 256 }),           // short question name
  question: text("question"),
  explanation: text("explanation"),
  difficulty: varchar("difficulty", { length: 10 }).default('normal').notNull(), // 'facil'|'normal'|'dificil'
  hard: boolean("hard").default(false),               // kept in sync: hard = difficulty === 'dificil'
  lessonRef: jsonb("lesson_ref"),                     // { section, quote, color, sentence?, anchorId?, frozen? }
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
```

- [ ] **Step 2: Edit `schemas/lessons.ts`** — add `subtitle` and `hero` after `title`:

```typescript
import { pgTable, serial, timestamp, integer, varchar, smallint, text, boolean, index, jsonb } from "drizzle-orm/pg-core";
// ...existing imports...
  title: varchar("title", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),        // NEW — optional lesson subtitle
  hero: jsonb("hero"),                                    // NEW — { type, gradient, color, image:{url,alt} }
  order: smallint("order").notNull(),
```

- [ ] **Step 3: Edit `schemas/lesson_resources.ts`** — add `size` and `status`:

```typescript
import { pgTable, serial, timestamp, integer, varchar, smallint } from "drizzle-orm/pg-core";
// ...
  url: varchar("url", { length: 512 }).notNull(),
  size: integer("size"),                                 // NEW — bytes, nullable
  status: varchar("status", { length: 20 }),             // NEW — 'ready' | 'uploading' | 'error', nullable
  order: smallint("order").default(1).notNull(),
```

- [ ] **Step 4: Edit `schemas/relations.ts`** — add the questions↔lessons relation.

Read the existing `questionsRelations` and `lessonsRelations` blocks first, then add:
- to `questionsRelations`: `lesson: one(lessons, { fields: [questions.lessonId], references: [lessons.id] })`
- to `lessonsRelations`: `questions: many(questions)`

(Keep the existing `unit` relation on questions.)

- [ ] **Step 5: Generate + apply migration**

Run: `npm run generate && npm run push`
Expected: a new migration under `drizzle/` adding the columns; `push` applies with no errors.

- [ ] **Step 6: Backfill `difficulty` from `hard`**

Run (via the project's psql access):
```sql
UPDATE questions SET difficulty = 'dificil' WHERE hard = true;
UPDATE questions SET difficulty = 'normal' WHERE hard = false OR hard IS NULL;
```
Expected: rows updated, no error.

- [ ] **Step 7: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.
```bash
git add schemas/ drizzle/
git commit -m "feat(teach): additive schema for question difficulty/label/lessonRef, lesson hero/subtitle, resource size/status"
git push origin feature/phase-2b
```

---

## Task 2: Shared types — Hero + LessonRef

**Files:**
- Create: `lib/teach/hero.ts`
- Create: `lib/teach/lesson-ref.ts`
- Test: `tests/unit/lesson-ref.test.ts` (if a unit runner exists) OR fold assertions into the E2E for Task 6.

**Interfaces:**
- Produces:
  - `type Hero = { type: 'gradient'|'solid'|'image'|'image-gradient'; gradient?: 'warm'|'trust'|'brand'; color?: string; image?: { url: string; alt: string } }`
  - `type LessonRef = { section: string; quote: string; color: string; sentence?: string; anchorId?: string; frozen?: boolean }`
  - `function deriveLessonRefStatus(ref: LessonRef, lessonMarkdown: string): 'synced'|'drift'|'orphan'`

- [ ] **Step 1: Create `lib/teach/hero.ts`**

```typescript
export type Hero = {
  type: 'gradient' | 'solid' | 'image' | 'image-gradient';
  gradient?: 'warm' | 'trust' | 'brand';
  color?: string;
  image?: { url: string; alt: string };
};

export const DEFAULT_HERO: Hero = { type: 'gradient', gradient: 'brand' };
```

- [ ] **Step 2: Create `lib/teach/lesson-ref.ts`** — reuse existing quote helpers

```typescript
import { findAnchors, deriveQuoteStatus } from '@/lib/lesson-quotes';

export type LessonRef = {
  section: string;
  quote: string;
  color: string;
  sentence?: string;
  anchorId?: string;
  frozen?: boolean;
};

// synced: anchor present and text matches; drift: anchor present, text changed; orphan: anchor gone / null.
export function deriveLessonRefStatus(ref: LessonRef, lessonMarkdown: string): 'synced' | 'drift' | 'orphan' {
  if (!ref.anchorId) return 'orphan';
  const anchors = findAnchors(lessonMarkdown);
  const hit = anchors.find((a) => a.id === ref.anchorId);
  if (!hit) return 'orphan';
  return deriveQuoteStatus({ quote: ref.quote, currentText: hit.text });
}
```

> Before writing Step 2, open `lib/lesson-quotes.ts` and confirm the exact shapes of `findAnchors`' return (`AnchorHit`) and `deriveQuoteStatus`' params (`QuoteRefLite` / `QuoteStatusInfo`). Adapt the field names in the call to match — the intent (anchor lookup by id + text comparison) is fixed; the exact property names must match the real helpers.

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.
```bash
git add lib/teach/
git commit -m "feat(teach): Hero + LessonRef types with quote-status derivation"
git push origin feature/phase-2b
```

---

## Task 3: Extend controllers to persist new fields

**Files:**
- Modify: `controllers/questions.ts` (`addQuestionWithAnswers`, `updateQuestionWithAnswers`)
- Modify: `controllers/lessons.ts` (`addLesson`, `updateLesson`)

**Interfaces:**
- Consumes: `Hero` (Task 2), `LessonRef` (Task 2), schema columns (Task 1).
- Produces (new controller signatures later tasks call):
  - `addQuestionWithAnswers({ question, label?, explanation?, difficulty, unitId, lessonId?, lessonRef?, answers })` → `Promise<number>` (new id)
  - `updateQuestionWithAnswers({ id, question, label?, explanation?, difficulty, lessonId?, lessonRef?, answers })` → `Promise<void>`
  - `addLesson`/`updateLesson` accept `subtitle?` and `hero?` in their `InsertLesson` payloads (already typed once schema lands).

- [ ] **Step 1: Rewrite `addQuestionWithAnswers` / `updateQuestionWithAnswers`** in `controllers/questions.ts`

```typescript
type Difficulty = 'facil' | 'normal' | 'dificil';
type QAnswer = { name: string; correct: boolean };

export const addQuestionWithAnswers = async ({ question, label, explanation, difficulty, unitId, lessonId, lessonRef, answers }: {
  question: string;
  label?: string;
  explanation?: string;
  difficulty: Difficulty;
  unitId: number;
  lessonId?: number | null;
  lessonRef?: unknown | null;
  answers: QAnswer[];
}) => {
  const newQuestion = await addQuestion({
    question, label, explanation, difficulty,
    hard: difficulty === 'dificil',
    unitId, lessonId: lessonId ?? null, lessonRef: lessonRef ?? null,
  });
  for (const answer of answers) {
    await addAnswer({ ...answer, questionId: newQuestion[0].id });
  }
  return newQuestion[0].id;
};

export const updateQuestionWithAnswers = async ({ id, question, label, explanation, difficulty, lessonId, lessonRef, answers }: {
  id: number;
  question: string;
  label?: string;
  explanation?: string;
  difficulty: Difficulty;
  lessonId?: number | null;
  lessonRef?: unknown | null;
  answers: QAnswer[];
}) => {
  await updateQuestion(id, {
    question, label, explanation, difficulty,
    hard: difficulty === 'dificil',
    lessonId: lessonId ?? null, lessonRef: lessonRef ?? null,
  });
  await deleteQuestionAnswers(id);
  for (const answer of answers) {
    await addAnswer({ ...answer, questionId: id });
  }
};
```

> `addQuestion` and `updateQuestion` already spread `InsertQuestion`, so the new fields flow through with no change to them.

- [ ] **Step 2: Confirm `addLesson`/`updateLesson` pass through `subtitle`+`hero`**

Open `controllers/lessons.ts`. `addLesson`/`updateLesson` take an `InsertLesson`. Once Task 1 lands, `InsertLesson` includes `subtitle` and `hero`, so no signature change is needed — verify they spread the full payload (not a hand-picked subset). If they cherry-pick columns, widen them to include `subtitle` and `hero`.

- [ ] **Step 3: Update every existing caller of the two question functions**

Run: `grep -rn "addQuestionWithAnswers\|updateQuestionWithAnswers" app components controllers`
For each caller (notably `app/(main)/build/[id]/[unitId]/questionForm.tsx`), update the call to the new shape: pass `difficulty` (map old boolean `hard` → `hard ? 'dificil' : 'normal'`) and `id` (for update). These old callers are retired in Task 8, but must compile until then.

- [ ] **Step 4: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.
```bash
git add controllers/ app/
git commit -m "feat(teach): persist explanation/label/difficulty/lessonId/lessonRef + lesson hero/subtitle"
git push origin feature/phase-2b
```

---

## Task 4: Teacher route group shell + role gate

**Files:**
- Create: `app/(teach)/layout.tsx`
- Test: `tests/e2e/uc-26-teach-role-gate.spec.ts`
- Reference: `middleware.ts` (already blocks students from `/teach`), `lib/getUser.ts`, `components/teach/TeachSidebar.tsx`, `app/wireframes/(teach)/layout.tsx` (copy source).

**Interfaces:**
- Produces: the `/teach/*` shell rendering `TeachSidebar`; server-side redirect to `/home` (or sign-in) when the user is not a teacher.

- [ ] **Step 1: Write the failing test** `tests/e2e/uc-26-teach-role-gate.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { signInAs } from './helpers'; // use the project's existing auth helper; check tests/e2e for its name

test('student is blocked from /teach', async ({ page }) => {
  await signInAs(page, 'student');
  await page.goto('/teach');
  await expect(page).not.toHaveURL(/\/teach/);
});

test('teacher can open /teach', async ({ page }) => {
  await signInAs(page, 'teacher');
  await page.goto('/teach');
  await expect(page.getByRole('heading', { name: /asignaturas/i })).toBeVisible();
});
```

> First open `tests/e2e/uc-04-teacher-backoffice.spec.ts` and reuse its exact sign-in helper + seeded teacher/student credentials rather than inventing `signInAs`.

- [ ] **Step 2: Run it — expect FAIL** (route group doesn't exist yet)

Run: `npx playwright test tests/e2e/uc-26-teach-role-gate.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Create `app/(teach)/layout.tsx`** — copy the wireframe layout, add the gate

Copy the structure of `app/wireframes/(teach)/layout.tsx` (TeachSidebar shell, slate chrome). Add a server-side role check at the top:

```typescript
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/getUser'; // confirm exact export

export default async function TeachLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user || user.role === 'student') redirect('/home');
  // ...render the copied slate shell + <TeachSidebar/> around {children}...
}
```

> Confirm `getUser`'s return shape and the exact role field/value (`'student'` vs `'teacher'`) from `lib/auth.ts` / `lib/getUser.ts` before finalizing the condition.

- [ ] **Step 4: Run the test — expect PASS**

Run: `npx playwright test tests/e2e/uc-26-teach-role-gate.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/(teach)/layout.tsx tests/e2e/uc-26-teach-role-gate.spec.ts
git commit -m "feat(teach): real (teach) route group shell with server-side role gate"
git push origin feature/phase-2b
```

---

## Task 5: Subjects list page (§3.10)

**Files:**
- Create: `app/(teach)/teach/page.tsx` (Server Component)
- Create: `components/teach/live/SubjectsBoard.tsx` (client; copy of the wireframe subjects UI)
- Test: `tests/e2e/uc-21-teach-subjects.spec.ts`
- Copy source: `app/wireframes/(teach)/teach/page.tsx`
- Controllers: `allSubjects`, `addSubject`, `updateSubject`, `activateSubject`, `deleteSubject` (in `controllers/subjects.ts`).

**Interfaces:**
- Consumes: `controllers/subjects.ts`.
- Produces: `/teach` listing real subjects with create/edit/publish/delete.

- [ ] **Step 1: Write the failing test** `tests/e2e/uc-21-teach-subjects.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { signInAsTeacher } from './helpers'; // reuse project's real helper

test('teacher creates a subject and sees it listed', async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto('/teach');
  await page.getByRole('button', { name: /nueva asignatura|crear asignatura/i }).click();
  await page.getByLabel(/nombre/i).fill('Constitución E2E');
  await page.getByRole('button', { name: /guardar|crear/i }).click();
  await expect(page.getByText('Constitución E2E')).toBeVisible();
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `npx playwright test tests/e2e/uc-21-teach-subjects.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Create `components/teach/live/SubjectsBoard.tsx`**

Copy the JSX/markup of `app/wireframes/(teach)/teach/page.tsx` into a client component `SubjectsBoard({ subjects }: { subjects: Subject[] })`. Replace the hard-coded seed array with the `subjects` prop. Wire the create/edit/publish/delete controls to the `controllers/subjects.ts` server actions (call them directly; use `router.refresh()` after mutations). Map the "Publicada/Borrador" badge to `subject.active`.

- [ ] **Step 4: Create `app/(teach)/teach/page.tsx`** (Server Component)

```typescript
import { allSubjects } from '@/controllers/subjects';
import { SubjectsBoard } from '@/components/teach/live/SubjectsBoard';

export default async function TeachSubjectsPage() {
  const subjects = await allSubjects();
  return <SubjectsBoard subjects={subjects} />;
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx playwright test tests/e2e/uc-21-teach-subjects.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/(teach)/teach/page.tsx components/teach/live/SubjectsBoard.tsx tests/e2e/uc-21-teach-subjects.spec.ts
git commit -m "feat(teach): wired subjects list page (§3.10)"
git push origin feature/phase-2b
```

---

## Task 6: Syllabus — units + lessons page (§3.11)

**Files:**
- Create: `app/(teach)/teach/[subjectId]/page.tsx` (Server Component)
- Create: `components/teach/live/SyllabusBoard.tsx` (client)
- Test: `tests/e2e/uc-22-teach-syllabus.spec.ts`
- Copy source: `app/wireframes/(teach)/teach/[id]/page.tsx`
- Controllers: `getSubject`, `getUnits`, `addUnit`, `updateUnit`, `deleteUnit` (`controllers/unit.ts`); `getLessonsForUnit`, `addLesson`, `updateLesson`, `deleteLesson` (`controllers/lessons.ts`).

**Interfaces:**
- Consumes: `controllers/unit.ts`, `controllers/lessons.ts`.
- Produces: `/teach/[subjectId]` — units table (order, name, secuencial/libre→`unlockPreviousRequired`, gratis→`isFree`) with nested lessons; row action opens the builder at `/teach/[subjectId]/[unitId]`.

- [ ] **Step 1: Write the failing test** `tests/e2e/uc-22-teach-syllabus.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { signInAsTeacher, seededSubjectId } from './helpers';

test('teacher adds a unit to a subject', async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto(`/teach/${seededSubjectId}`);
  await page.getByRole('button', { name: /nueva unidad|añadir unidad/i }).click();
  await page.getByLabel(/nombre/i).fill('Tema 1 E2E');
  await page.getByRole('button', { name: /guardar|crear/i }).click();
  await expect(page.getByText('Tema 1 E2E')).toBeVisible();
});
```

> Use the seeded subject id from `.env.test` / the project's seed exports rather than a literal.

- [ ] **Step 2: Run it — expect FAIL**

Run: `npx playwright test tests/e2e/uc-22-teach-syllabus.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Create `components/teach/live/SyllabusBoard.tsx`**

Copy the wireframe `[id]/page.tsx` markup into a client `SyllabusBoard({ subject, units, lessonsByUnit }: { subject: Subject; units: Unit[]; lessonsByUnit: Record<number, Lesson[]> })`. Replace seed data with props. Wire unit CRUD to `controllers/unit.ts` and lesson CRUD to `controllers/lessons.ts`. Map "Secuencial/Libre" → `unlockPreviousRequired`, "Gratis" → `isFree`. The per-lesson "Preguntas" count = number of questions whose `lessonId` equals that lesson (provided by the server component). "Abrir builder" links to `/teach/${subject.id}/${unit.id}`.

- [ ] **Step 4: Create `app/(teach)/teach/[subjectId]/page.tsx`**

```typescript
import { getSubject } from '@/controllers/subjects';
import { getUnits } from '@/controllers/unit';
import { getLessonsForUnit } from '@/controllers/lessons';
import { SyllabusBoard } from '@/components/teach/live/SyllabusBoard';

export default async function SyllabusPage({ params }: { params: { subjectId: string } }) {
  const subjectId = Number(params.subjectId);
  const subject = await getSubject(subjectId);
  const units = await getUnits(subjectId); // confirm getUnits' arg (subjectId) from controllers/unit.ts
  const lessonsByUnit: Record<number, Awaited<ReturnType<typeof getLessonsForUnit>>> = {};
  for (const u of units) lessonsByUnit[u.id] = await getLessonsForUnit(u.id);
  return <SyllabusBoard subject={subject} units={units} lessonsByUnit={lessonsByUnit} />;
}
```

> Confirm `getUnits` / `getSubject` exact signatures and return shapes before finalizing (the audit shows `getSubject` already left-joins units — you may be able to drop the separate `getUnits` call).

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx playwright test tests/e2e/uc-22-teach-syllabus.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/(teach)/teach/[subjectId]/page.tsx components/teach/live/SyllabusBoard.tsx tests/e2e/uc-22-teach-syllabus.spec.ts
git commit -m "feat(teach): wired syllabus units+lessons page (§3.11)"
git push origin feature/phase-2b
```

---

## Task 7: Content builder — questions + lessons (§3.12)

**Files:**
- Create: `app/(teach)/teach/[subjectId]/[unitId]/page.tsx` (Server Component)
- Create: `components/teach/live/BuilderWorkspaceLive.tsx` (client; wired copy of `components/teach/BuilderWorkspace.tsx`)
- Test: `tests/e2e/uc-23-teach-builder-questions.spec.ts`, `tests/e2e/uc-24-teach-builder-lessons.spec.ts`
- Copy source: `components/teach/BuilderWorkspace.tsx` (+ its wireframe pages)
- Controllers: `getQuestionsFromUnit`, `addQuestionWithAnswers`, `updateQuestionWithAnswers`, `deleteQuestion` (Task 3 signatures); `getLessonsForUnit`, `addLesson`, `updateLesson`, `deleteLesson`, resource CRUD.

**Interfaces:**
- Consumes: Task 3 controllers, `Hero`/`LessonRef` (Task 2).
- Produces: `/teach/[subjectId]/[unitId]` — tabs Preguntas/Lecciones, persisting all new fields. `lessonRef` wiring is Task 8 (this task leaves the QuoteSidebar rendering but does not yet persist the link).

- [ ] **Step 1: Copy `BuilderWorkspace.tsx` → `components/teach/live/BuilderWorkspaceLive.tsx`**

Duplicate the file verbatim. Change the component name to `BuilderWorkspaceLive`. Replace the props/state so it accepts real data instead of the seed arrays:

```typescript
export function BuilderWorkspaceLive({
  subjectId, unitId, initialQuestions, initialLessons, mode,
}: {
  subjectId: number;
  unitId: number;
  initialQuestions: BuilderQuestion[];   // reuse the file's existing question view-model type
  initialLessons: BuilderLesson[];       // reuse the file's existing lesson view-model type
  mode: 'questions' | 'lessons';
}) { /* ...copied body, seed arrays removed... */ }
```

Keep the imports of `LessonPlateEditor`, `LessonPreview`, `QuoteSidebar` pointing at the shared `components/teach/lesson-editor/*` (do NOT duplicate those).

- [ ] **Step 2: Write failing test — questions** `tests/e2e/uc-23-teach-builder-questions.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { signInAsTeacher, seededSubjectId, seededUnitId } from './helpers';

test('teacher authors a question with label, difficulty and explanation', async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto(`/teach/${seededSubjectId}/${seededUnitId}?tab=questions`);
  await page.getByRole('button', { name: /nueva pregunta|añadir pregunta/i }).click();
  await page.getByLabel(/etiqueta|nombre corto/i).fill('Edad plena capacidad');
  await page.getByLabel(/enunciado/i).fill('¿A qué edad se alcanza la plena capacidad?');
  await page.getByRole('button', { name: /difícil/i }).click();
  await page.getByLabel(/explicación/i).fill('Art. 12 CE.');
  // add two answers, mark one correct — selectors per the copied UI
  await page.getByRole('button', { name: /guardar/i }).click();
  await page.reload();
  await expect(page.getByText('Edad plena capacidad')).toBeVisible();
});
```

- [ ] **Step 3: Wire question persistence in `BuilderWorkspaceLive`**

On save, call `addQuestionWithAnswers` / `updateQuestionWithAnswers` (Task 3) with `{ question, label, explanation, difficulty, unitId, lessonId, answers }`. Map the 3-way difficulty toggle to `'facil'|'normal'|'dificil'`. On delete call `deleteQuestion`. After each mutation `router.refresh()`.

- [ ] **Step 4: Write failing test — lessons** `tests/e2e/uc-24-teach-builder-lessons.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { signInAsTeacher, seededSubjectId, seededUnitId } from './helpers';

test('teacher authors a lesson with subtitle, XP and body', async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto(`/teach/${seededSubjectId}/${seededUnitId}?tab=lessons`);
  await page.getByRole('button', { name: /nueva lección|añadir lección/i }).click();
  await page.getByLabel(/título/i).fill('Lección E2E');
  await page.getByLabel(/subtítulo/i).fill('Qué es y cómo se adquiere');
  await page.getByLabel(/xp/i).fill('20');
  // type into the Plate editor body — selector per LessonPlateEditor
  await page.getByRole('button', { name: /guardar/i }).click();
  await page.reload();
  await expect(page.getByText('Lección E2E')).toBeVisible();
});
```

- [ ] **Step 5: Wire lesson persistence in `BuilderWorkspaceLive`**

On save, call `addLesson`/`updateLesson` with `{ unitId, title, subtitle, hero, order, type, contentText, estimatedDurationMinutes, xpReward }`. Wire attachments to the existing resource endpoints (`/api/lessons/[id]/resources` + `/api/storage/presign`), storing `size` and `status`. Default `hero` to `DEFAULT_HERO`.

- [ ] **Step 6: Create `app/(teach)/teach/[subjectId]/[unitId]/page.tsx`**

```typescript
import { getQuestionsFromUnit } from '@/controllers/questions';
import { getLessonsForUnit } from '@/controllers/lessons';
import { BuilderWorkspaceLive } from '@/components/teach/live/BuilderWorkspaceLive';

export default async function BuilderPage({ params, searchParams }: {
  params: { subjectId: string; unitId: string };
  searchParams: { tab?: string };
}) {
  const unitId = Number(params.unitId);
  const [questions, lessons] = await Promise.all([
    getQuestionsFromUnit(unitId),
    getLessonsForUnit(unitId),
  ]);
  return (
    <BuilderWorkspaceLive
      subjectId={Number(params.subjectId)}
      unitId={unitId}
      initialQuestions={questions}
      initialLessons={lessons}
      mode={searchParams.tab === 'lessons' ? 'lessons' : 'questions'}
    />
  );
}
```

> Adapt the DB rows to the builder's view-model types where they differ (e.g. difficulty already stored; map DB `question` row → `BuilderQuestion`). Keep this mapping in the page or a small `toBuilderQuestion`/`toBuilderLesson` helper.

- [ ] **Step 7: Run both builder tests — expect PASS**

Run: `npx playwright test tests/e2e/uc-23-teach-builder-questions.spec.ts tests/e2e/uc-24-teach-builder-lessons.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/(teach)/teach/[subjectId]/[unitId]/page.tsx components/teach/live/BuilderWorkspaceLive.tsx tests/e2e/uc-23-teach-builder-questions.spec.ts tests/e2e/uc-24-teach-builder-lessons.spec.ts
git commit -m "feat(teach): wired content builder — questions + lessons (§3.12)"
git push origin feature/phase-2b
```

---

## Task 8: Quote-anchor (`lessonRef`) persistence

**Files:**
- Modify: `components/teach/live/BuilderWorkspaceLive.tsx`
- Modify: `app/(teach)/teach/[subjectId]/[unitId]/page.tsx` (derive status on load)
- Test: `tests/e2e/uc-25-teach-quote-anchor.spec.ts`
- Lib: `lib/teach/lesson-ref.ts` (Task 2), `lib/lesson-quotes.ts` (existing).

**Interfaces:**
- Consumes: `deriveLessonRefStatus` (Task 2), `updateQuestionWithAnswers`/`addQuestionWithAnswers` (Task 3, already accept `lessonRef`+`lessonId`).
- Produces: a question ↔ lesson-passage link that survives reload, with correct synced/drift/orphan status.

- [ ] **Step 1: Write the failing test** `tests/e2e/uc-25-teach-quote-anchor.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { signInAsTeacher, seededSubjectId, seededUnitId } from './helpers';

test('question keeps its lesson quote-anchor after reload', async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto(`/teach/${seededSubjectId}/${seededUnitId}?tab=lessons`);
  // select a passage in the lesson, push it as a quote to a question (per QuoteSidebar UI)
  // ...open quote sidebar, choose "enviar a pregunta"...
  await page.getByRole('button', { name: /guardar/i }).click();
  await page.reload();
  await page.goto(`/teach/${seededSubjectId}/${seededUnitId}?tab=questions`);
  await expect(page.getByText(/cita|sincronizad/i)).toBeVisible(); // status chip present
});
```

> Fill in the exact selectors from the copied QuoteSidebar/BuilderWorkspace UI while implementing; the assertion is: after reload, the question shows its linked quote with a status chip.

- [ ] **Step 2: Run it — expect FAIL**

Run: `npx playwright test tests/e2e/uc-25-teach-quote-anchor.spec.ts`
Expected: FAIL (lessonRef not persisted).

- [ ] **Step 3: Persist `lessonRef` on save**

In `BuilderWorkspaceLive`, when a question has a `lessonRef` (from the QuoteSidebar "push to question" flow), include `lessonRef` and `lessonId` in the `add/updateQuestionWithAnswers` payload. The anchor markers are already saved inside `lessons.contentText` via the editor's `wrapAnchorAt`, so saving the lesson persists the anchor; saving the question persists the ref object.

- [ ] **Step 4: Derive status on load**

In the builder page (or the `toBuilderQuestion` mapper), for each question with a `lessonRef`, compute `deriveLessonRefStatus(ref, lessonMarkdownForThatLesson)` and pass it into the view-model so the sidebar shows synced/drift/orphan. Use the lesson's `contentText` keyed by `question.lessonId`.

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx playwright test tests/e2e/uc-25-teach-quote-anchor.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/teach/live/BuilderWorkspaceLive.tsx app/(teach)/teach/[subjectId]/[unitId]/page.tsx lib/teach/lesson-ref.ts tests/e2e/uc-25-teach-quote-anchor.spec.ts
git commit -m "feat(teach): persist question↔lesson quote-anchor (lessonRef) with status derivation"
git push origin feature/phase-2b
```

---

## Task 9: Retire old screens + full-suite green

**Files:**
- Delete: `app/(main)/build/` (whole subtree)
- Delete: old `app/(main)/teach/[id]/` DataTable screens (`data-table.tsx`, `columns.tsx`, and the page if fully replaced) — keep whatever `(main)` still legitimately needs; the canonical teacher UI is now `(teach)`.
- Modify: `middleware.ts` — drop the `/build` matcher; keep `/teach`.
- Modify: any nav/links pointing at `/build/*` or old teach routes.
- Test: existing `tests/e2e/uc-04-teacher-backoffice.spec.ts` — update its paths to the new `(teach)` routes (or supersede it with uc-21..25).

**Interfaces:**
- Produces: a single canonical teacher backoffice under `/teach`; no dead `/build` routes.

- [ ] **Step 1: Find all references to the old routes**

Run: `grep -rn "/build/\|(main)/teach\|/teach/\[id\]" app components middleware.ts`
List every hit; each must be repointed to `/teach/[subjectId]` / `/teach/[subjectId]/[unitId]` or removed.

- [ ] **Step 2: Update `uc-04` spec (or supersede)**

Point `tests/e2e/uc-04-teacher-backoffice.spec.ts` at the new routes, or delete it in favor of uc-21..25 if fully covered. Do not leave it asserting retired routes.

- [ ] **Step 3: Delete retired files + fix middleware/links**

Delete the `(main)/build` subtree and old DataTable teach screens; remove the `/build` middleware matcher; repoint links found in Step 1.

- [ ] **Step 4: Full validation**

Run: `npm run typecheck && npm run build && npm run test:ralph`
Expected: all PASS, full E2E suite green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(teach): retire (main)/build + old teach DataTable screens; repoint links"
git push origin feature/phase-2b
```

---

## Self-Review

**Spec coverage:**
- §3.10 Subjects → Task 5. ✅
- §3.11 Syllabus/units+lessons → Task 6. ✅
- §3.12 Builder questions+lessons → Task 7. ✅
- Schema changes (difficulty/label/lessonId/lessonRef/subtitle/hero/size/status) → Task 1. ✅
- `explanation` controller fix + `hard` sync → Task 3. ✅
- lessonRef persistence + status → Tasks 2, 8. ✅
- Role gate → Task 4. ✅
- Duplicate-not-move wireframes; retire old `(main)` → Tasks 5–7 (copy), Task 9 (retire). ✅
- Testing per area → uc-21..26. ✅
- Media library (§3.13), dashboard, roster, analytics → **out of scope (Phase 2+)**, correctly absent.

**Placeholder scan:** Remaining "confirm X" notes are deliberate verification prompts against real files (helper names, `getUser` shape, controller signatures), not deferred work — each has a concrete fallback action. No TBD/TODO in delivered code.

**Type consistency:** `Difficulty` = `'facil'|'normal'|'dificil'` used identically in Task 1 (schema comment), Task 3 (controllers), Task 7 (UI mapping). `LessonRef`/`Hero` defined once (Task 2), consumed in Tasks 3, 7, 8. `addQuestionWithAnswers`/`updateQuestionWithAnswers` signatures defined in Task 3 and called with the same field names in Tasks 7–8.

## Assumptions to verify during execution (fail-fast, cheap)
- Exact Playwright auth-helper name + seeded teacher/student/subject/unit ids (from `tests/e2e/` + `.env.test`).
- `getUser` return shape and role field/values (`lib/getUser.ts`, `lib/auth.ts`).
- `getUnits`/`getSubject`/`getLessonsForUnit`/`getQuestionsFromUnit` exact arg + return shapes.
- The view-model types inside `BuilderWorkspace.tsx` (`BuilderQuestion`/`BuilderLesson` — real names may differ) for the RSC→client mapping.
- `lib/lesson-quotes.ts` helper signatures used by `deriveLessonRefStatus`.
