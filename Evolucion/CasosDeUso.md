# Casos de Uso - Roadmap de Evolución

> **Última actualización**: 21 de enero de 2026  
> **Equipo**: 1 Backend Developer + 1 Full Stack Developer

---

## 📊 Estado Actual (✅ Implementado)

### Autenticación
- ✅ Registro de usuarios con email/contraseña (`app/(auth)`)
- ✅ Login con email/contraseña
- ✅ Control de acceso basado en roles (Estudiante/Profesor)
- ✅ Gestión de sesiones con Supabase Auth
- ✅ Middleware de protección de rutas

### Gestión de Contenido (Profesores)
- ✅ CRUD completo de materias (subjects)
  - `controllers/subjects.ts`: addSubject, updateSubject, deleteSubject
  - `app/(main)/teach/`: UI de gestión
- ✅ CRUD completo de unidades (units)
  - `controllers/unit.ts`: addUnit, updateUnit, deleteUnit
  - Configurar preguntas por quiz (5-15)
- ✅ CRUD de preguntas y respuestas
  - `controllers/questions.ts` y `controllers/answers.ts`
  - Marcar respuestas correctas
  - Campo `hard` para dificultad
- ✅ Activar/desactivar materias, unidades y preguntas (campo `active`)

### Sistema de Evaluación (Estudiantes)
- ✅ Ver materias activas disponibles
  - `getNotEnrolledSubjects(userId)` - materias no inscritas
  - `getEnrolledSubjects(userId)` - materias inscritas
- ✅ Inscribirse a materias
  - `enrollSubjects(userId, subjectIds[])`
  - Tabla `user_subjects` (many-to-many)
- ✅ Realizar quizzes
  - `app/(main)/quiz/[id]/`: UI de quiz
  - Generación aleatoria de preguntas por unidad
  - `submitQuiz()` en `controllers/quizzes.ts`
- ✅ Ver puntuación obtenida
  - Campo `score` en tabla `quizzes`
- ✅ Historial de quizzes
  - `getActiveQuizzes(userId, subjectId)` agrupa por unidad
  - Tabla `quiz_details` con respuestas detalladas

### Sistema de Logros (Básico)
- ✅ Tabla `achievements` con campos:
  - name, description, threshold, type, icon
- ✅ Tabla `user_achievement` (many-to-many con users)
- ✅ Función `checkAndAssignAchievements()` en controllers
- ⚠️ **NOTA**: Sistema básico implementado pero no integrado en UI

---

## 🔄 REWORKS Necesarios (Infraestructura y Arquitectura)

### REWORK-1: Dockerización del Proyecto
**Prioridad:** 🔴 CRÍTICA  
**Responsable:** Backend Developer  
**Estimación:** 2-3 días

**Descripción:**
Containerizar toda la aplicación para desarrollo y despliegue local.

**Tareas:**
- [ ] Crear `docker-compose.yml` con servicios:
  - PostgreSQL (base de datos principal)
  - Redis (caché y jobs)
  - Next.js App (frontend + API)
  - BullMQ Worker (jobs en background)
  - Bull Board (dashboard de jobs - opcional)
- [ ] Crear `Dockerfile` para Next.js
- [ ] Crear `Dockerfile.worker` para BullMQ workers
- [ ] Configurar variables de entorno
- [ ] Documentar comandos de Docker en README
- [ ] Healthchecks para todos los servicios

**Archivos afectados:**
- `docker-compose.yml` (nuevo)
- `Dockerfile` (nuevo)
- `Dockerfile.worker` (nuevo)
- `.dockerignore` (nuevo)
- `README.md` (actualizar)

---

### REWORK-2: Implementar Redis para Caché
**Prioridad:** 🔴 CRÍTICA  
**Responsable:** Backend Developer  
**Estimación:** 2 días  
**Depende de:** REWORK-1

**Descripción:**
Añadir Redis como capa de caché para mejorar performance de rankings y sesiones.

**Tareas:**
- [ ] Instalar dependencias: `ioredis` o `@upstash/redis`
- [ ] Crear cliente Redis (`lib/redis/client.ts`)
- [ ] Implementar `LeaderboardService` con Sorted Sets
- [ ] Implementar `QuizSessionService` para sesiones temporales
- [ ] Implementar `RateLimiter` para prevenir spam
- [ ] Configurar TTL (Time To Live) apropiados

**Archivos nuevos:**
- `lib/redis/client.ts`
- `lib/redis/leaderboard.ts`
- `lib/redis/quiz-session.ts`
- `lib/redis/rate-limiter.ts`

**Archivos modificados:**
- `controllers/quizzes.ts` (usar sesiones Redis)
- API routes (añadir rate limiting)

---

### REWORK-3: Implementar BullMQ para Jobs Asíncronos
**Prioridad:** 🔴 CRÍTICA  
**Responsable:** Backend Developer  
**Estimación:** 3-4 días  
**Depende de:** REWORK-2

