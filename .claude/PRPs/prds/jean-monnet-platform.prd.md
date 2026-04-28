# Jean Monnet Serious Game — Platform PRD

## Problem Statement

Spanish civil service exam candidates ("oposicionistas") have no dedicated gamified digital platform. They study from scattered PDFs and photocopied books with no feedback loops, progress tracking, or motivation systems. Without measurable progress, dropout rates are high and preparation quality is poor.

## Evidence

- Spain holds 100,000+ civil service exam seats annually (AGE — Administración General del Estado)
- No gamified SaaS platform exists specifically for Spanish oposiciones (as of 2026)
- Existing solutions are generic (Quizlet, Anki) with no domain-specific content, billing, or gamification
- Assumption: 5–15% monthly churn is expected without a strong engagement loop

## Proposed Solution

A subscription SaaS platform where teachers create exam-specific content (subjects → units → lessons + quiz questions) and students study via an XP-driven quiz engine with achievements, leaderboards, and sequential content unlocking. Monetised via Lemon Squeezy (EU VAT handled as Merchant of Record).

## Key Hypothesis

We believe a gamified quiz platform with subscription-gated premium units will retain oposicionistas longer and generate recurring revenue. We'll know we're right when: (1) weekly active users return ≥3 sessions/week, and (2) paid conversion ≥8% of registered students within 30 days.

## What We're NOT Building

- Native mobile apps — PWA covers mobile; native apps deferred to Phase 6
- AI-generated questions — teacher-curated content only for now
- Social/community features (forums, DMs) — Phase 6 if validated
- Multi-language content — Spanish oposiciones only for v1

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| WAU retention (≥3 sessions/week) | ≥40% of actives | daily_activity table |
| Paid conversion (free → paid ≤30d) | ≥8% | subscriptions table |
| Quiz completion rate | ≥70% of started quizzes | quizzes.finished_at IS NOT NULL |
| Time to first quiz | <5 min after signup | quizzes.created_at - users.created_at |

## Open Questions

- [ ] Optimal free/paid split: 1 free unit per subject or 1 free lesson?
- [ ] Lemon Squeezy checkout UX: redirect vs modal embed?
- [ ] Should streak reset at midnight Madrid time or UTC?

---

## Users & Context

**Primary User — Student**
- **Who**: 20–35 year old Spanish national preparing a civil service exam (e.g. Cuerpo Administrativo AGE)
- **Current behavior**: Studies from photocopied legislation + generic Anki decks
- **Trigger**: Sees an exam convocatoria (official call), has 6–18 months to prepare
- **Success state**: Passes the exam; platform kept daily streak for 90 days

**Secondary User — Teacher / Content Creator**
- **Who**: Opposition academy instructor or freelance oposición specialist
- **Trigger**: Wants to monetise their content knowledge digitally
- **Success state**: Published a full subject with lessons + 100 questions, earns via student subscriptions

**Job to Be Done (Student)**
When I start preparing for my oposición, I want to practice daily with structured question banks and see my progress, so I can know I'm ready before the exam.

**Non-Users**
University students preparing generic academic exams (different content, no Lemon Squeezy subscription model needed), international users (Spain-specific legal content).

---

## Current Implementation Status

### ✅ Phase 0 — Foundation (COMPLETE, tested)
UC-01 Sign-up · UC-02 Sign-in · UC-03 Enrollment · UC-04 Teacher backoffice · UC-05 Lemon Squeezy webhook
- Better Auth (self-hosted sessions in PostgreSQL)
- 24 DB tables via Drizzle ORM
- Docker Compose: postgres:5432 + redis:6379
- Playwright E2E: `tests/e2e/uc-01` through `uc-04`
- **Gap**: No UC-05 (webhook) E2E test — tested via manual curl only

### ✅ Phase 1 — Gamification (COMPLETE, tested)
UC-06 Quiz engine · UC-07 Achievements · UC-08 Leaderboard · UC-09 Dashboard
- XP system, level-ups, daily streaks, achievement badges
- SQL view `view_counter_achievements` + `get_number_of_quizzes()` function
- Playwright E2E: `tests/e2e/uc-06-09-gamification.spec.ts`
- **Gap**: No unit/integration tests for XP calculation edge cases

### ✅ Phase 2 — Content (COMPLETE, tested)
UC-10 Lesson editor · UC-11 Lesson reader · UC-12 Sequential unit unlock
- Cloudflare R2 presigned URL upload flow
- Lesson progress + unit progress tracking
- `unlockNextUnit()` controller logic
- Playwright E2E: `tests/e2e/uc-10`, `uc-11`, `uc-12`
- **Gap**: R2 upload tested with placeholder URL only (real R2 requires live credentials)

### 🔜 Phase 3 — Monetisation UI (NEXT — 0% started)
UC-13 Pricing page · UC-14 Content gate · UC-15 Subscription management
- Backend infra READY: `subscriptions` table, `users.subscription_tier`, webhook handler
- UI layer: NOT BUILT
- Plan file: `.claude/PRPs/plans/phase-03-monetisation-ui.plan.md`

