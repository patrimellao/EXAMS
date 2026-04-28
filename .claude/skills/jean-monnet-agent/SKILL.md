# Jean Monnet Domain Agent

A specialized agent profile for working on the Jean Monnet oposiciones platform. Use this skill when you need an agent with deep context about this specific codebase.

## When to use
- Implementing a phase plan from `.claude/PRPs/plans/`
- Writing new Playwright E2E tests for this project
- Adding a new controller, API route, or RSC page
- Debugging a failing test in this codebase

## Context Summary

**Project**: Jean Monnet — Gamified oposiciones study platform (Next.js 14 + Better Auth + Drizzle ORM + PostgreSQL + Redis)

**Current Status**: Phases 0–2 complete. Phase 3 (Monetisation UI) is next.

**Key patterns**:

### Controller pattern (MIRROR EXACTLY)
```typescript
// controllers/example.ts
"use server";
import { db } from '@/utils/drizzle/db';
import { tableName } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function getExample(id: string) {
  return db.select().from(tableName).where(eq(tableName.id, id));
}
```

### RSC page pattern (MIRROR EXACTLY)
```typescript
// app/(main)/page-name/page.tsx
import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';

export default async function PageName() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const data = await someController();
  return <ClientComponent data={data} user={user} />;
}
```

### Test pattern (MIRROR EXACTLY)
```typescript
// tests/e2e/uc-NN-name.spec.ts
import { test, expect } from '@playwright/test';

test.describe('UC-NN: Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(process.env.STUDENT_EMAIL!);
    await page.getByLabel('Password').fill(process.env.STUDENT_PASSWORD!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('/study');
  });

  test('should do something', async ({ page }) => {
    // ...
  });
});
```

**Validation (run in order)**:
```bash
npm run typecheck    # Must pass first
npm run build        # Must pass second
npm run test:ralph   # Full E2E (auto-seeds DB)
```

**Test env vars** (written by `npm run seed` to `.env.test`):
- `TEACHER_EMAIL`, `TEACHER_PASSWORD`
- `STUDENT_EMAIL`, `STUDENT_PASSWORD`
- `TEST_SUBJECT_ID`, `TEST_UNIT_ID`, `TEST_LOCKED_UNIT_ID`, `TEST_LESSON_ID`

**Schema source of truth**: `schemas/*.ts` → compiled to `drizzle/schema.ts`

**DB access in controllers**: `import { db } from '@/utils/drizzle/db'` + `import * as schema from '@/drizzle/schema'`

**Auth in server components**: `import { getUser } from '@/lib/getUser'`

**UI components**: shadcn/ui in `components/ui/` + lucide-react icons

**Spanish UI**: All user-facing text is in Spanish. Match existing tone (formal but friendly).

## Rules
1. Never hardcode DB IDs in tests — always use `process.env.TEST_*` variables
2. Never skip the 3-level validation sequence
3. New pages go in `app/(main)/` for protected routes, `app/(public)/` for public routes
4. New controllers go in `controllers/` with `"use server"` at top
5. Match existing Spanish copy style — don't mix languages in UI
6. `isFree` flag on units controls content gating — always check before rendering paid content
