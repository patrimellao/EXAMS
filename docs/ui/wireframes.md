# Phase 2B — Wireframes (lo-fi, ASCII)

> **Estado:** propuesta UX inicial — pendiente de feedback del cliente.
> **Fuente:** mockups en `Evolucion/*.html` (TuFolio) + diagnóstico del front actual.
> **Cómo editarlos:** modifica el ASCII directamente en este archivo y abre PR. Cuando se aprueben, se materializan en `app/(wireframes)/` con shadcn real.

---

## 0 · Decisiones cerradas

| # | Decisión | Valor |
|---|----------|-------|
| 1 | Ruta para "Inicio" | **`/home`** (ruta nueva, separada de `/study`) |
| 2 | Modelo teacher | **Toggle de rol** en avatar (no shell propio) |
| 3 | Bottom-nav móvil | **4 items**: Inicio · Cursos · Ranking · Más |
| 4 | Asignaturas en sidebar | **No.** Pasan a ser contenido en `/study` |
| 5 | Sidebar fijo | **5 items**: Inicio, Mis cursos, Ranking, Noticias, Ajustes |
| 6 | Quiz y Lesson reader | **Modo focus** (sin sidebar) |

---

## 1 · Sitemap

```
                       ┌──────────────────────┐
                       │  / (landing pública) │
                       └──────────┬───────────┘
                                  │ login
                                  ▼
┌──── SIDEBAR FIJO (5 items) ─────────────────────────────────┐
│  🏠 Inicio          → /home                                 │
│  📚 Mis cursos      → /study                                │
│  🏆 Ranking         → /leaderboard                          │
│  📰 Noticias        → /news    (Phase 5)                    │
│  ⚙️  Configuración   → /settings                              │
│                                                             │
│  ─────                                                      │
│  [Avatar · Nivel · XP]   ← user card                        │
└─────────────────────────────────────────────────────────────┘
                                  │
            ┌─────────────────────┼─────────────────────────┐
            ▼                     ▼                         ▼
   /study/[subject]         /quiz/[id]              /profile/[userId]
     ├─ Tabs sticky:        (focus mode,            (público, Phase 5)
     │   • Temario          sin sidebar)
     │   • Exámenes
     │   • Ranking del curso
     └─ /lessons/[id]
          (focus mode, header propio)
```

---

## 2 · User journeys

**🟢 J1 — "Quiero seguir estudiando" (caso 80%)**
```
Login → /home → "Continuar: U2.3 Derecho Civil"
     → /study/[id]/lessons/[lessonId] → "Hacer test"
     → /quiz/[id] → submit → resultado + XP → "Volver a la unidad"
```

**🟡 J2 — "Quiero ver mi progreso"**
```
/home (ya muestra racha + XP del día) → click stat card → /profile
```

**🔵 J3 — "Quiero inscribirme a un curso nuevo"**
```
/study → "Explorar catálogo" → modal/sheet → enrolar
```

**🔴 J4 — "Soy teacher, quiero crear contenido"**
```
Avatar dropdown → "Modo profesor" → /teach (shell adapta items del sidebar)
```

---

## 3 · Wireframes por pantalla

### 3.1 — Shell global (todas las páginas con sidebar)

```
┌────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌────────────────────────────────────────────┐  │
│ │ 📘 TuFolio   │  │ 🔍 Buscar asignaturas, lecciones, tests…  │ 🔔 👤│ ← header sticky
│ ├──────────────┤  └────────────────────────────────────────────┘  │
│ │ 🏠 Inicio    │  ┌────────────────────────────────────────────┐  │
│ │ 📚 Mis cursos│  │                                            │  │
│ │ 🏆 Ranking   │  │           [ contenido de la ruta ]         │  │
│ │ 📰 Noticias  │  │                                            │  │
│ │ ⚙️  Ajustes  │  │                                            │  │
│ │              │  │                                            │  │
│ │              │  │                                            │  │
│ │ ━━━━━━━━━━   │  │                                            │  │
│ │ [👤 Manu]    │  │                                            │  │
│ │ Nivel 12     │  │                                            │  │
│ │ ▓▓▓▓▓░░ 78%  │  │                                            │  │
│ └──────────────┘  └────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
   240px fijo                       fluid

shadcn primitives: Sidebar, Input (search), Avatar, DropdownMenu,
                   Progress, Button, Tooltip
```

---

### 3.2 — `/home` (Inicio — pantalla nueva)

