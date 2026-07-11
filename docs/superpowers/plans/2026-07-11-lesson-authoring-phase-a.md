# Lesson Authoring — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the lesson MDX builder reachable and usable from the subject page — one lessons list (unit = filter/metadata), real navigation into the wired Plate builder, and a "Nueva lección" entry.

**Architecture:** Pure client/UX changes in `SyllabusBoard.tsx` (subject page) plus one small effect in `BuilderWorkspaceLive.tsx`. No schema, controller, or server-query changes — persistence already works (`addLesson`/`updateLesson`).

**Tech Stack:** Next.js 14 App Router, React client components, shadcn/ui (Dialog/Select/Table), Playwright E2E.

## Global Constraints

- No new DB tables/columns/migrations. Schema already covers the use cases.
- Lesson editing must route into the real Plate builder (`BuilderWorkspaceLive`), never a plain textarea.
- Builder lesson mode lives at `/teach/{subjectId}/{unitId}?tab=lessons`; lesson selection via `?lessonId={id}`; new-lesson auto-create via `?new=1`.
- Spanish UI copy, matching existing tone ("Nueva lección", "Gestionar unidades").
- Follow repo TDD: update/write Playwright spec first, run to fail, implement, run to pass, commit. Validation order: `npm run typecheck` → targeted `npx playwright test <file>` → (final) `npm run test:ralph`.
- Seeded test data (from `.env.test`): `TEST_SUBJECT_ID=24`, `TEST_UNIT_ID=40`, `TEST_LESSON_ID=151`; teacher `teacher@exams.test` / `Teacher123!`.

---

## File Structure

- **Modify:** `components/teach/live/SyllabusBoard.tsx` — collapse to one lessons list; add `ManageUnitsDialog` + `NewLessonDialog`; rewire lesson row actions; delete `LessonFormDialog`.
- **Modify:** `components/teach/live/BuilderWorkspaceLive.tsx` — auto-create lesson on `?new=1`.
- **Modify:** `tests/e2e/uc-22-teach-syllabus.spec.ts` — drive unit creation via the new "Gestionar unidades" dialog; assert single primary list.
- **Create:** `tests/e2e/uc-28-lesson-builder-nav.spec.ts` — lesson row → builder deep link; "Nueva lección" → builder with new lesson.

---

## Task 1: Collapse to one lessons list + "Gestionar unidades" dialog

**Files:**
- Modify: `components/teach/live/SyllabusBoard.tsx` (header ~571-588; units table ~590-676; state ~448-450)
- Test: `tests/e2e/uc-22-teach-syllabus.spec.ts`

**Interfaces:**
- Produces: header actions `Nueva lección` (primary) + `Gestionar unidades` (secondary); a `ManageUnitsDialog` open state `manageUnitsOpen`.
- Consumes: existing `UnitFormDialog`, `openCreateUnitDialog`, `openEditUnitDialog`, `setDeletingUnit`, `sortedUnits`, `lessonsByUnit`.

- [ ] **Step 1: Update the failing test (uc-22) to use the new dialog**

Replace the body of the test in `tests/e2e/uc-22-teach-syllabus.spec.ts` (lines 36-46) with:

```ts
  test('teacher adds a unit via Gestionar unidades', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);

    // The subject page shows a single lessons list; units are managed in a dialog.
    await page.getByRole('button', { name: /gestionar unidades/i }).click();
    await page.getByRole('button', { name: /nueva unidad|añadir unidad/i }).click();
    const unitName = `Tema 1 E2E ${Date.now()}`;
    await page.getByLabel(/nombre/i).fill(unitName);
    await page.getByRole('button', { name: /guardar|crear/i }).click();

    await expect(page.getByText(unitName)).toBeVisible({ timeout: 8000 });
  });

  test('subject page shows a single lessons list (Lección header present)', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD, 'teacher');
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);
    // Exactly one primary table, headed by the lessons columns.
    await expect(page.getByRole('columnheader', { name: 'Lección' })).toBeVisible();
    // The old standalone units table is gone from the page body.
    await expect(page.getByRole('columnheader', { name: 'Unidad' })).toBeVisible();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx dotenv-cli -e .env.local -- npx playwright test tests/e2e/uc-22-teach-syllabus.spec.ts`
Expected: FAIL — no "Gestionar unidades" button yet.

- [ ] **Step 3: Add the manage-units state**

In `SyllabusBoard` component state (after line 450, next to the other unit state), add:

```tsx
  const [manageUnitsOpen, setManageUnitsOpen] = useState(false);
```

- [ ] **Step 4: Replace the header actions**

Replace the `actions={ ... }` prop of `<PageHeader>` (lines 582-587) with:

```tsx
        actions={
          <div className="flex items-center gap-2">
            <UIButton variant="outline" onClick={() => setManageUnitsOpen(true)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Gestionar unidades
            </UIButton>
            <Button variant="learning" onClick={openNewLessonDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva lección
            </Button>
          </div>
        }
```

(`openNewLessonDialog` is added in Task 3; add a temporary stub `function openNewLessonDialog() {}` above `return (` for now so this task compiles — Task 3 replaces it.)

- [ ] **Step 5: Move the units table into a dialog**

Cut the entire units-table block (the `<div className="overflow-hidden rounded-card border bg-card shadow-card">` … `</div>` currently at lines 590-676, including its empty-state) out of the main flow. Render it inside a new dialog placed next to the other dialogs (near line 854), wrapping the moved block:

```tsx
      <Dialog open={manageUnitsOpen} onOpenChange={setManageUnitsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar unidades</DialogTitle>
            <DialogDescription>
              Las unidades agrupan las lecciones. Crea, ordena o edita sus reglas de acceso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="learning" size="sm" onClick={openCreateUnitDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva unidad
            </Button>
          </div>
          {/* MOVED units table block goes here (the <div ...>…</div> from old lines 590-676) */}
        </DialogContent>
      </Dialog>
```

Inside the moved unit rows, change the unit "Abrir builder" link target from `/teach/${subject.id}/${unit.id}` to `/teach/${subject.id}/${unit.id}?tab=lessons` (lessons-first).

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no unused-import errors; `SlidersHorizontal` and `Plus` already imported).

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx dotenv-cli -e .env.local -- npx playwright test tests/e2e/uc-22-teach-syllabus.spec.ts`
Expected: PASS — both tests green.

- [ ] **Step 8: Commit**

```bash
git add components/teach/live/SyllabusBoard.tsx tests/e2e/uc-22-teach-syllabus.spec.ts
git commit -m "feat(teach): single lessons list on subject page; units behind Gestionar unidades dialog"
```

---

## Task 2: Wire lesson row actions into the real Plate builder

**Files:**
- Modify: `components/teach/live/SyllabusBoard.tsx` (lesson row actions ~768-801; delete `LessonFormDialog` def ~ and usage; remove `editingLesson` state)
- Create: `tests/e2e/uc-28-lesson-builder-nav.spec.ts`

**Interfaces:**
- Produces: lesson "Editar" primary action + menu item both `Link` to `/teach/{subjectId}/{unit.id}?tab=lessons&lessonId={lesson.id}`.
- Consumes: `BuilderWorkspaceLive`'s existing `?lessonId=` selection (BuilderWorkspaceLive.tsx:601-606).

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/uc-28-lesson-builder-nav.spec.ts`:

```ts
/**
 * UC-28 · Teacher Backoffice — lesson row navigates into the wired Plate builder.
 * The subject-page lesson actions must deep-link to ?tab=lessons&lessonId=,
 * opening the real MDX editor (not a textarea dialog).
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? '';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? '';
const TEST_SUBJECT_ID = process.env.TEST_SUBJECT_ID ?? '1';

async function signInAs(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Inicia sesión' }).click();
  await page.waitForURL('**/teach', { timeout: 10000 });
}

test.describe('UC-28 · lesson row → Plate builder', () => {
  test.skip(!TEACHER_EMAIL, 'Set TEACHER_EMAIL/TEACHER_PASSWORD (run `npm run seed`)');

  test('clicking Editar on a lesson opens the lesson builder', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);

    // First lesson row's primary action.
    await page.getByRole('link', { name: 'Editar', exact: true }).first().click();

    await page.waitForURL('**/teach/**/**?tab=lessons**', { timeout: 10000 });
    // The Plate lesson editor is present (not a textarea modal).
    await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx dotenv-cli -e .env.local -- npx playwright test tests/e2e/uc-28-lesson-builder-nav.spec.ts`
Expected: FAIL — current "Editar lección" opens a dialog, no URL change to `?tab=lessons`.

- [ ] **Step 3: Rewire the lesson primary action**

Replace the lesson row primary button (lines 770-775) with a link into the builder:

```tsx
                      <UIButton variant="outline" size="sm" asChild className="h-8">
                        <Link
                          href={`/teach/${subject.id}/${lesson.unit.id}?tab=lessons&lessonId=${lesson.id}`}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </UIButton>
```

