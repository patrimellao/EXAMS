# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start Next.js dev server (Turbo)
npm run build        # Build for production
npm start            # Start production server
npm run build:worker # Compile TypeScript worker
npm run worker       # Run worker locally
```

### Database (Drizzle ORM)
```bash
npm run generate     # Generate migrations from schema changes
npm run push         # Apply migrations to PostgreSQL
npm run studio       # Open Drizzle Studio GUI
npm run pull         # Introspect existing DB schema
```

### Docker
```bash
docker-compose up -d            # Start all services (postgres, redis, app, worker, bull-board)
docker-compose logs -f app      # Follow app logs
docker-compose down             # Stop all services
docker-compose down -v          # Stop and remove volumes (reset DB)
```

### First-time setup
```bash
# Windows
setup-complete.bat
# Linux/Mac
./setup-complete.sh
```

## Architecture

### Tech Stack
- **Next.js 14** with App Router and React Server Components
- **Better Auth** for authentication (self-hosted, sessions in own DB); replaces Supabase Auth
- **Drizzle ORM** for type-safe database queries; schema in `schemas/`
- **Redis 7** + **BullMQ** for caching (leaderboards, quiz sessions) and background job processing
- **Docker Compose** for local dev (postgres:5432, redis:6379, app:3000, bull-board:3001)

### External Services

| Service | Purpose | Key files |
|---------|---------|-----------|
| **Better Auth** | Auth + sessions stored in own PostgreSQL DB | `lib/auth.ts`, `lib/auth-client.ts`, `middleware.ts`, `controllers/auth.ts` |
| **Lemon Squeezy** | Subscription billing + EU VAT (Merchant of Record) | `app/api/webhooks/lemonsqueezy/route.ts`, `schemas/subscriptions.ts` |
| **Cloudflare R2** | File uploads for lesson resources (presigned URL flow) | `lib/r2.ts`, `app/api/upload/presign/route.ts` *(Phase 2)* |
| **PostgreSQL** | Primary database (Docker locally, Neon in production) | `utils/drizzle/db.ts` |
| **Redis** | Leaderboard cache (5 min TTL) + BullMQ queues | `lib/redis/` |

### Directory Layout

| Path | Purpose |
|------|---------|
| `app/(auth)/` | Sign-in / sign-up routes (unauthenticated) |
| `app/(main)/` | Protected routes: study, quiz, profile, build |
| `app/api/` | Next.js route handlers (REST endpoints) |
| `controllers/` | Business logic with `"use server"` — called by API routes |
| `drizzle/` | Schema definition + migration files |
| `schemas/` | Zod schemas auto-generated from Drizzle tables |
| `utils/drizzle/` | Drizzle ORM instance (`db.ts`) |
| `utils/supabase/` | Supabase DB client (auth replaced by Better Auth) |
| `lib/redis/` | Redis client + leaderboard caching helpers |
| `workers/processors/` | BullMQ job handlers (compiled separately to `dist/`) |
| `components/ui/` | shadcn/ui primitives |
| `Evolucion/` | UI wireframes (HTML mockups) |
| `docs/` | Developer documentation (use cases, decisions) |

### Data Flow
```
Client Component
  → API Route (app/api/.../route.ts)
  → Controller (controllers/*.ts)  ["use server"]
  → Drizzle ORM (utils/drizzle/db.ts)
  → PostgreSQL (Supabase)

Async jobs:
  → BullMQ Queue (Redis)
  → Worker processor (workers/processors/*.ts)
  → Database update
```

### Authentication
- `lib/auth.ts` — Better Auth server instance (Drizzle adapter, session config, role field)
- `lib/auth-client.ts` — browser-side Better Auth client
- `middleware.ts` — protects all routes; redirects unauthenticated users; blocks students from `/teach` and `/build`
- `lib/getUser.ts` — helper for server components to retrieve the current user

### Use Cases → `docs/use-cases.md`
Full flows (entry point, UI, API, controller, DB tables) for all phases:

| Range | Phase |
|-------|-------|
| UC-01 – UC-05 | Phase 0: Foundation (auth, enrollment, teacher backoffice, billing) |
| UC-06 – UC-09 | Phase 1: Gamification (quiz, achievements, leaderboard, dashboard) |
| UC-10 – UC-12 | Phase 2: Content (lessons, file upload, unit unlock) |
| UC-13 – UC-15 | Phase 3: Monetisation UI (pricing, content gate, subscription management) |
| UC-16 – UC-17 | Phase 4: Scale (BullMQ jobs: streaks, notifications) |
| UC-18 – UC-20 | Phase 5: Portal (catalogue, news feed, public profiles) |

### Controller Pattern
All controllers use `"use server"` and follow a consistent CRUD structure:
```typescript
// Example from controllers/subjects.ts
export async function allSubjects() { ... }
export async function getSubject(id: string) { ... }  // includes joined units
export async function addSubject(data: InsertSubject) { ... }
export async function updateSubject(id: string, data: Partial<InsertSubject>) { ... }
export async function deleteSubject(id: string) { ... }
```

### Database Schema Key Tables
`users` → `students`/`teachers`, `subjects` → `units` → `questions` → `answers`, `quizzes` → `quiz_details`, `achievements` → `user_achievements`, `user_subjects` (enrollment M2M). Cascading deletes are defined at the ORM level.

### Redis Usage
- Leaderboards cached per subject with 5-min TTL (`lib/redis/leaderboard.ts`)
- Quiz session state during active attempts
- BullMQ job queues

### Environment Variables
Copy `.env.example` to `.env.local` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `BETTER_AUTH_SECRET` — random secret for session signing
- `LEMON_SQUEEZY_WEBHOOK_SECRET` + `LEMON_SQUEEZY_API_KEY` — billing webhooks
- `R2_ACCOUNT_ID` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_BUCKET` — file uploads

### Worker Build
The worker is a separate TypeScript project compiled via `tsconfig.worker.json` to CommonJS in `dist/`. It shares `lib/redis/` and queue definitions with the main app but runs as an independent Node.js process.
