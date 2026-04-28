# Feature: Phase 3 — Monetisation UI (UC-13, UC-14, UC-15)

## Summary
Add the three UI layers that activate revenue: a pricing page with Lemon Squeezy checkout links (UC-13), a content gate that blurs and locks paid units for free-tier users (UC-14), and a subscription management section in the student profile (UC-15). All backend infra (webhook, subscriptions table, subscription_tier column) is already built in Phase 0.

## User Story
As a student on the free tier, I want to see what's included in the paid plan and upgrade seamlessly, so I can access all exam units without interruption.

## Problem Statement
Phases 0–2 built the product but there's no monetisation UI: no pricing page, no visible gate on paid content, and no way to manage an existing subscription. Revenue is 0 because the checkout is unreachable.

## Solution Statement
Add three Next.js pages/components that surface the existing billing infrastructure. The pricing page links to Lemon Squeezy checkout URLs. The content gate replaces paid unit cards with a blurred overlay + CTA for free-tier users. The profile section shows subscription status and a "Manage subscription" portal link.

## Metadata
| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | app/(main), middleware.ts, components/ui, controllers/subjects.ts |
| Related UCs | UC-13, UC-14, UC-15 |
| PRD | `.claude/PRPs/prds/jean-monnet-platform.prd.md` |

## UX Design

### Before State
```
Student (free tier)
  → /study                  ← All units visible, no lock indicator
  → /profile                ← No subscription info
  → (no pricing page)       ← Can't find upgrade CTA
  → Lemon Squeezy checkout  ← Unreachable from UI
```

### After State
```
Student (free tier)
  → /study
      UnitCard (isFree=true)   ← Accessible as before
      UnitCard (isFree=false)  ← Blurred overlay + "Upgrade to access" CTA
                                   → /pricing
  → /pricing                   ← Monthly + yearly plan cards + comparison table
      "Subscribe Monthly" btn  ← Links to LS_MONTHLY_CHECKOUT_URL
      "Subscribe Yearly"  btn  ← Links to LS_YEARLY_CHECKOUT_URL
  → /profile
      Subscription section:
        - Status (Free / Pro · renews YYYY-MM-DD)
        - "Manage subscription" → LS customer portal URL

Student (paid tier)
  → /study                  ← All units accessible
  → /profile                ← Shows "Pro" + renewal date
```

## Mandatory Reading
| Priority | File | Lines | Why |
|----------|------|-------|-----|
| P0 | `app/(main)/study/[id]/page.tsx` | 1–end | Pattern to MIRROR for UnitCard layout |
| P0 | `app/(main)/profile/page.tsx` | 1–end | Pattern to MIRROR for adding a new section |
| P0 | `middleware.ts` | 1–end | Understand subscription_tier check pattern |
| P0 | `schemas/subscriptions.ts` | 1–end | Fields available: ls_customer_id, ls_subscription_id, status, renews_at |
| P0 | `schemas/users.ts` | 1–end | subscription_tier field (free/monthly/yearly) |
| P1 | `controllers/subjects.ts` | 1–end | allSubjects() return shape — check if isFree is returned |
| P1 | `lib/auth.ts` | 1–end | How to get current user server-side |
| P1 | `lib/getUser.ts` | 1–end | Helper to get user in RSC |

## Patterns to Mirror

### RSC data fetch pattern (from app/(main)/study/page.tsx)
```typescript
// Server Component — no "use client"
import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const subjects = await allSubjects();
  return <ClientComponent subjects={subjects} user={user} />;
}
```

### Controller pattern (from controllers/subjects.ts)
```typescript
"use server";
export async function allSubjects() {
  return db.select().from(subjects).where(eq(subjects.active, true));
}
```

### shadcn/ui card pattern (from components/ui/card.tsx)
```tsx
<Card className="...">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Environment variable pattern (.env.local)
```
LEMON_SQUEEZY_MONTHLY_CHECKOUT_URL=https://...
LEMON_SQUEEZY_YEARLY_CHECKOUT_URL=https://...
```
Accessed as `process.env.LEMON_SQUEEZY_MONTHLY_CHECKOUT_URL`.

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/(main)/pricing/page.tsx` | CREATE | UC-13: Pricing page (RSC) |
| `components/PricingCard.tsx` | CREATE | Reusable plan card component |
| `app/(main)/study/[id]/page.tsx` | UPDATE | UC-14: Add isFree gating to unit cards |
| `components/UnitGate.tsx` | CREATE | UC-14: Blurred overlay component for locked units |
| `app/(main)/profile/page.tsx` | UPDATE | UC-15: Add subscription status section |
| `controllers/subscriptions.ts` | CREATE | UC-15: getSubscription(userId) controller |
| `tests/e2e/uc-13-pricing.spec.ts` | CREATE | E2E for pricing page |
| `tests/e2e/uc-14-content-gate.spec.ts` | CREATE | E2E for content gate |
| `tests/e2e/uc-15-subscription.spec.ts` | CREATE | E2E for subscription section |
| `.env.example` | UPDATE | Add LS checkout URL vars |

