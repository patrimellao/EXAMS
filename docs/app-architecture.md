# `/app/` Directory — Architecture Reference for AI Agents

> **Purpose**: This document describes the current state of the Next.js App Router structure and flags what will change during the planned refactoring (Phases 3–5 from `docs/use-cases.md`). The HTML files in `/Evolucion/` are **design/function references only** — not literal targets.

---

## Tech Context

- **Next.js 14** with App Router, React Server Components (RSC) by default
- **Better Auth** for authentication (self-hosted, Drizzle adapter)
- **Drizzle ORM** → PostgreSQL
- **Redis** + **BullMQ** for caching and background jobs
- **Cloudflare R2** for file uploads (presigned URL flow)
- **Lemon Squeezy** for subscription billing (webhook-driven)

---

## Route Group Map

```
app/
├── layout.tsx              ← Root: ThemeProvider, Toaster, Sonner, CookieConsent, GeistSans font
├── page.tsx                ← Landing page (public). Redirects authenticated users to /study
├── globals.css
│
├── (auth)/                 ← Public auth pages (no layout wrapper)
│   ├── sign-in/page.tsx        "use client" — email/password form → signIn()
│   └── sign-up/page.tsx        "use client" — registration form → signUp()
│
├── (legal)/                ← Static legal pages
│   ├── layout.tsx              Header + footer with legal nav links
│   ├── aviso-legal/page.tsx
│   ├── privacidad/page.tsx
│   ├── cookies/page.tsx
│   └── terminos/page.tsx
│
├── (main)/                 ← ALL protected routes. Layout enforces auth + renders nav header
│   ├── layout.tsx              SSR: getUser() + getProfileInfo(); header with avatar dropdown
│   │
│   ├── study/
│   │   ├── page.tsx            Subject selection (enrolled subjects list)
│   │   ├── SubjectSelectionCard.tsx  "use client"
│   │   └── [id]/
│   │       ├── layout.tsx      2-col: StudentSidebar (left) + ScrollArea (right)
│   │       ├── page.tsx        SSR: parallel fetch units + progress + lessons per unit
│   │       ├── enroll.tsx      "use client" — enrollment dialog
│   │       ├── header.tsx, unit.tsx, unit-banner.tsx, lesson-button.tsx
│   │       └── lessons/
│   │           └── [lessonId]/
│   │               ├── page.tsx       SSR: getLessonWithProgress()
│   │               └── LessonReader.tsx  "use client" — markdown renderer + progress tracking
│   │
│   ├── quiz/
│   │   └── [id]/
│   │       ├── page.tsx         SSR: getQuiz()
│   │       ├── Quiz.tsx         "use client" — quiz orchestrator
│   │       ├── Test.tsx         "use client" — question display + answer selection
│   │       └── QuizResults.tsx  "use client" — score, XP, achievements earned
│   │
│   ├── leaderboard/
│   │   ├── page.tsx             SSR: getLeaderboard() + getEnrolledSubjects()
│   │   └── LeaderboardTabs.tsx  "use client" — subject/global tabs, period selector
│   │
│   ├── profile/
│   │   ├── page.tsx             SSR: getProfileInfo() + getAchievements()
│   │   └── ChangePasswordForm.tsx  "use client"
│   │
│   ├── teach/                   ← Teacher-only (middleware blocks students)
│   │   ├── layout.tsx           2-col: SidebarSubjects + content
│   │   ├── page.tsx             "use client" — empty state
│   │   ├── [id]/
│   │   │   ├── page.tsx         SSR: getSubject() → units data table
│   │   │   ├── SubjectActions.tsx, data-table.tsx, columns.tsx
│   │   ├── create-subject.tsx, create-unit.tsx, subject-form.tsx
│   │
│   └── build/                   ← Teacher-only (middleware blocks students)
│       └── [id]/[unitId]/
│           ├── page.tsx          SSR: getQuestionsFromUnit() + getLessonsForUnit()
│           ├── QuestionBuilder.tsx, questionForm.tsx
│           ├── SidebarQuestions.tsx
│           └── LessonBuilder.tsx
│
├── auth/
│   └── callback/route.ts   ← OAuth callback → redirect to /study
│
└── api/
    ├── auth/[...all]/route.ts         Better Auth catch-all handler
    ├── subjects/route.ts              GET (list), POST (create)
    ├── subjects/[id]/route.ts         PUT (update), DELETE
    ├── lessons/route.ts               GET (by unitId), POST (create) — session required
    ├── lessons/[id]/route.ts          PUT, DELETE — session + teacher role
    ├── lessons/[id]/progress/route.ts PATCH — mark complete, track time
    ├── lessons/[id]/resources/route.ts GET, POST, DELETE — file resources
    ├── leaderboard/route.ts           GET — ?subjectId=&period=week|month|all
    ├── users/route.ts                 GET (list), POST (deprecated 410)
    ├── storage/presign/route.ts       POST — R2 presigned URL (teacher only)
    ├── webhooks/lemonsqueezy/route.ts POST — HMAC-verified subscription events
    └── test/route.ts                  GET — health/env check
```