### 🔮 Phase 4 — Scale / BullMQ (DEFERRED)
UC-16 Streak validation job · UC-17 Notification job
- BullMQ + Redis workers deferred until platform has 100+ DAU
- Plan stub: `.claude/PRPs/plans/phase-04-scale-bullmq.plan.md`

### 🔮 Phase 5 — Portal (DEFERRED)
UC-18 Oposiciones catalogue · UC-19 News feed · UC-20 Public profiles
- Public discovery layer; deferred until subscription revenue is proven
- Plan stub: `.claude/PRPs/plans/phase-05-portal.plan.md`

---

## Testing Strategy (Ralph Loop Optimized)

### Goal
All validation can run **without human intervention**. Ralph loops MUST be able to run `npm run test:ralph` and get a green/red signal autonomously.

### Validation Levels (use in every plan file)

| Level | Command | What it catches | Duration |
|-------|---------|-----------------|----------|
| L1 — TypeCheck | `npm run typecheck` | Type errors, missing imports | ~15s |
| L2 — Build | `npm run build` | Next.js compilation, RSC errors | ~60s |
| L3 — E2E | `npm run test:ralph` | Full user flows, DB integration | ~3min |

**Minimal ralph validation** (fast feedback): `npm run typecheck && npm run build`
**Full ralph validation**: `npm run typecheck && npm run build && npm run test:ralph`

### Infrastructure

```
Docker (postgres + redis)
  → npm run push          # Apply schema
  → npm run setup-db      # SQL views + functions (one-time)
  → npm run seed          # Idempotent test data + writes .env.test
  → npx playwright test   # Reads .env.local + .env.test automatically
```

**Autonomous seed flow (added 2026-04-19):**
- `seed.ts` writes `.env.test` with dynamic IDs (TEST_SUBJECT_ID, etc.)
- `playwright.config.ts` loads `.env.test` at startup
- `tests/global-setup.ts` auto-re-seeds if `.env.test` is older than 1 hour
- `npm run test:ralph` = `npm run seed && npx playwright test`
- `npm run test:full` = `npm run push && npm run seed && npx playwright test` (fresh DB)

### Current Test Gaps (by priority)

| Gap | Priority | Fix required |
|-----|----------|-------------|
| UC-05 webhook not tested | HIGH | Add `tests/e2e/uc-05-webhook.spec.ts` with mock Lemon Squeezy payload |
| No XP edge-case tests | MED | Add API-level tests for XP calculation in `controllers/quizzes.ts` |
| R2 upload uses placeholder URL | LOW | Accept — integration requires live R2 credentials, skip in CI |
| No subscription gate E2E | HIGH (Phase 3) | Will be covered by `uc-14-content-gate.spec.ts` |

### Testing Rules for Ralph Loops
1. Every plan file **must** include all 3 validation levels
2. E2E tests must be runnable with `npm run test:ralph` (no manual steps)
3. New features require a matching test file in `tests/e2e/uc-{N}-{name}.spec.ts`
4. Tests use fixed seed IDs from `.env.test` — never hardcode IDs in test files
5. Max 1 Playwright worker (sequential = DB consistency guaranteed)

---

## Ralph Loop Strategy

### Per-Phase Scope & Model Recommendation

| Phase | Plan File | Scope (UCs) | Model | Effort | Parallel? | Est. Iterations |
|-------|-----------|------------|-------|--------|-----------|-----------------|
| 3 — Monetisation UI | `phase-03-monetisation-ui.plan.md` | UC-13,14,15 | **Sonnet** | Medium | ❌ Sequential (shared middleware) | 3–5 |
| 4 — Scale/BullMQ | `phase-04-scale-bullmq.plan.md` | UC-16,17 | **Sonnet** | Medium | ✅ with Phase 5 | 4–6 |
| 5 — Portal | `phase-05-portal.plan.md` | UC-18,19,20 | **Opus** | High | ✅ with Phase 4 | 5–8 |

**Why Phases 4 and 5 can run in parallel:**
- Phase 4 touches `workers/processors/`, BullMQ queues, Redis — backend-only
- Phase 5 touches `app/(main)/catalogue/`, `app/(main)/news/` — new UI routes
- They share `schemas/` but don't modify the same tables

**Why Phase 3 must be sequential:**
- UC-13, UC-14, and UC-15 all touch `middleware.ts` subscription checks
- Shared state: `users.subscription_tier` + `subscriptions` table read from all 3 UCs

### Ralph Loop Command Pattern (per phase)

```bash
# Start loop for Phase 3
/prp-ralph .claude/PRPs/plans/phase-03-monetisation-ui.plan.md

# Monitor with (separate terminal)
cat .claude/prp-ralph.state.md
```

### Workflow per Feature

