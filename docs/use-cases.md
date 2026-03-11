# Use Cases

Living document. **Update in the same PR that changes the flow.**
Wireframe mockups live in `Evolucion/`.

---

## Index

| UC | Name | Phase | Actor |
|----|------|-------|-------|
| [UC-01](#uc-01--sign-up) | Sign up | 0 | Student |
| [UC-02](#uc-02--sign-in) | Sign in | 0 | Student / Teacher |
| [UC-03](#uc-03--student-enrolls-in-a-subject) | Student enrolls in a subject | 0 | Student |
| [UC-04](#uc-04--teacher-manages-content-backoffice) | Teacher manages content (backoffice) | 0 | Teacher |
| [UC-05](#uc-05--student-initiates-subscription) | Student initiates subscription | 0 | Student |
| [UC-06](#uc-06--student-takes-a-quiz) | Student takes a quiz | 1 | Student |
| [UC-07](#uc-07--student-earns-an-achievement) | Student earns an achievement | 1 | Student |
| [UC-08](#uc-08--student-views-leaderboard) | Student views leaderboard | 1 | Student |
| [UC-09](#uc-09--student-views-dashboard) | Student views dashboard | 1 | Student |
| [UC-10](#uc-10--teacher-creates--edits-a-lesson) | Teacher creates / edits a lesson | 2 | Teacher |
| [UC-11](#uc-11--student-reads-a-lesson) | Student reads a lesson | 2 | Student |
| [UC-12](#uc-12--sequential-unit-unlock) | Sequential unit unlock | 2 | Student |
| [UC-13](#uc-13--student-upgrades-plan) | Student upgrades plan | 3 | Student |
| [UC-14](#uc-14--free-tier-content-gate) | Free-tier content gate | 3 | Student |
| [UC-15](#uc-15--student-manages-subscription) | Student manages subscription | 3 | Student |
| [UC-16](#uc-16--nightly-streak-validation-job) | Nightly streak validation (job) | 4 | System |
| [UC-17](#uc-17--achievement-notification-job) | Achievement notification (job) | 4 | System |
| [UC-18](#uc-18--browse-oposiciones-catalogue) | Browse oposiciones catalogue | 5 | Student |
| [UC-19](#uc-19--convocatorias--news-feed) | Convocatorias / news feed | 5 | Student |
| [UC-20](#uc-20--public-student-profile) | Public student profile | 5 | Student |

---

## Phase 0 — Foundation

---

### UC-01 · Sign up
**Actor:** Student
**Wireframe:** `Evolucion/tufolio_registro user.html`
**Entry:** Landing page → "Empieza gratis" → `/sign-up`

| Layer | File | Role |
|-------|------|------|
| Page | `app/(auth)/sign-up/page.tsx` | Form: nombre, apellido, email, contraseña, confirmar |
| Action | `controllers/auth.ts · signUp()` | Validates passwords match, calls Better Auth |
| Auth | `lib/auth.ts` | Creates session, writes to `users` + `accounts` + `sessions` |
| DB | `users`, `accounts`, `sessions` | User record created with `role = "student"` |

**Flujo:**
1. User rellena el formulario → submit → `signUp()` server action
2. Better Auth crea el usuario en `users` y la cuenta en `accounts`
3. Sesión creada → cookie HttpOnly → redirect a `/study`

**Edge cases:** email ya registrado · contraseñas no coinciden · email inválido

---

### UC-02 · Sign in
**Actor:** Student / Teacher
**Wireframe:** `Evolucion/tufolio_inicio sesion.html`
**Entry:** `/sign-in`

| Layer | File | Role |
|-------|------|------|
| Page | `app/(auth)/sign-in/page.tsx` | Form: email + contraseña |
| Action | `controllers/auth.ts · signIn()` | Calls Better Auth signInEmail |
| Auth | `lib/auth.ts` | Verifica credenciales, emite sesión |
| Middleware | `middleware.ts` | Comprueba sesión en cada request; redirige a `/sign-in` si ausente |
| DB | `sessions`, `accounts` | Sesión persistida |

**Flujo:**
1. User envía credenciales → `signIn()` server action
2. Better Auth verifica → crea sesión → redirect según `role`:
   - `student` → `/study`
   - `teacher` → `/teach`

**Edge cases:** credenciales incorrectas · cuenta inexistente · sesión expirada (middleware redirige)

---

### UC-03 · Student enrolls in a subject
**Actor:** Student
**Wireframe:** `Evolucion/tufolio_temario.html` (vista resultante)
**Entry:** `/study` → card de asignatura disponible → "Inscribirme"

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/study/page.tsx` | Lista asignaturas inscritas + disponibles |
| API | `POST /api/subjects` | Llama a `enrollSubjects()` |
| Controller | `controllers/subjects.ts · enrollSubjects()` | Inserta en `user_subjects` |
| Controller | `controllers/subjects.ts · getNotEnrolledSubjects()` | Filtra asignaturas disponibles |
| DB | `user_subjects`, `subjects` | M2M enrollment |

**Flujo:**
1. `/study` carga asignaturas inscritas (`getEnrolledSubjects`) y disponibles (`getNotEnrolledSubjects`)
2. Student pulsa "Inscribirme" → `POST /api/subjects` con `subjectIds[]`
3. Se insertan filas en `user_subjects` → la asignatura aparece en "Mis cursos"

**Edge cases:** ya inscrito · asignatura inactiva (`active = false`) · sin suscripción para asignaturas de pago (Phase 3)

---

### UC-04 · Teacher manages content (backoffice)
**Actor:** Teacher
**Entry:** `/teach` → selecciona asignatura → `/teach/[id]` → selecciona unidad → `/build/[id]/[unitId]`

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/teach/page.tsx` | Lista todas las asignaturas |
| Page | `app/(main)/teach/[id]/page.tsx` | Vista de asignatura: tabla de unidades |
| Page | `app/(main)/build/[id]/[unitId]/page.tsx` | Editor de preguntas (`QuestionBuilder`) |
| Middleware | `middleware.ts` | Bloquea acceso a `/teach` y `/build` si `role = "student"` |
| Controller | `controllers/subjects.ts` | `addSubject`, `updateSubject`, `deleteSubject`, `getSubject` |
| Controller | `controllers/unit.ts` | `addUnit`, `updateUnit`, `deleteUnit`, `getUnits` |
| Controller | `controllers/questions.ts` | `getQuestionsFromUnit`, add/edit/delete questions + answers |
| API | `GET/POST /api/subjects` | CRUD asignaturas |
| API | `GET/PUT/DELETE /api/subjects/[id]` | CRUD asignatura individual |
| DB | `subjects`, `units`, `questions`, `answers` | Contenido del curso |

**Flujo (crear pregunta):**
1. Teacher va a `/build/[subjectId]/[unitId]`
2. `QuestionBuilder` carga preguntas existentes (`getQuestionsFromUnit`)
3. Teacher añade pregunta + 4 respuestas, marca la correcta
4. Guarda → persiste en `questions` + `answers`

**Edge cases:** unidad sin preguntas (quiz no disponible para students) · asignatura inactiva no visible para students

---

### UC-05 · Student initiates subscription
**Actor:** Student
**Entry:** Call-to-action en landing o gate de contenido → checkout de Lemon Squeezy (externo)

| Layer | File | Role |
|-------|------|------|
| Webhook | `app/api/webhooks/lemonsqueezy/route.ts` | Recibe evento `subscription_created` |
| DB | `users.subscription_tier`, `subscriptions` | Actualiza tier y guarda datos de suscripción |

**Flujo:**
1. Student pulsa "Suscríbete" → redirige a Lemon Squeezy checkout (externo)
2. Pago completado → Lemon Squeezy envía webhook `subscription_created`
3. Webhook handler actualiza `users.subscription_tier` y crea fila en `subscriptions`
4. Student accede a contenido de pago

**Edge cases:** webhook llegado antes de que el user exista · fallo de red en webhook (Lemon Squeezy reintenta) · suscripción cancelada (`subscription_cancelled` webhook)

> UI de inicio de suscripción (pricing page, botón checkout) se implementa en Phase 3 (UC-13).

---

## Phase 1 — Gamification

---

### UC-06 · Student takes a quiz
**Actor:** Student
**Wireframe:** `Evolucion/tufolio_examenes.html`
**Entry:** `/study/[subjectId]` → unidad → "Iniciar test" → `/quiz/[quizId]`

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/study/[id]/page.tsx` | Lista unidades con estado (completado / en progreso / bloqueado) |
| Page | `app/(main)/quiz/[id]/page.tsx` | Motor del quiz: pregunta, opciones, timer (Phase 2), navegación |
| API | `POST /api/quizzes` | Crea fila en `quizzes`, genera `quiz_details` por cada pregunta |
| API | `PATCH /api/quizzes/[id]` | *(Phase 2)* Registra respuesta individual |
| API | `POST /api/quizzes/[id]/finish` | Score final, XP, puntos, streak update |
| Controller | `controllers/quizzes.ts · getActiveQuizzes()` | Carga quizzes activos de una asignatura por unidad |
| Controller | `controllers/quizzes.ts · getQuiz()` | Devuelve preguntas barajadas con respuestas |
| Controller | `controllers/quizzes.ts · submitQuiz()` | Persiste resultado si mejora el score previo |
| Controller | `controllers/quizzes.ts · updateScore()` | Actualiza `quizzes.score` |
| Controller | `controllers/achievements.ts · checkAndAssignAchievements()` | Evalúa y asigna logros tras el quiz |
| DB | `quizzes`, `quiz_details`, `users` (xp, points), `daily_activity` | Estado y resultado |

**Flujo:**
1. Student pulsa "Iniciar" → `POST /api/quizzes` → crea `quizzes` + `quiz_details` por pregunta
2. Responde cada pregunta (opciones A/B/C/D) → botón "Siguiente"
3. Última pregunta → "Finalizar" → `submitQuiz()`:
   - Si `score > previousScore`: actualiza score + quiz_details
   - Llama a `checkAndAssignAchievements()`
4. Muestra pantalla de resultados con breakdown de respuestas + explicaciones

**Edge cases:** unidad sin preguntas · quiz previo no finalizado · empate de score (no sobrescribe) · unidad bloqueada por suscripción (Phase 3)

---

### UC-07 · Student earns an achievement
**Actor:** Student (disparado por sistema al finalizar quiz)
**Entry:** Automático tras `submitQuiz()`

| Layer | File | Role |
|-------|------|------|
| Controller | `controllers/achievements.ts · checkAndAssignAchievements()` | Query SQL sobre `view_counter_achievements`; inserta en `user_achievements` si cumple umbral |
| Controller | `controllers/achievements.ts · getAchievements()` | Recupera logros del usuario para mostrar en perfil/dashboard |
| DB | `achievements`, `user_achievements`, `view_counter_achievements` (vista) | Definición y asignación de logros |

**Flujo:**
1. `submitQuiz()` llama a `checkAndAssignAchievements()`
2. La función consulta la vista `view_counter_achievements` (quizzes hechos, pasados, perfectos)
3. Compara con umbrales de `achievements`; inserta en `user_achievements` los no asignados aún
4. UI muestra el logro desbloqueado (toast / modal en resultados del quiz)

**Tipos de logros:** score (nota), streak (racha), completion (lecciones), speed (tiempo) ← Phase 2

---

### UC-08 · Student views leaderboard
**Actor:** Student
**Wireframe:** `Evolucion/tufolio_ranking.html`
**Entry:** Navegación principal → "Ranking" → `/leaderboard` *(ruta pendiente)*

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/leaderboard/page.tsx` *(por crear)* | Tabla de ranking con tabs: por asignatura / global; filtro de periodo |
| API | `GET /api/leaderboard?subjectId=&period=` *(por crear)* | Devuelve ranking paginado |
| Controller | `controllers/leaderboard.ts` *(por crear)* | Query PostgreSQL `RANK()` sobre `users.total_points` o `xp_transactions` |
| Cache | `lib/redis/leaderboard.ts` | Cache 5 min por subject; invalida tras `submitQuiz` |
| DB | `users`, `user_subjects`, `xp_transactions` | Fuente de datos del ranking |

**Flujo:**
1. Student accede a `/leaderboard` → carga ranking global por defecto
2. Puede filtrar por asignatura (tab) y periodo (semana / mes / total)
3. Cache Redis sirve la respuesta; si miss → query PostgreSQL `RANK()` → escribe cache

**Edge cases:** empate en puntos (mismo rank) · student no inscrito en asignatura filtrada

---

### UC-09 · Student views dashboard
**Actor:** Student
**Wireframe:** `Evolucion/tufolio_portal por dentro.html` (sección "Inicio")
**Entry:** `/study` (home del área privada) o navegación principal

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/study/page.tsx` | Bienvenida, barra XP, nivel, streak, logros recientes, "continúa donde lo dejaste" |
| Controller | `controllers/profiles.ts · getProfileInfo()` | Nombre, iniciales, fecha de registro |
| Controller | `controllers/profiles.ts · getUserStats()` | Quizzes hechos, pasados, perfectos |
| Controller | `controllers/achievements.ts · getAchievements()` | Últimos logros para mostrar badges |
| DB | `users` (xp, level, streak), `user_stats`, `user_achievements`, `daily_activity` | Métricas del estudiante |

**Flujo:**
1. SSR: carga paralela de `getProfileInfo`, `getUserStats`, `getAchievements`, datos de asignaturas
2. Renderiza: barra XP con nivel · contador de racha · badges recientes · tarjetas de asignaturas inscritas

---

## Phase 2 — Content

---

### UC-10 · Teacher creates / edits a lesson
**Actor:** Teacher
**Wireframe:** `Evolucion/tufolio_lecciones.html` (vista del estudiante resultante)
**Entry:** `/build/[subjectId]/[unitId]` → pestaña "Lecciones" → "Nueva lección"

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/build/[id]/[unitId]/page.tsx` | Editor de lección: título, orden, tipo, contenido markdown |
| API | `POST /api/lessons` *(por crear)* | Crea lección; opcionalmente solicita presigned URL para adjunto |
| API | `GET /api/upload/presign` *(por crear)* | Genera presigned URL de Cloudflare R2 |
| Controller | `controllers/lessons.ts` *(por crear)* | `addLesson`, `updateLesson`, `deleteLesson` |
| External | `lib/r2.ts` | Cliente R2; genera URL prefirmada para subida directa |
| DB | `lessons`, `lesson_resources` | Contenido y recursos adjuntos |

**Flujo (con adjunto):**
1. Teacher rellena título, tipo (`text` / `file`), orden, contenido markdown
2. Si adjunta archivo → UI solicita `GET /api/upload/presign` → obtiene URL R2 prefirmada
3. Cliente sube el archivo **directamente a R2** (sin pasar por el server)
4. API guarda la URL R2 en `lesson_resources`
5. `POST /api/lessons` persiste la lección en `lessons`

**Edge cases:** archivo > límite de tamaño · URL prefirmada expirada · markdown inválido

---

### UC-11 · Student reads a lesson
**Actor:** Student
**Wireframe:** `Evolucion/tufolio_lecciones.html`
**Entry:** `/study/[subjectId]` → unidad → lección → `/study/[subjectId]/lessons/[lessonId]` *(por crear)*

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/study/[id]/lessons/[lessonId]/page.tsx` *(por crear)* | Renderiza contenido markdown; sidebar con unidades y lecciones |
| API | `PATCH /api/lessons/[id]/progress` *(por crear)* | Marca lección como completada |
| Controller | `controllers/lessons.ts` *(por crear)* | `getLessonWithProgress`, `markLessonComplete` |
| Controller | `controllers/unit.ts` | `getActiveUnits` para sidebar |
| DB | `lessons`, `lesson_resources`, `lesson_progress`, `unit_progress` | Contenido y progreso |

**Flujo:**
1. Student abre una lección → SSR carga contenido + recursos descargables
2. Al llegar al final (scroll o botón) → `PATCH /api/lessons/[id]/progress` con `status: "completed"`
3. Se actualiza `lesson_progress`; se recalcula `unit_progress.lessons_completed`
4. Si todas las lecciones de la unidad completadas → unidad marcada como lista para quiz

**Edge cases:** lección de tipo `file` (solo descarga, sin contenido markdown) · lección ya completada (idempotente)

---

### UC-12 · Sequential unit unlock
**Actor:** Student (disparado automáticamente por el sistema)
**Entry:** Automático tras completar quiz o lección de una unidad

| Layer | File | Role |
|-------|------|------|
| Controller | `controllers/unit.ts` *(ampliar)* | Comprueba `units.unlock_previous_required`; actualiza `unit_progress.is_unlocked` |
| DB | `units` (unlock_previous_required), `unit_progress` (is_unlocked), `quizzes` (score) | Lógica de desbloqueo |

**Flujo:**
1. Student completa quiz de unidad N (score suficiente) o todas las lecciones
2. Sistema comprueba si la unidad N+1 tiene `unlock_previous_required = true`
3. Si sí → inserta/actualiza `unit_progress` con `is_unlocked = true` para N+1
4. UI muestra la unidad N+1 desbloqueada (pasa de `locked` a `in-progress`)

**Edge cases:** asignatura sin orden secuencial (`unlock_previous_required = false`) · última unidad (no hay siguiente)

---

## Phase 3 — Monetisation UI

---

### UC-13 · Student upgrades plan
**Actor:** Student
**Entry:** Landing page pricing section o gate de contenido → `/pricing` *(por crear)*

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/pricing/page.tsx` *(por crear)* | Planes mensual / anual, comparativa de features |
| External | Lemon Squeezy checkout (externo) | Gestiona pago, IVA EU, facturación |
| Webhook | `app/api/webhooks/lemonsqueezy/route.ts` | Recibe `subscription_created`, actualiza DB |
| DB | `users.subscription_tier`, `subscriptions` | Tier y datos de suscripción |

**Flujo:**
1. Student pulsa "Suscribirse" en la pricing page → redirige a Lemon Squeezy checkout
2. Introduce datos de pago (gestionados por Lemon Squeezy — GDPR, IVA)
3. Pago OK → Lemon Squeezy dispara webhook → `subscription_created`
4. Webhook actualiza `users.subscription_tier` a `"monthly"` o `"yearly"`

---

### UC-14 · Free-tier content gate
**Actor:** Student sin suscripción
**Entry:** Intento de acceso a unidad con `is_free = false`

| Layer | File | Role |
|-------|------|------|
| Middleware / Page | `middleware.ts` o lógica en page | Comprueba `users.subscription_tier` vs `units.is_free` |
| Page | `app/(main)/study/[id]/page.tsx` | Muestra unidades bloqueadas con CTA de suscripción |
| DB | `units.is_free`, `users.subscription_tier` | Fuente de verdad del gate |

**Flujo:**
1. Student accede a unidad con `is_free = false` y `subscription_tier = "free"`
2. Middleware o la propia page detecta el bloqueo → muestra banner "Accede con suscripción"
3. CTA redirige a UC-13 (pricing page)

---

### UC-15 · Student manages subscription
**Actor:** Student suscrito
**Entry:** Perfil → "Mi suscripción" → `/profile/subscription` *(por crear)*

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/profile/page.tsx` *(ampliar)* | Estado de suscripción, próxima renovación, historial de facturas |
| External | Lemon Squeezy Customer Portal (externo) | Cambio de plan, cancelación, descarga de facturas |
| Webhook | `app/api/webhooks/lemonsqueezy/route.ts` | Recibe `subscription_cancelled`, `subscription_updated` |
| DB | `subscriptions`, `users.subscription_tier` | Estado actualizado por webhook |

**Flujo (cancelación):**
1. Student pulsa "Cancelar suscripción" → redirige a Lemon Squeezy Customer Portal
2. Cancela → Lemon Squeezy dispara `subscription_cancelled`
3. Webhook actualiza `subscriptions.status = "cancelled"` y `users.subscription_tier = "free"`
4. Al renovarse el periodo, el acceso a contenido de pago se cierra

---

## Phase 4 — Scale

---

### UC-16 · Nightly streak validation (job)
**Actor:** System
**Trigger:** Cron job cada noche (00:05 UTC)

| Layer | File | Role |
|-------|------|------|
| Worker | `workers/processors/streak.ts` *(por crear)* | BullMQ job: comprueba `daily_activity.activity_date` vs `now()` |
| Queue | BullMQ (Redis) | Job encolado por cron |
| DB | `users` (current_streak, longest_streak), `daily_activity` | Lee actividad, resetea o incrementa racha |

**Flujo:**
1. Cron encola job `validate-streaks` cada noche
2. Worker itera usuarios con actividad en las últimas 48h
3. Si hoy no hay actividad → `current_streak = 0`
4. Si actividad consecutiva → `current_streak++`, actualiza `longest_streak` si procede

---

### UC-17 · Achievement notification (job)
**Actor:** System
**Trigger:** Tras `checkAndAssignAchievements()` → encola job

| Layer | File | Role |
|-------|------|------|
| Worker | `workers/processors/notifications.ts` *(por crear)* | BullMQ job: envía email de logro desbloqueado |
| Queue | BullMQ (Redis) | Job con payload `{ userId, achievementId }` |
| External | Servicio de email (TBD) | Envío del email transaccional |
| DB | `users.email`, `achievements` | Datos para el email |

---

## Phase 5 — Portal

---

### UC-18 · Browse oposiciones catalogue
**Actor:** Student (autenticado o visitante)
**Wireframe:** `Evolucion/tufolio_portal por dentro.html` (sección "Oposiciones")
**Entry:** Navegación principal → "Oposiciones" → `/oposiciones` *(por crear)*

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/oposiciones/page.tsx` *(por crear)* | Catálogo con filtros: Administración / Justicia / Seguridad |
| DB | `subjects` (+ campo `category` / `oposicion_type` por añadir) | Fuente del catálogo |

**Flujo:**
1. Student accede al catálogo → ve todas las oposiciones disponibles + "Próximamente"
2. Filtra por categoría → la lista se actualiza
3. Pulsa en oposición → detalle con asignaturas → puede inscribirse (UC-03)

---

### UC-19 · Convocatorias / news feed
**Actor:** Student
**Wireframe:** `Evolucion/tufolio_portal por dentro.html` (sección "Noticias"), `Evolucion/tufolio_homepage blog.html`
**Entry:** Navegación principal → "Noticias" → `/noticias` *(por crear)*

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/noticias/page.tsx` *(por crear)* | Feed con filtros: Convocatorias / Normativa / Consejos |
| DB | `news` / `convocatorias` *(tabla por definir)* | Contenido publicado por admin |

---

### UC-20 · Public student profile
**Actor:** Cualquier usuario
**Wireframe:** `Evolucion/tufolio_portal por dentro.html` (sección "Perfil")
**Entry:** Link desde leaderboard → `/profile/[userId]` *(por crear)*

| Layer | File | Role |
|-------|------|------|
| Page | `app/(main)/profile/[userId]/page.tsx` *(por crear)* | Nombre, nivel, XP, logros, ranking por asignatura |
| Controller | `controllers/profiles.ts` *(ampliar)* | Datos públicos del perfil |
| DB | `users`, `user_achievements`, `user_stats` | Solo campos públicos |

---

## Convenciones de actualización

- `*(por crear)*` = ruta/fichero aún no existe; se elimina la nota cuando se implementa
- Añadir aquí el UC en el mismo PR que introduce el flujo
- Si cambia un endpoint, controlador o tabla, actualizar la fila correspondiente