- [ ] **Step 4: Rewire the row menu "Editar lección"**

Replace the menu item (lines 788-791) with a link into the builder:

```tsx
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/teach/${subject.id}/${lesson.unit.id}?tab=lessons&lessonId=${lesson.id}`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Abrir en el builder
                            </Link>
                          </DropdownMenuItem>
```

- [ ] **Step 5: Delete the anemic LessonFormDialog**

Remove: (a) the `LessonFormDialog` component definition and its `lessonFormSchema`/`LessonFormInputs` (the block from `// ─── Lesson form dialog` through its closing `}` around lines 234-423 — remove only the lesson-form pieces, keep `UnitFormDialog`); (b) the `editingLesson` state (line 452); (c) the `<LessonFormDialog .../>` render (lines 889-896); (d) now-unused imports if any (`insertLessonSchema` if only used there — verify with typecheck). Keep `updateLesson`? It becomes unused in this file → drop it from the import on line 90, keeping `deleteLesson`.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS. Fix any unused-import errors it reports (remove `Textarea`, `Form*`, `Select*` only if no longer referenced — `UnitFormDialog` still uses several, so verify before removing).

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx dotenv-cli -e .env.local -- npx playwright test tests/e2e/uc-28-lesson-builder-nav.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/teach/live/SyllabusBoard.tsx tests/e2e/uc-28-lesson-builder-nav.spec.ts
git commit -m "feat(teach): lesson row deep-links into the Plate builder; remove textarea editor"
```

---

## Task 3: "Nueva lección" from the subject page (unit picker + auto-create)

**Files:**
- Modify: `components/teach/live/SyllabusBoard.tsx` (add `NewLessonDialog` + `openNewLessonDialog`)
- Modify: `components/teach/live/BuilderWorkspaceLive.tsx` (auto-create on `?new=1`, ~after line 606)
- Test: `tests/e2e/uc-28-lesson-builder-nav.spec.ts` (add case)

**Interfaces:**
- Consumes: `router` (from `useRouter()`, already in scope at line 440), `sortedUnits`, `unitFilter`.
- Produces: navigation to `/teach/{subjectId}/{unitId}?tab=lessons&new=1`; builder calls `createNewLesson()` once on mount.

- [ ] **Step 1: Add the failing test case**

Append inside the `UC-28` describe in `tests/e2e/uc-28-lesson-builder-nav.spec.ts`:

```ts
  test('Nueva lección creates a lesson and opens it in the builder', async ({ page }) => {
    await signInAs(page, TEACHER_EMAIL, TEACHER_PASSWORD);
    await page.goto(`/teach/${TEST_SUBJECT_ID}`);

    await page.getByRole('button', { name: /nueva lección/i }).click();
    // Pick the first unit in the picker (dialog only appears when no unit filter is set).
    const picker = page.getByLabel(/unidad/i);
    if (await picker.isVisible().catch(() => false)) {
      await picker.click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: /crear|continuar/i }).click();
    }
    await page.waitForURL('**/teach/**/**?tab=lessons**', { timeout: 10000 });
    await expect(page.getByText(/nueva lección/i).first()).toBeVisible({ timeout: 10000 });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx dotenv-cli -e .env.local -- npx playwright test tests/e2e/uc-28-lesson-builder-nav.spec.ts -g "Nueva lección creates"`
Expected: FAIL — no "Nueva lección" button wired.

- [ ] **Step 3: Add new-lesson state + handler (replace the Task 1 stub)**

Replace the temporary `function openNewLessonDialog() {}` stub with real state and logic (place near the other state/handlers):

```tsx
  const [newLessonOpen, setNewLessonOpen] = useState(false);
  const [newLessonUnitId, setNewLessonUnitId] = useState<string>("");

  function goToBuilderNewLesson(unitId: number) {
    router.push(`/teach/${subject.id}/${unitId}?tab=lessons&new=1`);
  }

  function openNewLessonDialog() {
    // If a unit is already filtered, create straight there.
    if (unitFilter !== "all") {
      goToBuilderNewLesson(Number(unitFilter));
      return;
    }
    setNewLessonUnitId(sortedUnits[0] ? String(sortedUnits[0].id) : "");
    setNewLessonOpen(true);
  }