---

## Layout Nesting & Providers

```
Root layout (ThemeProvider, Toaster, Sonner, CookieConsent)
 ├── (auth)/* — no additional wrapper
 ├── (legal)/* — LegalLayout (header + footer)
 └── (main)/* — MainLayout (auth gate + nav header + avatar dropdown)
      ├── study/[id]/* — StudyLayout (StudentSidebar + ScrollArea)
      └── teach/* — TeachLayout (SidebarSubjects + content)
```

---

## Authentication & Authorization

| Layer | Mechanism |
|-------|-----------|
| **Middleware** (`middleware.ts`) | Protects `/(main)/*`; redirects unauthenticated → `/sign-in`; blocks students from `/teach`, `/build` |
| **API routes** | `auth.api.getSession({ headers })` per-request; teacher role check for write operations |
| **SSR pages** | `getUser()` helper (from `lib/getUser.ts`); `redirect()` on failure |
| **Client** | `lib/auth-client.ts` — browser-side Better Auth client |

Roles: `student` (default), `teacher`. Stored in `users.role`.

---

## Data Flow Pattern

```
Client Component (or browser)
  → API Route (app/api/.../route.ts)    ← validates session, role
  → Controller (controllers/*.ts)        ← "use server", business logic
  → Drizzle ORM (utils/drizzle/db.ts)
  → PostgreSQL

SSR Page
  → Controller directly (no API hop)
  → Drizzle ORM → PostgreSQL
```

Some pages call controllers directly from SSR (no API route needed). Client components call API routes via `fetch()`.

---

## Current Implementation Status

| Phase | Use Cases | Status |
|-------|-----------|--------|
| **0 — Foundation** | UC-01 Sign Up, UC-02 Sign In, UC-03 Enrollment, UC-04 Teacher Backoffice, UC-05 Subscription (backend) | **Done** |
| **1 — Gamification** | UC-06 Quiz, UC-07 Achievements, UC-08 Leaderboard, UC-09 Dashboard | **Done** |
| **2 — Content** | UC-10 Lesson CRUD, UC-11 Lesson Reader, UC-12 Unit Unlock | **Done** |
| **3 — Monetisation UI** | UC-13 Pricing Page, UC-14 Content Gate, UC-15 Subscription Mgmt | **Not started** |
| **4 — Scale** | UC-16 Streak Validation Job, UC-17 Achievement Notification Job | **Not started** |
| **5 — Portal** | UC-18 Oposiciones Catalogue, UC-19 News Feed, UC-20 Public Profiles | **Not started** |

---

## Planned Refactoring — What Will Change

### Phase 3: New Routes Needed

| Route | Purpose | Reference Mockup |
|-------|---------|-----------------|
| `/pricing` (or landing section) | Plan comparison (Free / Pro Monthly / Pro Yearly) → Lemon Squeezy checkout | `tufolio_portal por dentro.html` — pricing section |
| `/profile` (extend) | Add "Mi suscripción" section with tier info + Lemon Squeezy portal link | — |
| Content gate UI on `/study/[id]` | Locked unit cards show "Desbloquear" CTA instead of content | `tufolio_temario.html` — locked unit state (grey, lock icon) |

**New API routes expected**: `/api/billing/portal` (Lemon Squeezy customer portal URL generator).

