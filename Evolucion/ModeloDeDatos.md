# Modelo de Datos - Evolución

## Esquema Actual (✅ Implementado)

### Tabla: `users`
```typescript
id: uuid (PK)
full_name: varchar
email: varchar (unique)
created_at: timestamp
updated_at: timestamp
```

### Tabla: `students`
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
```

### Tabla: `teachers`
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
```

### Tabla: `subjects`
```typescript
id: serial (PK)
name: varchar
description: varchar
active: boolean
created_at: timestamp
updated_at: timestamp
```

### Tabla: `units`
```typescript
id: serial (PK)
title: text
description: varchar
subject_id: int (FK → subjects.id)
active: boolean
questions_per_quiz: smallint (5-15, default 10)
created_at: timestamp
updated_at: timestamp
```

### Tabla: `questions`
```typescript
id: serial (PK)
unit_id: int (FK → units.id)
text: varchar
hard: boolean
active: boolean
created_at: timestamp
updated_at: timestamp
```

### Tabla: `answers`
```typescript
id: serial (PK)
question_id: int (FK → questions.id)
text: varchar
correct: boolean
created_at: timestamp
updated_at: timestamp
```

### Tabla: `quizzes`
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
unit_id: int (FK → units.id)
score: smallint
metadata: varchar (JSON)
created_at: timestamp
updated_at: timestamp
```

### Tabla: `quiz_details`
```typescript
(Relación quizzes ↔ questions + respuestas del usuario)
```

### Tabla: `achievements`
```typescript
id: serial (PK)
name: varchar
description: varchar
threshold: smallint
icon: smallint
created_at: timestamp
updated_at: timestamp
```

### Tabla (Junction): `user_subjects`
```typescript
user_id: uuid (FK → users.id)
subject_id: int (FK → subjects.id)
created_at: timestamp
PRIMARY KEY (user_id, subject_id)
```

### Tabla (Junction): `user_achievement`
```typescript
user_id: uuid (FK → users.id)
achievement_id: int (FK → achievements.id)
created_at: timestamp
PRIMARY KEY (user_id, achievement_id)
```

---

## Modificaciones a Tablas Existentes

### `users` (Añadir gamificación)
```typescript
// Campos nuevos:
+ xp: int (default 0) // Experiencia acumulada
+ level: smallint (default 1) // Nivel actual
+ current_streak: smallint (default 0) // Racha actual en días
+ longest_streak: smallint (default 0) // Mejor racha histórica
+ last_activity_date: date // Última fecha de actividad (para calcular streaks)
+ total_points: int (default 0) // Puntos acumulados (distinto a XP)
+ avatar_url: varchar (nullable) // URL de avatar personalizado
+ bio: text (nullable) // Biografía/descripción
+ is_profile_public: boolean (default false) // Perfil público
```

### `units` (Añadir orden y bloqueo)
```typescript
// Campos nuevos:
+ order: smallint (not null) // Orden de presentación
+ unlock_previous_required: boolean (default true) // Requiere completar anterior
+ estimated_duration_minutes: smallint (nullable) // Duración estimada
```

### `quizzes` (Mejorar exámenes)
```typescript
// Campos nuevos:
+ time_limit_seconds: int (nullable) // Límite de tiempo (null = sin límite)
+ started_at: timestamp (nullable) // Hora de inicio
+ finished_at: timestamp (nullable) // Hora de finalización
+ time_spent_seconds: int (nullable) // Tiempo real empleado
+ questions_marked_for_review: jsonb (default '[]') // Array de IDs de preguntas marcadas
+ xp_earned: int (default 0) // XP ganado por este quiz
+ points_earned: int (default 0) // Puntos ganados
```

### `achievements` (Mejorar tipos de logros)
```typescript
// Campos nuevos:
+ type: varchar (not null) // 'streak', 'score', 'completion', 'speed', etc.
+ badge_image_url: varchar (nullable) // URL de imagen del badge
+ category: varchar (nullable) // Categoría del logro
+ rarity: varchar (default 'common') // 'common', 'rare', 'epic', 'legendary'
```

---

## Nuevas Tablas - FASE 1: Gamificación

### `user_stats` (Estadísticas agregadas por usuario)
```typescript
user_id: uuid (PK, FK → users.id)
total_study_time_minutes: int (default 0)
total_lessons_completed: int (default 0)
total_quizzes_completed: int (default 0)
total_questions_answered: int (default 0)
total_correct_answers: int (default 0)
average_quiz_score: decimal(5,2) (nullable)
current_weekly_goal_minutes: int (default 0)
current_weekly_progress_minutes: int (default 0)
last_updated: timestamp
```

### `daily_activity` (Registro de actividad diaria)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
activity_date: date (not null)
study_minutes: int (default 0)
lessons_completed: int (default 0)
quizzes_completed: int (default 0)
xp_earned: int (default 0)
points_earned: int (default 0)
created_at: timestamp
UNIQUE (user_id, activity_date)
INDEX (user_id, activity_date DESC)
```

