# Roadmap

Tracks deferred items not yet attached to a numbered phase plan.
For phase work, see `.claude/PRPs/plans/`.

---

## Phase 2B — Rebrand & UX Rework 🎨 (active)

**Branch:** `phase-2b-rebranding` (from `develop`)
**Wireframes:** [`docs/ui/wireframes.md`](./ui/wireframes.md) — lo-fi ASCII, editable
**Design system:** [`docs/ui/design-system.md`](./ui/design-system.md) — architecture + layers
**Token spec (authoritative):** [`docs/superpowers/specs/2026-05-07-tufolio-design-system-tokens-design.md`](./superpowers/specs/2026-05-07-tufolio-design-system-tokens-design.md) — locked palette, typography, micro-tokens
**Live mocks:** `app/wireframes/*` — shadcn-based mock route namespace with WIREFRAME banner (9 routes including `/wireframes/news`)
**Brand rename:** "Jean Monnet" (old, EU-history product) → **"TuFolio"** (new, oposiciones product)
**Archived (do not copy styling from):** `archive/Evolucion-pre-tokens/*.html` — pre-token TuFolio mockups, useful only for flow ideas

### Next step

Fase A is closed. To unlock Fase B PR sequence:
1. **Complete impeccable setup** — author `PRODUCT.md` (run `/impeccable teach`) and `DESIGN.md` (run `/impeccable document`) so `/impeccable {distill,clarify,polish,critique}` commands stop falling back to the memory-based shortcut.
2. Then start **PR #1 — Global shell** (sidebar refactor + remove `SubjectNavigation`); tokens are already shipped.

### Why this phase