**Descripción:**
Implementar sistema de colas para procesamiento asíncrono de tareas pesadas.

**Tareas:**
- [ ] Instalar dependencia: `bullmq`
- [ ] Crear estructura de workers:
  - `workers/index.ts` (entry point)
  - `workers/queues/` (definiciones de queues)
  - `workers/processors/` (lógica de procesamiento)
- [ ] Implementar queues:
  - `ranking.queue.ts` - Calcular rankings periódicamente
  - `streak.queue.ts` - Verificar streaks diarios
  - `achievement.queue.ts` - Asignar badges automáticamente
  - `email.queue.ts` - Enviar emails/notificaciones
- [ ] Implementar processors para cada queue
- [ ] Configurar jobs recurrentes (cron)
- [ ] Añadir Bull Board para monitoreo

**Archivos nuevos:**
- `workers/index.ts`
- `workers/queues/*.ts`
- `workers/processors/*.ts`
- `package.json` (script `build:worker`)

**Archivos modificados:**
- `controllers/quizzes.ts` (encolar job al completar quiz)
- `controllers/achievements.ts` (usar queue)

---

### REWORK-4: Migración de Schema de Base de Datos
**Prioridad:** 🟠 ALTA  
**Responsable:** Backend Developer  
**Estimación:** 2 días  
**Depende de:** REWORK-1

**Descripción:**
Añadir campos de gamificación a tablas existentes y crear nuevas tablas.

**Tareas:**
- [ ] Modificar tabla `users`:
  - Añadir: `xp`, `level`, `current_streak`, `longest_streak`, `last_activity_date`, `total_points`
  - Añadir: `avatar_url`, `bio`, `is_profile_public`
- [ ] Modificar tabla `units`:
  - Añadir: `order`, `unlock_previous_required`, `estimated_duration_minutes`
- [ ] Modificar tabla `quizzes`:
  - Añadir: `time_limit_seconds`, `started_at`, `finished_at`, `time_spent_seconds`
  - Añadir: `questions_marked_for_review` (jsonb), `xp_earned`, `points_earned`
- [ ] Modificar tabla `achievements`:
  - Añadir: `type`, `badge_image_url`, `category`, `rarity`
- [ ] Crear nuevas tablas:
  - `user_stats` (estadísticas agregadas)
  - `daily_activity` (actividad diaria)
  - `xp_transactions` (historial de XP)
  - `points_transactions` (historial de puntos)
  - `user_badges` (badges obtenidos)
- [ ] Generar migraciones con Drizzle Kit
- [ ] Crear scripts de población de datos históricos

**Archivos modificados:**
- `drizzle/schema.ts`
- `schemas/*.ts`

**Archivos nuevos:**
- `drizzle/migrations/XXXX_add_gamification.sql`
- `scripts/migrate-historical-data.ts`

---

## 📋 RESUMEN DE CASOS DE USO

> **NOTA:** Este documento contiene el análisis de casos de uso.  
> **Para el roadmap detallado con tareas y estimaciones, ver [ROADMAP.md](./ROADMAP.md)**

### ✅ Casos de Uso Implementados

Todos los casos de uso básicos están implementados:
- Autenticación (registro, login, roles)
- Gestión de contenido por profesores (materias, unidades, preguntas)
- Sistema de evaluación para estudiantes (inscripción, quizzes, historial)
- Sistema de logros básico (sin UI integrada)

### 🎯 Casos de Uso Prioritarios (Próximos 3 Meses)

Ver **[ROADMAP.md](./ROADMAP.md)** para detalles completos.

**Sprint 1-2 (Infraestructura):**
- Dockerización completa
- Redis para caché
- BullMQ para jobs asíncronos
- Migración de BD con campos de gamificación

**Sprint 3-7 (Gamificación):**
- Sistema de XP y niveles
- Sistema de rachas (streaks)
- Sistema de puntos y badges
- Rankings/leaderboards
- Dashboard de progreso
- UI completa de gamificación

**Sprint 8-12 (Contenido Enriquecido):**
- Sistema de lecciones con videos
- Desbloqueo secuencial de contenido
- Exámenes mejorados (timer, navegación)
- Temario visual mejorado

**Sprint 13 (Social):**
- Perfiles públicos
- Polish final

### 🔮 Casos de Uso Diferidos

**Portal y Descubrimiento (FASE 6):**
- Catálogo de oposiciones
- Sistema de noticias
- Blog interno

**Monetización (FASE 7):**
- Suscripciones (Free, Pro)
- Límites por tier
- Integración con Stripe

---

## 🔄 REWORKS Identificados