### Phase 4: No New Routes

Background workers only (`workers/processors/streak.ts`, `workers/processors/notifications.ts`). No `/app/` changes.

### Phase 5: New Routes Needed

| Route | Purpose | Reference Mockup |
|-------|---------|-----------------|
| `/oposiciones` | Public catalogue with category filters (Administración, Justicia, Seguridad) | `tufolio_portal por dentro.html` — categories section |
| `/noticias` or `/blog` | News feed with category pills, featured article, grid of articles | `tufolio_homepage blog.html` |
| `/profile/[userId]` | Public student profile (name, level, XP, achievements, rankings) | — |

### UI/UX Overhaul (from Evolucion mockups)

The mockups signal a visual redesign across existing pages. Key patterns to adopt:

1. **Auth pages** (`sign-in`, `sign-up`): Split layout — left form, right hero with gradient background + floating stats. Currently simple centered forms.
2. **Subject/temario page** (`/study/[id]`): Gradient header (blue/cyan) with breadcrumb + stats badges. Sticky tabs ("Temario", "Exámenes", "Ranking"). Unit cards with color-coded borders (green=complete, orange=in-progress, grey=locked).
3. **Quiz page** (`/quiz/[id]`): Compact header with timer (pulsing red when low). Sticky sidebar with mini question map (grid showing answered/current/pending). Improved option cards with hover effects.
4. **Leaderboard** (`/leaderboard`): Podium section for top 3. Enhanced ranking table with badges.
5. **Lesson reader** (`/study/[id]/lessons/[lessonId]`): Orange/amber gradient header. 3-column layout: video + content (left), sticky TOC + resources sidebar (right). Support for learning objectives cards, concept cards, practical examples.
6. **Landing/homepage** (`/`): Full marketing page with hero + phone mockup, stats section, category grid, "how it works" steps, features grid, pricing cards, CTA.
7. **Dashboard** (`/study`): Achievement popups, stats cards (aciertos/tiempo/XP), progress visualization.

### Routes That Will Likely Be Restructured

- **`/study`** — Currently just subject selection. Will become a richer dashboard (UC-09 enhancement) with XP bar, level, streak, recent badges.
- **`/study/[id]`** — Needs sticky tabs to switch between Temario / Exámenes / Ranking views (currently only shows units).
- **`/` (landing)** — Currently has basic marketing. Mockup shows full pricing section, category grid, feature cards, phone mockup hero.
- **`/(auth)/*`** — Visual redesign to split layout with gradient hero.

---

## Key Files Outside `/app/` That Agents Must Know

| File | Role |
|------|------|
| `middleware.ts` | Route protection + role gating |
| `controllers/*.ts` | All business logic ("use server") |
| `drizzle/schema.ts` | Database schema (single source of truth for tables) |
| `schemas/*.ts` | Zod validation schemas (auto-generated from Drizzle) |
| `lib/auth.ts` | Better Auth server config |
| `lib/auth-client.ts` | Better Auth browser client |
| `lib/getUser.ts` | SSR helper to get current user |
| `lib/redis/leaderboard.ts` | Redis caching for leaderboard |
| `components/ui/` | shadcn/ui primitives |
| `components/StudentSidebar.tsx` | Study sidebar with unit/lesson nav |

---

## Conventions for AI Agents

1. **Server Components are the default**. Only add `"use client"` when the component needs browser APIs, state, or event handlers.
2. **Controllers are the business logic layer**. Pages and API routes should be thin — delegate to controllers.
3. **API routes check auth inline** via `auth.api.getSession({ headers })`. There is no shared auth middleware for API routes.
4. **Parallel data fetching** with `Promise.all()` in SSR pages (see `/study/[id]/page.tsx` as the pattern).
5. **Role check pattern**: `(session.user as any).role !== "teacher"` → 403.
6. **Tests must be written/updated before implementing features** (see `CLAUDE.md` testing policy).
7. **Route groups** `(auth)`, `(legal)`, `(main)` do not affect URL paths — they are organizational only.
8. **Placeholder files** exist at `api/questions/route.txt`, `api/quizzes/route.txt`, `api/topics/route.txt` — these are empty stubs, not implemented.
