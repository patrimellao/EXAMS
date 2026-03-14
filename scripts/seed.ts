/**
 * Seed script — Phase 0 & Phase 1 test data
 *
 * Run AFTER `npm run push` (schema already applied) and after
 * setup-db.sql has been executed (view + function):
 *
 *   psql $DATABASE_URL -f scripts/setup-db.sql
 *   npx tsx scripts/seed.ts
 *
 * The script is IDEMPOTENT — it truncates seed tables first.
 * ⚠️  Never run against production.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// DB connection
// ─────────────────────────────────────────────────────────────────────────────
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set. Copy .env.example → .env.local and fill it in.');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ─────────────────────────────────────────────────────────────────────────────
// Fixed test UUIDs  (safe to hard-code — dev only)
// ─────────────────────────────────────────────────────────────────────────────
const ALICE_ID  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const BRUNO_ID  = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CARMEN_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const SEED_USER_IDS = [ALICE_ID, BRUNO_ID, CARMEN_ID];

const today     = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function log(msg: string) { console.log(`  ${msg}`); }

// ─────────────────────────────────────────────────────────────────────────────
// Question data
// ─────────────────────────────────────────────────────────────────────────────
const DA_QUESTIONS: { q: string; answers: { name: string; correct: boolean }[] }[] = [
  {
    q: '¿Cuál es la norma de mayor rango en el ordenamiento jurídico español?',
    answers: [
      { name: 'La Constitución Española de 1978', correct: true },
      { name: 'El Código Civil', correct: false },
      { name: 'La Ley Orgánica del Poder Judicial', correct: false },
      { name: 'Los Reglamentos de la UE', correct: false },
    ],
  },
  {
    q: '¿Qué principio prohíbe sancionar dos veces por los mismos hechos?',
    answers: [
      { name: 'Non bis in idem', correct: true },
      { name: 'Ius cogens', correct: false },
      { name: 'Pacta sunt servanda', correct: false },
      { name: 'Nulla poena sine lege', correct: false },
    ],
  },
  {
    q: '¿Cuál es el plazo general de prescripción de las infracciones muy graves?',
    answers: [
      { name: '3 años', correct: true },
      { name: '1 año', correct: false },
      { name: '6 meses', correct: false },
      { name: '5 años', correct: false },
    ],
  },
  {
    q: '¿Qué ley regula el procedimiento administrativo común de las Administraciones Públicas?',
    answers: [
      { name: 'Ley 39/2015', correct: true },
      { name: 'Ley 40/2015', correct: false },
      { name: 'Ley 29/1998', correct: false },
      { name: 'Ley 47/2003', correct: false },
    ],
  },
  {
    q: '¿Cuántos días hábiles tiene la Administración para resolver y notificar en el procedimiento común?',
    answers: [
      { name: '3 meses (salvo norma especial)', correct: true },
      { name: '1 mes', correct: false },
      { name: '6 meses', correct: false },
      { name: '15 días hábiles', correct: false },
    ],
  },
  {
    q: 'El silencio administrativo positivo implica que la solicitud se considera:',
    answers: [
      { name: 'Estimada', correct: true },
      { name: 'Desestimada', correct: false },
      { name: 'Archivada', correct: false },
      { name: 'Pendiente de resolución', correct: false },
    ],
  },
  {
    q: '¿Qué recurso procede contra los actos de trámite que impidan continuar el procedimiento?',
    answers: [
      { name: 'Recurso de alzada', correct: true },
      { name: 'Recurso de reposición', correct: false },
      { name: 'Recurso extraordinario de revisión', correct: false },
      { name: 'Recurso contencioso-administrativo', correct: false },
    ],
  },
  {
    q: '¿Qué órgano es el máximo intérprete de la Constitución?',
    answers: [
      { name: 'El Tribunal Constitucional', correct: true },
      { name: 'El Tribunal Supremo', correct: false },
      { name: 'La Audiencia Nacional', correct: false },
      { name: 'El Consejo de Estado', correct: false },
    ],
  },
  {
    q: 'La invalidez de pleno derecho de un acto administrativo se denomina:',
    answers: [
      { name: 'Nulidad de pleno derecho', correct: true },
      { name: 'Anulabilidad', correct: false },
      { name: 'Irregularidad no invalidante', correct: false },
      { name: 'Ineficacia sobrevenida', correct: false },
    ],
  },
  {
    q: '¿Qué principio exige que las normas sancionadoras sean previas al hecho y estén escritas?',
    answers: [
      { name: 'Legalidad (lex scripta, lex praevia, lex certa)', correct: true },
      { name: 'Proporcionalidad', correct: false },
      { name: 'Tipicidad', correct: false },
      { name: 'Culpabilidad', correct: false },
    ],
  },
  {
    q: 'El recurso de alzada se interpone ante:',
    answers: [
      { name: 'El órgano superior jerárquico', correct: true },
      { name: 'El mismo órgano que dictó el acto', correct: false },
      { name: 'El Tribunal Supremo', correct: false },
      { name: 'El Defensor del Pueblo', correct: false },
    ],
  },
  {
    q: '¿En qué plazo debe interponerse el recurso de alzada?',
    answers: [
      { name: '1 mes si el acto es expreso; 3 meses si es presunto', correct: true },
      { name: '10 días hábiles en todo caso', correct: false },
      { name: '2 meses en todo caso', correct: false },
      { name: '6 meses si el acto es expreso', correct: false },
    ],
  },
  {
    q: 'Los reglamentos dictados por el Gobierno se denominan:',
    answers: [
      { name: 'Reales Decretos', correct: true },
      { name: 'Órdenes Ministeriales', correct: false },
      { name: 'Circulares', correct: false },
      { name: 'Instrucciones', correct: false },
    ],
  },
  {
    q: '¿Qué principio rige la actividad de la Administración según el art. 103 CE?',
    answers: [
      { name: 'Objetividad y servicio al interés general', correct: true },
      { name: 'Discrecionalidad absoluta', correct: false },
      { name: 'Reserva de ley orgánica', correct: false },
      { name: 'Libre apreciación probatoria', correct: false },
    ],
  },
  {
    q: '¿Qué acto pone fin a la vía administrativa en primera instancia?',
    answers: [
      { name: 'La resolución del recurso de alzada o el acto que agote la vía', correct: true },
      { name: 'Cualquier resolución administrativa', correct: false },
      { name: 'Solo la sentencia judicial', correct: false },
      { name: 'La Circular del Ministerio', correct: false },
    ],
  },
];

const CE_QUESTIONS: { q: string; answers: { name: string; correct: boolean }[] }[] = [
  {
    q: '¿En qué año se aprobó la Constitución Española vigente?',
    answers: [
      { name: '1978', correct: true },
      { name: '1975', correct: false },
      { name: '1931', correct: false },
      { name: '1982', correct: false },
    ],
  },
  {
    q: '¿Cuántos artículos tiene la Constitución Española?',
    answers: [
      { name: '169', correct: true },
      { name: '145', correct: false },
      { name: '200', correct: false },
      { name: '108', correct: false },
    ],
  },
  {
    q: 'La forma política del Estado español es:',
    answers: [
      { name: 'La Monarquía parlamentaria', correct: true },
      { name: 'La República presidencialista', correct: false },
      { name: 'La Monarquía absoluta', correct: false },
      { name: 'La República parlamentaria', correct: false },
    ],
  },
  {
    q: '¿Quién tiene la iniciativa para reformar la Constitución según el art. 166?',
    answers: [
      { name: 'El Gobierno, el Congreso, el Senado y las Asambleas legislativas autonómicas', correct: true },
      { name: 'Solo el Gobierno', correct: false },
      { name: 'Solo el Congreso de los Diputados', correct: false },
      { name: 'El Rey mediante decreto', correct: false },
    ],
  },
  {
    q: '¿Qué artículo recoge el derecho a la tutela judicial efectiva?',
    answers: [
      { name: 'Art. 24 CE', correct: true },
      { name: 'Art. 14 CE', correct: false },
      { name: 'Art. 18 CE', correct: false },
      { name: 'Art. 35 CE', correct: false },
    ],
  },
  {
    q: '¿Cuál es la lengua oficial del Estado?',
    answers: [
      { name: 'El castellano', correct: true },
      { name: 'El catalán y el castellano', correct: false },
      { name: 'Cualquier lengua cooficial de una CCAA', correct: false },
      { name: 'El español en su variante madrileña', correct: false },
    ],
  },
  {
    q: 'El Congreso de los Diputados se compone de:',
    answers: [
      { name: 'Un mínimo de 300 y un máximo de 400 diputados', correct: true },
      { name: 'Exactamente 350 diputados', correct: false },
      { name: 'Un mínimo de 200 y un máximo de 300 diputados', correct: false },
      { name: 'Los que resulten de cada elección sin límite', correct: false },
    ],
  },
  {
    q: '¿Cuánto dura el mandato del Senado?',
    answers: [
      { name: '4 años', correct: true },
      { name: '5 años', correct: false },
      { name: '6 años', correct: false },
      { name: '3 años', correct: false },
    ],
  },
  {
    q: '¿Qué recurso puede interponer cualquier ciudadano ante el TC por violación de derechos fundamentales?',
    answers: [
      { name: 'El recurso de amparo', correct: true },
      { name: 'El recurso de inconstitucionalidad', correct: false },
      { name: 'El recurso de casación', correct: false },
      { name: 'La cuestión de inconstitucionalidad', correct: false },
    ],
  },
  {
    q: 'Según la CE, la soberanía nacional reside en:',
    answers: [
      { name: 'El pueblo español', correct: true },
      { name: 'El Rey', correct: false },
      { name: 'Las Cortes Generales', correct: false },
      { name: 'El Gobierno', correct: false },
    ],
  },
  {
    q: '¿En qué Título se regulan los derechos y libertades?',
    answers: [
      { name: 'Título I', correct: true },
      { name: 'Título II', correct: false },
      { name: 'Título III', correct: false },
      { name: 'Título Preliminar', correct: false },
    ],
  },
  {
    q: 'El derecho a la educación está recogido en:',
    answers: [
      { name: 'Art. 27 CE', correct: true },
      { name: 'Art. 43 CE', correct: false },
      { name: 'Art. 35 CE', correct: false },
      { name: 'Art. 20 CE', correct: false },
    ],
  },
  {
    q: '¿Quién refrenda los actos del Rey?',
    answers: [
      { name: 'El Presidente del Gobierno o los ministros competentes', correct: true },
      { name: 'Solo el Presidente del Congreso', correct: false },
      { name: 'El Presidente del Tribunal Constitucional', correct: false },
      { name: 'El Consejo de Estado', correct: false },
    ],
  },
  {
    q: '¿Cuántos magistrados componen el Tribunal Constitucional?',
    answers: [
      { name: '12', correct: true },
      { name: '9', correct: false },
      { name: '15', correct: false },
      { name: '7', correct: false },
    ],
  },
  {
    q: 'El Estado de alarma lo declara:',
    answers: [
      { name: 'El Gobierno mediante Real Decreto, con autorización del Congreso si supera 15 días', correct: true },
      { name: 'El Rey a propuesta del TC', correct: false },
      { name: 'El Congreso por mayoría absoluta', correct: false },
      { name: 'El Senado', correct: false },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main seed
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  Starting seed…\n');

  // ── 0. Clean previous seed data ──────────────────────────────────────────
  console.log('🧹  Cleaning previous seed data…');
  // Delete in FK order
  await db.delete(schema.userAchievement).where(inArray(schema.userAchievement.userId, SEED_USER_IDS));
  await db.delete(schema.xpTransactions).where(inArray(schema.xpTransactions.userId, SEED_USER_IDS));
  await db.delete(schema.quizDetails).where(inArray(schema.quizDetails.userId, SEED_USER_IDS));
  await db.delete(schema.quizzes).where(inArray(schema.quizzes.userId, SEED_USER_IDS));
  await db.delete(schema.userSubjects).where(inArray(schema.userSubjects.userId, SEED_USER_IDS));
  await db.delete(schema.users).where(inArray(schema.users.id, SEED_USER_IDS));
  log('Done');

  // ── 1. Achievements ───────────────────────────────────────────────────────
  console.log('\n🏆  Upserting achievements…');
  const achievementRows = await db
    .insert(schema.achievements)
    .values([
      { name: 'Primer paso',      description: 'Completa tu primer quiz',            threshold: 1,  type: '1', rarity: 'common'    },
      { name: 'Constante',        description: 'Completa 5 quizzes',                 threshold: 5,  type: '1', rarity: 'common'    },
      { name: 'Experto',          description: 'Completa 10 quizzes',                threshold: 10, type: '1', rarity: 'rare'      },
      { name: 'Primera aprobada', description: 'Aprueba tu primer quiz (≥70%)',       threshold: 1,  type: '2', rarity: 'common'    },
      { name: 'En racha',         description: 'Aprueba 5 quizzes',                  threshold: 5,  type: '2', rarity: 'rare'      },
      { name: 'Estudioso',        description: 'Aprueba 10 quizzes',                 threshold: 10, type: '2', rarity: 'epic'      },
      { name: 'Perfeccionista',   description: 'Obtén tu primer 100%',               threshold: 1,  type: '3', rarity: 'rare'      },
      { name: 'Impecable',        description: 'Obtén 3 puntuaciones perfectas',      threshold: 3,  type: '3', rarity: 'epic'      },
      { name: 'Máquina perfecta', description: 'Obtén 5 puntuaciones perfectas',      threshold: 5,  type: '3', rarity: 'legendary' },
    ])
    .onConflictDoNothing()
    .returning({ id: schema.achievements.id, type: schema.achievements.type, threshold: schema.achievements.threshold });
  log(`${achievementRows.length} achievement rows processed`);

  // Re-fetch all achievements for later FK use
  const allAchievements = await db.select().from(schema.achievements);

  // ── 2. Subjects ───────────────────────────────────────────────────────────
  console.log('\n📚  Upserting subjects…');
  const subjectRows = await db
    .insert(schema.subjects)
    .values([
      { name: 'Derecho Administrativo', description: 'Fuentes, procedimiento y acto administrativo', active: true },
      { name: 'Constitución Española',  description: 'Estructura, derechos y órganos constitucionales', active: true },
    ])
    .onConflictDoNothing()
    .returning({ id: schema.subjects.id, name: schema.subjects.name });

  let daSubject = subjectRows.find(s => s.name === 'Derecho Administrativo');
  let ceSubject = subjectRows.find(s => s.name === 'Constitución Española');

  // If already existed (onConflictDoNothing returned nothing), fetch them
  if (!daSubject || !ceSubject) {
    const existing = await db.select().from(schema.subjects)
      .where(inArray(schema.subjects.name, ['Derecho Administrativo', 'Constitución Española']));
    daSubject = daSubject ?? existing.find(s => s.name === 'Derecho Administrativo');
    ceSubject = ceSubject ?? existing.find(s => s.name === 'Constitución Española');
  }
  log(`Subjects: DA(id=${daSubject!.id})  CE(id=${ceSubject!.id})`);

  // ── 3. Units ──────────────────────────────────────────────────────────────
  console.log('\n🗂️   Upserting units…');
  const unitRows = await db
    .insert(schema.units)
    .values([
      { name: 'Tema 1 · Fuentes del Derecho',     description: 'Jerarquía normativa y tipos de normas',       subjectId: daSubject!.id, active: true, questionsPerQuiz: 5, order: 1 },
      { name: 'Tema 2 · Acto Administrativo',     description: 'Elementos, eficacia y validez del acto',      subjectId: daSubject!.id, active: true, questionsPerQuiz: 5, order: 2 },
      { name: 'Tema 1 · Principios y Derechos',   description: 'Título I CE: derechos fundamentales',         subjectId: ceSubject!.id, active: true, questionsPerQuiz: 5, order: 1 },
      { name: 'Tema 2 · Órganos Constitucionales',description: 'Cortes, Gobierno y Tribunal Constitucional', subjectId: ceSubject!.id, active: true, questionsPerQuiz: 5, order: 2 },
    ])
    .onConflictDoNothing()
    .returning({ id: schema.units.id, name: schema.units.name, subjectId: schema.units.subjectId });

  // Ensure we have 4 units
  let allUnits = unitRows;
  if (allUnits.length < 4) {
    const fetched = await db.select({ id: schema.units.id, name: schema.units.name, subjectId: schema.units.subjectId })
      .from(schema.units)
      .where(inArray(schema.units.subjectId, [daSubject!.id, ceSubject!.id]));
    allUnits = fetched;
  }
  log(`${allUnits.length} units ready`);

  // ── 4. Questions + Answers ────────────────────────────────────────────────
  console.log('\n❓  Seeding questions & answers…');

  const unitsBySubject = {
    da: allUnits.filter(u => u.subjectId === daSubject!.id).sort((a, b) => a.id - b.id),
    ce: allUnits.filter(u => u.subjectId === ceSubject!.id).sort((a, b) => a.id - b.id),
  };

  // Assign questions: first 8 → DA unit 1+2 split,  last 7 → CE unit 1+2 split
  const daQ1 = DA_QUESTIONS.slice(0, 8);   // 8 Qs → DA Tema 1 (2 quizzes of 4... we use 5 per quiz so 8 = 1 full quiz + 3)
  const daQ2 = DA_QUESTIONS.slice(7, 15);  // 8 Qs → DA Tema 2
  const ceQ1 = CE_QUESTIONS.slice(0, 8);   // 8 Qs → CE Tema 1
  const ceQ2 = CE_QUESTIONS.slice(7, 15);  // 8 Qs → CE Tema 2

  // Actually let's put all 15 in each unit, then set questionsPerQuiz=5 → 3 quiz slots
  const questionMap: Record<number, number[]> = {}; // unitId → questionIds[]

  const unitQuestionData: { unitId: number; questions: typeof DA_QUESTIONS }[] = [
    { unitId: unitsBySubject.da[0]?.id, questions: DA_QUESTIONS.slice(0, 15) },
    { unitId: unitsBySubject.da[1]?.id, questions: DA_QUESTIONS.slice(0, 15) },
    { unitId: unitsBySubject.ce[0]?.id, questions: CE_QUESTIONS.slice(0, 15) },
    { unitId: unitsBySubject.ce[1]?.id, questions: CE_QUESTIONS.slice(0, 15) },
  ].filter(x => x.unitId != null);

  for (const { unitId, questions } of unitQuestionData) {
    // Check if questions already exist for this unit
    const existingQ = await db.select({ id: schema.questions.id })
      .from(schema.questions)
      .where(eq(schema.questions.unitId, unitId));

    if (existingQ.length >= questions.length) {
      questionMap[unitId] = existingQ.map(q => q.id);
      log(`Unit ${unitId}: ${existingQ.length} questions already exist — skipping`);
      continue;
    }

    const qIds: number[] = [];
    for (const qData of questions) {
      const [inserted] = await db
        .insert(schema.questions)
        .values({ unitId, question: qData.q, active: true })
        .returning({ id: schema.questions.id });

      await db.insert(schema.answers).values(
        qData.answers.map(a => ({ questionId: inserted.id, name: a.name, correct: a.correct })),
      );
      qIds.push(inserted.id);
    }
    questionMap[unitId] = qIds;
    log(`Unit ${unitId}: inserted ${qIds.length} questions with answers`);
  }

  // Update units to use questionsPerQuiz=5 so get_number_of_quizzes returns 3
  for (const { unitId } of unitQuestionData) {
    await db.update(schema.units)
      .set({ questionsPerQuiz: 5 })
      .where(eq(schema.units.id, unitId));
  }

  // ── 5. Test users ─────────────────────────────────────────────────────────
  console.log('\n👤  Inserting test users…');
  await db.insert(schema.users).values([
    {
      id:               ALICE_ID,
      fullName:         'Alice García',
      email:            'alice@seed.test',
      xp:               1800,
      level:            4,
      currentStreak:    7,
      longestStreak:    12,
      lastActivityDate: today,
      totalPoints:      420,
      createdAt:        '2024-09-01 10:00:00',
    },
    {
      id:               BRUNO_ID,
      fullName:         'Bruno Martínez',
      email:            'bruno@seed.test',
      xp:               750,
      level:            2,
      currentStreak:    3,
      longestStreak:    8,
      lastActivityDate: yesterday,
      totalPoints:      175,
      createdAt:        '2024-10-15 12:00:00',
    },
    {
      id:               CARMEN_ID,
      fullName:         'Carmen López',
      email:            'carmen@seed.test',
      xp:               200,
      level:            1,
      currentStreak:    1,
      longestStreak:    1,
      lastActivityDate: today,
      totalPoints:      55,
      createdAt:        '2025-01-20 09:00:00',
    },
  ]);
  log('3 users inserted');

  // ── 6. Enrollments ────────────────────────────────────────────────────────
  console.log('\n📋  Enrolling users…');
  await db.insert(schema.userSubjects).values([
    // Alice enrolled in both
    { userId: ALICE_ID,  subjectId: daSubject!.id },
    { userId: ALICE_ID,  subjectId: ceSubject!.id },
    // Bruno enrolled in DA only
    { userId: BRUNO_ID,  subjectId: daSubject!.id },
    // Carmen enrolled in DA only
    { userId: CARMEN_ID, subjectId: daSubject!.id },
  ]).onConflictDoNothing();
  log('Enrollments inserted');

  // ── 7. Quizzes + quiz_details ─────────────────────────────────────────────
  console.log('\n🎯  Creating quiz records…');

  type QuizSeed = {
    userId:  string;
    unitId:  number;
    score:   number;
    daysAgo: number; // for createdAt
  };

  const quizzesToSeed: QuizSeed[] = [
    // Alice - DA unit 1  (3 attempts)
    { userId: ALICE_ID, unitId: unitsBySubject.da[0]?.id, score: 60,  daysAgo: 14 },
    { userId: ALICE_ID, unitId: unitsBySubject.da[0]?.id, score: 80,  daysAgo: 10 },
    { userId: ALICE_ID, unitId: unitsBySubject.da[0]?.id, score: 100, daysAgo: 5  },
    // Alice - DA unit 2  (2 attempts)
    { userId: ALICE_ID, unitId: unitsBySubject.da[1]?.id, score: 70,  daysAgo: 4  },
    { userId: ALICE_ID, unitId: unitsBySubject.da[1]?.id, score: 100, daysAgo: 2  },
    // Alice - CE unit 1  (2 attempts)
    { userId: ALICE_ID, unitId: unitsBySubject.ce[0]?.id, score: 80,  daysAgo: 3  },
    { userId: ALICE_ID, unitId: unitsBySubject.ce[0]?.id, score: 100, daysAgo: 1  },
    // Alice - CE unit 2  (1 attempt)
    { userId: ALICE_ID, unitId: unitsBySubject.ce[1]?.id, score: 90,  daysAgo: 0  },

    // Bruno - DA unit 1  (2 attempts)
    { userId: BRUNO_ID, unitId: unitsBySubject.da[0]?.id, score: 40,  daysAgo: 8  },
    { userId: BRUNO_ID, unitId: unitsBySubject.da[0]?.id, score: 75,  daysAgo: 3  },
    // Bruno - DA unit 2  (1 attempt)
    { userId: BRUNO_ID, unitId: unitsBySubject.da[1]?.id, score: 60,  daysAgo: 1  },

    // Carmen - DA unit 1  (1 attempt)
    { userId: CARMEN_ID, unitId: unitsBySubject.da[0]?.id, score: 55, daysAgo: 0  },
  ].filter(q => q.unitId != null);

  for (const q of quizzesToSeed) {
    const createdAt = new Date(Date.now() - q.daysAgo * 86_400_000).toISOString();
    const questionsPerQuiz = 5;
    const unitQIds = questionMap[q.unitId] ?? [];
    const selectedQIds = unitQIds.slice(0, questionsPerQuiz);

    if (selectedQIds.length === 0) {
      log(`⚠️  No questions for unit ${q.unitId} — skipping quiz`);
      continue;
    }

    // Insert quiz record
    const [quiz] = await db.insert(schema.quizzes).values({
      userId:       q.userId,
      unitId:       q.unitId,
      score:        q.score,
      xpEarned:     selectedQIds.length * 5 + (q.score >= 70 ? 20 : 0) + (q.score === 100 ? 30 : 0),
      pointsEarned: q.score,
      startedAt:    createdAt,
      finishedAt:   createdAt,
      createdAt:    createdAt,
    }).returning({ id: schema.quizzes.id });

    // Insert quiz_details (one per question)
    const correctCount = Math.round((q.score / 100) * selectedQIds.length);
    await db.insert(schema.quizDetails).values(
      selectedQIds.map((qId, i) => ({
        quizId:    quiz.id,
        userId:    q.userId,
        questionId: qId,
        unitId:    q.unitId,
        correct:   i < correctCount,
        createdAt: createdAt,
      })),
    );
  }
  log(`${quizzesToSeed.length} quiz records created`);

  // ── 8. XP transactions ────────────────────────────────────────────────────
  console.log('\n⚡  Inserting XP transactions…');
  const xpEntries = [
    { userId: ALICE_ID,  xp: 600, desc: 'Seeded historical XP — DA quizzes'   },
    { userId: ALICE_ID,  xp: 700, desc: 'Seeded historical XP — CE quizzes'   },
    { userId: ALICE_ID,  xp: 500, desc: 'Seeded streak bonuses'                },
    { userId: BRUNO_ID,  xp: 450, desc: 'Seeded historical XP — DA quizzes'   },
    { userId: BRUNO_ID,  xp: 300, desc: 'Seeded streak bonuses'                },
    { userId: CARMEN_ID, xp: 200, desc: 'Seeded historical XP — DA quizzes'   },
  ];
  await db.insert(schema.xpTransactions).values(
    xpEntries.map(e => ({
      userId:      e.userId,
      amount:      e.xp,
      sourceType:  'quiz' as const,
      description: e.desc,
    })),
  );
  log(`${xpEntries.length} XP transactions inserted`);

  // ── 9. Achievements assignment ────────────────────────────────────────────
  console.log('\n🎖️   Assigning user achievements…');

  const achByTypeThreshold = (type: string, threshold: number) =>
    allAchievements.find(a => a.type === type && a.threshold === threshold);

  const userAchievements: { userId: string; achievementId: number }[] = [];

  // Alice: has 8 quizzes, 6 passed, 3 perfect
  for (const ach of [
    achByTypeThreshold('1', 1), achByTypeThreshold('1', 5),  // done: 1, 5
    achByTypeThreshold('2', 1), achByTypeThreshold('2', 5),  // passed: 1, 5
    achByTypeThreshold('3', 1), achByTypeThreshold('3', 3),  // perfect: 1, 3
  ]) {
    if (ach) userAchievements.push({ userId: ALICE_ID, achievementId: ach.id });
  }

  // Bruno: has 3 quizzes, 1 passed, 0 perfect
  for (const ach of [
    achByTypeThreshold('1', 1),  // done: 1
    achByTypeThreshold('2', 1),  // passed: 1
  ]) {
    if (ach) userAchievements.push({ userId: BRUNO_ID, achievementId: ach.id });
  }

  // Carmen: has 1 quiz, 0 passed
  for (const ach of [
    achByTypeThreshold('1', 1),  // done: 1
  ]) {
    if (ach) userAchievements.push({ userId: CARMEN_ID, achievementId: ach.id });
  }

  if (userAchievements.length) {
    await db.insert(schema.userAchievement).values(userAchievements).onConflictDoNothing();
  }
  log(`${userAchievements.length} achievements assigned`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!\n');
  console.log('   Test users (DB only — no Supabase auth):');
  console.log(`   • Alice García   ${ALICE_ID}  — Level 4, 7d streak`);
  console.log(`   • Bruno Martínez ${BRUNO_ID}  — Level 2, 3d streak`);
  console.log(`   • Carmen López   ${CARMEN_ID} — Level 1, 1d streak`);
  console.log('\n   These appear in /leaderboard and /profile pages.');
  console.log('   To test the full quiz flow, register a real user via /sign-up\n');

  await client.end();
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
