# Arquitectura del Sistema - Jean Monnet Serious Game

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Componentes Clave](#componentes-clave)
4. [Arquitectura General](#arquitectura-general)
5. [Flujos de Datos Críticos](#flujos-de-datos-críticos)
6. [Setup Docker para MVP Local](#setup-docker-para-mvp-local)
7. [Casos de Uso de Redis](#casos-de-uso-de-redis)
8. [Casos de Uso de BullMQ](#casos-de-uso-de-bullmq)
9. [Beneficios de la Arquitectura](#beneficios-de-la-arquitectura)
10. [Estrategia de Despliegue](#estrategia-de-despliegue)

---

## Resumen Ejecutivo

Sistema de gamificación educativa para oposiciones, construido con **Next.js 14** (App Router), **Supabase** (Auth + PostgreSQL), **Redis** (caché y sesiones), y **BullMQ** (procesamiento asíncrono). El MVP se despliega completamente dockerizado en servidor local para máxima portabilidad.

### Decisiones Arquitectónicas Clave:
- ✅ **Next.js 14** con React Server Components para reducir bundle JS cliente
- ✅ **Supabase** para Auth y PostgreSQL (no reinventar la rueda)
- ✅ **Redis** para caché de rankings y sesiones de alta frecuencia
- ✅ **BullMQ** para jobs asíncronos (cálculo de rankings, streaks, notificaciones)
- ✅ **Docker Compose** para desarrollo local y despliegue MVP

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 14.x | Framework React con SSR/RSC |
| **React** | 18.x | Librería UI |
| **TypeScript** | 5.x | Type safety |
| **TailwindCSS** | 3.x | Estilos utility-first |
| **shadcn/ui** | Latest | Componentes accesibles |
| **Framer Motion** | 10.x | Animaciones |
| **Recharts** | 2.x | Gráficas de progreso |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Supabase** | Latest | Auth + PostgreSQL |
| **Drizzle ORM** | Latest | Type-safe ORM |
| **Redis** | 7.x | Caché + Sesiones |
| **BullMQ** | 5.x | Job queue asíncrona |
| **Node.js** | 20.x LTS | Runtime |

### Infraestructura
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Docker** | 24.x | Containerización |
| **Docker Compose** | 2.x | Orquestación local |
| **Nginx** | Latest | Reverse proxy (prod) |
| **PostgreSQL** | 15.x | Base de datos (via Supabase) |

---

## Componentes Clave

### 1. Redis - ¿Qué es y por qué lo necesitamos?

**Redis** es una base de datos **en memoria** (in-memory) extremadamente rápida que actúa como **caché** y **almacén de datos clave-valor**.

#### 🎯 Rol en Nuestro Sistema:

##### A) **Caché de Rankings (Leaderboards)**
```typescript
// Sin Redis: Query pesado cada vez
// Tiempo: ~500-1000ms
const leaderboard = await db
  .select()
  .from(users)
  .leftJoin(quizzes, ...)
  .orderBy(desc(points))
  .limit(100);

// Con Redis: Lectura instantánea
// Tiempo: ~5-10ms (100x más rápido!)
const leaderboard = await redis.get('leaderboard:subject:1:weekly');
if (!leaderboard) {
  // Solo se calcula si no existe en caché
  const data = await calculateLeaderboard();
  await redis.setex('leaderboard:subject:1:weekly', 300, JSON.stringify(data)); // 5 min
}
```

**Ventaja:** En lugar de recalcular rankings con queries complejos en cada request (costoso), lo guardamos en Redis y lo refrescamos cada 5 minutos mediante un job asíncrono.

##### B) **Sesiones de Usuario**
```typescript
// Guardar estado temporal del usuario
await redis.setex(`user:${userId}:current_quiz`, 1800, JSON.stringify({
  quizId: 123,
  startedAt: Date.now(),
  questionsAnswered: 5,
  markedForReview: [2, 7]
}));
```

**Ventaja:** Datos de sesión ultra-rápidos sin cargar PostgreSQL.

##### C) **Rate Limiting**
```typescript
// Prevenir spam de requests
const attempts = await redis.incr(`rate_limit:${userId}:quiz_submit`);
await redis.expire(`rate_limit:${userId}:quiz_submit`, 60);

if (attempts > 10) {
  throw new Error('Too many requests, wait 1 minute');
}
```

##### D) **Contadores en Tiempo Real**
```typescript
// Incrementar XP sin transacciones SQL pesadas
await redis.zincrby('leaderboard:global', 50, userId); // Añade 50 XP
```

#### 📊 Tipos de Datos Redis que Usaremos:

| Tipo | Uso en Nuestro Sistema |
|------|------------------------|
| **String** | Caché de objetos JSON (stats, profiles) |
| **Hash** | Datos estructurados de usuario |
| **Sorted Set (ZSET)** | ⭐ Rankings/Leaderboards (ordenados por puntos) |
| **List** | Historial de actividad reciente |
| **Set** | Badges obtenidos, temas completados |

---

### 2. BullMQ - ¿Qué es y por qué lo necesitamos?

**BullMQ** es una librería de **colas de trabajos** (job queue) que permite ejecutar tareas en **segundo plano** (background) de forma **asíncrona** y **confiable**.

#### 🎯 Rol en Nuestro Sistema:

##### A) **Cálculo de Rankings Pesado**
```typescript
// ❌ PROBLEMA: Calcular ranking en cada request
app.get('/api/leaderboard', async (req, res) => {
  // Query que tarda 2-3 segundos con miles de usuarios
  const ranking = await calculateRanking();
  res.json(ranking);
});

// ✅ SOLUCIÓN: Job asíncrono cada 5 minutos
rankingQueue.add('calculate-weekly-ranking', {
  subjectId: 1,
  period: 'weekly'
}, {
  repeat: { every: 300000 } // 5 minutos
});

// Worker procesa en background
rankingQueue.process('calculate-weekly-ranking', async (job) => {
  const ranking = await calculateRanking(job.data);
  await redis.setex(`leaderboard:subject:${job.data.subjectId}:weekly`, 300, JSON.stringify(ranking));
});
```

**Ventaja:** El usuario obtiene respuesta instantánea desde Redis, mientras el cálculo pesado ocurre en background.

##### B) **Procesamiento de Streaks Diario**
```typescript
// Cada día a las 00:00, procesar streaks de todos los usuarios
streakQueue.add('check-streaks', {}, {
  repeat: { cron: '0 0 * * *' } // Cron: medianoche
});

streakQueue.process('check-streaks', async () => {
  const users = await db.select().from(users);
  
  for (const user of users) {
    const lastActivity = user.last_activity_date;
    const today = new Date();
    
    // Si no hay actividad ayer, racha se rompe
    if (isYesterday(lastActivity)) {
      await db.update(users)
        .set({ current_streak: user.current_streak + 1 })
        .where(eq(users.id, user.id));
    } else if (!isToday(lastActivity)) {
      // Racha rota
      await db.update(users)
        .set({ current_streak: 0 })
        .where(eq(users.id, user.id));
      
      // Notificar al usuario
      await sendNotification(user.id, 'Tu racha se ha roto 😢');
    }
  }
});
```

**Ventaja:** Proceso automático que no requiere intervención manual.

##### C) **Envío de Emails/Notificaciones**
```typescript
// Cuando usuario sube de nivel
await levelUpQueue.add('send-level-up-email', {
  userId: '123',
  newLevel: 5,
  email: 'user@example.com'
});

// Worker envía email sin bloquear la respuesta HTTP
levelUpQueue.process('send-level-up-email', async (job) => {
  await sendEmail({
    to: job.data.email,
    subject: `¡Felicidades! Has alcanzado el nivel ${job.data.newLevel}`,
    template: 'level-up',
    data: job.data
  });
});
```

**Ventaja:** Usuario recibe respuesta HTTP inmediata, email se envía después.

##### D) **Asignación Automática de Badges**
```typescript
// Después de cada quiz
await badgeQueue.add('check-badges', {
  userId: '123',
  quizScore: 95,
  consecutiveStreak: 7
});

badgeQueue.process('check-badges', async (job) => {
  const { userId, quizScore, consecutiveStreak } = job.data;
  
  // Check si merece badge de "Perfect Score"
  if (quizScore === 100) {
    await assignBadge(userId, 'PERFECT_SCORE');
  }
  
  // Check badge de "Hot Streak"
  if (consecutiveStreak >= 7) {
    await assignBadge(userId, 'SEVEN_DAY_STREAK');
  }
});
```

#### 📊 Tipos de Jobs que Implementaremos:

| Job | Frecuencia | Propósito |
|-----|-----------|-----------|
| `calculate-rankings` | Cada 5 min | Actualizar leaderboards |
| `process-daily-streaks` | Diario 00:00 | Verificar/actualizar rachas |
| `send-study-reminders` | Personalizado | Recordatorios de estudio |
| `aggregate-user-stats` | Cada hora | Calcular stats agregadas |
| `check-achievements` | On-demand | Verificar y asignar badges |
| `send-emails` | On-demand | Emails transaccionales |
| `cleanup-old-cache` | Semanal | Limpiar datos antiguos |

---

## Arquitectura General

### Diagrama de Componentes

```mermaid
graph TB
    subgraph "Cliente (Browser)"
        A[React/Next.js UI]
    end
    
    subgraph "Next.js Server"
        B[API Routes]
        C[React Server Components]
        D[Server Actions]
    end
    
    subgraph "Servicios Backend"
        E[Supabase Auth]
        F[PostgreSQL]
        G[Redis Cache]
        H[BullMQ Worker]
    end
    
    subgraph "Storage"
        I[Supabase Storage]
        J[CDN]
    end
    
    A -->|HTTP/HTTPS| B
    A -->|Streaming RSC| C
    A -->|Form Actions| D
    
    B --> E
    B --> F
    B --> G
    C --> F
    D --> F
    D --> H
    
    H -->|Background Jobs| F
    H -->|Update Cache| G
    H -->|Send Notifications| K[Email Service]
    
    I -->|Videos/PDFs| J
    J -->|Serve Assets| A
    
    style A fill:#61dafb
    style B fill:#0070f3
    style E fill:#3ecf8e
    style F fill:#336791
    style G fill:#dc382d
    style H fill:#ff6b6b
```

### Flujo de Request Típico

```mermaid
sequenceDiagram
    participant U as Usuario
    participant N as Next.js
    participant R as Redis
    participant P as PostgreSQL
    participant B as BullMQ
    
    U->>N: GET /leaderboard
    N->>R: Buscar en caché
    
    alt Cache Hit
        R-->>N: Datos del leaderboard
        N-->>U: Respuesta rápida (5ms)
    else Cache Miss
        N->>P: Query base de datos
        P-->>N: Datos calculados
        N->>R: Guardar en caché (5 min TTL)
        N-->>U: Respuesta (500ms)
    end
    
    Note over B: Job programado cada 5 min
    B->>P: Recalcular ranking
    P-->>B: Datos actualizados
    B->>R: Actualizar caché
```

---

## Flujos de Datos Críticos

### 1. Flujo de Completar Quiz

```mermaid
flowchart TD
    A[Usuario completa quiz] --> B[POST /api/quizzes/submit]
    B --> C{Validar respuestas}
    
    C -->|Válido| D[Guardar en PostgreSQL]
    C -->|Inválido| E[Error 400]
    
    D --> F[Calcular puntuación]
    F --> G[Actualizar XP del usuario]
    
    G --> H[Encolar job: check-achievements]
    G --> I[Encolar job: update-daily-activity]
    G --> J[Invalidar caché de ranking]
    
    H --> K[BullMQ Worker]
    I --> K
    
    K --> L[Verificar si ganó badges]
    K --> M[Actualizar estadísticas]
    K --> N[Notificar si subió de nivel]
    
    L --> O[Response: score + nuevos badges]
    M --> O
    N --> O
    
    O --> P[Cliente recibe respuesta inmediata]
    
    style B fill:#0070f3
    style D fill:#336791
    style K fill:#ff6b6b
    style P fill:#61dafb
```

### 2. Flujo de Caché de Rankings

```mermaid
flowchart LR
    A[Usuario accede /leaderboard] --> B{Redis: ¿Existe caché?}
    
    B -->|Sí| C[Leer de Redis<br/>~5ms]
    B -->|No| D[Calcular desde PostgreSQL<br/>~500ms]
    
    C --> E[Devolver JSON al cliente]
    D --> F[Guardar en Redis<br/>TTL: 5 min]
    F --> E
    
    G[BullMQ Job<br/>Cada 5 min] --> H[Recalcular ranking]
    H --> I[Actualizar Redis]
    I -.->|Próximo request| C
    
    style B fill:#dc382d
    style G fill:#ff6b6b
    style C fill:#90EE90
    style D fill:#FFB6C1
```

### 3. Flujo de Streaks Diarios

```mermaid
sequenceDiagram
    participant C as Cron Job (00:00)
    participant B as BullMQ
    participant P as PostgreSQL
    participant R as Redis
    participant E as Email Service
    
    C->>B: Trigger: check-daily-streaks
    B->>P: SELECT usuarios con streaks activos
    
    loop Para cada usuario
        B->>P: ¿Actividad ayer?
        
        alt Sí tuvo actividad
            P-->>B: last_activity = yesterday
            B->>P: current_streak += 1
            B->>R: Actualizar caché de usuario
        else No tuvo actividad
            P-->>B: last_activity < yesterday
            B->>P: current_streak = 0
            B->>E: Enviar email "Racha rota"
        end
    end
    
    B->>R: Invalidar cachés de rankings
    Note over B: Job completado
```

---

## Setup Docker para MVP Local

### docker-compose.yml

```yaml
version: '3.9'

services:
  # PostgreSQL (simulando Supabase local)
  postgres:
    image: postgres:15-alpine
    container_name: jeanmonnet-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: jeanmonnet
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db_init:/docker-entrypoint-initdb.d
    networks:
      - jeanmonnet-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (caché y sesiones)
  redis:
    image: redis:7-alpine
    container_name: jeanmonnet-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - jeanmonnet-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Next.js App
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: jeanmonnet-app
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/jeanmonnet
      REDIS_URL: redis://redis:6379
      NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - jeanmonnet-network
    restart: unless-stopped

  # BullMQ Worker (jobs asíncronos)
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: jeanmonnet-worker
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/jeanmonnet
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - jeanmonnet-network
    restart: unless-stopped

  # BullMQ Dashboard (opcional - para ver jobs)
  bull-board:
    image: deadly0/bull-board
    container_name: jeanmonnet-bull-board
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "3001:3000"
    depends_on:
      - redis
    networks:
      - jeanmonnet-network

networks:
  jeanmonnet-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile (Next.js App)

```dockerfile
FROM node:20-alpine AS base

# Dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Dockerfile.worker (BullMQ Worker)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

# Compilar TypeScript si es necesario
RUN npm run build:worker

CMD ["node", "dist/worker/index.js"]
```

### Estructura de Carpetas para Workers

```
workers/
├── index.ts              # Entry point
├── queues/
│   ├── ranking.queue.ts
│   ├── streak.queue.ts
│   ├── badge.queue.ts
│   └── email.queue.ts
└── processors/
    ├── ranking.processor.ts
    ├── streak.processor.ts
    ├── badge.processor.ts
    └── email.processor.ts
```

### Ejemplo: workers/index.ts

```typescript
import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { rankingProcessor } from './processors/ranking.processor';
import { streakProcessor } from './processors/streak.processor';

const redisConnection = new Redis(process.env.REDIS_URL!);

// Workers
const rankingWorker = new Worker('ranking-queue', rankingProcessor, {
  connection: redisConnection,
  concurrency: 5 // Procesar 5 jobs simultáneos
});

const streakWorker = new Worker('streak-queue', streakProcessor, {
  connection: redisConnection,
  concurrency: 10
});

// Event handlers
rankingWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

rankingWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

console.log('🚀 Workers started');
```

### Ejemplo: workers/processors/ranking.processor.ts

```typescript
import { Job } from 'bullmq';
import { db } from '@/lib/drizzle';
import { redis } from '@/lib/redis';
import { users, quizzes } from '@/drizzle/schema';
import { desc, eq, sql } from 'drizzle-orm';

interface RankingJobData {
  subjectId: number;
  period: 'weekly' | 'monthly' | 'all_time';
}

export async function rankingProcessor(job: Job<RankingJobData>) {
  const { subjectId, period } = job.data;
  
  console.log(`📊 Calculating ranking for subject ${subjectId}, period: ${period}`);
  
  // Query complejo para calcular ranking
  const ranking = await db
    .select({
      userId: users.id,
      fullName: users.full_name,
      totalPoints: sql<number>`SUM(${quizzes.score})`.as('total_points'),
      quizzesCompleted: sql<number>`COUNT(${quizzes.id})`.as('quizzes_completed'),
      avgScore: sql<number>`AVG(${quizzes.score})`.as('avg_score'),
      currentStreak: users.current_streak,
    })
    .from(users)
    .leftJoin(quizzes, eq(users.id, quizzes.user_id))
    .groupBy(users.id, users.full_name, users.current_streak)
    .orderBy(desc(sql`total_points`))
    .limit(100);
  
  // Guardar en Redis con TTL de 5 minutos
  const cacheKey = `leaderboard:subject:${subjectId}:${period}`;
  await redis.setex(cacheKey, 300, JSON.stringify(ranking));
  
  // También guardar en tabla leaderboard_cache para histórico
  // ... código para insertar en PostgreSQL
  
  console.log(`✅ Ranking cached for ${cacheKey}`);
  
  return { success: true, recordsProcessed: ranking.length };
}
```

---

## Casos de Uso de Redis

### 1. Leaderboard con Sorted Sets

```typescript
// lib/redis/leaderboard.ts
import { redis } from './client';

export class LeaderboardService {
  
  // Añadir puntos a usuario
  async addPoints(userId: string, points: number) {
    await redis.zincrby('leaderboard:global', points, userId);
  }
  
  // Obtener top 100
  async getTop100(): Promise<Array<{ userId: string; points: number }>> {
    const results = await redis.zrevrange('leaderboard:global', 0, 99, 'WITHSCORES');
    
    // Redis devuelve [userId, points, userId, points, ...]
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        points: parseInt(results[i + 1])
      });
    }
    
    return leaderboard;
  }
  
  // Obtener ranking de usuario específico
  async getUserRank(userId: string): Promise<number> {
    const rank = await redis.zrevrank('leaderboard:global', userId);
    return rank !== null ? rank + 1 : 0; // +1 porque rank empieza en 0
  }
  
  // Obtener usuarios alrededor de un usuario
  async getUsersAround(userId: string, range: number = 5) {
    const userRank = await redis.zrevrank('leaderboard:global', userId);
    if (userRank === null) return [];
    
    const start = Math.max(0, userRank - range);
    const end = userRank + range;
    
    return await redis.zrevrange('leaderboard:global', start, end, 'WITHSCORES');
  }
}
```

### 2. Caché de Sesiones de Quiz

```typescript
// lib/redis/quiz-session.ts
import { redis } from './client';

interface QuizSession {
  quizId: number;
  startedAt: number;
  questionsAnswered: number[];
  markedForReview: number[];
  answers: Record<number, number>; // questionId -> answerId
}

export class QuizSessionService {
  private readonly TTL = 1800; // 30 minutos
  
  async saveSession(userId: string, session: QuizSession) {
    const key = `quiz_session:${userId}`;
    await redis.setex(key, this.TTL, JSON.stringify(session));
  }
  
  async getSession(userId: string): Promise<QuizSession | null> {
    const key = `quiz_session:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async deleteSession(userId: string) {
    const key = `quiz_session:${userId}`;
    await redis.del(key);
  }
  
  // Renovar TTL cuando usuario interactúa
  async extendSession(userId: string) {
    const key = `quiz_session:${userId}`;
    await redis.expire(key, this.TTL);
  }
}
```

### 3. Rate Limiting

```typescript
// lib/redis/rate-limiter.ts
import { redis } from './client';

export class RateLimiter {
  
  async checkLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const current = await redis.incr(key);
    
    if (current === 1) {
      // Primera request en esta ventana
      await redis.expire(key, windowSeconds);
    }
    
    const allowed = current <= maxRequests;
    const remaining = Math.max(0, maxRequests - current);
    
    return { allowed, remaining };
  }
  
  // Uso específico para quiz submissions
  async canSubmitQuiz(userId: string): Promise<boolean> {
    const key = `rate_limit:quiz_submit:${userId}`;
    const { allowed } = await this.checkLimit(key, 10, 60); // 10 quizzes por minuto
    return allowed;
  }
}
```

---

## Casos de Uso de BullMQ

### 1. Queue de Rankings

```typescript
// lib/queues/ranking.queue.ts
import { Queue } from 'bullmq';
import { redis } from '@/lib/redis/client';

export const rankingQueue = new Queue('ranking-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

// Programar job recurrente
export async function scheduleRankingUpdates() {
  // Calcular rankings cada 5 minutos para cada materia
  await rankingQueue.add(
    'calculate-weekly-ranking',
    { period: 'weekly' },
    {
      repeat: {
        every: 300000 // 5 minutos en ms
      }
    }
  );
  
  // Calcular ranking mensual cada hora
  await rankingQueue.add(
    'calculate-monthly-ranking',
    { period: 'monthly' },
    {
      repeat: {
        every: 3600000 // 1 hora
      }
    }
  );
}
```

### 2. Queue de Streaks

```typescript
// lib/queues/streak.queue.ts
import { Queue } from 'bullmq';
import { redis } from '@/lib/redis/client';

export const streakQueue = new Queue('streak-queue', {
  connection: redis
});

// Programar verificación diaria
export async function scheduleDailyStreakCheck() {
  await streakQueue.add(
    'check-daily-streaks',
    {},
    {
      repeat: {
        pattern: '0 0 * * *' // Cron: todos los días a medianoche
      }
    }
  );
  
  // También recordatorios personalizados
  await streakQueue.add(
    'send-streak-reminders',
    {},
    {
      repeat: {
        pattern: '0 20 * * *' // 8 PM para recordar estudiar
      }
    }
  );
}
```

### 3. Queue de Achievements

```typescript
// lib/queues/achievement.queue.ts
import { Queue } from 'bullmq';
import { redis } from '@/lib/redis/client';

export const achievementQueue = new Queue('achievement-queue', {
  connection: redis
});

// Verificar achievements después de evento
export async function checkAchievements(userId: string, eventType: string, data: any) {
  await achievementQueue.add('check-user-achievements', {
    userId,
    eventType, // 'quiz_completed', 'level_up', 'streak_milestone'
    data
  });
}
```

### Procesador de Achievements

```typescript
// workers/processors/achievement.processor.ts
import { Job } from 'bullmq';
import { db } from '@/lib/drizzle';
import { users, user_badges } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

interface AchievementJobData {
  userId: string;
  eventType: string;
  data: any;
}

export async function achievementProcessor(job: Job<AchievementJobData>) {
  const { userId, eventType, data } = job.data;
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });
  
  if (!user) return;
  
  const badgesToAward: string[] = [];
  
  switch (eventType) {
    case 'quiz_completed':
      // Perfect score badge
      if (data.score === 100) {
        badgesToAward.push('PERFECT_SCORE');
      }
      
      // Speed demon badge (completó en menos de 5 min)
      if (data.timeSpentSeconds < 300) {
        badgesToAward.push('SPEED_DEMON');
      }
      break;
      
    case 'streak_milestone':
      if (user.current_streak === 7) {
        badgesToAward.push('WEEK_WARRIOR');
      }
      if (user.current_streak === 30) {
        badgesToAward.push('MONTH_MASTER');
      }
      break;
      
    case 'level_up':
      if (data.newLevel === 10) {
        badgesToAward.push('LEVEL_10');
      }
      break;
  }
  
  // Insertar badges en la BD
  for (const badgeType of badgesToAward) {
    await db.insert(user_badges).values({
      user_id: userId,
      badge_type: badgeType,
      badge_name: getBadgeName(badgeType),
      badge_description: getBadgeDescription(badgeType),
      earned_at: new Date()
    }).onConflictDoNothing();
  }
  
  return { badgesAwarded: badgesToAward };
}
```

---

## Beneficios de la Arquitectura

### 1. Performance

| Métrica | Sin Redis/BullMQ | Con Redis/BullMQ | Mejora |
|---------|-------------------|------------------|--------|
| **Tiempo de respuesta (leaderboard)** | 500-1000ms | 5-10ms | **100x más rápido** |
| **Carga en PostgreSQL** | Alta (queries complejos repetidos) | Baja (queries batch periódicos) | **80% reducción** |
| **Tiempo de respuesta (completar quiz)** | 200-300ms (calcular achievements síncronamente) | 50-80ms (delegar a worker) | **4x más rápido** |

### 2. Escalabilidad

```mermaid
graph LR
    A[1000 requests/seg] --> B{Arquitectura}
    
    B -->|Sin Redis| C[PostgreSQL sobrecargado<br/>❌ Timeout errors]
    B -->|Con Redis| D[Cache absorbe 90% requests<br/>✅ PostgreSQL relajado]
    
    style C fill:#ffcccc
    style D fill:#ccffcc
```

- ✅ **Horizontal scaling**: Añadir más workers BullMQ si hay mucha carga
- ✅ **Cache layer**: Redis absorbe la mayoría de requests de lectura
- ✅ **Async processing**: No bloqueamos respuestas HTTP

### 3. Confiabilidad

```typescript
// BullMQ garantiza que jobs no se pierden
rankingQueue.add('calculate-ranking', data, {
  attempts: 3, // Reintentar hasta 3 veces
  backoff: {
    type: 'exponential',
    delay: 1000 // Esperar 1s, 2s, 4s entre reintentos
  },
  removeOnComplete: 100, // Mantener últimos 100 completados
  removeOnFail: 50 // Mantener últimos 50 fallidos
});

// Si el worker se cae, los jobs quedan en Redis
// Al reiniciar, continúa procesando desde donde quedó
```

### 4. Observabilidad

Con **Bull Board** (dashboard web incluido en docker-compose):

- 📊 Ver jobs en tiempo real (pending, active, completed, failed)
- 🔍 Inspeccionar datos de cada job
- 🔄 Reintentar jobs fallidos manualmente
- 📈 Métricas de throughput y latencia

Acceso: `http://localhost:3001`

### 5. Mantenibilidad

**Separación de concerns:**

```
├── app/                    # Next.js routes (presentación)
├── lib/
│   ├── redis/             # Lógica de caché
│   └── queues/            # Definición de queues
├── workers/
│   └── processors/        # Lógica de negocio asíncrona
└── services/              # Lógica de negocio síncrona
```

Cada componente tiene responsabilidad única:
- **Next.js**: Servir UI y API rápida
- **Redis**: Caché y datos temporales
- **BullMQ**: Procesamiento pesado en background
- **PostgreSQL**: Source of truth persistente

---

## Estrategia de Despliegue

### Fase 1: MVP Local (Docker Compose)

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Acceder a:
# - App: http://localhost:3000
# - Bull Board: http://localhost:3001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

**Ventajas:**
- ✅ Todo en una máquina
- ✅ Fácil desarrollo
- ✅ Portátil (funciona en Windows/Mac/Linux)

**Limitaciones:**
- ⚠️ No auto-scaling
- ⚠️ Single point of failure

### Fase 2: Producción Cloud (Escalable)

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/Caddy]
    end
    
    subgraph "Next.js Instances (Auto-scaling)"
        N1[Next.js 1]
        N2[Next.js 2]
        N3[Next.js N...]
    end
    
    subgraph "Workers (Auto-scaling)"
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker N...]
    end
    
    subgraph "Managed Services"
        R[Redis<br/>Upstash/Railway]
        P[PostgreSQL<br/>Supabase]
        S[Storage<br/>Supabase/S3]
    end
    
    LB --> N1
    LB --> N2
    LB --> N3
    
    N1 --> R
    N2 --> R
    N3 --> R
    
    N1 --> P
    N2 --> P
    N3 --> P
    
    W1 --> R
    W2 --> R
    W3 --> R
    
    W1 --> P
    W2 --> P
    W3 --> P
    
    N1 --> S
    N2 --> S
    N3 --> S
    
    style LB fill:#61dafb
    style R fill:#dc382d
    style P fill:#336791
```

**Opciones de Hosting:**

| Componente | Opción 1 (Económica) | Opción 2 (Productiva) | Opción 3 (Enterprise) |
|------------|----------------------|-----------------------|-----------------------|
| **Next.js** | Railway ($5/mes) | Vercel Pro ($20/mes) | AWS ECS |
| **PostgreSQL** | Supabase Free | Supabase Pro ($25/mes) | RDS |
| **Redis** | Upstash Free (10K req/día) | Upstash Pay-as-you-go | ElastiCache |
| **Workers** | Railway ($5/mes) | Railway ($10/mes) | Kubernetes |
| **Storage** | Supabase (1GB gratis) | Cloudflare R2 | S3 |
| **CDN** | Cloudflare Free | Cloudflare Free | CloudFront |
| **Total/mes** | **~$10** | **~$55** | **~$200+** |

### Fase 3: Alta Disponibilidad

Para escalar a miles de usuarios:

```yaml
# docker-swarm o Kubernetes
services:
  app:
    replicas: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
  
  worker:
    replicas: 5 # Más workers para procesar jobs
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

---

## Comandos Útiles

### Desarrollo Local

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f app

# Reiniciar un servicio
docker-compose restart worker

# Ejecutar migraciones
docker-compose exec app npm run db:migrate

# Acceder a Redis CLI
docker-compose exec redis redis-cli

# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d jeanmonnet

# Parar todo
docker-compose down

# Parar y eliminar volúmenes (reset total)
docker-compose down -v
```

### Monitoreo Redis

```bash
# Ver todas las keys
redis-cli KEYS "*"

# Ver leaderboard
redis-cli ZREVRANGE leaderboard:global 0 10 WITHSCORES

# Ver info de memoria
redis-cli INFO memory

# Monitorear comandos en tiempo real
redis-cli MONITOR
```

### Monitoreo BullMQ

```bash
# Acceder a Bull Board
open http://localhost:3001

# O ver jobs desde código
import { rankingQueue } from '@/lib/queues/ranking.queue';

const jobs = await rankingQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
console.log(jobs);
```

---

## Próximos Pasos

### Checklist de Implementación

- [ ] 1. Crear `docker-compose.yml` y `Dockerfile`
- [ ] 2. Configurar Redis client (`lib/redis/client.ts`)
- [ ] 3. Implementar LeaderboardService con Sorted Sets
- [ ] 4. Configurar BullMQ queues (`lib/queues/`)
- [ ] 5. Crear workers básicos (`workers/processors/`)
- [ ] 6. Migrar esquema de BD con nuevas tablas de gamificación
- [ ] 7. Implementar endpoints API que usen caché
- [ ] 8. Implementar jobs de rankings periódicos
- [ ] 9. Implementar job de streaks diario
- [ ] 10. Testing de carga (k6 o Artillery)

---

## Recursos y Documentación

### Redis
- 📘 [Redis Official Docs](https://redis.io/docs/)
- 📘 [Redis Data Types](https://redis.io/docs/data-types/)
- 📘 [Redis Sorted Sets Tutorial](https://redis.io/docs/data-types/sorted-sets/)

### BullMQ
- 📘 [BullMQ Docs](https://docs.bullmq.io/)
- 📘 [BullMQ Patterns](https://docs.bullmq.io/patterns/)
- 📘 [Bull Board](https://github.com/felixmosh/bull-board)

### Docker
- 📘 [Docker Compose Docs](https://docs.docker.com/compose/)
- 📘 [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### Next.js + Docker
- 📘 [Next.js Deployment](https://nextjs.org/docs/deployment)
- 📘 [Next.js Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)

---

## Conclusión

Esta arquitectura combina lo mejor de múltiples tecnologías:

✅ **Next.js 14**: Framework moderno y productivo
✅ **Supabase**: Auth y PostgreSQL sin complicaciones
✅ **Redis**: Performance extrema para caché
✅ **BullMQ**: Procesamiento asíncrono confiable
✅ **Docker**: Portabilidad y consistencia

**Resultado:** Sistema escalable, mantenible y rápido que puede crecer desde 10 usuarios hasta 10,000+ sin cambios arquitectónicos mayores.