The current sidebar lists subjects as nav items, which mixes content with structure
and breaks IA conventions (doesn't scale past ~10 enrolments). `(main)/layout.tsx`
doesn't even mount the sidebar — it appears only inside `study/[id]`, so the shell
changes per route. There is no global Home/dashboard, no global search, and
gamification (XP/streak/level) is hidden in a side strip. Phase 2B fixes the
information architecture before we layer Phase 3 monetisation UI on top.

### Decisions cerradas

| # | Decisión | Valor |
|---|----------|-------|
| 1 | Ruta para "Inicio" | `/home` (nueva) |
| 2 | Modelo teacher | Toggle de rol en avatar |
| 3 | Bottom-nav móvil | 4 items |
| 4 | Asignaturas | Contenido en `/study`, NO en sidebar |
| 5 | Sidebar fijo | 5 items: Inicio · Mis cursos · Ranking · Noticias · Ajustes |
| 6 | Quiz / Lesson reader | Focus mode (sin sidebar) |

### Tooling

Two MCPs unblock fidelity for the live mocks:

- **`shadcn-ui` MCP** — `npx @jpisnice/shadcn-ui-mcp-server`. Schemas + registry examples.
- **`chrome-devtools` MCP** (or Playwright MCP) — screenshots of `/wireframes/*`
  routes for in-chat review.

Optional: Excalidraw MCP (free-hand sketch) and Figma Dev Mode MCP (only if a
designer joins).

### Pre-PR groundwork (Fase A — 2026-05-07 → 2026-05-10) ✅ closed

- ✅ **Audit producción vs spec** — every `app/(main)/*` and `app/(auth)/*` route mapped against wireframes 3.1–3.8. Verdicts captured in audit report; see "Game-layer components to build" below for what's missing.
- ✅ **Evolucion archivado** — moved to `archive/Evolucion-pre-tokens/` with README explaining the pre-token verdict. Stops future redesign loops from copying Merriweather/Manrope/orange-teal styling.
- ✅ **Design token spec locked** — slate chrome + teal game accents · Geist + Source Serif 4 · 5 micro-token scales (shadow, button heights, focus-ring, motion, reading widths). See spec doc.
- ✅ **Tokens applied to `globals.css` + `tailwind.config.ts`** — `--primary` swapped to slate-900, shadow scale + motion durations added, `font-reader` wired via `next/font`. Button `lg` bumped to `h-12`. Game `<Button variant="learning">` wrapper exposes teal opt-in.
- ✅ **Brand rename completed end-to-end** — "Jean Monnet" → "TuFolio" across `(main)/layout.tsx`, 4 legal pages, `README.md`, email domains (`jeanmonnet.es` → `tufolio.es`). Pending only the historical references inside `.claude/PRPs/*` and the `jean-monnet-agent` skill (intentionally left as internal aliases).
- ✅ **Auth Spanish localization** — sign-in/sign-up form copy + button labels + toasts localized; `controllers/auth.ts` error strings localized; 14 E2E specs updated to match new Spanish selectors (`'Inicia sesión'`, `'Crear cuenta'`, `'Nombre'`, `'Apellidos'`, `'Contraseña'`, etc.).
- ✅ **Auth split layout shipped** — `app/(auth)/layout.tsx` renders the wireframe-3.8 split with `GradientHero variant="brand" decorative={false}`, distilled hero (no Sparkles / CheckCircle2 list / blur orbs per `/impeccable critique` findings), Source Serif 4 display headline.
- ✅ **Game-layer reskinned to brand tokens** — `StatTile`, `ContinueCTA`, `AchievementCard`, `StreakBadge`, `RankRow` swapped from raw Tailwind colors (amber/orange/cyan/teal/emerald) to `--brand-{primary,warm,cool,xp,success}` tokens. Gradient count in `components/game/` reduced to 1 (XPBar fill). Light + dark mode now coherent.
- ✅ **9 wireframes redesigned with locked tokens** — `/wireframes/{home,courses,courses/[id],lesson,quiz,leaderboard,sign-in,news,index}`. Two parallel-agent passes (7 + 3 agents). Includes new `/wireframes/news` route (`docs/ui/wireframes.md#3-9-news`). Em-dashes purged (impeccable hard ban). Cursor + caption recorder available via `scripts/wireframe-tour.mjs` → produces `tour-video/wireframe-tour.{webm,mp4}`.

### Execution plan (PRs, in order)

| # | PR | Entrega | E2E afectados | Estado |
|---|----|---------|---------------|--------|
| 1 | **Global shell** | Sidebar fijo de 5 items (Inicio · Mis cursos · Ranking · Noticias · Ajustes), header con search global, user card con XP/streak. **Quitar `SubjectNavigation` del sidebar actual.** `(main)/layout.tsx` monta el shell para todas las rutas autenticadas. Tokens ya aplicados — solo queda el refactor estructural. | `uc-03`, `uc-12` selectors | tokens ✅ · shell ⏳ |
| 2 | **`/home` (Inicio)** | Ruta nueva. Stat cards (racha/XP/objetivo), card "Continuar donde lo dejaste", ranking compacto, logros recientes. Login redirige aquí. | `uc-02` (post-login redirect) | ⏳ |
| 3 | **`/study` (Mis cursos)** | Grid de cursos con tabs filtro (Todos / En progreso / Completados / Pausados) + sheet "Explorar catálogo". | `uc-03` | ⏳ |
| 4 | **`/study/[id]` (Course detail)** | Header gradient + 4 stat cards + tabs sticky (Temario / Exámenes / Ranking del curso). Acordeón de unidades con estados (✓ / ▶ / 🔒). | `uc-12` | ⏳ |
| 5 | **Lesson reader (focus mode)** | Header gradient amber, layout 3-col (contenido / TOC sticky + recursos). Sale del shell global. Componente `<MdxLesson>` para contenido enriquecido. | `uc-11` | ⏳ |
| 6 | **Quiz (focus mode)** | Sin sidebar. Header con timer pulsante. Sidebar lateral con question map. AlertDialog al salir/pausar. | `uc-06` | ⏳ |
| 7 | **Auth split layout** | Sign-in/up con hero distillado (sin value-props list) + Source Serif 4 headline. | `uc-01`, `uc-02` | ✅ shipped (2026-05-10) |
| 8 | **`/leaderboard`** | Podio top 3 + tabla con tendencias (↑ / ↓ / ─) + filtros (Global ▾ / Periodo ▾). | `uc-08` | ⏳ |
| 9 | **`/profile` + `/settings`** | Separar perfil público de ajustes privados. Toggle de rol teacher en avatar dropdown. | nuevo | ⏳ |

### Game-layer components to build

Per `docs/ui/design-system.md` the game layer should include these — currently NOT implemented in `components/game/` (only XPBar, StreakBadge, StatTile, AchievementCard, GradientHero, ContinueCTA, RankRow, Button exist; all reskinned to brand tokens 2026-05-10):

| Componente | Bloquea PR | Notas |
|---|---|---|
| `<UnitCard>` | #4 | Estado locked / active / done. Reemplaza `unit.tsx` actual. |
| `<CourseCard>` | #3 | Tarjeta de curso con progreso, ranking, CTA. Reemplaza `SubjectSelectionCard.tsx`. |
| `<LevelBadge>` | #1 | Círculo con número + ring de progreso. Va en user card del sidebar. |
| `<QuizOption>` | #6 | Radio styled como card grande con prefix de letra. |
| `<QuestionMap>` | #6 | Grid 5×N con estados (✓ ✗ ◉ ·). |
| `<MdxLesson>` | #5 | Wrapper que renderiza MDX con `<Section>`, `<Objectives>`, `<KeyConcept>`, `<Example>`, `<Video>`, `<Resource>`. Es el corazón del producto. |
| `<PodiumCard>` | #8 | Top 3 leaderboard con jerarquía visual. |

### Política durante la fase

- **Sin tocar lógica de negocio** — controllers, schemas, API routes, queries Drizzle, webhook LS quedan intactos.
- **Tests E2E existentes deben quedar verdes** — si rompe un selector por copy/markup, se actualiza el spec, no la lógica.
- **Cada PR mergeable independiente** — se puede pausar entre PRs sin dejar la app rota.
- **Mobile-first verificado en cada PR** — DevTools 375px width antes de mergear.
- **`/teach` y `/build` quedan en shadcn puro** — son herramientas de profesor; el design system los excluye intencionalmente del game layer ("el profesor trabaja, el alumno aprende").

---

## Feature parity backlog (Fase D — DB schema work)

Inspirations from Coursera, Udemy, and Duolingo to consider once UI polish converges. Each entry will need new schema/columns; **do not design these tables yet** — let the UI redesign reveal the actual fields needed.

### From Coursera
- **Lesson notes** — in-lesson note-taking that persists per user × lesson. New table `lesson_notes (user_id, lesson_id, content, updated_at)`.
- **Resume position** — exact scroll/section position within a lesson, so "Continue where you left off" goes to the precise paragraph. New columns on `unit_progress` or new table `lesson_position`.
- **Estimated time per unit/lesson** — surface in `<CourseCard>` and `<UnitCard>`. New column `estimated_minutes` on `lessons` and `units`.
- **Structured paths / specializations** — group multiple subjects into a guided sequence (e.g., "Oposición Justicia 2026"). New table `learning_paths` + `path_subjects` join.

### From Udemy
- **Bookmarks** — per-user bookmarks within lessons or specific paragraphs. New table `bookmarks`.
- **Q&A per lesson** — student questions + teacher answers. New tables `lesson_questions`, `lesson_answers`.

### From Duolingo
- **Daily goal** — configurable XP target per day with progress ring on `/home`. New columns on `users` (`daily_goal_xp`) + new table `daily_progress` (or aggregate from existing XP events).
- **Streak freeze** — single-use item that protects a streak from breaking. New columns on `users` (`streak_freezes_available`, `streak_freeze_used_on`).
- **Mastery / crown levels per unit** — progress beyond first-pass completion (e.g., 3 levels of review). New column `mastery_level` on `unit_progress`.
- **Path/tree progression visualization** — visual unlock tree on `/study/[id]`. Mostly a UI piece — leverages existing `unit_progress` + prerequisite metadata.
- **Daily reminder cadence** — push/email at user's configured study time. New table `notification_preferences`.

### How this backlog gets worked

1. During Fase B (PRs #1–#9) when a wireframe needs data we don't have, link the wireframe to the relevant backlog item here rather than blocking on schema work.
2. After UI polish (Fase C) converges, do ONE schema-design pass that addresses all backlog items at once — gives a coherent migration instead of N small ones.
3. Open Phase 2C: "Feature parity schema + APIs" as a separate phase.

---

## Next cycle

### Quiz auto-creation on enrollment / quiz pass

**Status:** Bug. Product is unusable for credentialed students — no path
in code to create quiz rows for them, so the UI shows only locked
placeholder buttons (`id=2222`, `aria-disabled="true"`).

**Investigation summary** (history audit performed 2026-04-28 across
`origin/main`, `origin/rework`, `origin/claude/link-desktop-mobile-ZmvvQ`,
`origin/claude/phase-02-setup-QGkgP`):

- `controllers/quizzes.ts` has always exported only
  `getActiveQuizzes`, `getQuiz`, `submitQuiz`, `updateScore`.
  The `addQuiz` helper has been commented since the first commit
  that touched the file. **No branch has ever had a JS-side quiz
  insert outside the seed.**
- `controllers/subjects.ts:enrollSubjects` only inserts into
  `user_subjects`; never created a quiz.
- `controllers/quizzes.ts:submitQuiz` on `score >= 70` calls
  `unlockNextUnit`, which only upserts `unit_progress` — does not
  create the next quiz row.
- `scripts/setup-db.sql` declares only the `view_counter_achievements`
  view and the `get_number_of_quizzes(unit_id)` SQL function.
  `\dft` against the live DB returns 0 triggers.
- `app/api/quizzes/route.txt` (note the `.txt` extension) is a
  zero-byte stub that has never been wired as a route handler.
- Searched the full git history for `createQuizForUser`,
  `provisionQuiz`, `seedUserQuizzes`, `generateQuizzes`,
  `INSERT INTO quizzes`, `insert(quizzes)`, `TRIGGER` — zero hits
  outside `scripts/seed.ts`.

**Hypothesis:** the working production deployment
(`jean-monnet-sg.vercel.app`, original Supabase project tied to
`origin/main`) likely has a **SQL trigger or stored procedure
authored directly in the Supabase dashboard** that was never exported
to the repo. When the codebase moved off Supabase to local Postgres
+ Drizzle, that trigger was lost. Confirm by querying the Supabase
project's `pg_trigger` and `pg_proc` for anything referencing the
`user_subjects` or `quizzes` tables.

**Implementation plan when picked up:**

1. **Recover the original trigger** from the Supabase project (DB
   dashboard → SQL editor → `\df+`, `\dft+`). Keep a copy in
   `scripts/setup-db.sql` for reproducibility.
2. **Port to TypeScript** — keep the logic in the application layer
   so it works against any Postgres (Neon prod doesn't share the
   Supabase trigger):
   - `controllers/subjects.ts:enrollSubjects` — after inserting the
     `user_subjects` row, generate one `quizzes` row per active unit
     of each enrolled subject. Pre-create `quiz_details` rows linking
     `units.questions_per_quiz` random questions per quiz.
   - `controllers/quizzes.ts:submitQuiz` — when the user passes
     (`score >= 70`) and `unlockNextUnit` opens unit N+1, generate
     the first quiz of unit N+1 in the same transaction so the next
     `LessonButton` is immediately clickable.
3. **Write Playwright coverage** before the implementation lands
   (per project testing policy):
   - Fresh student enrolls → at least one clickable quiz button
     appears on `/study/<subjectId>`.
   - Student passes a quiz on unit 1 → unit 2's first quiz button
     becomes clickable without a manual SQL insert.
4. **Backfill the existing seeded users** (`student1`, `student2`)
   in `scripts/seed.ts` so dev data matches prod behaviour and the
   `journey-quiz-e2e.spec.ts` setup no longer needs the SQL stub
   it currently uses.

**Why deferred:** scoped out of the current PR (auth fix +
journey-test expansion). Fits naturally before Phase 4 BullMQ work
since quiz provisioning may move to a job in that phase.