## NOT Building (Scope Limits)
- Actual Lemon Squeezy checkout flow (requires live LS account — just link to URLs)
- Customer portal redirect (requires LS API call — mock with placeholder URL in tests)
- Middleware subscription enforcement (middleware already checks tier; UC-14 is UI only)
- Annual vs monthly price calculation UI (static copy is fine for v1)

## Step-by-Step Tasks

### Task 1: CREATE `controllers/subscriptions.ts`
- **ACTION**: Create new server-side controller
- **IMPLEMENT**: Export `getSubscription(userId: string)` that queries `subscriptions` table for the user's active subscription. Return `null` if none.
- **MIRROR**: `controllers/profiles.ts` pattern (same "use server" + db.select structure)
- **IMPORTS**: `import { db } from '@/utils/drizzle/db'`, `import { subscriptions } from '@/drizzle/schema'`, `import { eq } from 'drizzle-orm'`
- **VALIDATE**: `npm run typecheck`

### Task 2: CREATE `app/(main)/pricing/page.tsx`
- **ACTION**: Create RSC pricing page
- **IMPLEMENT**:
  - Call `getUser()` — redirect to /sign-in if not logged in
  - Render two plan cards (Monthly + Yearly) using `PricingCard` component
  - Each card has: price, features list, CTA button linking to `process.env.LEMON_SQUEEZY_{MONTHLY|YEARLY}_CHECKOUT_URL`
  - Add feature comparison table (Markdown table rendered as HTML)
  - If user already has `subscription_tier !== 'free'`, show "You're already subscribed" instead of CTA
- **MIRROR**: `app/(main)/leaderboard/page.tsx` for RSC + card layout pattern
- **GOTCHA**: LEMON_SQUEEZY checkout URLs must be server-env vars (not NEXT_PUBLIC_) since they contain API keys in the query string. Render them as simple `<a href>` links.
- **VALIDATE**: `npm run typecheck && npm run build`

### Task 3: CREATE `components/PricingCard.tsx`
- **ACTION**: Reusable "client" pricing card component
- **IMPLEMENT**:
  - Props: `{ plan: 'monthly' | 'yearly'; price: string; features: string[]; checkoutUrl: string; isCurrentPlan?: boolean }`
  - Renders shadcn Card with price badge, features list (check icons), CTA button
  - Yearly card gets a "Save 20%" badge
  - `isCurrentPlan=true` shows disabled "Current plan" button instead of CTA
- **MIRROR**: `components/ui/card.tsx` + existing button patterns in components/
- **VALIDATE**: `npm run typecheck`

### Task 4: CREATE `components/UnitGate.tsx`
- **ACTION**: Blurred overlay component for locked paid units
- **IMPLEMENT**:
  - Props: `{ children: React.ReactNode; isLocked: boolean }`
  - When `isLocked=true`: wrap children in `relative` div, add `absolute inset-0 backdrop-blur-sm bg-background/60` overlay with lock icon + "Upgrade to access" text that links to `/pricing`
  - When `isLocked=false`: render children as-is
- **MIRROR**: shadcn/ui overlay patterns; import `Lock` from `lucide-react`
- **VALIDATE**: `npm run typecheck`

### Task 5: UPDATE `app/(main)/study/[id]/page.tsx`
- **ACTION**: Wrap each unit card with `<UnitGate>`
- **IMPLEMENT**:
  - Get `user.subscription_tier` from `getUser()`
  - For each unit: `isLocked = !unit.isFree && user.subscription_tier === 'free'`
  - Wrap unit card JSX: `<UnitGate isLocked={isLocked}>{...unitCard}</UnitGate>`
- **GOTCHA**: `unit.isFree` must be returned from the query — verify `controllers/subjects.ts` includes it in the select. If not, add it.
- **VALIDATE**: `npm run typecheck && npm run build`

### Task 6: UPDATE `app/(main)/profile/page.tsx`
- **ACTION**: Add subscription status section
- **IMPLEMENT**:
  - Call `getSubscription(user.id)` from the new controller
  - Add a new Card section "Mi Suscripción" below existing profile stats
  - Show: plan tier badge (Free / Pro Monthly / Pro Yearly), `renews_at` date if subscription exists
  - Show "Gestionar suscripción" button only if `subscription.ls_customer_portal_url` exists (from LS webhook payload); otherwise link to `/pricing`
  - If free tier: show "Upgrade to Pro" CTA linking to `/pricing`
- **MIRROR**: Existing profile sections for visual consistency
- **VALIDATE**: `npm run typecheck && npm run build`

