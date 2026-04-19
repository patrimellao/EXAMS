# Feature: Phase 4 — Scale / BullMQ (UC-16, UC-17)

## Summary
Move streak validation and notification dispatch from synchronous request-time logic to background BullMQ workers. Workers compile separately to `dist/` and run as an independent Node.js process.

## Status
**PENDING — do not start until Phase 3 is complete and merged.**

## Depends On
- Phase 3 PRD + plan (subscription tier must be stable before notifications reference it)

## Can Run In Parallel With
- Phase 5 (Portal) — different files, no shared state

## Metadata
| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Model Recommendation | Sonnet |
| Systems Affected | `workers/processors/`, `lib/queues/`, `app/api/`, Redis BullMQ queues |
| Related UCs | UC-16 (streak validation job), UC-17 (notification job) |

## Key Files to Read Before Planning
- `workers/processors/` — currently empty, needs streak + notification processors
- `lib/queues/` — currently empty, needs queue definitions
- `tsconfig.worker.json` — worker compilation config (CommonJS output to `dist/`)
- `controllers/quizzes.ts` — existing synchronous streak logic to extract
- `schemas/daily_activity.ts` — streak tracking table

## Scope
- UC-16: Create `streak-validation` BullMQ job that runs nightly, checks `daily_activity` for gaps, resets `users.current_streak` if no activity yesterday
- UC-17: Create `notification` BullMQ job triggered on achievement unlock (enqueue from `controllers/achievements.ts`); for now, just log to console (email integration Phase 6)

## Validation Commands
```bash
npm run typecheck
npm run build:worker
npm run test:ralph
```

## Acceptance Criteria
- [ ] `npm run build:worker` exits 0 (compiles to `dist/`)
- [ ] `npm run worker` starts without error (requires Docker redis running)
- [ ] Streak job processes all users with activity gaps
- [ ] Achievement unlock enqueues notification job (visible in bull-board at :3001)
- [ ] `npm run test:ralph` passes with no regressions

## Notes
This plan stub needs to be expanded via `/prp-plan` before starting the ralph loop. Run:
```
/prp-plan .claude/PRPs/plans/phase-04-scale-bullmq.plan.md
```
This will generate the full task breakdown with `codebase-explorer` + `codebase-analyst` agents.
