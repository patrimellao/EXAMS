# TuFolio — Design System Token Lock

**Date:** 2026-05-07
**Status:** Approved by user via brainstorming visual companion
**Branch:** `phase-2b-rebranding`
**Supersedes (where conflicting):** parts of `docs/ui/design-system.md` (the chrome-vs-game color split was previously underspecified)
**Companion docs:** `docs/ui/design-system.md` (architecture, component layers), `docs/ui/wireframes.md` (page-level specs)

## 1 · Why this exists

`docs/ui/design-system.md` defines the architectural layers (pages → game → shadcn) and broad-strokes tokens (palette, animations, gradients) but leaves three things underspecified that would make a Fase B ralph loop oscillate iteration to iteration:

- Whether teal is *the* primary color or only the gamification primary
- Whether MDX lessons share the chrome typography or get an editorial body font
- Concrete values for shadows, button heights, focus rings, transition durations, and reading widths

This spec locks those values. After this lands, no per-PR re-decision of these tokens is allowed in Fase B.

## 2 · Decision A — Color split: chrome slate + game teal

### Decision

- **shadcn `--primary` = slate-900** (`hsl(222 47% 11%)`, hex `#0F172A`)
- **`--brand-primary` = teal-600** (kept; `hsl(178 84% 32%)`, hex `#0D9488`) — now scoped to game-layer + learning-context accents, not chrome workhorse
- All other brand tokens (`--brand-cool`, `--brand-warm`, `--brand-flame`, `--brand-xp`, `--brand-success`) unchanged

### Application rules

| Surface | Color |
|---|---|
| Sidebar active item, primary chrome buttons (Save, Submit, Confirm, Sign in), chrome inline links | **slate-900** |
| "Continue lesson" CTA, learning-context links, course-detail headers, accent on active unit | **teal-600** |
| XP bar fill, streak flame, lesson-active highlight, "+10 XP" toasts, achievement glow | warm gradient (xp + warm + flame) — unchanged |
| Stat tiles (StatTile component) | tone prop unchanged: warm/cool/primary/success |
| Auth `GradientHero variant="brand"` | slate-700 → slate-900 — already shipped |
| Course detail `GradientHero variant="trust"` | teal → cyan — unchanged |
| Lesson reader `GradientHero variant="warm"` | xp + warm + flame — unchanged |

### Tiebreaker rule for ambiguous buttons

Default behavior: any `<Button>` component without a variant override renders in slate-900 (because shadcn `--primary` = slate-900).

To use teal-600 for a learning-progression action, the button must opt in explicitly via the `variant="learning"` prop on the game-layer button wrapper. This makes "did the developer mean this is a learning action?" an explicit decision instead of a guess.

| Action | Variant | Why |
|---|---|---|
| "Sign in", "Save", "Submit", "Confirm", "Cancel" | default (slate) | Page primary or chrome action |
| "Inscribirse en curso" | default (slate) | Enrollment = page-level transaction, not learning progression |
| "Continuar lección", "Hacer test", "Ir al siguiente módulo", "Repasar" | `variant="learning"` (teal) | Direct progression through learning content |
| "Reintentar test" inside QuizResults | `variant="learning"` (teal) | Continues the learning loop |
| Buttons inside /teach, /build (teacher tools) | default — but `--primary` reads as slate, which fits the "tool tone" intent already documented |

When in doubt: default. Opting into teal is the deliberate exception.

### Why split, not replace

A single-color primary forces a tonal compromise: pure teal reads as "fresh tech learning" (Brilliant.org) and undersells the gravitas oposiciones students need; pure slate reads as "B2B serious" (WSJ) and kills the retention warmth that makes Duolingo mechanics work. The split lets chrome carry seriousness while gamification carries warmth — the LinkedIn Learning pattern.

## 3 · Decision B — Typography: Geist (chrome) + Source Serif 4 (MDX body)

### Decision

