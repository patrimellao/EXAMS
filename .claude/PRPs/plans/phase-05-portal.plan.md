# Feature: Phase 5 — Portal (UC-18, UC-19, UC-20)

## Summary
Build the public discovery layer: an oposiciones catalogue (UC-18), a news feed for convocatorias (UC-19), and public student profiles (UC-20). These routes are accessible without authentication for SEO purposes.

## Status
**PENDING — do not start until Phase 3 is complete and merged.**

## Depends On
- Phase 3 PRD + plan (subscription UX must be stable)

## Can Run In Parallel With
- Phase 4 (Scale/BullMQ) — different domain, no shared tables

## Metadata
| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | HIGH |
| Model Recommendation | Opus (public SEO routes + complex data model) |
| Systems Affected | `app/(public)/`, new schemas for news + catalogue, `middleware.ts` exclusions |
| Related UCs | UC-18 (catalogue), UC-19 (news), UC-20 (public profiles) |

## Key Design Decisions (TBD)
- Public routes: new `app/(public)/` route group vs. root-level pages?
- News feed: manual teacher posts vs. scraping BOE? — assume manual for v1
- Public profiles: `users.is_profile_public` flag already in schema ✅
- SEO: Next.js `generateMetadata()` per page

## Scope
- UC-18: `/catalogo` page listing all active subjects with enrollment CTA
- UC-19: `/noticias` page with manually-created convocatoria news items
- UC-20: `/perfil/[username]` public profile showing XP, level, achievements (if `is_profile_public=true`)

## Validation Commands
```bash
npm run typecheck
npm run build
npm run test:ralph
```

## Notes
This plan stub needs full expansion via `/prp-plan` before the ralph loop. The Portal phase requires careful SEO consideration (Open Graph meta, canonical URLs) and public caching strategy. Consider using Next.js `unstable_cache` or `revalidate` for the catalogue and news pages.

Run `/prp-plan .claude/PRPs/plans/phase-05-portal.plan.md` to generate the full task breakdown.
