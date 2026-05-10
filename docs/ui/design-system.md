# TuFolio Design System

> **Filosofía:** *serious game para adultos.* Sensación de herramienta seria con mecánicas de retención visibles. Brilliant.org adulto, no Duolingo niño.

---

## Capas

```
┌───────────────────────────────────────────┐
│  app/wireframes/* y app/(main)/* — pages  │
└─────────────────┬─────────────────────────┘
                  │ usa
                  ▼
┌───────────────────────────────────────────┐
│  components/game/* — componentes con      │
│  identidad TuFolio (color, animación,     │
│  composición). Wraps shadcn cuando hace   │
│  falta accesibilidad.                     │
└─────────────────┬─────────────────────────┘
                  │ usa
                  ▼
┌───────────────────────────────────────────┐
│  components/ui/* — shadcn/Radix puro.     │
│  Motor invisible. NO se mezclan estilos   │
│  TuFolio aquí.                            │
└───────────────────────────────────────────┘
```

**Regla de oro:** una página de alumno no importa nada de `components/ui/*` directamente excepto `Input`, `Label`, `Form`, `RadioGroup`, `AlertDialog`, `DropdownMenu`. Todo lo visual (Card, Button, Tabs, Progress) pasa por un wrapper de `components/game/`.

**Regla del profesor:** las pantallas de `/teach` SÍ usan shadcn puro. Es una herramienta, no un juego. El contraste de tono comunica "el profesor trabaja, el alumno aprende".

---

## Tokens de color

**Semánticos (en `globals.css`):**

| Token | HSL | Uso |
|-------|-----|-----|
| `--brand-primary` | teal-600 | CTA principal, links activos, brand |
| `--brand-cool` | cyan-700 | Secundario brand, gradients trust |
| `--brand-warm` | orange-500 | XP, energía, lecciones |
| `--brand-flame` | rose-500 | Streak, alerta amistosa |
| `--brand-xp` | amber-400 | XP fill, achievements |
| `--brand-success` | emerald-600 | Done, aciertos |

**Gradients (utilidades CSS):**

- `bg-grad-trust` → `linear-gradient(135deg, primary, cool)` — course detail, sign-in hero
- `bg-grad-warm` → `linear-gradient(135deg, xp, warm, flame)` — lesson reader, leaderboard
- `bg-grad-brand` → `linear-gradient(135deg, slate-700, slate-900)` — logo, tarjetas oscuras

---

## Tokens de tipografía

- **Body:** Geist (ya en root layout). Pesos 400, 500, 600.
- **Display:** Geist con `font-black` (900) + `tracking-tight`. Usar SOLO en h1/h2 de heros.
- No se añade Manrope/Inter. Una fuente, mil pesos.

| Token | Tailwind | Uso |
|-------|----------|-----|
| `text-hero` | `text-4xl font-black tracking-tight md:text-5xl` | h1 de hero pages |
| `text-display` | `text-2xl font-black tracking-tight` | h2 de hero, modal titles importantes |
| `text-h2` | `text-xl font-semibold` | sección dentro de página |
| `text-card-title` | `text-lg font-semibold` | titulares de cards |

---

## Tokens de radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-card` | 12px | Cards principales |
| `rounded-hero` | 16-24px | Hero containers, lesson reader |
| `rounded-pill` | 9999px | Badges, chips |
| `rounded-md` (shadcn) | 6px | Inputs, buttons standard |

---

## Motion

**Tres tokens, no más:**

| Animación | Curva | Duración | Uso |
|-----------|-------|----------|-----|
| `animate-xp-bump` | bump (0.34, 1.56, 0.64, 1) | 400ms | XP gana, score reveal, achievement |
| `animate-streak-flame` | ease-in-out infinite | 1.5s | Llama del streak badge |
| `animate-achievement-pop` | bump | 500ms | Toast de logro |

Para transiciones de página, hover, focus: usar `motion` (framer-motion) directamente. NO se inventan keyframes en CSS.

---

## Iconografía

- **Lucide** para todo el chrome (sidebar, header, controles, estados).
- **Emoji** SOLO dentro de:
  - Achievement cards (🔥 racha, 📚 lecciones, 🎯 objetivo, 🏆 ranking)
  - Lesson reader sections (📋 introducción, 🎯 objetivos, 💡 conceptos, ✅ ejemplo)
- Cuando se usa emoji, va en un container con bg-muted y un tamaño consistente (40×40px, rounded-card).

---

## Componentes de la capa game

**Stat / progresión:**
- `<StatTile />` — racha, XP, objetivo del día. Icono + número + tendencia + progress.
- `<XPBar />` — gradient amber→orange, fill animado.
- `<StreakBadge />` — llama animada + count.
- `<LevelBadge />` — círculo con número + ring de progreso al siguiente nivel.

**Navegación / contenido:**
- `<ContinueCTA />` — card grande "Continuar donde lo dejaste" con play, gradient, hover.
- `<UnitCard />` — tarjeta de unidad con estado (locked/active/done) + acciones inline.
- `<CourseCard />` — tarjeta de curso para `/study`.
- `<GradientHero />` — header gradient reutilizable. Variantes: `trust` (course), `warm` (lesson, leaderboard), `brand` (auth).

**Quiz / lección:**
- `<QuizOption />` — radio styled como card grande con prefix de letra.
- `<QuestionMap />` — grid 5×N con estados.
- `<MdxLesson />` — wrapper que renderiza MDX con componentes custom (`<Section>`, `<Objectives>`, `<KeyConcept>`, `<Example>`, `<Video>`, `<Resource>`).

**Gamificación:**
- `<AchievementCard />` — emoji + nombre + fecha, animación pop al ganar.
- `<PodiumCard />` — top 3 leaderboard.
- `<RankRow />` — fila de ranking con avatar, tendencia.

---

## Reglas de composición

1. **Hero gradient solo en pantallas hito**: course detail, lesson, leaderboard, sign-in. NO en `/home` ni `/courses` (son dashboards, deben respirar).
2. **Una jerarquía de tarjetas**: `card` (border 1px, radius-card, padding 24px). Si quieres énfasis: `card` + ring teal-200 + sombra. NO inventar tamaños de borde sueltos.
3. **Densidad creciente arriba → abajo**: hero (alta densidad visual) → stat tiles (media) → contenido (baja densidad, mucho whitespace).
4. **Color con propósito**: amber/warm = motivación (XP, streak, lecciones). Teal/cool = información, navegación, trust. Verde = éxito. Rojo = peligro/error. NO color decorativo gratis.
5. **Animación con propósito**: solo en eventos significativos (XP gana, level up, achievement). No animar hovers de cards rutinarios.
