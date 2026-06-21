# Teach backoffice chrome: drop the top app-bar, section-owned `PageHeader`, mobile drawer

**Date:** 2026-06-20
**Branch:** phase-2b-rebranding
**Scope:** `app/wireframes/(teach)/` layout + every teach section header. Wireframe only.

## Problem

The `(teach)` layout has a global top app-bar (`h-14`) that is redundant with the
left sidebar: brand (`TuFolio`) already lives at the sidebar top, and teacher
identity (`García · Profesor`) already lives in the sidebar's bottom card. On
desktop the app-bar is a near-empty strip with three controls floating right.

## Decision

Adopt the standard dashboard shape (Linear / Vercel / Notion): a persistent left
sidebar owns nav + identity + global controls; there is **no** global top bar;
**each section owns its own header/toolbar**. Mobile gets a foldable sidebar
(hamburger → slide-in drawer) that **replaces** the current bottom tab nav.

## Architecture

Two new shared components; the layout and every section render them.

### 1. `components/teach/TeachSidebar.tsx`
The sidebar's *inner content*, extracted so it can be rendered in two places
(desktop fixed rail + mobile drawer) without duplication.

Contains:
- Brand block (`TuFolio` / `Profesor`).
- Primary nav (`Asignaturas`, `Media`, + `Próximamente` disabled items) — same
  `isActive` logic that lives in the layout today, moved here.
- **Footer (absorbs the dead app-bar's controls):**
  - `ModeToggle` (light/dark).
  - The `García · Profesor` card becomes a **dropdown trigger** with items:
    `Mi perfil`, `Modo estudiante` (→ `/wireframes/home`), `Cerrar sesión`.

Uses `usePathname()` internally. No props needed for v1 (optional `onNavigate`
callback so the mobile drawer can close itself on link click).

### 2. `components/teach/PageHeader.tsx`
The shared section header. Replaces the bespoke `<header>` block in each page.

Props (all slots are `ReactNode`):
- `title` — required (ReactNode, so a page can put a badge inline, e.g. the
  builder's `Cambios sin guardar`).
- `subtitle?`
- `breadcrumb?` — rendered above the title row.
- `actions?` — right-aligned controls.

Layout: `flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between` (the
shape every page already uses), with `text-display` title + muted subtitle.

**Mobile drawer trigger lives here, self-contained:** on the left, `md:hidden`,
a hamburger button wrapped in a shadcn `Sheet`; `SheetContent` (side `left`)
renders `<TeachSidebar onNavigate={close} />`. Because trigger + content sit in
the same `Sheet` subtree, **no layout/context coordination is needed** — only one
section renders at a time, so one Sheet instance is fine.

### 3. `app/wireframes/(teach)/layout.tsx` changes
- **Remove** the entire top `<header>` (`h-14` app-bar).
- **Remove** the mobile bottom `<nav>` (replaced by the drawer in `PageHeader`).
- Desktop `<aside>` now renders `<TeachSidebar />` instead of inline markup.
- Main content wrapper: drop `pb-24` (bottom-nav clearance) → `py-6`; keep
  `md:ml-60`, keep `px-4 md:px-8`. With the header gone, content gains ~3.5rem
  of vertical space on desktop.

## Section migrations (each swaps its inline `<header>` for `<PageHeader>`)

| File | title | subtitle | actions |
|------|-------|----------|---------|
| `teach/page.tsx` | `Asignaturas` | `N asignaturas · M publicadas` | `Nueva asignatura` |
| `teach/[id]/page.tsx` | `Derecho Civil` (+ existing breadcrumb) | existing | existing actions |
| `components/teach/MediaLibraryPanel.tsx` | `Media` | existing | existing (only when not `embedded`) |
| `components/teach/BuilderWorkspace.tsx` | `Unidad 2 · Capacidad jurídica` + saved/dirty badge (+ breadcrumb) | existing | save / discard / view-mode / settings |

Notes:
- `MediaLibraryPanel` renders its header only in non-`embedded` mode; preserve that.
- `BuilderWorkspace` already had its breadcrumb + control header restructured in
  prior turns — it becomes the canonical `PageHeader` instance.
- Pages currently wrap content in `mx-auto max-w-5xl`. Leave list/detail pages as
  they are (centered) — **only `BuilderWorkspace` is full-width** (already done).
  `PageHeader` itself is width-agnostic; the page's own wrapper controls width.

## Out of scope
- The `BuilderWorkspace` control-header internals (save/preview/settings) — only
  the wrapper moves into `PageHeader`.
- Sticky headers.
- Any non-teach layout.

## Risks
- Removing the app-bar deletes the only desktop home for `ModeToggle` / logout /
  `Modo estudiante` → must land in `TeachSidebar` footer in the same change.
- Mobile loses brand from the (removed) top bar → brand lives in the drawer; the
  hamburger is the only persistent mobile chrome. Acceptable: backoffice-on-mobile
  is secondary.

## Verification
- `npm run typecheck` clean.
- Manual (dev on :3100): desktop has no top bar; sidebar footer dropdown +
  ModeToggle work on every teach page. Mobile: no bottom nav; hamburger opens the
  drawer with full nav + identity + controls; links close it.
