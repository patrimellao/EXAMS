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
- **Supabase** for authentication (SSR-aware) and PostgreSQL hosting
- **Drizzle ORM** for type-safe database queries; schema defined in [drizzle/schema.ts](drizzle/schema.ts)
- **Redis 7** + **BullMQ** for caching (leaderboards, quiz sessions) and background job processing
- **Docker Compose** for local dev (postgres:5432, redis:6379, app:3000, bull-board:3001)

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
| `utils/supabase/` | Supabase clients (server, client, middleware) |
| `lib/redis/` | Redis client + leaderboard caching helpers |
| `workers/processors/` | BullMQ job handlers (compiled separately to `dist/`) |
| `components/ui/` | shadcn/ui primitives |
| `Evolucion/` | Project documentation (Architecture, Roadmap, Data Model) |

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
- `utils/supabase/server.ts` — server-side client with cookie management
- `utils/supabase/client.ts` — browser-side client
- `utils/supabase/middleware.ts` — protects routes; runs on every request
- `lib/getUser.ts` — helper for server components to retrieve the current user

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
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string

### Worker Build
The worker is a separate TypeScript project compiled via `tsconfig.worker.json` to CommonJS in `dist/`. It shares `lib/redis/` and queue definitions with the main app but runs as an independent Node.js process.