### REWORK-1: Dockerización
**Problema:** Difícil setup local, dependencias manuales  
**Solución:** Docker Compose con 5 servicios (PostgreSQL, Redis, Next.js, Worker, Bull Board)  
**Ver:** [ROADMAP.md - Sprint 1-2](./ROADMAP.md#sprint-1-2-infraestructura-semanas-1-2)

### REWORK-2: Redis para Caché
**Problema:** Rankings y stats calculados en cada request (lentos)  
**Solución:** Redis Sorted Sets para rankings, caché con TTL  
**Ver:** [ROADMAP.md - Sprint 1-2](./ROADMAP.md#rework-2-redis-para-caché)

### REWORK-3: BullMQ para Jobs Asíncronos
**Problema:** Tareas pesadas bloquean respuestas HTTP  
**Solución:** Workers en background para rankings, streaks, badges, emails  
**Ver:** [ROADMAP.md - Sprint 1-2](./ROADMAP.md#rework-3-bullmq-para-jobs-asíncronos)

### REWORK-4: Migración de BD
**Problema:** Schema actual no soporta gamificación  
**Solución:** Añadir campos a tablas existentes + crear 6 tablas nuevas  
**Ver:** [ROADMAP.md - Sprint 1-2](./ROADMAP.md#rework-4-migración-de-base-de-datos)

---

## 📊 Matriz de Casos de Uso

| Caso de Uso | Actor | Estado | Prioridad | Sprint |
|-------------|-------|--------|-----------|--------|
| **Autenticación** |
| Registro de usuario | Usuario | ✅ Implementado | - | - |
| Login | Usuario | ✅ Implementado | - | - |
| Control de roles | Sistema | ✅ Implementado | - | - |
| **Gestión de Contenido (Profesor)** |
| CRUD de materias | Profesor | ✅ Implementado | - | - |
| CRUD de unidades | Profesor | ✅ Implementado | - | - |
| CRUD de preguntas | Profesor | ✅ Implementado | - | - |
| CRUD de lecciones | Profesor | ❌ Pendiente | Media | 8-9 |
| Configurar desbloqueos | Profesor | ❌ Pendiente | Media | 8-9 |
| **Evaluación (Estudiante)** |
| Ver materias | Estudiante | ✅ Implementado | - | - |
| Inscribirse a materia | Estudiante | ✅ Implementado | - | - |
| Realizar quiz | Estudiante | ✅ Implementado | - | - |
| Ver resultados | Estudiante | ✅ Implementado | - | - |
| Ver historial | Estudiante | ✅ Implementado | - | - |
| Realizar quiz con timer | Estudiante | ❌ Pendiente | Alta | 5-7 |
| Marcar preguntas | Estudiante | ❌ Pendiente | Alta | 5-7 |
| **Lecciones (Estudiante)** |
| Ver lecciones | Estudiante | ❌ Pendiente | Media | 10-12 |
| Reproducir video | Estudiante | ❌ Pendiente | Media | 10-12 |
| Leer contenido texto | Estudiante | ❌ Pendiente | Media | 10-12 |
| Tomar notas | Estudiante | ❌ Pendiente | Baja | 10-12 |
| Marcar lección completa | Estudiante | ❌ Pendiente | Media | 10-12 |
| **Gamificación (Estudiante)** |
| Ganar XP | Estudiante | ❌ Pendiente | Alta | 3-4 |
| Subir de nivel | Estudiante | ❌ Pendiente | Alta | 3-4 |
| Mantener racha | Estudiante | ❌ Pendiente | Alta | 3-4 |
| Ganar puntos | Estudiante | ❌ Pendiente | Alta | 3-4 |
| Obtener badges | Estudiante | ❌ Pendiente | Alta | 3-4 |
| Ver dashboard | Estudiante | ❌ Pendiente | Alta | 5-7 |
| Ver badges | Estudiante | ❌ Pendiente | Alta | 5-7 |
| Ver ranking | Estudiante | ❌ Pendiente | Alta | 5-7 |
| **Social (Estudiante)** |
| Ver perfil público | Estudiante | ❌ Pendiente | Baja | 13 |
| Configurar privacidad | Estudiante | ❌ Pendiente | Baja | 13 |
| **Sistema (Background)** |
| Calcular rankings | Sistema | ❌ Pendiente | Alta | 3-4 |
| Verificar streaks | Sistema | ❌ Pendiente | Alta | 3-4 |
| Asignar badges | Sistema | ❌ Pendiente | Alta | 3-4 |
| Agregar stats | Sistema | ❌ Pendiente | Media | 3-4 |
| Enviar notificaciones | Sistema | ❌ Pendiente | Media | 3-4 |

---

## 🔗 Ver También

- **[ROADMAP.md](./ROADMAP.md)** - Roadmap detallado con estimaciones y tareas
- **[Architecture.md](./Architecture.md)** - Arquitectura técnica con Redis y BullMQ
- **[ModeloDeDatos.md](./ModeloDeDatos.md)** - Schema completo de BD
- **[../Jean-Monet-Serious-Game.wiki/Diagramas.md](../Jean-Monet-Serious-Game.wiki/Diagramas.md)** - Diagramas de casos de uso actuales