- **Geist** for *all* chrome and headings (sidebar, header, buttons, cards, forms, navigation, all `<h1>`–`<h6>` including those *inside* MDX lessons)
- **Source Serif 4** for body paragraphs and lists *only* inside `<MdxLesson>` components
- Both loaded via `next/font` with `font-display: swap`
- Source Serif 4: variable optical-size (8–60), weights 400/500/600/700

### Tailwind config addition

```ts
fontFamily: {
  // existing 'sans' (Geist) unchanged
  reader: ['"Source Serif 4"', 'Charter', 'Iowan Old Style', 'Georgia', 'serif'],
}
```

### `<MdxLesson>` typography rules

- Body paragraphs: `font-reader text-[17px] leading-[1.7]` with `font-feature-settings: "liga", "kern", "onum"`
- Lists: same as body
- Headings inside lesson: `font-sans` (Geist) — keeps clear hierarchy serif↔sans
- First paragraph of each lesson section: `::first-letter` drop cap, ~2.5× body size, weight 600
- Line length: capped at `max-w-2xl` (~65 characters)

### Why a serif for MDX only

Sans is optimized for scanning (UI, dashboards, controls); serif is optimized for sustained reading. Oposiciones lessons are 20–30 minute reading sessions — exactly the threshold where serif starts paying off in reduced visual fatigue. Source Serif 4 is the modern screen-optimized serif (cf. NYT, The Atlantic, Stripe Press) — neither too academic (Garamond) nor too literary (Cormorant). Bundle cost: ~30 KB on lesson routes only; chrome routes unaffected.

## 4 · Decision C — Micro-token scales

### 4.1 Shadow scale (4 levels)

```css
:root {
  --shadow-card:        0 0 0 1px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04);
  --shadow-card-hover:  0 0 0 1px rgb(15 23 42 / 0.06), 0 4px 12px rgb(15 23 42 / 0.08), 0 1px 2px rgb(15 23 42 / 0.04);
  --shadow-popover:     0 0 0 1px rgb(15 23 42 / 0.06), 0 8px 24px rgb(15 23 42 / 0.12), 0 2px 4px rgb(15 23 42 / 0.06);
  --shadow-modal:       0 24px 48px -12px rgb(15 23 42 / 0.25), 0 0 0 1px rgb(15 23 42 / 0.05);
}
```

Tailwind extension:
```ts
boxShadow: {
  card: 'var(--shadow-card)',
  'card-hover': 'var(--shadow-card-hover)',
  popover: 'var(--shadow-popover)',
  modal: 'var(--shadow-modal)',
}
```

Rules:
- Cards in resting state → `shadow-card`
- Cards on hover (only when interactive — clickable cards, course cards) → `shadow-card-hover` + 200ms transition
- Dropdowns, tooltips, hover-cards → `shadow-popover`
- Dialogs, sheets, command palette → `shadow-modal`
- Do NOT invent intermediate values. Promote / demote to next tier instead.

### 4.2 Button heights

| Token | Height | Use |
|---|---|---|
| `sm` | 36px (`h-9`) | Inside cards, inline actions, dense forms (desktop-only) |
| `md` | 40px (`h-10`) | **Default.** Forms, page CTAs, dialogs |
| `lg` | 48px (`h-12`) | Hero CTAs, auth submit, mobile primary actions, lesson "Hacer test" |

Update `components/ui/button.tsx` size variants to these exact heights.

### 4.3 Focus ring

```css
.focus-ring { @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary; }
```

- Use `focus-visible:` (NOT `focus:`) so the ring only appears for keyboard navigation, not mouse clicks
- Ring color: `brand-primary` (teal-600) — chosen to contrast cleanly on the slate-900 chrome buttons
- Apply via shared utility on every interactive element (button, link, input, select, tab, tab-trigger, accordion-trigger, etc.)

### 4.4 Motion durations

```css
:root {
  --duration-fast:   150ms;  /* hover, link underline, button color change */
  --duration-normal: 200ms;  /* state changes, dropdown open, accordion expand, focus ring fade-in */
  --duration-slow:   300ms;  /* modal entry, page transitions, sheet slide */
}
```

