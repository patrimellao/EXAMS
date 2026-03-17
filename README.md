# Jean Monnet — Oposiciones Study Platform

A gamified study platform for students preparing for Spanish competitive exams (*oposiciones*). Students progress through structured content, earn XP, maintain streaks, and compete on leaderboards. Teachers manage all content as backoffice.

---

## Table of Contents

1. [Domain Model](#domain-model)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Data Model](#data-model)
5. [Use Cases](#use-cases)
6. [Getting Started](#getting-started)
7. [Development Reference](#development-reference)
8. [Roadmap](#roadmap)

---

## Domain Model

```
Oposición (exam track)
  └── Subject  (e.g. "Cultura General RTVE")
        └── Unit  (chapter — ordered, optionally sequential)
              ├── Lessons  (articles / downloadable files)
              └── Quiz  (randomised questions from that unit)
                    └── Questions → Answers (one correct)

Student
  ├── enrolls in Subjects
  ├── completes Lessons → earns XP
  ├── takes Quizzes → earns points, XP
  ├── maintains daily Streak
  └── earns Achievements / Badges

Teacher
  └── full backoffice: create/edit Subjects, Units, Lessons, Questions
```

**Monetisation**: Students pay a monthly or yearly subscription. Free tier gets access to units marked `is_free`. Teachers have no subscription — they are content authors.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | React Server Components, streaming |
| Language | TypeScript 5.3 | Strict mode |
| Styling | Tailwind CSS 3.4 + shadcn/ui | Radix primitives |
| Auth | Better Auth | Self-hosted, runs in own DB, no MAU pricing, GDPR-friendly |
| Database | PostgreSQL 15 | Local via Docker; Neon for production |
| ORM | Drizzle ORM 0.30 | Type-safe queries, schema-first migrations |
| Cache | Redis 7.2 / ioredis | Pinned to 7.2 (last BSD licence); leaderboard cache |
| Job queue | BullMQ 5 | Deferred — added when scale requires it |
| Billing | Lemon Squeezy | Merchant of Record — handles EU/Spain VAT automatically |
| File storage | Cloudflare R2 | No egress fees; presigned-URL upload flow |
| Validation | Zod 3 + drizzle-zod | Schema-derived types |
| PWA | next-pwa | Installable, offline-capable |

---

## Architecture

```
Browser
  │  HTTPS
  ▼
Next.js 14 (App Router)
  ├── app/(auth)/         Sign-in · Sign-up
  ├── app/(main)/         Protected routes
  │     ├── study/        Subject browse + enroll
  │     ├── quiz/[id]/    Quiz engine
  │     ├── teach/        Teacher backoffice
  │     └── profile/      Student profile + stats
  ├── app/api/            REST route handlers
  └── middleware.ts       Auth + subscription gate
         │
         ├── controllers/*.ts   Business logic  ("use server")
         │         │
         │         ▼
         │   Drizzle ORM ──► PostgreSQL (Docker / Supabase)
         │
         ├── lib/redis/         Leaderboard cache · Quiz sessions
         │         │
         │         ▼
         │        Redis
         │
         └── Better Auth        Session cookies · JWT (own DB)
```

**Data flow:**
```
Client action
  → API Route  (app/api/.../route.ts)
  → Controller (controllers/*.ts)  — validates, queries
  → Drizzle    (utils/drizzle/db.ts)
  → PostgreSQL

Async (future):
  → BullMQ Queue (Redis)
  → Worker processor
  → DB update + notification
```

**Auth flow:**
Better Auth issues a session token stored in an HttpOnly cookie. Session data lives in our own PostgreSQL DB (no external vendor). `middleware.ts` verifies the session on every request.

**File upload flow:**
```
Client requests upload → API Route generates R2 presigned URL
  → Client uploads file directly to Cloudflare R2
  → API Route saves the R2 URL to lesson_resources table
```

**Billing flow:**
```
Student subscribes via Lemon Squeezy checkout
  → Lemon Squeezy webhook → app/api/webhooks/lemonsqueezy/
  → Updates users.subscription_tier + inserts into subscriptions table
  → Lemon Squeezy handles EU VAT collection and remittance
```

---

## Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        varchar full_name
        varchar email
        int xp
        smallint level
        smallint current_streak
        smallint longest_streak
        date last_activity_date
        int total_points
        varchar subscription_tier
    }

    subscriptions {
        serial id PK
        uuid user_id FK
        varchar tier
        varchar status
        varchar lemonsqueezy_subscription_id
        timestamp current_period_end
    }

    subjects {
        serial id PK
        varchar name
        varchar description
        boolean active
    }

    units {
        serial id PK
        int subject_id FK
        text name
        smallint order
        boolean is_free
        boolean unlock_previous_required
    }

    lessons {
        serial id PK
        int unit_id FK
        varchar title
        smallint order
        varchar type
        text content_text
        int xp_reward
    }

    lesson_resources {
        serial id PK
        int lesson_id FK
        varchar title
        varchar type
        varchar url
    }

    questions {
        serial id PK
        int unit_id FK
        text question
        text explanation
        boolean hard
    }

    answers {
        serial id PK
        int question_id FK
        text name
        boolean correct
    }

    quizzes {
        serial id PK
        uuid user_id FK
        int unit_id FK
        smallint score
        int xp_earned
        int points_earned
        timestamp started_at
        timestamp finished_at
    }

    quiz_details {
        serial id PK
        int quiz_id FK
        uuid user_id FK
        int question_id FK
        boolean correct
    }

    achievements {
        serial id PK
        varchar name
        varchar type
        smallint threshold
        varchar rarity
    }

    user_achievement {
        uuid user_id FK
        int achievement_id FK
    }

    daily_activity {
        serial id PK
        uuid user_id FK
        date activity_date
        int quizzes_done
        int xp_earned
    }

    user_stats {
        uuid user_id PK
        int total_quizzes_completed
        int total_correct_answers
        decimal average_quiz_score
    }

    xp_transactions {
        serial id PK
        uuid user_id FK
        int amount
        varchar source_type
    }

    lesson_progress {
        serial id PK
        uuid user_id FK
        int lesson_id FK
        varchar status
        timestamp completed_at
    }

    unit_progress {
        serial id PK
        uuid user_id FK
        int unit_id FK
        int lessons_completed
        boolean is_unlocked
    }

    users ||--o{ subscriptions : "has"
    users ||--o{ user_achievement : "earns"
    users ||--o{ quizzes : "takes"
    users ||--o{ daily_activity : "logs"
    users ||--o{ xp_transactions : "receives"
    users ||--o{ lesson_progress : "tracks"
    users ||--o{ unit_progress : "tracks"
    users }o--o{ subjects : "enrolled in"
    subjects ||--o{ units : "contains"
    units ||--o{ lessons : "has"
    units ||--o{ questions : "has"
    lessons ||--o{ lesson_resources : "has"
    lessons ||--o{ lesson_progress : "tracked by"
    units ||--o{ unit_progress : "tracked by"
    questions ||--o{ answers : "has"
    questions ||--o{ quiz_details : "appears in"
    quizzes ||--o{ quiz_details : "contains"
    achievements ||--o{ user_achievement : "awarded via"
```

### Schema files

All tables are defined in [`schemas/`](schemas/). Drizzle Kit reads this directory to generate and push migrations.

| File | Tables |
|------|--------|
| [users.ts](schemas/users.ts) | `users` |
| [students.ts](schemas/students.ts) | `students` |
| [teachers.ts](schemas/teachers.ts) | `teachers` |
| [subscriptions.ts](schemas/subscriptions.ts) | `subscriptions` |
| [subjects.ts](schemas/subjects.ts) | `subjects` |
| [units.ts](schemas/units.ts) | `units` |
| [lessons.ts](schemas/lessons.ts) | `lessons` |
| [lesson_resources.ts](schemas/lesson_resources.ts) | `lesson_resources` |
| [lesson_progress.ts](schemas/lesson_progress.ts) | `lesson_progress` |
| [unit_progress.ts](schemas/unit_progress.ts) | `unit_progress` |
| [questions.ts](schemas/questions.ts) | `questions` |
| [answers.ts](schemas/answers.ts) | `answers` |
| [quizzes.ts](schemas/quizzes.ts) | `quizzes` |
| [quiz_details.ts](schemas/quiz_details.ts) | `quiz_details` |
| [achievements.ts](schemas/achievements.ts) | `achievements` |
| [user_achievements.ts](schemas/user_achievements.ts) | `user_achievement` |
| [daily_activity.ts](schemas/daily_activity.ts) | `daily_activity` |
| [user_stats.ts](schemas/user_stats.ts) | `user_stats` |
| [xp_transactions.ts](schemas/xp_transactions.ts) | `xp_transactions` |

---

## Use Cases

### Student

| Use Case | Phase | Status |
|----------|-------|--------|
| Register / login | 0 | ✅ Done |
| Browse and enroll in subjects | 0 | ✅ Done |
| Initiate subscription (webhook backend) | 0 | ✅ Done |
| Take a quiz, see score + explanations | 1 | ✅ Done |
| Earn XP, level up, maintain daily streak | 1 | ✅ Done |
| Earn achievement badges | 1 | ✅ Done |
| View personal stats dashboard | 1 | ✅ Done |
| View leaderboard (subject / global) | 1 | ⚠️ Pending — UC-08, no route yet |
| Read lesson articles | 2 | ✅ Done |
| Download lesson resources (PDFs) | 2 | ✅ Done |
| Track lesson + unit progress | 2 | ✅ Done |
| Sequential unit unlock | 2 | ✅ Done |
| Upgrade subscription (pricing page) | 3 | 🔜 Next |
| Free-tier content gate (UI) | 3 | 🔜 Next |
| Manage subscription (cancel / billing) | 3 | 🔜 Next |
| Public profile | 5 | 🔮 Future |

### Teacher (Backoffice)

| Use Case | Phase | Status |
|----------|-------|--------|
| Create / edit subjects and units | 0 | ✅ Done |
| Create / edit questions and answers | 0 | ✅ Done |
| Activate / deactivate content | 0 | ✅ Done |
| Create / edit lessons (articles + files) | 2 | ✅ Done |
| Upload lesson resource files to R2 | 2 | ✅ Done |
| Mark units as free-tier accessible | 2 | ✅ Done |
| Configure sequential unit unlocking | 2 | ✅ Done |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 20+

### 1. Clone and install

```bash
git clone <repo-url>
cd Jean-Monnet-Serious-Game
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Local database (Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jeanmonnet

# Local Redis (Docker)
REDIS_URL=redis://localhost:6379

# Better Auth (generate a random secret: openssl rand -hex 32)
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=jeanmonnet-files
R2_PUBLIC_URL=https://files.yourdomain.com

# Lemon Squeezy (billing — add when implementing Phase 0)
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
LEMONSQUEEZY_STORE_ID=your-store-id
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 15** on `localhost:5432`
- **Redis 7** on `localhost:6379`

### 4. Initialise the database

```bash
npm run push
```

This creates all tables in the Docker PostgreSQL from the schema files in `schemas/`.

### 5. Seed test data

```bash
npm run seed
```

Creates 1 teacher + 2 students, 1 subject, 2 units, 20 questions, 6 lessons, 5 achievements and enrollments.
The script prints `TEST_*` environment variable values to paste into `.env.local` — required by Playwright.

> To wipe seed data: `npm run seed:clear`

### 6. Start the dev server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### 7. Run the test suite

```bash
npx playwright test
```

Requires `.env.local` to be set up and the dev server + Docker services running.

---

## Development Reference

### Commands

```bash
# Dev server (Next.js + Turbo)
npm run dev

# Production build
npm run build

# Database
npm run push        # Apply schema to DB (dev)
npm run generate    # Generate SQL migration file
npm run studio      # Drizzle Studio GUI (localhost:4983)
npm run pull        # Introspect DB → regenerate drizzle/schema.ts

# Seed / test data
npm run seed        # Insert teacher + students + subject + units + questions + lessons + achievements
npm run seed:clear  # Remove all rows inserted by seed (idempotent)

# Tests
npx playwright test            # Full test suite
npx playwright test --ui       # UI mode
npx playwright test tests/e2e/uc-01-sign-up.spec.ts  # Single file

# Docker
docker-compose up -d          # Start postgres + redis
docker-compose down           # Stop
docker-compose down -v        # Stop + wipe volumes (full reset)
docker-compose logs -f        # Follow logs
```

### Directory layout

```
app/
  (auth)/           Sign-in · Sign-up
  (main)/           Protected routes (study, quiz, teach, profile)
  api/              REST route handlers
components/
  ui/               shadcn/ui primitives
controllers/        Business logic — "use server" functions
drizzle/            Drizzle Kit output (generated migrations)
schemas/            Source of truth: Drizzle table definitions + Zod types
lib/
  redis/            Redis client, leaderboard service
  queues/           BullMQ queue definitions (deferred)
workers/
  processors/       BullMQ job handlers (deferred)
utils/
  drizzle/db.ts     Drizzle ORM instance
  supabase/         Supabase clients (server, client, middleware)
Evolucion/          UI mockups and design reference
```

### Key patterns

**Controller pattern** — all business logic uses `"use server"` and is called by API routes:
```typescript
// controllers/subjects.ts
export async function allSubjects() { ... }
export async function getSubject(id: string) { ... }
export async function addSubject(data: InsertSubject) { ... }
```

**Authentication** — Better Auth session verified in `middleware.ts`. `lib/getUser.ts` retrieves the current user in server components. `middleware.ts` protects all `(main)/` routes.

**Subscription gating** — `users.subscription_tier` is checked in middleware/controllers. Free content is marked with `units.is_free = true`. Lemon Squeezy webhooks (`app/api/webhooks/lemonsqueezy/`) update `subscription_tier` on the user.

**File uploads** — presigned URL generated server-side via Cloudflare R2 SDK, client uploads directly to R2, URL saved to `lesson_resources`.

**Streak logic** — on quiz or lesson completion: upsert `daily_activity` for today, compare to yesterday to increment/reset `users.current_streak`. No Redis required.

**Leaderboard** — PostgreSQL `RANK() OVER (ORDER BY total_points DESC)` query, cached with Next.js `unstable_cache`. Redis `LeaderboardService` available as a drop-in upgrade when needed.

---

## Roadmap

### ✅ Phase 0 — Foundation
- Better Auth (self-hosted sessions, Drizzle adapter) replacing Supabase Auth
- Lemon Squeezy webhook handler (`app/api/webhooks/lemonsqueezy/`) — updates `subscription_tier`
- Cloudflare R2 presigned URL upload flow (`app/api/storage/presign/`)
- Legal pages: Aviso Legal, Privacidad, Cookies, Términos (`app/(legal)/`)
- Playwright E2E tests: UC-01 to UC-04

---

### ✅ Phase 1 — Gamification
- XP + level system (awarded on quiz and lesson completion)
- Daily streak tracking via `daily_activity` table
- Achievement badges (score, streak, completion types) via `checkAndAssignAchievements()`
- Student dashboard (`app/(main)/study/page.tsx`)
- Playwright E2E tests: UC-06, UC-07, UC-09

> ⚠️ **UC-08 (Leaderboard) was scoped to Phase 1 but is not yet implemented.**
> No route `/leaderboard` exists. The controller, API route and Redis cache layer are all pending.
> This must be completed as part of Phase 3 before the feature is shipped.

---

### ✅ Phase 2 — Content
- Lesson editor for teachers (`LessonBuilder.tsx`, `controllers/lessons.ts`)
- Sequential unit unlocking (`unit_progress`, `controllers/unit.ts`)
- Lesson progress tracking for students (`lesson_progress`, `api/lessons/[id]/progress`)
- Quiz: explanation shown after each answer, score history
- Playwright E2E tests: UC-10, UC-11, UC-12

---

### 🔜 Phase 3 — Monetisation UI ← **CURRENT**

**UC-08 · Leaderboard (leftover from Phase 1)**

| Task | File |
|------|------|
| Leaderboard page | `app/(main)/leaderboard/page.tsx` *(create)* |
| API route | `app/api/leaderboard/route.ts` *(create)* |
| Controller | `controllers/leaderboard.ts` *(create)* — `RANK() OVER` query |
| Redis cache | `lib/redis/leaderboard.ts` *(exists, wire it in)* |
| Playwright test | `tests/e2e/uc-08-leaderboard.spec.ts` *(create)* |

**UC-13 · Pricing page**

| Task | File |
|------|------|
| Pricing page | `app/(main)/pricing/page.tsx` *(create)* |
| Plans: monthly + yearly with feature comparison | — |
| CTA links to Lemon Squeezy checkout (no custom payment UI) | `LEMONSQUEEZY_API_KEY` required |
| Playwright test | `tests/e2e/uc-13-pricing.spec.ts` *(create)* |

**UC-14 · Free-tier content gate**

| Task | File |
|------|------|
| Gate logic in `study/[id]/page.tsx` | Check `user.subscriptionTier` vs `unit.isFree` |
| Lock UI component (blurred card + upgrade CTA) | `components/ui/unit-gate.tsx` *(create)* |
| Middleware guard for lesson routes | `middleware.ts` *(extend)* |
| Seed data: Unit 2 already has `isFree = false` | use `npm run seed` |
| Playwright test | `tests/e2e/uc-14-content-gate.spec.ts` *(create)* |

**UC-15 · Subscription management**

| Task | File |
|------|------|
| Subscription status section in profile | `app/(main)/profile/page.tsx` *(extend)* |
| Customer portal redirect to Lemon Squeezy | `app/api/billing/portal/route.ts` *(create)* |
| Display `subscriptions` table data (tier, renews_at, status) | `controllers/subscriptions.ts` *(create)* |
| Webhook already handles `subscription_cancelled` / `subscription_updated` | existing |
| Playwright test | `tests/e2e/uc-15-subscription.spec.ts` *(create)* |

**Test credentials (from `npm run seed`):**
```
teacher@exams.test  /  Teacher123!
student1@exams.test  /  Student123!
```

---

### Phase 4 — Scale (when needed)
- BullMQ workers: nightly streak validation, email notifications, ranking recalculation
- Redis leaderboard cache upgrade (replace Next.js `unstable_cache`)
- Neon for production DB (replace local Docker postgres)

### Phase 5 — Portal
- Oposiciones catalogue (browse exam tracks, mark as "próximamente")
- News / convocatorias feed
- Public student profiles