```
1. /prp-plan <description or prd-file-path>
     → Generates .claude/PRPs/plans/{feature}.plan.md
     → Uses: codebase-explorer + codebase-analyst agents (parallel)

2. Review plan (human) — check scope, tasks, validation commands

3. /prp-ralph .claude/PRPs/plans/{feature}.plan.md
     → Autonomous implement → validate → fix loop
     → Exits when: npm run typecheck + npm run build + npm run test:ralph all pass

4. /prp-review (optional, pre-PR quality check)

5. /prp-pr
     → Creates PR with summary
```

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Auth + enrollment (UC-01–03) | Foundation for everything |
| Must | Quiz engine + XP (UC-06) | Core value loop |
| Must | Subscription gating (UC-14) | Revenue enablement |
| Must | Pricing page (UC-13) | Conversion funnel |
| Should | Achievements + leaderboard (UC-07,08) | Retention |
| Should | Lesson reader (UC-11) | Content differentiation |
| Should | Subscription management (UC-15) | Churn reduction |
| Could | BullMQ jobs (UC-16,17) | Scale (not blocking revenue) |
| Won't (v1) | AI question generation | Complexity vs. value unclear |
| Won't (v1) | Native mobile apps | PWA sufficient |

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Auth provider | Better Auth (self-hosted) | Supabase Auth, Clerk | No MAU pricing; full DB control |
| Billing | Lemon Squeezy | Stripe | MoR handles Spanish/EU VAT automatically |
| File storage | Cloudflare R2 | S3, Supabase Storage | Cheapest egress; already on private server |
| Cache | Redis 7.2 (pinned) | Redis 7.4+, Valkey | 7.4+ license changed; Valkey migration deferred |
| DB | PostgreSQL + Drizzle ORM | Prisma | Type-safe, lighter, no connection pool overhead |
| Streak sync | Synchronous in quiz submit | BullMQ job | Simpler; BullMQ deferred to Phase 4 |
| Leaderboard | PostgreSQL RANK() | Redis sorted sets | Redis upgrade deferred; Next.js unstable_cache handles TTL |
| Tests | Playwright E2E only | Jest unit + Cypress | E2E covers the full stack; 1 worker = DB consistency |

---

## Maintenance Strategy

### Documentation Decay Prevention

The main context-length risk is `docs/use-cases.md` (29 KB). Strategy:

1. **Split on first PR of each new phase**: Extract that phase's UCs into `docs/uc-phase-N.md`. The master `use-cases.md` keeps only a summary table pointing to phase files.
2. **PRD is the living document**: Update implementation status as phases complete. Mark sections `complete` rather than expanding them.
3. **Plan files are ephemeral**: Move to `completed/` folder after phase PR merges. Ralph archives contain learnings.
4. **CLAUDE.md stays under 200 lines**: Commands + architecture only. No narrative. Every 3 phases, audit and trim.
5. **MEMORY.md index stays under 150 chars/line**: If a memory entry expands, extract to its file and keep the index pointer short.
6. **Quarterly review**: After each phase, run `/prp-codebase-question "What documentation is stale or redundant?"` to identify cleanup.

### Pruning Checklist (run after each phase merge)
- [ ] Move completed plan to `.claude/PRPs/plans/completed/`
- [ ] Update PRD phase table (status → complete)
- [ ] Archive ralph state to `.claude/PRPs/ralph-archives/`
- [ ] Check `docs/use-cases.md` — extract completed phase UCs to `docs/uc-phase-N.md`
- [ ] Audit CLAUDE.md line count (target: < 200 lines)
- [ ] Update MEMORY.md project entry with new implementation state

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 0 | Foundation | Auth, enrollment, teacher backoffice, billing webhook | complete | - | - | - |
| 1 | Gamification | Quiz engine, XP, achievements, leaderboard, dashboard | complete | - | 0 | - |
| 2 | Content | Lesson editor, reader, sequential unlock, R2 uploads | complete | - | 1 | - |
| 3 | Monetisation UI | Pricing page, content gate, subscription management | pending | - | 0,1,2 | `phase-03-monetisation-ui.plan.md` |
| 4 | Scale / BullMQ | Streak validation job, notification job | pending | with 5 | 3 | `phase-04-scale-bullmq.plan.md` |
| 5 | Portal | Oposiciones catalogue, news feed, public profiles | pending | with 4 | 3 | `phase-05-portal.plan.md` |

### Phase Details

**Phase 3: Monetisation UI** ← NEXT
- **Goal**: Revenue-enabling UI so students can subscribe and be gated
- **Scope**: UC-13 (pricing), UC-14 (content gate), UC-15 (subscription management)
- **Success signal**: `npm run test:ralph` passes with tests/e2e/uc-13, uc-14, uc-15

**Phase 4: Scale / BullMQ**
- **Goal**: Move streak + notification logic to background jobs
- **Scope**: UC-16 (streak job), UC-17 (notification job)
- **Success signal**: Worker processes jobs from BullMQ queue; `npm run worker` stays healthy

**Phase 5: Portal**
- **Goal**: Public discovery layer for oposiciones catalogue and news
- **Scope**: UC-18 (catalogue), UC-19 (news feed), UC-20 (public profiles)
- **Success signal**: Public routes accessible without auth; SEO meta tags present

---

*Generated: 2026-04-19*
*Status: ACTIVE — update phase table as phases complete*