### `xp_transactions` (Historial de ganancia de XP)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
amount: int (not null)
source_type: varchar (not null) // 'lesson', 'quiz', 'achievement', 'bonus'
source_id: int (nullable) // ID de la lección/quiz/etc
description: varchar
created_at: timestamp
INDEX (user_id, created_at DESC)
```

### `points_transactions` (Historial de puntos)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
amount: int (not null)
source_type: varchar (not null) // 'quiz_score', 'streak_bonus', 'unit_completion', etc.
source_id: int (nullable)
description: varchar
created_at: timestamp
INDEX (user_id, created_at DESC)
```

### `user_badges` (Badges obtenidos por usuario)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
badge_type: varchar (not null) // 'course_leader', 'top_performer', 'hot_streak', etc.
badge_name: varchar (not null)
badge_description: varchar
badge_image_url: varchar
earned_at: timestamp
metadata: jsonb (default '{}') // Info adicional (ej: "7_day_streak")
UNIQUE (user_id, badge_type, metadata)
```

---

## Nuevas Tablas - FASE 2: Contenido Enriquecido

### `lessons` (Lecciones de video/texto)
```typescript
id: serial (PK)
unit_id: int (FK → units.id)
title: varchar (not null)
description: text
type: varchar (not null) // 'video', 'text', 'interactive'
order: smallint (not null) // Orden dentro de la unidad
video_url: varchar (nullable) // URL del video (Cloudinary/Mux)
video_duration_seconds: int (nullable)
content_text: text (nullable) // Contenido en markdown/HTML
estimated_duration_minutes: smallint
xp_reward: int (default 10)
unlock_previous_required: boolean (default true)
active: boolean (default true)
created_at: timestamp
updated_at: timestamp
INDEX (unit_id, order)
```

### `lesson_objectives` (Objetivos de aprendizaje por lección)
```typescript
id: serial (PK)
lesson_id: int (FK → lessons.id)
objective_text: varchar (not null)
order: smallint (not null)
```

### `lesson_resources` (Recursos descargables)
```typescript
id: serial (PK)
lesson_id: int (FK → lessons.id)
title: varchar (not null)
description: text (nullable)
type: varchar (not null) // 'pdf', 'infographic', 'link', 'download'
url: varchar (not null)
file_size_bytes: int (nullable)
order: smallint
created_at: timestamp
```

### `lesson_progress` (Progreso de lecciones por usuario)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
lesson_id: int (FK → lessons.id)
status: varchar (not null) // 'not_started', 'in_progress', 'completed'
progress_percentage: smallint (default 0) // 0-100
video_progress_seconds: int (default 0) // Para videos
completed_at: timestamp (nullable)
time_spent_seconds: int (default 0)
xp_earned: int (default 0)
created_at: timestamp
updated_at: timestamp
UNIQUE (user_id, lesson_id)
INDEX (user_id, status)
```

### `lesson_notes` (Notas personales por lección)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
lesson_id: int (FK → lessons.id)
content: text (not null)
created_at: timestamp
updated_at: timestamp
UNIQUE (user_id, lesson_id)
```

### `unit_progress` (Progreso agregado por unidad)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
unit_id: int (FK → units.id)
lessons_completed: int (default 0)
lessons_total: int (not null)
quizzes_completed: int (default 0)
average_quiz_score: decimal(5,2) (nullable)
progress_percentage: smallint (default 0) // 0-100
is_unlocked: boolean (default false)
unlocked_at: timestamp (nullable)
completed_at: timestamp (nullable)
created_at: timestamp
updated_at: timestamp
UNIQUE (user_id, unit_id)
INDEX (user_id, unit_id)
```

### `question_tips` (Tips contextuales para preguntas)
```typescript
id: serial (PK)
question_id: int (FK → questions.id)
tip_text: text (not null)
order: smallint (default 1)
```

---

## Nuevas Tablas - FASE 3: Rankings y Social

### `leaderboard_cache` (Cache de rankings - actualización periódica)
```typescript
id: serial (PK)
subject_id: int (FK → subjects.id, nullable) // null = global
period: varchar (not null) // 'weekly', 'monthly', 'all_time'
user_id: uuid (FK → users.id)
rank_position: int (not null)
total_points: int (not null)
average_score: decimal(5,2)
quizzes_completed: int
current_streak: int
updated_at: timestamp
UNIQUE (subject_id, period, user_id)
INDEX (subject_id, period, rank_position)
INDEX (updated_at) // Para limpieza periódica
```