```
┌────────────────────────────────────────────────────────────────────┐
│ Hola, Manu 👋                              Lunes, 28 abril 2026   │
│ ¿Qué quieres aprender hoy?                                         │
│                                                                    │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│ │ 🔥 Racha         │ │ ⭐ XP hoy        │ │ 🎯 Objetivo      │   │
│ │   12 días        │ │   +240 / 500    │ │   3 / 5 lecc.   │   │
│ │   ↑ +1 vs ayer   │ │   ▓▓▓▓▓░░░ 48% │ │   ▓▓▓░░ 60%    │   │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘   │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ▶ Continuar donde lo dejaste                                 │  │
│ │ ┌──────────────────────────────────────────────────────────┐ │  │
│ │ │ [thumb] Derecho Civil · Unidad 2.3                       │ │  │
│ │ │         "Capacidad de obrar"           ▓▓▓▓░░░ 65%       │ │  │
│ │ │                                          [Continuar →]   │ │  │
│ │ └──────────────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌────────────────────────────┐  ┌─────────────────────────────┐   │
│ │ 🏆 Ranking semanal         │  │ 🏅 Logros recientes         │   │
│ │ #4 en Derecho Civil  ↑ 2   │  │ [🔥] Racha 7 días - hace 3d │   │
│ │ #12 global                  │  │ [📚] 100 lecciones - hace 5d│   │
│ │            [Ver ranking →] │  │             [Ver todos →]   │   │
│ └────────────────────────────┘  └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘

shadcn primitives: Card, Progress, Badge, Button
```

---

### 3.3 — `/study` (Mis cursos — reemplaza listado en sidebar)

```
┌────────────────────────────────────────────────────────────────────┐
│ Mis cursos                                  [+ Explorar catálogo] │
│ 4 inscripciones · 2 activas esta semana                           │
│                                                                    │
│ [Todos (4)] [En progreso (2)] [Completados (1)] [Pausados (1)]    │
│                                                                    │
│ ┌─────────────────────┐ ┌─────────────────────┐ ┌────────────────┐│
│ │ ▓▓▓▓▓░░░ 65%        │ │ ▓▓░░░░░░ 22%        │ │ ▓▓▓▓▓▓▓ 100%   ││
│ │ Derecho Civil       │ │ Constitucional      │ │ ✓ Penal        ││
│ │ 12 / 18 unidades    │ │ 4 / 18 unidades     │ │ Completado     ││
│ │ #4 en ranking       │ │ #21 en ranking      │ │ Diploma listo  ││
│ │   [Continuar →]     │ │   [Continuar →]     │ │   [Repasar]    ││
│ └─────────────────────┘ └─────────────────────┘ └────────────────┘│
└────────────────────────────────────────────────────────────────────┘

shadcn primitives: Card, Tabs, Progress, Button, Sheet (catálogo)
```

---

### 3.4 — `/study/[id]` (Detalle de curso — tabs sticky)

```
┌────────────────────────────────────────────────────────────────────┐
│ ╔════════════════════════════════════════════════════════════════╗│
│ ║ ← Mis cursos / Derecho Civil          [gradient teal/cyan]    ║│
│ ║                                                                ║│
│ ║ Derecho Civil                                                  ║│
│ ║ Prof. García · 18 unidades · 240 lecciones                    ║│
│ ║                                                                ║│
│ ║ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   ║│
│ ║ │ 65%    │ │ 12/18  │ │ #4     │ │ 8h 40m │                   ║│
│ ║ │ Progr. │ │ Unidad.│ │ Rank.  │ │ Tiempo │                   ║│
│ ║ └────────┘ └────────┘ └────────┘ └────────┘                   ║│
│ ╚════════════════════════════════════════════════════════════════╝│
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ▌Temario   Exámenes   Ranking del curso     ← sticky tabs    │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ✓ Unidad 1 · Conceptos generales              ▓▓▓▓▓▓ 100%   │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ ▶ Unidad 2 · Capacidad jurídica                ▓▓▓░░░ 65%   │  │
│ │   2.1 Personalidad       ✓ leída · 92% test                  │  │
│ │   2.2 Capacidad jurídica ✓ leída · 78% test                  │  │
│ │   2.3 Capacidad de obrar  ↻ en progreso                      │  │
│ │   2.4 Restricciones        — sin empezar                      │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ 🔒 Unidad 3 · Estado civil          (completa Unidad 2)      │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

shadcn primitives: Tabs (sticky), Accordion (unidades), Progress,
                   Card, Badge (estados), Breadcrumb
```

---

### 3.5 — `/quiz/[id]` (modo focus, sin sidebar)