Tailwind extension:
```ts
transitionDuration: {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
}
```

The three custom keyframes already in `tailwind.config.ts` keep their own tokens (they are special celebration moments, not generic transitions):
- `animate-xp-bump` — 400ms (kept)
- `animate-streak-flame` — 1.6s infinite (kept)
- `animate-achievement-pop` — 500ms (kept)

Easing convention:
- Entering / opening: `ease-out`
- Exiting / closing: `ease-in`
- Bidirectional state changes (toggle, accordion): `ease-in-out`
- Never `linear` for UI transitions

### 4.5 Reading widths

| Token | Width | Use |
|---|---|---|
| `max-w-2xl` | 672px | MDX body, lesson containers, long forms (sign-up). ~65 characters per line — research-backed reading optimum. |
| `max-w-3xl` | 768px | Settings, profile, list pages with rows of mixed prose+data |
| `max-w-6xl` | 1152px | Dashboards, course grids, leaderboard, `/home`, `/study`, `/leaderboard` |

These are the **only** three widths used for content containers. Rejected: `max-w-4xl` and `max-w-5xl` (too close to 6xl, no semantic reason).

## 5 · Application order

The implementation plan (writing-plans skill, next step) will sequence these. Indicative order:

1. **PR #0 (this spec) — token application:** apply all of §3 and §4 to `app/globals.css` and `tailwind.config.ts`. Add Source Serif 4 to font loader. Update `components/ui/button.tsx` size variants. Add shared `focus-ring` utility.
2. **PR #1 — auth split inherits new tokens:** the auth split shipped 2026-05-07 currently uses default Button (which uses `--primary`). After §2 lands, the auth submit button automatically becomes slate-900 — verify visually, no code change expected. Run `impeccable` skill on the result.
3. **PR #1 (Fase B) — global shell:** sidebar uses slate-900 for active state, teal-600 for hover indicators. Reading widths applied per page.
4. **PR #5 (Fase B) — MdxLesson:** introduces `font-reader`, drop cap, `max-w-2xl` body.

## 6 · Inherited (not re-decided here)

These remain as `docs/ui/design-system.md` defines them:

- **Border radius scale:** `rounded-card` (12px), `rounded-hero` (16–24px), `rounded-pill` (9999px), `rounded-md` (6px shadcn default for inputs/buttons)
- **Spacing scale:** Tailwind defaults (4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64). No custom spacing tokens needed.
- **Custom keyframes:** `xp-bump`, `streak-flame`, `achievement-pop` keep their existing values
- **Gradient utilities:** `bg-grad-trust`, `bg-grad-warm`, `bg-grad-brand` unchanged
- **Iconography:** Lucide for chrome, emoji only inside achievement cards and lesson-section markers (📋 🎯 💡 ✅) inside `<MdxLesson>` custom components

## 7 · What this spec does NOT decide

- Specific copy / Spanish localization of UI strings (separate work; tracked as Fase A.5 in ROADMAP)
- The `<MdxLesson>` *layout* (1-col vs 2-col with TOC) — tentatively 2-col with sticky TOC per ui-ux-pro-max recommendation, but the layout is part of `docs/ui/wireframes.md` section 3.6 and will be reconfirmed when PR #5 starts
- Animation vocabulary beyond durations (specific keyframes) — `tailwind.config.ts` already locks them; this spec only adds the *generic* duration tokens
- Dark mode token values — the existing `globals.css` already covers light + dark; this spec inherits without modification

## 8 · Sign-off

User approved A, B, and C via the brainstorming visual companion on 2026-05-07. Decisions are now load-bearing for `phase-2b-rebranding` and persisted in memory at `~/.claude/projects/-home-manuel-EXAMS/memory/project_design_tokens_locked.md`.

Re-litigating these tokens inside a Fase B PR is out of scope — open a deliberate token-update PR if a token genuinely needs revision.