### `user_profiles` (Perfiles públicos/semi-públicos)
```typescript
user_id: uuid (PK, FK → users.id)
display_name: varchar (nullable) // Nombre público (puede ser diferente a full_name)
headline: varchar (nullable) // "Opositor a RTVE"
show_stats: boolean (default true)
show_badges: boolean (default true)
show_rank: boolean (default true)
show_streak: boolean (default true)
created_at: timestamp
updated_at: timestamp
```

---

## Nuevas Tablas - FASE 4: Portal y Descubrimiento (Diferido)

### `oposiciones` (Catálogo de oposiciones)
```typescript
id: serial (PK)
name: varchar (not null)
slug: varchar (unique, not null)
category: varchar (not null) // 'rtve', 'justicia', 'hacienda', etc.
description: text
total_plazas: int (nullable)
convocatoria_fecha: date (nullable)
is_available: boolean (default false) // false = "Próximamente"
featured: boolean (default false)
image_url: varchar (nullable)
created_at: timestamp
updated_at: timestamp
```

### `subject_oposiciones` (Relación materias ↔ oposiciones)
```typescript
subject_id: int (FK → subjects.id)
oposicion_id: int (FK → oposiciones.id)
PRIMARY KEY (subject_id, oposicion_id)
```

### `news_articles` (Noticias internas - admin)
```typescript
id: serial (PK)
title: varchar (not null)
slug: varchar (unique, not null)
excerpt: text
content: text (not null) // Markdown/HTML
category: varchar (not null) // 'convocatorias', 'normativa', 'consejos'
author_id: uuid (FK → users.id) // Profesor/admin que lo escribe
featured: boolean (default false)
read_time_minutes: smallint (nullable)
published_at: timestamp (nullable) // null = draft
created_at: timestamp
updated_at: timestamp
INDEX (category, published_at DESC)
INDEX (published_at DESC)
```

### `blog_posts` (Artículos de blog - baja prioridad)
```typescript
id: serial (PK)
title: varchar (not null)
slug: varchar (unique, not null)
excerpt: text
content: text (not null)
category: varchar // 'guias', 'experiencias', 'recursos'
author_id: uuid (FK → users.id)
featured: boolean (default false)
read_time_minutes: smallint (nullable)
published_at: timestamp (nullable)
created_at: timestamp
updated_at: timestamp
```

### `user_preferences` (Preferencias de usuario)
```typescript
user_id: uuid (PK, FK → users.id)
target_oposicion_id: int (nullable, FK → oposiciones.id)
difficulty_preference: varchar (default 'medium') // 'easy', 'medium', 'hard'
daily_study_goal_minutes: int (default 30)
email_notifications: boolean (default true)
push_notifications: boolean (default false)
study_reminders: boolean (default false)
reminder_time: time (nullable) // Hora del día para recordatorios
created_at: timestamp
updated_at: timestamp
```

---

## Nuevas Tablas - FASE 5: Monetización (Diferido)

### `subscriptions` (Suscripciones de usuarios)
```typescript
id: serial (PK)
user_id: uuid (FK → users.id)
tier: varchar (not null) // 'free', 'pro_monthly', 'pro_annual'
status: varchar (not null) // 'active', 'cancelled', 'expired', 'trial'
start_date: timestamp (not null)
end_date: timestamp (nullable)
payment_provider: varchar (nullable) // 'stripe', 'paypal', etc.
external_subscription_id: varchar (nullable) // ID en el proveedor de pago
created_at: timestamp
updated_at: timestamp
INDEX (user_id, status)
```

---

## Herramientas y Librerías Open Source Recomendadas