```
┌────────────────────────────────────────────────────────────────────┐
│ [← Salir]   Test U2.3 · Derecho Civil          ⏱ 12:34   [Pausar]│
│ ▓▓▓▓░░░░░░  Pregunta 4 / 10                                        │
├────────────────────────────────────────────────────┬───────────────┤
│                                                    │ Mapa preguntas│
│ ¿Qué edad establece el Código Civil para la       │  1 ✓  2 ✓     │
│  plena capacidad de obrar?                        │  3 ✗  4 ◉     │
│                                                    │  5 ·  6 ·     │
│ ○ A · 16 años                                      │  7 ·  8 ·     │
│ ○ B · 17 años                                      │  9 · 10 ·     │
│ ◉ C · 18 años                                      │               │
│ ○ D · 21 años                                      │ ✓ Acertadas: 2│
│                                                    │ ✗ Falladas: 1 │
│           [Anterior]   [Siguiente →]               │ ◉ Actual      │
└────────────────────────────────────────────────────┴───────────────┘

shadcn primitives: Progress, RadioGroup, Button, Card, Separator,
                   AlertDialog (salir/pausar)
```

---

### 3.6 — `/study/[id]/lessons/[id]` (modo lectura, sin sidebar)

```
┌────────────────────────────────────────────────────────────────────┐
│ [← Volver al temario]              Lección 2.3 · Capacidad de obrar│
│ ════════════════════════════════════════════════════════════════ │ ← gradient amber
│ Capacidad de obrar                                                │
│ Unidad 2 · Lección 3 de 4                                         │
│                                                                    │
├─────────────────────────────────────────────────┬─────────────────┤
│                                                 │ ÍNDICE          │
│  [▶ Video]                                      │ ▌ Vídeo         │
│                                                 │   Introducción  │
│  📋 Introducción                                │   Objetivos     │
│  Lorem ipsum dolor sit amet…                    │   Conceptos     │
│                                                 │   Ejemplo       │
│  🎯 Objetivos de aprendizaje                    │                 │
│  • Comprender el concepto…                      │ RECURSOS        │
│  • Diferenciar entre…                           │ 📄 Apuntes.pdf  │
│                                                 │ 📊 Esquema.pdf  │
│  💡 Conceptos clave                             │                 │
│  …                                              │ ━━━━━━━━━       │
│                                                 │ [Hacer test →]  │
└─────────────────────────────────────────────────┴─────────────────┘

shadcn primitives: ScrollArea (sticky TOC), Card, Button, Separator
```

---

### 3.7 — `/leaderboard`

```
┌────────────────────────────────────────────────────────────────────┐
│ ╔════════════════════════════════════════════════════════════════╗│
│ ║ Ranking                            [Global ▾]  [Esta semana ▾]║│
│ ╚════════════════════════════════════════════════════════════════╝│
│                                                                    │
│              ┌──────┐                                              │
│              │  🥇  │                                              │
│      ┌──────┤ Lucía├──────┐                                        │
│      │  🥈  │ 4.230 │ 🥉  │       ← podio top 3                    │
│      │ Marta│      │ Luis│                                         │
│      │ 3.890│      │ 3.650│                                        │
│      └──────┴──────┴──────┘                                        │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  4 │ 👤 Manu (tú)   ↑2  │ Derecho Civil │ 1.240 XP │ 🔥 12  │  │
│ │  5 │ 👤 Carmen      ─   │ Constituc.    │ 1.180 XP │ 🔥  3  │  │
│ │  6 │ 👤 Pablo       ↓1  │ Penal         │ 1.090 XP │ 🔥  7  │  │
│ │ …                                                              │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

shadcn primitives: Select (filtros), Avatar, Table, Badge
```

---

### 3.8 — `/(auth)/sign-in` (split layout)

```
┌────────────────────────────────────────────────────────────────────┐
│                                  ║                                 │
│   📘 TuFolio                     ║   ╔════════════════╗            │
│                                  ║   ║                ║            │
│   Bienvenido de nuevo            ║   ║   [hero]       ║ ← gradient │
│                                  ║   ║                ║   teal/cyan│
│   Email   [_______________]      ║   ║   📊 +12K      ║            │
│   Pass    [_______________]      ║   ║   estudiantes  ║            │
│                                  ║   ║                ║            │
│   [────── Entrar ──────]         ║   ║   "Aprobé las  ║            │
│   o entrar con Google            ║   ║    oposi en 6m"║            │
│                                  ║   ║   — Lucía M.   ║            │
│   ¿No tienes cuenta? Regístrate  ║   ║                ║            │
│                                  ║   ╚════════════════╝            │
└────────────────────────────────────────────────────────────────────┘

shadcn primitives: Card, Input, Button, Label, Form (RHF + zod)
```

---

### 3.10 — `/teach` (Backoffice profesor — Asignaturas)