### Task 7: UPDATE `.env.example`
- **ACTION**: Add new required env vars
- **IMPLEMENT**: Append to `.env.example`:
  ```
  LEMON_SQUEEZY_MONTHLY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID
  LEMON_SQUEEZY_YEARLY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID
  ```
- **VALIDATE**: manual review

### Task 8: CREATE `tests/e2e/uc-13-pricing.spec.ts`
- **ACTION**: E2E test for pricing page
- **IMPLEMENT**:
  - Test 1: Free-tier student sees pricing page with two plan cards + CTA buttons
  - Test 2: Plan cards contain expected pricing copy (substring check, not exact)
  - Test 3: Paid student (`subscription_tier='monthly'`) sees "Current plan" on monthly card
  - Setup: seed student1 (free tier) + manually set subscription_tier for a test in-test via DB direct (or create a paid-student fixture in seed)
- **MIRROR**: `tests/e2e/uc-06-09-gamification.spec.ts` for test structure
- **GOTCHA**: Don't test actual Lemon Squeezy redirect — just verify `href` attribute of CTA link
- **VALIDATE**: `npm run test:ralph`

### Task 9: CREATE `tests/e2e/uc-14-content-gate.spec.ts`
- **ACTION**: E2E test for content gate
- **IMPLEMENT**:
  - Test 1: Free-tier student sees locked overlay on paid units (unit with `isFree=false`)
  - Test 2: Locked overlay contains "Upgrade to access" text and link to /pricing
  - Test 3: Free unit has no overlay (accessible)
  - Test 4: After DB update to subscription_tier='monthly', paid unit becomes accessible (no overlay)
  - Uses `TEST_LOCKED_UNIT_ID` from `.env.test`
- **VALIDATE**: `npm run test:ralph`

### Task 10: CREATE `tests/e2e/uc-15-subscription.spec.ts`
- **ACTION**: E2E test for subscription section in profile
- **IMPLEMENT**:
  - Test 1: Free-tier student sees "Mi Suscripción" section with "Free" badge + "Upgrade to Pro" CTA
  - Test 2: CTA in profile links to /pricing
  - Test 3: Page does not crash (no JS errors in console)
- **VALIDATE**: `npm run test:ralph`

## Testing Strategy

### E2E Tests
| Test File | Test Cases | Validates |
|-----------|-----------|----------|
| `uc-13-pricing.spec.ts` | 3 | Pricing page renders, plan cards, CTA links |
| `uc-14-content-gate.spec.ts` | 4 | Gate renders on paid units, no gate on free, unlock on upgrade |
| `uc-15-subscription.spec.ts` | 3 | Subscription section in profile, tier badge, CTA |

### Edge Cases Checklist
- [ ] User with no subscription (subscription_tier='free') — all UI shows upgrade path
- [ ] User with active subscription — gate removed, profile shows tier + renewal date
- [ ] LEMON_SQUEEZY env vars not set — pricing page shows fallback (disabled buttons)
- [ ] Unit with isFree=true — never gated regardless of subscription tier
- [ ] Teacher user accessing /pricing — redirect to /teach (teachers don't need subscription)

## Validation Commands

### Level 1: TYPE_CHECK
```bash
npm run typecheck
```

### Level 2: BUILD
```bash
npm run build
```

### Level 3: E2E
```bash
npm run test:ralph
```

### Full validation (all levels)
```bash
npm run typecheck && npm run build && npm run test:ralph
```

## Acceptance Criteria
- [ ] `/pricing` route exists and renders two plan cards for logged-in students
- [ ] Paid units (`isFree=false`) show blur overlay + CTA for free-tier students
- [ ] Free units (`isFree=true`) are always accessible regardless of tier
- [ ] Profile page shows "Mi Suscripción" section with correct tier badge
- [ ] `npm run typecheck` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm run test:ralph` exits 0 (all 10 new tests + existing 8 suites pass)
- [ ] No regressions in `uc-01` through `uc-12` tests

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LS checkout URLs not configured in .env.local | HIGH | LOW | Show disabled button with tooltip; don't crash |
| `controllers/subjects.ts` doesn't return `isFree` field | MED | HIGH | Read file first (Task 5 GOTCHA) and fix before gating |
| Profile page refactor breaks existing stats display | MED | MED | Run full E2E suite after Task 6; don't restructure existing sections |
| Subscription table empty in test DB | LOW | HIGH | Seed.ts already handles free tier (no subscription row) — gate code must handle NULL gracefully |

## Notes
- Lemon Squeezy customer portal URL is returned in the webhook payload as `data.attributes.urls.customer_portal`. Store it in `subscriptions.ls_portal_url` (add column if missing — check schema first).
- This phase deliberately avoids modifying `middleware.ts` — subscription enforcement is already there. This phase is UI only.
- Spanish copy: "Actualizar a Pro", "Gestionar suscripción", "Tu suscripción" — match existing Spanish UI in the app.