### Gamificación
- **Base de datos**: PostgreSQL (actual) - suficiente para toda la gamificación
- **Cache**: [Redis](https://redis.io/) - para rankings en tiempo real y cache de leaderboards
- **Background Jobs**: [BullMQ](https://github.com/taskforcesh/bullmq) - para calcular rankings, procesar streaks, enviar notificaciones

### Contenido de Video
- **Hosting de Videos**: 
  - [Cloudflare Stream](https://www.cloudflare.com/products/cloudflare-stream/) (gratis hasta 1000 minutos)
  - [Mux](https://www.mux.com/) - player open source, API simple
  - [Bunny.net](https://bunny.net/) - económico, con CDN
- **Player**: [video.js](https://github.com/videojs/video.js) - open source, customizable
- **Markdown/Rich Text**: [MDX](https://mdxjs.com/) - integración perfecta con Next.js

### Rankings y Leaderboards
- **Redis Sorted Sets** - ideal para rankings en tiempo real
- Queries PostgreSQL optimizados con `RANK()` y `DENSE_RANK()` para leaderboards
- **Índices compuestos** en `leaderboard_cache` para queries rápidas

### Notificaciones
- **Email**: [React Email](https://react.email/) + [Resend](https://resend.com/) o [SendGrid](https://sendgrid.com/)
- **Push Notifications**: [web-push](https://github.com/web-push-libs/web-push) - implementación PWA
- **In-app**: [React Hot Toast](https://react-hot-toast.com/) o [Sonner](https://sonner.emilkowal.ski/) (ya en el proyecto)
- **Scheduling**: [node-cron](https://github.com/node-cron/node-cron) o BullMQ

### Analytics y Tracking
- **[Posthog](https://github.com/PostHog/posthog)** - open source, self-hosted o cloud
- **[Plausible Analytics](https://github.com/plausible/analytics)** - privacy-first, open source
- **[Umami](https://github.com/umami-software/umami)** - simple, self-hosted

### UI/UX Enhancements
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/) - ya compatible con React/Next.js
- **Charts**: [Recharts](https://recharts.org/) o [Chart.js](https://www.chartjs.org/) - para gráficas de progreso
- **Confetti**: [canvas-confetti](https://github.com/catdad/canvas-confetti) - para celebrar logros
- **Progress Bars**: [nprogress](https://github.com/rstacruz/nprogress) o componentes custom

### ORM y Database
- **Mantener Drizzle ORM** (actual) - excelente elección, type-safe
- **Migraciones**: Drizzle-kit (ya configurado)
- **Connection Pooling**: PgBouncer si se escala mucho

### Caché y Performance
- **Redis** - para:
  - Cache de queries frecuentes (leaderboards, stats)
  - Session storage
  - Rate limiting
  - Real-time features (si se añaden)
- **Next.js Cache**: Usar ISR (Incremental Static Regeneration) para contenido estático
- **CDN**: Cloudflare o Vercel Edge Network

### Testing
- **[Vitest](https://vitest.dev/)** - test runner rápido, compatible con Vite
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[MSW](https://mswjs.io/)** - mock de API calls

### Pagos (Fase 5)
- **[Stripe](https://stripe.com/)** - librería official `@stripe/stripe-js`
- **[Lemon Squeezy](https://www.lemonsqueezy.com/)** - alternativa más simple, MoR incluido

---

## Breaking Changes y Stack Improvements Sugeridos

### Opcional pero Recomendado:

1. **Añadir Redis** - significativa mejora en performance para rankings y cache
   ```bash
   # Docker compose para desarrollo local
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Implementar React Server Components** más agresivamente
   - Streaming de contenido
   - Parallel data fetching
   - Reducir bundle de JavaScript cliente

3. **Configurar BullMQ** para jobs asíncronos
   - Cálculo periódico de leaderboards
   - Procesamiento de streaks diarias
   - Envío de emails/notificaciones
   - Generación de stats agregadas

4. **PWA (Progressive Web App)**
   - Service Workers para offline support
   - Push notifications
   - Install to home screen
   - Ya tienes `manifest.json` - solo falta configurar SW

5. **Optimistic UI Updates**
   - React Query / SWR para cache cliente
   - Mejora UX en acciones de usuario

6. **Image Optimization**
   - Next.js Image component (ya disponible)
   - Cloudinary para transformaciones dinámicas
   - WebP/AVIF formats

### No Recomendado (Mantener):
- ✅ Next.js (excelente elección)
- ✅ Supabase Auth (funciona bien)
- ✅ Drizzle ORM (type-safe, buen rendimiento)
- ✅ TailwindCSS (productividad alta)
- ✅ shadcn/ui (componentes de calidad)

---

## Índices Críticos para Performance

```sql
-- Índices esenciales para gamificación
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, activity_date DESC);
CREATE INDEX idx_xp_transactions_user_date ON xp_transactions(user_id, created_at DESC);
CREATE INDEX idx_leaderboard_cache_ranking ON leaderboard_cache(subject_id, period, rank_position);
CREATE INDEX idx_lesson_progress_user_status ON lesson_progress(user_id, status);
CREATE INDEX idx_unit_progress_user ON unit_progress(user_id, unit_id);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_quizzes_user_created ON quizzes(user_id, created_at DESC);
CREATE INDEX idx_lessons_unit_order ON lessons(unit_id, order);
CREATE INDEX idx_units_subject_order ON units(subject_id, order);
```

---

## Estrategia de Migración

1. **Crear nuevas tablas** sin afectar las existentes
2. **Añadir nuevas columnas** con valores default seguros
3. **Poblar datos históricos** mediante scripts de migración:
   - Calcular XP retroactivo de quizzes existentes
   - Generar `daily_activity` desde historial de quizzes
   - Crear `user_stats` a partir de datos actuales
4. **Ejecutar migraciones** en entorno de desarrollo primero
5. **Testing exhaustivo** antes de producción
6. **Rollback plan** para cada migración