```
┌────────────────────────────────────────────────────────────────────┐
│ Asignaturas                                  [+ Nueva asignatura]  │
│ 3 asignaturas · 2 publicadas                                       │
│                                                                    │
│ ┌─────────────────────────┐  ┌─────────────────────────┐          │
│ │ [📖]          Publicada │  │ [📖]          Publicada │          │
│ │ Derecho Civil           │  │ Derecho Constitucional  │          │
│ │ Temario completo de…    │  │ Constitución española…  │          │
│ │ ─────────────────────   │  │ ─────────────────────   │          │
│ │ 18 unidades  Editar →   │  │ 12 unidades  Editar →   │          │
│ └─────────────────────────┘  └─────────────────────────┘          │
│ ┌─────────────────────────┐                                       │
│ │ [📖]           Borrador │   (empty state si no hay asignaturas: │
│ │ Derecho Penal           │    icono + CTA "Nueva asignatura")    │
│ └─────────────────────────┘                                       │
└────────────────────────────────────────────────────────────────────┘

Shell propio: sidebar profesor (Asignaturas activo · Estudiantes /
Analítica "Próximamente"). Slate chrome, sin gamificación.
shadcn/game: Button(learning), Card, Badge
```

---

### 3.11 — `/teach/[id]` (Temario — tabla de unidades)

```
┌────────────────────────────────────────────────────────────────────┐
│ Asignaturas / Derecho Civil                                        │
│ Derecho Civil  [Publicada]              [Despublicar] [+ Unidad]   │
│ Temario completo · 4 unidades                                      │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ # │ Unidad             │ Preg. │ Lecc. │ Acceso     │  ⋯     │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ 1 │ Conceptos grales.  │   24  │   4   │ 🔓 Libre G │  ⋯     │  │
│ │ 2 │ Capacidad jurídica │   18  │   3   │ 🔓 Libre G │  ⋯     │  │
│ │ 3 │ Estado civil       │   12  │   3   │ 🔒 Secuenc.│  ⋯     │  │
│ │ 4 │ Persona jurídica   │   —   │   2   │ 🔒 Secuenc.│  ⋯     │  │
│ └──────────────────────────────────────────────────────────────┘  │
│   ⋯ = Abrir builder · Editar unidad · Eliminar                    │
│   (empty state si la asignatura no tiene unidades)                 │
└────────────────────────────────────────────────────────────────────┘

shadcn: Breadcrumb, Table, Badge, DropdownMenu (acciones de fila)
```

---

### 3.12 — `/build` (Builder — dual-tab, fleshed-out · iteración 2)

```
┌────────────────────────────────────────────────────────────────────┐
│ Asignaturas / Derecho Civil / U2 · Builder                         │
│ Unidad 2 · Capacidad jurídica  ● Cambios sin guardar               │
│ ▌Preguntas (3)   Lecciones (3)                                     │
├──────────────────┬─────────────────────────────────────────────────┤
│ [+ Nueva pregunta]│ ❓ Editar pregunta   [Normal|Difícil] [🗑]      │
│ ▌Edad capacidad ● │ Enunciado [____________________________]        │
│   Personalidad    │ Respuestas (mín. 2):                            │
│   Extinción       │  [✓] 16 años [🗑]   [✓]✔ 18 años [🗑] (verde)  │
│                   │  [+ Añadir respuesta]                           │
│                   │ Explicación [_________________]                 │
│                   │ ● sin guardar   [Descartar] [✓ Guardar preg.]   │
├──────────────────┴─────────────────────────────────────────────────┤
│ Tab Lecciones (fleshed):                                            │
│  Título · Tipo(select) · Orden · Duración · XP                      │
│  Contenido Markdown:  [B I • 🔗] ┬ textarea  │ vista previa live   │
│  Recursos: ╎dropzone "Subir a R2 (URL prefirmada)"╎                 │
│            [📄 apuntes.pdf · 1.2MB · ✔ Listo R2  ✕]                 │
│  [Cancelar] [✓ Guardar lección]                                     │
└────────────────────────────────────────────────────────────────────┘

shadcn: Tabs, Breadcrumb, Select, Textarea, Input, Label, Separator,
        Badge ·  markdown editor split (editor | preview), R2 dropzone
```

---

### 3.13 — `/teach/media` (Biblioteca global · WordPress-style)

