/**
 * scripts/seed.ts — Seed script (Phases 0–3)
 *
 * Run AFTER:
 *   npm run push                    (schema applied)
 *   npm run setup-db                (view + function, see scripts/setup-db.sql)
 *
 * Then:
 *   npm run seed
 *
 * What is seeded:
 *   Auth users    → teacher@exams.test + student1/2@exams.test (Better-Auth compatible, with bcrypt passwords)
 *   Gamif users   → Alice / Bruno / Carmen (leaderboard personas, no auth — DB only)
 *   Subjects      → "Derecho Administrativo" + "Constitución Española"
 *   Units         → 2 per subject (DA unit 1 = free/open; DA unit 2 = paid/sequential lock)
 *   Questions     → 15 per unit with answers (oposiciones content)
 *   Lessons       → 3 per DA unit (2 article + 1 file), seeded with placeholder R2 URL
 *   Quiz history  → Alice (8 quizzes), Bruno (3), Carmen (1) — drives leaderboard
 *   XP txns       → historical XP for leaderboard personas
 *   Achievements  → 9 achievement types + assignments for Alice / Bruno / Carmen
 *   Enrollments   → auth students in both subjects; gamif personas per rework plan
 *   UserStats     → empty rows for auth students
 *
 * IDEMPOTENT: clears all seed rows (by known IDs) before re-inserting.
 * ⚠️  Never run against production.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';
import * as schema from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

// ─── DB ───────────────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set. Copy .env.example → .env.local.');
  process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ─── Fixed IDs ────────────────────────────────────────────────────────────────

// Auth users (Playwright login tests)
const TEACHER_ID  = 'seed-teacher-001';
const STUDENT1_ID = 'seed-student-001';
const STUDENT2_ID = 'seed-student-002';

// Gamification personas (leaderboard display — no auth accounts)
const ALICE_ID  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const BRUNO_ID  = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CARMEN_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const ALL_SEED_USER_IDS = [TEACHER_ID, STUDENT1_ID, STUDENT2_ID, ALICE_ID, BRUNO_ID, CARMEN_ID];

const today      = new Date().toISOString().split('T')[0];
const yesterday  = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

// ─── Question data ────────────────────────────────────────────────────────────

const DA_QUESTIONS = [
  { q: '¿Cuál es la norma de mayor rango en el ordenamiento jurídico español?',
    answers: [{ name: 'La Constitución Española de 1978', correct: true }, { name: 'El Código Civil', correct: false }, { name: 'La Ley Orgánica del Poder Judicial', correct: false }, { name: 'Los Reglamentos de la UE', correct: false }] },
  { q: '¿Qué principio prohíbe sancionar dos veces por los mismos hechos?',
    answers: [{ name: 'Non bis in idem', correct: true }, { name: 'Ius cogens', correct: false }, { name: 'Pacta sunt servanda', correct: false }, { name: 'Nulla poena sine lege', correct: false }] },
  { q: '¿Cuál es el plazo general de prescripción de las infracciones muy graves?',
    answers: [{ name: '3 años', correct: true }, { name: '1 año', correct: false }, { name: '6 meses', correct: false }, { name: '5 años', correct: false }] },
  { q: '¿Qué ley regula el procedimiento administrativo común de las Administraciones Públicas?',
    answers: [{ name: 'Ley 39/2015', correct: true }, { name: 'Ley 40/2015', correct: false }, { name: 'Ley 29/1998', correct: false }, { name: 'Ley 47/2003', correct: false }] },
  { q: '¿Cuántos días hábiles tiene la Administración para resolver y notificar en el procedimiento común?',
    answers: [{ name: '3 meses (salvo norma especial)', correct: true }, { name: '1 mes', correct: false }, { name: '6 meses', correct: false }, { name: '15 días hábiles', correct: false }] },
  { q: 'El silencio administrativo positivo implica que la solicitud se considera:',
    answers: [{ name: 'Estimada', correct: true }, { name: 'Desestimada', correct: false }, { name: 'Archivada', correct: false }, { name: 'Pendiente de resolución', correct: false }] },
  { q: '¿Qué recurso procede contra los actos de trámite que impidan continuar el procedimiento?',
    answers: [{ name: 'Recurso de alzada', correct: true }, { name: 'Recurso de reposición', correct: false }, { name: 'Recurso extraordinario de revisión', correct: false }, { name: 'Recurso contencioso-administrativo', correct: false }] },
  { q: '¿Qué órgano es el máximo intérprete de la Constitución?',
    answers: [{ name: 'El Tribunal Constitucional', correct: true }, { name: 'El Tribunal Supremo', correct: false }, { name: 'La Audiencia Nacional', correct: false }, { name: 'El Consejo de Estado', correct: false }] },
  { q: 'La invalidez de pleno derecho de un acto administrativo se denomina:',
    answers: [{ name: 'Nulidad de pleno derecho', correct: true }, { name: 'Anulabilidad', correct: false }, { name: 'Irregularidad no invalidante', correct: false }, { name: 'Ineficacia sobrevenida', correct: false }] },
  { q: '¿Qué principio exige que las normas sancionadoras sean previas al hecho y estén escritas?',
    answers: [{ name: 'Legalidad (lex scripta, lex praevia, lex certa)', correct: true }, { name: 'Proporcionalidad', correct: false }, { name: 'Tipicidad', correct: false }, { name: 'Culpabilidad', correct: false }] },
  { q: 'El recurso de alzada se interpone ante:',
    answers: [{ name: 'El órgano superior jerárquico', correct: true }, { name: 'El mismo órgano que dictó el acto', correct: false }, { name: 'El Tribunal Supremo', correct: false }, { name: 'El Defensor del Pueblo', correct: false }] },
  { q: '¿En qué plazo debe interponerse el recurso de alzada?',
    answers: [{ name: '1 mes si el acto es expreso; 3 meses si es presunto', correct: true }, { name: '10 días hábiles en todo caso', correct: false }, { name: '2 meses en todo caso', correct: false }, { name: '6 meses si el acto es expreso', correct: false }] },
  { q: 'Los reglamentos dictados por el Gobierno se denominan:',
    answers: [{ name: 'Reales Decretos', correct: true }, { name: 'Órdenes Ministeriales', correct: false }, { name: 'Circulares', correct: false }, { name: 'Instrucciones', correct: false }] },
  { q: '¿Qué principio rige la actividad de la Administración según el art. 103 CE?',
    answers: [{ name: 'Objetividad y servicio al interés general', correct: true }, { name: 'Discrecionalidad absoluta', correct: false }, { name: 'Reserva de ley orgánica', correct: false }, { name: 'Libre apreciación probatoria', correct: false }] },
  { q: '¿Qué acto pone fin a la vía administrativa en primera instancia?',
    answers: [{ name: 'La resolución del recurso de alzada o el acto que agote la vía', correct: true }, { name: 'Cualquier resolución administrativa', correct: false }, { name: 'Solo la sentencia judicial', correct: false }, { name: 'La Circular del Ministerio', correct: false }] },
];

const CE_QUESTIONS = [
  { q: '¿En qué año se aprobó la Constitución Española vigente?',
    answers: [{ name: '1978', correct: true }, { name: '1975', correct: false }, { name: '1931', correct: false }, { name: '1982', correct: false }] },
  { q: '¿Cuántos artículos tiene la Constitución Española?',
    answers: [{ name: '169', correct: true }, { name: '145', correct: false }, { name: '200', correct: false }, { name: '108', correct: false }] },
  { q: 'La forma política del Estado español es:',
    answers: [{ name: 'La Monarquía parlamentaria', correct: true }, { name: 'La República presidencialista', correct: false }, { name: 'La Monarquía absoluta', correct: false }, { name: 'La República parlamentaria', correct: false }] },
  { q: '¿Quién tiene la iniciativa para reformar la Constitución según el art. 166?',
    answers: [{ name: 'El Gobierno, el Congreso, el Senado y las Asambleas legislativas autonómicas', correct: true }, { name: 'Solo el Gobierno', correct: false }, { name: 'Solo el Congreso de los Diputados', correct: false }, { name: 'El Rey mediante decreto', correct: false }] },
  { q: '¿Qué artículo recoge el derecho a la tutela judicial efectiva?',
    answers: [{ name: 'Art. 24 CE', correct: true }, { name: 'Art. 14 CE', correct: false }, { name: 'Art. 18 CE', correct: false }, { name: 'Art. 35 CE', correct: false }] },
  { q: '¿Cuál es la lengua oficial del Estado?',
    answers: [{ name: 'El castellano', correct: true }, { name: 'El catalán y el castellano', correct: false }, { name: 'Cualquier lengua cooficial de una CCAA', correct: false }, { name: 'El español en su variante madrileña', correct: false }] },
  { q: 'El Congreso de los Diputados se compone de:',
    answers: [{ name: 'Un mínimo de 300 y un máximo de 400 diputados', correct: true }, { name: 'Exactamente 350 diputados', correct: false }, { name: 'Un mínimo de 200 y un máximo de 300 diputados', correct: false }, { name: 'Los que resulten de cada elección sin límite', correct: false }] },
  { q: '¿Cuánto dura el mandato del Senado?',
    answers: [{ name: '4 años', correct: true }, { name: '5 años', correct: false }, { name: '6 años', correct: false }, { name: '3 años', correct: false }] },
  { q: '¿Qué recurso puede interponer cualquier ciudadano ante el TC por violación de derechos fundamentales?',
    answers: [{ name: 'El recurso de amparo', correct: true }, { name: 'El recurso de inconstitucionalidad', correct: false }, { name: 'El recurso de casación', correct: false }, { name: 'La cuestión de inconstitucionalidad', correct: false }] },
  { q: 'Según la CE, la soberanía nacional reside en:',
    answers: [{ name: 'El pueblo español', correct: true }, { name: 'El Rey', correct: false }, { name: 'Las Cortes Generales', correct: false }, { name: 'El Gobierno', correct: false }] },
  { q: '¿En qué Título se regulan los derechos y libertades?',
    answers: [{ name: 'Título I', correct: true }, { name: 'Título II', correct: false }, { name: 'Título III', correct: false }, { name: 'Título Preliminar', correct: false }] },
  { q: 'El derecho a la educación está recogido en:',
    answers: [{ name: 'Art. 27 CE', correct: true }, { name: 'Art. 43 CE', correct: false }, { name: 'Art. 35 CE', correct: false }, { name: 'Art. 20 CE', correct: false }] },
  { q: '¿Quién refrenda los actos del Rey?',
    answers: [{ name: 'El Presidente del Gobierno o los ministros competentes', correct: true }, { name: 'Solo el Presidente del Congreso', correct: false }, { name: 'El Presidente del Tribunal Constitucional', correct: false }, { name: 'El Consejo de Estado', correct: false }] },
  { q: '¿Cuántos magistrados componen el Tribunal Constitucional?',
    answers: [{ name: '12', correct: true }, { name: '9', correct: false }, { name: '15', correct: false }, { name: '7', correct: false }] },
  { q: 'El Estado de alarma lo declara:',
    answers: [{ name: 'El Gobierno mediante Real Decreto, con autorización del Congreso si supera 15 días', correct: true }, { name: 'El Rey a propuesta del TC', correct: false }, { name: 'El Congreso por mayoría absoluta', correct: false }, { name: 'El Senado', correct: false }] },
];

// ─── Lesson content ───────────────────────────────────────────────────────────

const DA_LESSONS = [
  {
    title: 'Introducción al Derecho Administrativo', order: 1, type: 'article',
    estimatedDurationMinutes: 15, xpReward: 10,
    contentText: `## Derecho Administrativo

El Derecho Administrativo es la rama del Derecho público que regula la organización y actividad de las Administraciones Públicas y sus relaciones con los ciudadanos.

### Fuentes del Derecho Administrativo

1. **La Constitución** — norma suprema del ordenamiento jurídico
2. **Las Leyes Orgánicas** — requieren mayoría absoluta del Congreso
3. **Las Leyes Ordinarias** — aprobadas por mayoría simple
4. **Los Reglamentos** — normas dictadas por el Poder Ejecutivo

### Principios fundamentales (art. 103 CE)

- **Objetividad**: la Administración sirve con objetividad los intereses generales
- **Eficacia**: debe actuar con eficacia en el cumplimiento de sus fines
- **Jerarquía, descentralización, desconcentración y coordinación**
- **Sometimiento pleno a la Ley y al Derecho**`,
  },
  {
    title: 'El Acto Administrativo y su Invalidez', order: 2, type: 'article',
    estimatedDurationMinutes: 20, xpReward: 15,
    contentText: `## El Acto Administrativo

El acto administrativo es toda declaración de voluntad, juicio, conocimiento o deseo realizada por la Administración en el ejercicio de una potestad administrativa.

### Requisitos de validez

- **Competencia** del órgano que lo dicta
- **Procedimiento** adecuado
- **Forma** requerida
- **Motivación** cuando sea preceptiva

### Tipos de invalidez

| Tipo | Causa | Efectos |
|------|-------|---------|
| **Nulidad de pleno derecho** (art. 47 LPAC) | Lesión DDFF, incompetencia manifiesta, contenido imposible | Impugnable en cualquier momento |
| **Anulabilidad** (art. 48 LPAC) | Cualquier infracción del ordenamiento | Impugnable en plazo |
| **Irregularidad no invalidante** | Defecto de forma sin indefensión | No invalida el acto |

### Recursos administrativos

- **Recurso de alzada**: ante el órgano superior jerárquico
- **Recurso de reposición**: potestativo, ante el mismo órgano
- **Recurso extraordinario de revisión**: causas tasadas`,
  },
  {
    title: 'Normativa — Texto oficial Ley 39/2015', order: 3, type: 'file',
    estimatedDurationMinutes: 5, xpReward: 5, contentText: null,
  },
];

const CE_LESSONS = [
  {
    title: 'Estructura y Principios de la Constitución', order: 1, type: 'article',
    estimatedDurationMinutes: 15, xpReward: 10,
    contentText: `## La Constitución Española de 1978

### Estructura

- **Preámbulo**
- **Título Preliminar** (arts. 1-9): principios fundamentales
- **Títulos I–X** (arts. 10-169): organización del Estado
- 4 disposiciones adicionales, 9 transitorias, 1 derogatoria, 1 final

### Valores superiores (art. 1.1 CE)

1. **Libertad**
2. **Justicia**
3. **Igualdad**
4. **Pluralismo político**

### Reforma constitucional

- **Art. 167**: reforma ordinaria (mayoría de 3/5 de cada Cámara)
- **Art. 168**: reforma agravada (aprobación en dos legislaturas + referéndum)`,
  },
  {
    title: 'Órganos Constitucionales', order: 2, type: 'article',
    estimatedDurationMinutes: 20, xpReward: 15,
    contentText: `## Los Órganos Constitucionales

### Las Cortes Generales

- **Congreso de los Diputados**: 300–400 diputados; elegidos por 4 años
- **Senado**: Cámara de representación territorial; 4 años de mandato

### El Gobierno (arts. 97-107 CE)

- Dirige la política interior y exterior, la Administración civil y militar
- Compuesto por el Presidente, vicepresidentes y ministros

### El Tribunal Constitucional (arts. 159-165 CE)

- **12 magistrados** nombrados por el Rey
- Intérprete supremo de la Constitución
- Controla la constitucionalidad de las leyes
- Protege los derechos fundamentales mediante el recurso de amparo`,
  },
  {
    title: 'Texto consolidado — Constitución Española', order: 3, type: 'file',
    estimatedDurationMinutes: 5, xpReward: 5, contentText: null,
  },
];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  Starting seed…\n');

  // ── 0. Clean all previous seed data (FK order) ────────────────────────────
  console.log('🧹  Cleaning previous seed data…');

  await db.delete(schema.userAchievement).where(inArray(schema.userAchievement.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.xpTransactions).where(inArray(schema.xpTransactions.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.quizDetails).where(inArray(schema.quizDetails.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.quizzes).where(inArray(schema.quizzes.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.userStats).where(inArray(schema.userStats.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.userSubjects).where(inArray(schema.userSubjects.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.accounts).where(inArray(schema.accounts.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.students).where(inArray(schema.students.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.teachers).where(inArray(schema.teachers.userId, ALL_SEED_USER_IDS));
  await db.delete(schema.users).where(inArray(schema.users.id, ALL_SEED_USER_IDS));
  console.log('   ✓ Previous seed rows removed');

  // ── 1. Auth users (teacher + students — for Playwright) ───────────────────
  console.log('\n👤  Inserting auth users…');
  const now = new Date();
  const teacherHash  = await bcrypt.hash('Teacher123!', 10);
  const studentHash  = await bcrypt.hash('Student123!', 10);

  await db.insert(schema.users).values([
    { id: TEACHER_ID,  email: 'teacher@exams.test',  fullName: 'Profesora Ana García',      emailVerified: true, role: 'teacher',  xp: 0, totalPoints: 0, createdAt: now, updatedAt: now },
    { id: STUDENT1_ID, email: 'student1@exams.test', fullName: 'Carlos Martínez López',     emailVerified: true, role: 'student',  xp: 0, totalPoints: 0, createdAt: now, updatedAt: now },
    { id: STUDENT2_ID, email: 'student2@exams.test', fullName: 'Laura Fernández Ruiz',      emailVerified: true, role: 'student',  xp: 0, totalPoints: 0, createdAt: now, updatedAt: now },
  ]);

  // Better-Auth credential accounts
  await db.insert(schema.accounts).values([
    { id: `acc-${TEACHER_ID}`,  accountId: TEACHER_ID,  providerId: 'credential', userId: TEACHER_ID,  password: teacherHash, createdAt: now, updatedAt: now },
    { id: `acc-${STUDENT1_ID}`, accountId: STUDENT1_ID, providerId: 'credential', userId: STUDENT1_ID, password: studentHash, createdAt: now, updatedAt: now },
    { id: `acc-${STUDENT2_ID}`, accountId: STUDENT2_ID, providerId: 'credential', userId: STUDENT2_ID, password: studentHash, createdAt: now, updatedAt: now },
  ]);

  await db.insert(schema.teachers).values({ id: 1, userId: TEACHER_ID }).onConflictDoNothing();
  await db.insert(schema.students).values([
    { id: 1, userId: STUDENT1_ID },
    { id: 2, userId: STUDENT2_ID },
  ]).onConflictDoNothing();

  // UserStats rows
  await db.insert(schema.userStats).values([
    { userId: STUDENT1_ID, totalQuizzesCompleted: 0, totalQuestionsAnswered: 0, totalCorrectAnswers: 0 },
    { userId: STUDENT2_ID, totalQuizzesCompleted: 0, totalQuestionsAnswered: 0, totalCorrectAnswers: 0 },
  ]).onConflictDoNothing();

  console.log('   ✓ teacher@exams.test  (Teacher123!)');
  console.log('   ✓ student1@exams.test (Student123!)');
  console.log('   ✓ student2@exams.test (Student123!)');

  // ── 2. Gamification personas (leaderboard — no auth) ──────────────────────
  console.log('\n🎮  Inserting gamification personas…');
  await db.insert(schema.users).values([
    { id: ALICE_ID,  fullName: 'Alice García',    email: 'alice@seed.test',  emailVerified: true, role: 'student', xp: 1800, level: 4, currentStreak: 7,  longestStreak: 12, lastActivityDate: today,     totalPoints: 420, createdAt: new Date('2024-09-01T10:00:00Z'), updatedAt: now },
    { id: BRUNO_ID,  fullName: 'Bruno Martínez',  email: 'bruno@seed.test',  emailVerified: true, role: 'student', xp: 750,  level: 2, currentStreak: 3,  longestStreak: 8,  lastActivityDate: yesterday,  totalPoints: 175, createdAt: new Date('2024-10-15T12:00:00Z'), updatedAt: now },
    { id: CARMEN_ID, fullName: 'Carmen López',    email: 'carmen@seed.test', emailVerified: true, role: 'student', xp: 200,  level: 1, currentStreak: 1,  longestStreak: 1,  lastActivityDate: today,     totalPoints: 55,  createdAt: new Date('2025-01-20T09:00:00Z'), updatedAt: now },
  ]);
  console.log('   ✓ Alice García   (level 4, 7d streak, 420pts)');
  console.log('   ✓ Bruno Martínez (level 2, 3d streak, 175pts)');
  console.log('   ✓ Carmen López   (level 1, 1d streak,  55pts)');

  // ── 3. Achievements ───────────────────────────────────────────────────────
  console.log('\n🏆  Upserting achievements…');
  await db.insert(schema.achievements).values([
    { name: 'Primer paso',      description: 'Completa tu primer quiz',           threshold: 1,  type: '1', rarity: 'common'    },
    { name: 'Constante',        description: 'Completa 5 quizzes',                threshold: 5,  type: '1', rarity: 'common'    },
    { name: 'Experto',          description: 'Completa 10 quizzes',               threshold: 10, type: '1', rarity: 'rare'      },
    { name: 'Primera aprobada', description: 'Aprueba tu primer quiz (≥70%)',      threshold: 1,  type: '2', rarity: 'common'    },
    { name: 'En racha',         description: 'Aprueba 5 quizzes',                 threshold: 5,  type: '2', rarity: 'rare'      },
    { name: 'Estudioso',        description: 'Aprueba 10 quizzes',                threshold: 10, type: '2', rarity: 'epic'      },
    { name: 'Perfeccionista',   description: 'Obtén tu primer 100%',              threshold: 1,  type: '3', rarity: 'rare'      },
    { name: 'Impecable',        description: 'Obtén 3 puntuaciones perfectas',     threshold: 3,  type: '3', rarity: 'epic'      },
    { name: 'Máquina perfecta', description: 'Obtén 5 puntuaciones perfectas',     threshold: 5,  type: '3', rarity: 'legendary' },
  ]).onConflictDoNothing();
  const allAchievements = await db.select().from(schema.achievements);
  console.log(`   ✓ ${allAchievements.length} achievements ready`);

  // ── 4. Subjects ───────────────────────────────────────────────────────────
  console.log('\n📚  Upserting subjects…');
  const subjectRows = await db.insert(schema.subjects).values([
    { name: 'Derecho Administrativo', description: 'Fuentes, procedimiento y acto administrativo', active: true },
    { name: 'Constitución Española',  description: 'Estructura, derechos y órganos constitucionales', active: true },
  ]).onConflictDoNothing().returning({ id: schema.subjects.id, name: schema.subjects.name });

  // Fetch if already existed (onConflictDoNothing returns nothing on conflict)
  const allSubjects = subjectRows.length === 2
    ? subjectRows
    : await db.select({ id: schema.subjects.id, name: schema.subjects.name })
        .from(schema.subjects)
        .where(inArray(schema.subjects.name, ['Derecho Administrativo', 'Constitución Española']));

  const daSubject = allSubjects.find(s => s.name === 'Derecho Administrativo')!;
  const ceSubject = allSubjects.find(s => s.name === 'Constitución Española')!;
  console.log(`   ✓ Derecho Administrativo (id: ${daSubject.id})`);
  console.log(`   ✓ Constitución Española  (id: ${ceSubject.id})`);

  // ── 5. Units ──────────────────────────────────────────────────────────────
  console.log('\n🗂️   Upserting units…');
  const unitRows = await db.insert(schema.units).values([
    // DA: unit 1 = free + open; unit 2 = paid + sequential (for Phase 3 gate testing)
    { name: 'Tema 1 · Fuentes del Derecho',      description: 'Jerarquía normativa y tipos de normas',       subjectId: daSubject.id, active: true, questionsPerQuiz: 5, order: 1, isFree: true,  unlockPreviousRequired: false },
    { name: 'Tema 2 · Acto Administrativo',      description: 'Elementos, eficacia y validez del acto',      subjectId: daSubject.id, active: true, questionsPerQuiz: 5, order: 2, isFree: false, unlockPreviousRequired: true  },
    { name: 'Tema 1 · Principios y Derechos',    description: 'Título I CE: derechos fundamentales',         subjectId: ceSubject.id, active: true, questionsPerQuiz: 5, order: 1, isFree: true,  unlockPreviousRequired: false },
    { name: 'Tema 2 · Órganos Constitucionales', description: 'Cortes, Gobierno y Tribunal Constitucional',  subjectId: ceSubject.id, active: true, questionsPerQuiz: 5, order: 2, isFree: false, unlockPreviousRequired: true  },
  ]).onConflictDoNothing().returning({ id: schema.units.id, name: schema.units.name, subjectId: schema.units.subjectId });

  const allUnits = unitRows.length === 4
    ? unitRows
    : await db.select({ id: schema.units.id, name: schema.units.name, subjectId: schema.units.subjectId })
        .from(schema.units)
        .where(inArray(schema.units.subjectId, [daSubject.id, ceSubject.id]));

  const daUnits = allUnits.filter(u => u.subjectId === daSubject.id).sort((a, b) => a.id - b.id);
  const ceUnits = allUnits.filter(u => u.subjectId === ceSubject.id).sort((a, b) => a.id - b.id);
  const [daUnit1, daUnit2] = daUnits;
  const [ceUnit1, ceUnit2] = ceUnits;
  console.log(`   ✓ 4 units ready (DA: ${daUnit1.id}, ${daUnit2.id} | CE: ${ceUnit1.id}, ${ceUnit2.id})`);

  // ── 6. Questions + Answers ────────────────────────────────────────────────
  console.log('\n❓  Seeding questions & answers…');
  const questionMap: Record<number, number[]> = {};

  const unitQuestionData = [
    { unitId: daUnit1.id, questions: DA_QUESTIONS },
    { unitId: daUnit2.id, questions: DA_QUESTIONS },
    { unitId: ceUnit1.id, questions: CE_QUESTIONS },
    { unitId: ceUnit2.id, questions: CE_QUESTIONS },
  ];

  for (const { unitId, questions } of unitQuestionData) {
    const existing = await db.select({ id: schema.questions.id })
      .from(schema.questions).where(eq(schema.questions.unitId, unitId));

    if (existing.length >= questions.length) {
      questionMap[unitId] = existing.map(q => q.id);
      console.log(`   ✓ Unit ${unitId}: ${existing.length} questions already exist`);
      continue;
    }

    const qIds: number[] = [];
    for (const qData of questions) {
      const [inserted] = await db.insert(schema.questions)
        .values({ unitId, question: qData.q, active: true })
        .returning({ id: schema.questions.id });
      await db.insert(schema.answers).values(
        qData.answers.map(a => ({ questionId: inserted.id, name: a.name, correct: a.correct }))
      );
      qIds.push(inserted.id);
    }
    questionMap[unitId] = qIds;
    console.log(`   ✓ Unit ${unitId}: ${qIds.length} questions inserted`);
  }

  // ── 7. Lessons (on DA units — Phase 2 content) ────────────────────────────
  console.log('\n📖  Seeding lessons…');
  const PLACEHOLDER_FILE_URL = 'https://placeholder.r2.dev/resources/seed/documento.pdf';

  const seedLessons = async (unitId: number, lessonsData: typeof DA_LESSONS, label: string) => {
    const existing = await db.select({ id: schema.lessons.id })
      .from(schema.lessons).where(eq(schema.lessons.unitId, unitId));
    if (existing.length >= lessonsData.length) {
      console.log(`   ✓ ${label}: ${existing.length} lessons already exist`);
      return existing[0].id;
    }
    let firstId = 0;
    for (const l of lessonsData) {
      const [lesson] = await db.insert(schema.lessons).values({
        unitId, title: l.title, order: l.order, type: l.type,
        contentText: l.contentText ?? undefined,
        estimatedDurationMinutes: l.estimatedDurationMinutes,
        xpReward: l.xpReward, active: true,
      }).returning({ id: schema.lessons.id });
      if (!firstId) firstId = lesson.id;
      if (l.type === 'file') {
        await db.insert(schema.lessonResources).values({
          lessonId: lesson.id, title: `${l.title}.pdf`, type: 'pdf',
          url: PLACEHOLDER_FILE_URL, order: 1,
        }).onConflictDoNothing();
      }
    }
    console.log(`   ✓ ${label}: ${lessonsData.length} lessons inserted`);
    return firstId;
  };

  const daUnit1FirstLesson = await seedLessons(daUnit1.id, DA_LESSONS, `DA Unit 1 (id:${daUnit1.id})`);
  await seedLessons(daUnit2.id, DA_LESSONS, `DA Unit 2 (id:${daUnit2.id})`);
  await seedLessons(ceUnit1.id, CE_LESSONS, `CE Unit 1 (id:${ceUnit1.id})`);
  await seedLessons(ceUnit2.id, CE_LESSONS, `CE Unit 2 (id:${ceUnit2.id})`);

  // ── 8. Enrollments ────────────────────────────────────────────────────────
  console.log('\n📋  Seeding enrollments…');
  await db.insert(schema.userSubjects).values([
    // Auth students → both subjects
    { userId: STUDENT1_ID, subjectId: daSubject.id },
    { userId: STUDENT1_ID, subjectId: ceSubject.id },
    { userId: STUDENT2_ID, subjectId: daSubject.id },
    { userId: STUDENT2_ID, subjectId: ceSubject.id },
    // Gamification personas
    { userId: ALICE_ID,  subjectId: daSubject.id },
    { userId: ALICE_ID,  subjectId: ceSubject.id },
    { userId: BRUNO_ID,  subjectId: daSubject.id },
    { userId: CARMEN_ID, subjectId: daSubject.id },
  ]).onConflictDoNothing();
  console.log('   ✓ Enrollments done');

  // ── 9. Quiz history (gamification personas) ───────────────────────────────
  console.log('\n🎯  Creating quiz history…');

  const quizzesToSeed = [
    { userId: ALICE_ID,  unitId: daUnit1.id, score: 60,  daysAgo: 14 },
    { userId: ALICE_ID,  unitId: daUnit1.id, score: 80,  daysAgo: 10 },
    { userId: ALICE_ID,  unitId: daUnit1.id, score: 100, daysAgo: 5  },
    { userId: ALICE_ID,  unitId: daUnit2.id, score: 70,  daysAgo: 4  },
    { userId: ALICE_ID,  unitId: daUnit2.id, score: 100, daysAgo: 2  },
    { userId: ALICE_ID,  unitId: ceUnit1.id, score: 80,  daysAgo: 3  },
    { userId: ALICE_ID,  unitId: ceUnit1.id, score: 100, daysAgo: 1  },
    { userId: ALICE_ID,  unitId: ceUnit2.id, score: 90,  daysAgo: 0  },
    { userId: BRUNO_ID,  unitId: daUnit1.id, score: 40,  daysAgo: 8  },
    { userId: BRUNO_ID,  unitId: daUnit1.id, score: 75,  daysAgo: 3  },
    { userId: BRUNO_ID,  unitId: daUnit2.id, score: 60,  daysAgo: 1  },
    { userId: CARMEN_ID, unitId: daUnit1.id, score: 55,  daysAgo: 0  },
  ];

  for (const q of quizzesToSeed) {
    const createdAt = new Date(Date.now() - q.daysAgo * 86_400_000).toISOString();
    const unitQIds  = (questionMap[q.unitId] ?? []).slice(0, 5);
    if (!unitQIds.length) continue;

    const [quiz] = await db.insert(schema.quizzes).values({
      userId: q.userId, unitId: q.unitId, score: q.score,
      xpEarned:     unitQIds.length * 5 + (q.score >= 70 ? 20 : 0) + (q.score === 100 ? 30 : 0),
      pointsEarned: q.score,
      startedAt: createdAt, finishedAt: createdAt, createdAt: createdAt,
    }).returning({ id: schema.quizzes.id });

    const correctCount = Math.round((q.score / 100) * unitQIds.length);
    await db.insert(schema.quizDetails).values(
      unitQIds.map((qId, i) => ({
        quizId: quiz.id, userId: q.userId, questionId: qId,
        unitId: q.unitId, correct: i < correctCount, createdAt,
      }))
    );
  }
  console.log(`   ✓ ${quizzesToSeed.length} quiz records + quiz_details`);

  // ── 10. XP transactions ───────────────────────────────────────────────────
  console.log('\n⚡  Inserting XP transactions…');
  await db.insert(schema.xpTransactions).values([
    { userId: ALICE_ID,  amount: 600, sourceType: 'quiz', description: 'DA quizzes — historical' },
    { userId: ALICE_ID,  amount: 700, sourceType: 'quiz', description: 'CE quizzes — historical' },
    { userId: ALICE_ID,  amount: 500, sourceType: 'quiz', description: 'Streak bonuses'          },
    { userId: BRUNO_ID,  amount: 450, sourceType: 'quiz', description: 'DA quizzes — historical' },
    { userId: BRUNO_ID,  amount: 300, sourceType: 'quiz', description: 'Streak bonuses'          },
    { userId: CARMEN_ID, amount: 200, sourceType: 'quiz', description: 'DA quizzes — historical' },
  ]);
  console.log('   ✓ 6 XP transactions');

  // ── 11. Achievement assignments (gamification personas) ───────────────────
  console.log('\n🎖️   Assigning achievements…');
  const ach = (type: string, threshold: number) =>
    allAchievements.find(a => a.type === type && a.threshold === threshold);

  const assignments: { userId: string; achievementId: number }[] = [];
  // Alice: 8 quizzes done, 6 passed, 3 perfect
  for (const a of [ach('1',1), ach('1',5), ach('2',1), ach('2',5), ach('3',1), ach('3',3)])
    if (a) assignments.push({ userId: ALICE_ID, achievementId: a.id });
  // Bruno: 3 quizzes done, 1 passed, 0 perfect
  for (const a of [ach('1',1), ach('2',1)])
    if (a) assignments.push({ userId: BRUNO_ID, achievementId: a.id });
  // Carmen: 1 quiz done, 0 passed
  for (const a of [ach('1',1)])
    if (a) assignments.push({ userId: CARMEN_ID, achievementId: a.id });

  if (assignments.length)
    await db.insert(schema.userAchievement).values(assignments).onConflictDoNothing();
  console.log(`   ✓ ${assignments.length} achievements assigned`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(64));
  console.log('✅  Seed complete!\n');
  console.log('Add these to .env.local for Playwright tests:\n');
  console.log(`TEACHER_EMAIL=teacher@exams.test`);
  console.log(`TEACHER_PASSWORD=Teacher123!`);
  console.log(`STUDENT_EMAIL=student1@exams.test`);
  console.log(`STUDENT_PASSWORD=Student123!`);
  console.log(`TEST_SUBJECT_ID=${daSubject.id}`);
  console.log(`TEST_UNIT_ID=${daUnit1.id}`);
  console.log(`TEST_LOCKED_UNIT_ID=${daUnit2.id}`);
  console.log(`TEST_LESSON_ID=${daUnit1FirstLesson}`);
  console.log('\nGameification personas (leaderboard preview):');
  console.log('  Alice García    — Level 4, 420 pts, 7d streak');
  console.log('  Bruno Martínez  — Level 2, 175 pts, 3d streak');
  console.log('  Carmen López    — Level 1,  55 pts, 1d streak');
  console.log('─'.repeat(64) + '\n');

  await client.end();
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