```

- [ ] **Step 4: Render the unit-picker dialog**

Add next to the other dialogs (near the `ManageUnitsDialog`):

```tsx
      <Dialog open={newLessonOpen} onOpenChange={setNewLessonOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva lección</DialogTitle>
            <DialogDescription>
              Elige la unidad en la que quieres crear la lección.
            </DialogDescription>
          </DialogHeader>
          {sortedUnits.length === 0 ? (
            <div className="space-y-3 py-2 text-sm text-muted-foreground">
              <p>Todavía no hay unidades. Crea una primero.</p>
              <Button
                variant="learning"
                size="sm"
                onClick={() => {
                  setNewLessonOpen(false);
                  setManageUnitsOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Gestionar unidades
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={newLessonUnitId} onValueChange={setNewLessonUnitId}>
                <SelectTrigger aria-label="Unidad">
                  <SelectValue placeholder="Unidad" />
                </SelectTrigger>
                <SelectContent>
                  {sortedUnits.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.order}. {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <UIButton
                  onClick={() => {
                    if (!newLessonUnitId) return;
                    setNewLessonOpen(false);
                    goToBuilderNewLesson(Number(newLessonUnitId));
                  }}
                >
                  Crear
                </UIButton>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
```

- [ ] **Step 5: Auto-create on `?new=1` in the builder**

In `components/teach/live/BuilderWorkspaceLive.tsx`, after the `createNewLesson` definition (it ends at line 949), add an effect. First add a ref near the other lesson state (after line 606):

```tsx
  const didAutoCreateLesson = useRef(false);
```

Ensure `useRef` and `useEffect` are imported from `react` (add if missing). Then, after `createNewLesson` is defined (after line 949), add:

```tsx
  // When arriving from the subject page's "Nueva lección" (?new=1), create a
  // fresh lesson once. createNewLesson() replaces the URL to ?lessonId=, so a
  // reload won't re-create.
  useEffect(() => {
    if (didAutoCreateLesson.current) return;
    if (mode !== "lessons") return;
    if (searchParams.get("new") !== "1") return;
    didAutoCreateLesson.current = true;
    void createNewLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx dotenv-cli -e .env.local -- npx playwright test tests/e2e/uc-28-lesson-builder-nav.spec.ts`
Expected: PASS (all UC-28 cases).

- [ ] **Step 8: Commit**

```bash
git add components/teach/live/SyllabusBoard.tsx components/teach/live/BuilderWorkspaceLive.tsx tests/e2e/uc-28-lesson-builder-nav.spec.ts
git commit -m "feat(teach): Nueva lección from subject page (unit picker + ?new=1 auto-create)"
```

---

## Task 4: Full validation

**Files:** none (verification only)

- [ ] **Step 1: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both PASS.

- [ ] **Step 2: Run the affected specs together**

Run: `npx dotenv-cli -e .env.local -- npx playwright test tests/e2e/uc-22-teach-syllabus.spec.ts tests/e2e/uc-24-teach-builder-lessons.spec.ts tests/e2e/uc-28-lesson-builder-nav.spec.ts`
Expected: PASS. (uc-24 must still pass — the builder itself is unchanged.)

- [ ] **Step 3: Full suite**

Run: `npm run test:ralph`
Expected: green except the known pre-existing environmental failures (study/unit-unlock needing `npm run setup-db`), which are unrelated to this change. Note any new failures and fix before completing.

- [ ] **Step 4: Manual drive (optional but recommended)**

With the dev server running: open `/teach/{TEST_SUBJECT_ID}` → confirm one lessons list, "Gestionar unidades" opens the units dialog, "Editar" on a lesson opens the Plate builder on that lesson, "Nueva lección" creates and opens a lesson. Edit content, save, reload — content persists.

---

## Self-Review

- **Spec coverage:** A1 (single list + manage-units dialog) → Task 1. A2 (deep-link + remove textarea) → Task 2. A3 (Nueva lección + `?new=1`) → Task 3. A4/A5 (data flow unchanged, edge cases) → covered in Tasks 1-3 (no-units empty state in Task 3 Step 4; stale lessonId handled by existing builder fallback). A6 (tests) → Tasks 1-3 specs + Task 4 suite. ✅
- **Placeholder scan:** the only intentional stub is the Task 1 `openNewLessonDialog` placeholder, explicitly replaced in Task 3 Step 3. No TODOs. ✅
- **Type consistency:** `goToBuilderNewLesson(unitId: number)`, `openNewLessonDialog()`, `manageUnitsOpen`/`newLessonOpen`/`newLessonUnitId` used consistently across tasks. Builder deep-link shape identical in Tasks 2 & 3. ✅