```
┌────────────────────────────────────────────────────────────────────┐
│ Media                                  [Subir]  [+ Nuevo álbum]    │
│ 12 archivos · biblioteca global, etiquetada por asignatura         │
│ ┌─ Buscar ──────────────┐  [Todo|Imágenes|PDF|Vídeo|Documentos]   │
│ │ 🔍 nombre, alt, desc.  │                            [▦] [≡]      │
│ └────────────────────────┘                                          │
│ Asignatura: [Todas] [Civil] [Constitucional] [Penal] [Sin etiqueta]│
│                                                                    │
│ ┌── grid 5 cols (xl) ────────────────┐ ┌─ Detalle ────────────┐   │
│ │ [img] [pdf] [mp4] [doc] [img]  ⏎  │ │ ▣ aspect-video        │   │
│ │ [img] [pdf] [mp4] [doc] [img]      │ │ Nombre [____________]│   │
│ │ • thumbnail + nombre + tamaño      │ │ Alt    [____________]│   │
│ │ • badge "↗ 2" si usado en N lecc.  │ │ Descripción [______] │   │
│ │ • selección anillo brand-primary   │ │ Asignaturas: [Civil]+│   │
│ │ (vista lista = tabla con tags)     │ │ Tipo · Tamaño · R2…  │   │
│ │                                    │ │ Usado en (2):        │   │
│ │                                    │ │  · Civil U2 · L1     │   │
│ │                                    │ │  · Penal U1 · L3     │   │
│ │                                    │ │ [Editar] [Reemplazar]│   │
│ │                                    │ │ [Descargar] [🗑 dis] │   │
│ └────────────────────────────────────┘ └──────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘

Scope: teacher-global con etiquetas por asignatura (filtro por defecto
"Todas"). Tag "Sin asignatura" para uploads recién importados.

Modo picker (mismo UI en Dialog): se invoca desde el builder cuando el
profesor pulsa el botón de vídeo / enlace / "adjuntar recurso". La acción
del panel de detalle cambia a [Insertar en texto] / [Adjuntar como recurso]
en lugar de [Editar / Reemplazar / Eliminar].

Eliminación segura: el botón Eliminar se deshabilita si `usage.length > 0`.
El profesor primero retira el archivo de las lecciones que lo usan.

shadcn: Input, Button, Badge, Separator, Textarea, Label · custom: grid
cards con focus-ring, chips de filtro, panel de detalle slide-in.

Modelo de datos (Phase 2):
  media_assets(id, teacher_id, r2_key, mime, size, title, alt,
               description, created_at)
  media_asset_subjects(asset_id, subject_id)
  lesson_media(lesson_id, asset_id, role: 'inline' | 'resource', position)
```

---

## 3.bis · Backoffice profesor — roadmap

| Fase | Pantalla | Estado |
|------|----------|--------|
| 1 | 3.10 Asignaturas · 3.11 Temario · 3.12 Builder (esquemático) | ✅ wireframe |
| 2 | 3.12 Builder fleshed-out (form pregunta completo, editor markdown + preview, subida R2) | ✅ wireframe |
| 2 (esta) | 3.13 Media library global con etiquetas + panel de detalle (reusable como picker) | ✅ wireframe |
| 3 | Dashboard profesor (overview, actividad reciente, accesos rápidos) | 🔜 |
| 3 | Gestión de estudiantes (matrículas por asignatura) | 🔜 sidebar "Próximamente" |
| 3 | Analítica por asignatura (tasas de acierto, intentos) | 🔜 sidebar "Próximamente" |

> El shell profesor ya expone `Estudiantes` y `Analítica` como ítems
> deshabilitados con chip "Próximamente" para que la estructura futura sea
> legible hoy. `Media` ya está activa.

---

## 4 · Mobile (≤ 768px)

```
┌──────────────────┐
│ 📘  🔍   🔔  👤 │ ← header
├──────────────────┤
│                  │
│   [contenido]    │
│                  │
│                  │
├──────────────────┤
│ 🏠  📚  🏆  ⋯   │ ← bottom nav (4 items, "Más" abre Sheet con extras)
└──────────────────┘

shadcn primitives: Sheet (menú "Más"), Drawer (header móvil)
```

---

## 5 · Convenciones visuales (placeholder hasta cerrar paleta)

| Token | Uso | Color de prueba |
|-------|-----|-----------------|
| `primary` | CTAs principales, links activos, gradientes hero | teal-600 |
| `accent` | Lección reader, achievements, XP | amber-500 |
| `success` | Unidades completas, aciertos | emerald-500 |
| `destructive` | Timer crítico, fallos en quiz | red-500 |
| `muted` | Skeleton, placeholders, fondos suaves | slate-100 |
| `brand-neutral` | Logo, headers densos | slate-800 |

> **Pendiente:** confirmar paleta con cliente. Fuente recomendada: stack del sistema o Inter desde `next/font`.
