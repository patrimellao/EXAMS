# Roadmap

Tracks deferred items not yet attached to a numbered phase plan.
For phase work, see `.claude/PRPs/plans/`.

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
