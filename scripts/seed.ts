/**
 * scripts/seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates the database with deterministic test/dev data for all phases.
 *
 * Usage:
 *   npm run seed               # reads .env.local automatically
 *   DATABASE_URL=... npx tsx scripts/seed.ts
 *
 * What is seeded:
 *   Users       → 1 teacher + 2 students (Better-Auth compatible rows)
 *   Subject     → "Administrativo General" (active)
 *   Units       → 2 units (unit 1 free + open, unit 2 paid + sequential lock)
 *   Questions   → 10 per unit with 4 answers each (realistic oposiciones content)
 *   Lessons     → 3 per unit (2 article + 1 file-type)
 *   Achievements→ 5 covering all types
 *   Enrollments → both students enrolled in the subject
 *   UserStats   → empty row per student (required by dashboard)
 *
 * After seeding the script prints the IDs of key records so you can paste
 * them into .env.local as TEST_* variables for Playwright.
 *
 * Running a second time is safe: all inserts use ON CONFLICT DO NOTHING /
 * DO UPDATE so the script is fully idempotent.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as schema from '../drizzle/schema';
import {
  eq, and
} from 'drizzle-orm';

// ─── DB connection ────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date();
const nowIso = now.toISOString();

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// ─── Seed data definitions ────────────────────────────────────────────────────

const TEACHER = {
  id: 'seed-teacher-001',
  email: 'teacher@exams.test',
  fullName: 'Profesora Ana García',
  password: 'Teacher123!',
  role: 'teacher',
};

const STUDENTS = [
  {
    id: 'seed-student-001',
    email: 'student1@exams.test',
    fullName: 'Carlos Martínez López',
    password: 'Student123!',
    role: 'student',
  },
  {
    id: 'seed-student-002',
    email: 'student2@exams.test',
    fullName: 'Laura Fernández Ruiz',
    password: 'Student123!',
    role: 'student',
  },
];

// Questions for Unit 1 — Constitución Española
const UNIT1_QUESTIONS: Array<{ question: string; explanation: string; answers: Array<{ name: string; correct: boolean }> }> = [
  {
    question: '¿En qué año fue aprobada la Constitución Española vigente?',
    explanation: 'La Constitución Española fue aprobada por las Cortes el 31 de octubre de 1978 y ratificada en referéndum el 6 de diciembre de 1978.',
    answers: [
      { name: '1976', correct: false },
      { name: '1977', correct: false },
      { name: '1978', correct: true },
      { name: '1979', correct: false },
    ],
  },
  {
    question: '¿Cuántos artículos tiene la Constitución Española de 1978?',
    explanation: 'La CE cuenta con 169 artículos, 4 disposiciones adicionales, 9 disposiciones transitorias, 1 disposición derogatoria y 1 disposición final.',
    answers: [
      { name: '150', correct: false },
      { name: '169', correct: true },
      { name: '175', correct: false },
      { name: '182', correct: false },
    ],
  },
  {
    question: 'Según el artículo 1.1 CE, España se constituye en un Estado social y democrático de Derecho que propugna como valores superiores:',
    explanation: 'Art. 1.1 CE: "España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político."',
    answers: [
      { name: 'La libertad, la justicia, la igualdad y el pluralismo político', correct: true },
      { name: 'La solidaridad, la justicia, la igualdad y la democracia', correct: false },
      { name: 'La libertad, la fraternidad, la igualdad y el pluralismo político', correct: false },
      { name: 'La libertad, la justicia, la solidaridad y el pluralismo político', correct: false },
    ],
  },
  {
    question: 'La soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado. ¿En qué artículo se recoge este principio?',
    explanation: 'El artículo 1.2 CE establece que "La soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado."',
    answers: [
      { name: 'Artículo 1.1', correct: false },
      { name: 'Artículo 1.2', correct: true },
      { name: 'Artículo 2', correct: false },
      { name: 'Artículo 9.1', correct: false },
    ],
  },
  {
    question: '¿Cuántos títulos tiene la Constitución Española de 1978?',
    explanation: 'La CE tiene un Título Preliminar y 10 Títulos (I al X), siendo el Título I el más extenso al regular los derechos y deberes fundamentales.',
    answers: [
      { name: '8', correct: false },
      { name: '9', correct: false },
      { name: '10 + Título Preliminar', correct: true },
      { name: '12', correct: false },
    ],
  },
  {
    question: 'Según la Constitución, el castellano es la lengua española oficial del Estado. El conocimiento y uso del castellano es:',
    explanation: 'Art. 3.1 CE: "El castellano es la lengua española oficial del Estado. Todos los españoles tienen el deber de conocerla y el derecho a usarla."',
    answers: [
      { name: 'Un derecho pero no un deber', correct: false },
      { name: 'Un deber pero no un derecho', correct: false },
      { name: 'Un deber y un derecho', correct: true },
      { name: 'Solo una obligación administrativa', correct: false },
    ],
  },
  {
    question: '¿Qué forma de gobierno establece el artículo 1.3 de la Constitución Española?',
    explanation: 'El art. 1.3 CE dispone que "La forma política del Estado español es la Monarquía parlamentaria."',
    answers: [
      { name: 'República parlamentaria', correct: false },
      { name: 'Monarquía constitucional', correct: false },
      { name: 'Monarquía parlamentaria', correct: true },
      { name: 'Democracia directa', correct: false },
    ],
  },
  {
    question: 'Según el artículo 9.3 CE, la Constitución garantiza el principio de legalidad, la jerarquía normativa y:',
    explanation: 'El art. 9.3 CE garantiza el principio de legalidad, la jerarquía normativa, la publicidad de las normas, la irretroactividad de las disposiciones sancionadoras no favorables, la seguridad jurídica, la responsabilidad y la interdicción de la arbitrariedad.',
    answers: [
      { name: 'La proporcionalidad y la responsabilidad de los poderes públicos', correct: false },
      { name: 'La publicidad de las normas, la irretroactividad y la seguridad jurídica', correct: true },
      { name: 'El pluralismo político y la separación de poderes', correct: false },
      { name: 'La igualdad de los ciudadanos ante la ley', correct: false },
    ],
  },
  {
    question: '¿Cuál es la capital del Estado según la Constitución Española?',
    explanation: 'El art. 5 CE establece que "La capital del Estado es la villa de Madrid."',
    answers: [
      { name: 'Toledo', correct: false },
      { name: 'Barcelona', correct: false },
      { name: 'Madrid', correct: true },
      { name: 'No está especificada en la Constitución', correct: false },
    ],
  },
  {
    question: 'El principio de unidad territorial y la autonomía de las nacionalidades y regiones se recoge en el artículo:',
    explanation: 'El art. 2 CE: "La Constitución se fundamenta en la indisoluble unidad de la Nación española, patria común e indivisible de todos los españoles, y reconoce y garantiza el derecho a la autonomía de las nacionalidades y regiones que la integran."',
    answers: [
      { name: 'Artículo 1', correct: false },
      { name: 'Artículo 2', correct: true },
      { name: 'Artículo 3', correct: false },
      { name: 'Artículo 143', correct: false },
    ],
  },
];

// Questions for Unit 2 — LPAC
const UNIT2_QUESTIONS: Array<{ question: string; explanation: string; answers: Array<{ name: string; correct: boolean }> }> = [
  {
    question: '¿Cuál es el objeto de la Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común?',
    explanation: 'La Ley 39/2015 regula los requisitos de validez y eficacia de los actos administrativos, el procedimiento administrativo común y los principios que rigen la iniciativa legislativa y la potestad reglamentaria.',
    answers: [
      { name: 'Regular exclusivamente el régimen jurídico del sector público', correct: false },
      { name: 'Regular los requisitos de validez y eficacia de los actos y el procedimiento administrativo común', correct: true },
      { name: 'Regular las relaciones entre las Administraciones Públicas', correct: false },
      { name: 'Establecer el estatuto de los empleados públicos', correct: false },
    ],
  },
  {
    question: '¿Cuál es el plazo máximo para resolver y notificar en el procedimiento administrativo común cuando no hay plazo especial?',
    explanation: 'El art. 21.3 LPAC establece un plazo máximo de 3 meses para resolver y notificar, salvo que una norma con rango de Ley establezca otro plazo.',
    answers: [
      { name: '1 mes', correct: false },
      { name: '2 meses', correct: false },
      { name: '3 meses', correct: true },
      { name: '6 meses', correct: false },
    ],
  },
  {
    question: 'Según la LPAC, el silencio administrativo positivo implica que la solicitud se entiende:',
    explanation: 'Art. 24.1 LPAC: En los procedimientos iniciados a solicitud del interesado, el vencimiento del plazo máximo sin haberse notificado resolución expresa legitima al interesado para entenderla estimada por silencio administrativo (silencio positivo), salvo excepciones.',
    answers: [
      { name: 'Desestimada', correct: false },
      { name: 'Estimada', correct: true },
      { name: 'Caducada', correct: false },
      { name: 'Suspendida', correct: false },
    ],
  },
  {
    question: '¿Qué es la caducidad del procedimiento administrativo?',
    explanation: 'La caducidad se produce cuando el procedimiento está paralizado por causa imputable al interesado durante más de 3 meses, dando lugar al archivo de las actuaciones (art. 95 LPAC).',
    answers: [
      { name: 'La extinción del acto administrativo por el transcurso del tiempo', correct: false },
      { name: 'El archivo del expediente por paralización imputable al interesado', correct: true },
      { name: 'La anulación del procedimiento por vicios de forma', correct: false },
      { name: 'La prescripción de la acción administrativa', correct: false },
    ],
  },
  {
    question: 'En la notificación por medios electrónicos, ¿cuántos días naturales tiene el interesado para acceder a la notificación antes de que se entienda rechazada?',
    explanation: 'Art. 43.2 LPAC: Si en el plazo de 10 días naturales el interesado no accede a su contenido, la notificación se entenderá rechazada.',
    answers: [
      { name: '5 días', correct: false },
      { name: '10 días', correct: true },
      { name: '15 días', correct: false },
      { name: '20 días', correct: false },
    ],
  },
  {
    question: '¿Cuáles son los requisitos de los actos administrativos para que sean válidos?',
    explanation: 'Los actos administrativos deben cumplir los requisitos de competencia, procedimiento, forma y motivación (cuando sea exigida). La falta de alguno puede dar lugar a nulidad o anulabilidad.',
    answers: [
      { name: 'Solo competencia y motivación', correct: false },
      { name: 'Competencia, procedimiento, forma y motivación (cuando proceda)', correct: true },
      { name: 'Solo forma y motivación', correct: false },
      { name: 'Competencia, publicidad y motivación', correct: false },
    ],
  },
  {
    question: '¿Cuándo son nulos de pleno derecho los actos administrativos?',
    explanation: 'Art. 47 LPAC: Son nulos de pleno derecho los actos que lesionen derechos fundamentales, los dictados por órgano manifiestamente incompetente, los de contenido imposible, los constitutivos de infracción penal, los dictados prescindiendo absolutamente del procedimiento, y otros.',
    answers: [
      { name: 'Cuando incurren en cualquier infracción del ordenamiento jurídico', correct: false },
      { name: 'Solo cuando lesionan derechos fundamentales', correct: false },
      { name: 'En los casos tasados del art. 47 LPAC (lesión DDFF, incompetencia manifiesta, etc.)', correct: true },
      { name: 'Cuando no están motivados', correct: false },
    ],
  },
  {
    question: '¿Qué plazo tienen los interesados para interponer recurso de alzada?',
    explanation: 'Art. 121 LPAC: El recurso de alzada se interpondrá en el plazo de un mes si el acto es expreso. Si no lo fuera, el plazo será de tres meses.',
    answers: [
      { name: '10 días hábiles', correct: false },
      { name: '15 días hábiles', correct: false },
      { name: '1 mes (acto expreso) o 3 meses (acto presunto)', correct: true },
      { name: '2 meses', correct: false },
    ],
  },
  {
    question: 'El recurso de reposición es previo a la vía contencioso-administrativa. ¿Con qué carácter se interpone?',
    explanation: 'Art. 123 LPAC: Los actos administrativos que pongan fin a la vía administrativa podrán ser recurridos potestativamente en reposición ante el mismo órgano que los hubiera dictado o ser impugnados directamente ante la jurisdicción contencioso-administrativa.',
    answers: [
      { name: 'Obligatorio', correct: false },
      { name: 'Potestativo (opcional)', correct: true },
      { name: 'Solo para actos de trámite', correct: false },
      { name: 'Automático', correct: false },
    ],
  },
  {
    question: '¿En qué consiste el principio de confianza legítima en el procedimiento administrativo?',
    explanation: 'El principio de confianza legítima protege a los ciudadanos frente a cambios normativos o de criterio de la Administración que modifiquen situaciones jurídicas consolidadas o expectativas razonables, obligando a una actuación coherente y previsible.',
    answers: [
      { name: 'La Administración debe actuar con celeridad', correct: false },
      { name: 'Los ciudadanos tienen derecho a que la Administración actúe de forma coherente con sus actos anteriores', correct: true },
      { name: 'Toda la información administrativa debe ser pública', correct: false },
      { name: 'La Administración debe motivar todos sus actos', correct: false },
    ],
  },
];

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ── 1. Users ────────────────────────────────────────────────────────────────

  console.log('👤 Seeding users...');
  const allSeedUsers = [TEACHER, ...STUDENTS];

  for (const u of allSeedUsers) {
    const hashedPassword = await hashPassword(u.password);

    // Insert into `users` table
    await db.insert(schema.users).values({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      emailVerified: true,
      role: u.role,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        updatedAt: now,
      },
    });

    // Insert into `accounts` (Better Auth credential account)
    await db.insert(schema.accounts).values({
      id: `seed-account-${u.id}`,
      accountId: u.id,
      providerId: 'credential',
      userId: u.id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: schema.accounts.id,
      set: { password: hashedPassword, updatedAt: now },
    });

    console.log(`   ✓ ${u.role.padEnd(8)} ${u.email}`);
  }

  // Seed role-specific tables
  await db.insert(schema.teachers).values({ id: 1, userId: TEACHER.id })
    .onConflictDoNothing();

  for (let i = 0; i < STUDENTS.length; i++) {
    await db.insert(schema.students).values({ id: i + 1, userId: STUDENTS[i].id })
      .onConflictDoNothing();
  }

  // ── 2. Subject ──────────────────────────────────────────────────────────────

  console.log('\n📚 Seeding subject...');
  const [subject] = await db.insert(schema.subjects).values({
    name: 'Administrativo General',
    description: 'Temario de Derecho Administrativo para oposiciones de la AGE',
    active: true,
  }).onConflictDoUpdate({
    target: schema.subjects.id,
    set: { active: true },
  }).returning();

  console.log(`   ✓ Subject: "${subject.name}" (id: ${subject.id})`);

  // ── 3. Units ─────────────────────────────────────────────────────────────────

  console.log('\n🏫 Seeding units...');
  const [unit1] = await db.insert(schema.units).values({
    name: 'Constitución Española',
    description: 'Estructura, principios, derechos fundamentales y organización territorial del Estado',
    subjectId: subject.id,
    active: true,
    questionsPerQuiz: 10,
    order: 1,
    unlockPreviousRequired: false,
    isFree: true,
    estimatedDurationMinutes: 60,
  }).onConflictDoUpdate({
    target: schema.units.id,
    set: { active: true },
  }).returning();

  const [unit2] = await db.insert(schema.units).values({
    name: 'Ley de Procedimiento Administrativo Común',
    description: 'Procedimiento administrativo, actos administrativos, recursos y silencio administrativo',
    subjectId: subject.id,
    active: true,
    questionsPerQuiz: 10,
    order: 2,
    unlockPreviousRequired: true,
    isFree: false,
    estimatedDurationMinutes: 90,
  }).onConflictDoUpdate({
    target: schema.units.id,
    set: { active: true },
  }).returning();

  console.log(`   ✓ Unit 1: "${unit1.name}" (id: ${unit1.id}, free, no lock)`);
  console.log(`   ✓ Unit 2: "${unit2.name}" (id: ${unit2.id}, paid, sequential lock)`);

  // ── 4. Questions & Answers ──────────────────────────────────────────────────

  console.log('\n❓ Seeding questions and answers...');

  const seedQuestionsForUnit = async (
    unitId: number,
    questionsData: typeof UNIT1_QUESTIONS,
    label: string
  ) => {
    for (const qData of questionsData) {
      const [question] = await db.insert(schema.questions).values({
        unitId,
        question: qData.question,
        explanation: qData.explanation,
        hard: false,
        active: true,
      }).returning();

      for (const aData of qData.answers) {
        await db.insert(schema.answers).values({
          questionId: question.id,
          name: aData.name,
          correct: aData.correct,
        }).onConflictDoNothing();
      }
    }
    console.log(`   ✓ ${questionsData.length} questions seeded for ${label}`);
  };

  await seedQuestionsForUnit(unit1.id, UNIT1_QUESTIONS, 'Unit 1 (CE)');
  await seedQuestionsForUnit(unit2.id, UNIT2_QUESTIONS, 'Unit 2 (LPAC)');

  // ── 5. Lessons ───────────────────────────────────────────────────────────────

  console.log('\n📖 Seeding lessons...');

  const UNIT1_LESSONS = [
    {
      title: 'Introducción a la Constitución Española',
      order: 1,
      type: 'article',
      estimatedDurationMinutes: 15,
      xpReward: 10,
      contentText: `## La Constitución Española de 1978

La Constitución Española de 1978 es la norma suprema del ordenamiento jurídico español. Fue aprobada por las Cortes Generales el 31 de octubre de 1978 y ratificada en referéndum el 6 de diciembre del mismo año.

### Estructura

La CE se estructura en:
- **Preámbulo**
- **Título Preliminar** (arts. 1-9): principios fundamentales del Estado
- **Título I** (arts. 10-55): Derechos y deberes fundamentales
- **Títulos II al X** (arts. 56-169): Organización institucional del Estado
- 4 disposiciones adicionales, 9 transitorias, 1 derogatoria y 1 final

### Valores superiores

El artículo 1.1 CE proclama como valores superiores del ordenamiento jurídico:
1. La **libertad**
2. La **justicia**
3. La **igualdad**
4. El **pluralismo político**

### La Monarquía parlamentaria

El artículo 1.3 CE establece que la forma política del Estado español es la **Monarquía parlamentaria**, lo que implica que el Rey es el Jefe del Estado pero no ejerce el poder político de forma directa.`,
    },
    {
      title: 'Título I: Derechos y Libertades Fundamentales',
      order: 2,
      type: 'article',
      estimatedDurationMinutes: 20,
      xpReward: 15,
      contentText: `## Derechos Fundamentales en la CE

El Título I de la CE (arts. 10-55) es el más extenso y regula los derechos y libertades de los ciudadanos.

### Clasificación de los derechos

**Sección 1.ª — Derechos fundamentales y libertades públicas (arts. 15-29)**
- Derecho a la vida (art. 15)
- Derecho a la libertad ideológica y religiosa (art. 16)
- Derecho a la libertad y seguridad (art. 17)
- Derecho al honor, intimidad e imagen (art. 18)
- Inviolabilidad del domicilio y secreto de comunicaciones (art. 18)
- Libertad de residencia y circulación (art. 19)
- Libertad de expresión e información (art. 20)
- Derecho de reunión (art. 21)
- Derecho de asociación (art. 22)
- Derecho a participar en asuntos públicos (art. 23)
- Derecho a la tutela judicial efectiva (art. 24)
- Principio de legalidad penal (art. 25)
- Libertad de enseñanza (art. 27)

**Sección 2.ª — Derechos y deberes de los ciudadanos (arts. 30-38)**
- Defensa de España (art. 30)
- Obligaciones tributarias (art. 31)
- Derecho a contraer matrimonio (art. 32)
- Derecho a la propiedad privada (art. 33)

### Garantías de los derechos

Los derechos fundamentales de la Sección 1.ª gozan de la máxima protección:
- Vinculan a todos los poderes públicos
- Son susceptibles de recurso de amparo ante el TC
- Solo pueden ser desarrollados por Ley Orgánica`,
    },
    {
      title: 'Esquemas y Resumen — Descargar PDF',
      order: 3,
      type: 'file',
      estimatedDurationMinutes: 5,
      xpReward: 5,
      contentText: null,
    },
  ];

  const UNIT2_LESSONS = [
    {
      title: 'Principios y ámbito de aplicación de la LPAC',
      order: 1,
      type: 'article',
      estimatedDurationMinutes: 15,
      xpReward: 10,
      contentText: `## Ley 39/2015, de 1 de octubre, del PACAP

La Ley 39/2015 regula el procedimiento administrativo común de todas las Administraciones Públicas y tiene por objeto establecer los requisitos de validez y eficacia de los actos administrativos.

### Ámbito de aplicación

Se aplica al sector público integrado por:
- La Administración General del Estado
- Las Administraciones de las Comunidades Autónomas
- Las Entidades que integran la Administración Local
- El sector público institucional

### Principios generales

Los principios que rigen la actuación administrativa son:
1. **Legalidad**: las AAPP sirven con objetividad los intereses generales bajo la CE y el resto del ordenamiento jurídico
2. **Eficacia**: actuación eficaz en el cumplimiento de sus objetivos
3. **Jerarquía**: respeto a la estructura jerárquica de la organización
4. **Descentralización y desconcentración**
5. **Coordinación**
6. **Servicio a los ciudadanos**

### Derechos de las personas en sus relaciones con la AAPP

Entre los más relevantes (art. 13 LPAC):
- A comunicarse en cualquiera de las lenguas cooficiales
- A ser asistido en el uso de medios electrónicos
- A conocer el estado de tramitación de los procedimientos
- A obtener información y orientación sobre requisitos técnicos
- Al acceso a la información pública`,
    },
    {
      title: 'El Procedimiento Administrativo: Fases y Actos',
      order: 2,
      type: 'article',
      estimatedDurationMinutes: 25,
      xpReward: 20,
      contentText: `## El Procedimiento Administrativo

### Fases del procedimiento

**1. Iniciación**
El procedimiento puede iniciarse:
- **De oficio**: por acuerdo del órgano competente (arts. 58-64 LPAC)
- **A solicitud del interesado** (arts. 65-68 LPAC)

**2. Instrucción**
Comprende los actos de trámite destinados al conocimiento y comprobación de los datos relevantes para la resolución:
- Alegaciones (art. 76)
- Prueba (art. 77-78)
- Informes (arts. 79-80)
- Participación de los interesados: audiencia y información pública (arts. 82-83)

**3. Finalización**
El procedimiento termina por:
- Resolución expresa
- Desistimiento del interesado
- Renuncia al derecho
- Declaración de caducidad
- Imposibilidad material de continuar

### Silencio administrativo

| Tipo de procedimiento | Efecto del silencio |
|---|---|
| Iniciado a solicitud del interesado | **Positivo** (estimado) salvo excepciones |
| Iniciado de oficio | **Negativo** (desestimado) |

### Actos administrativos

Para que un acto sea válido debe reunir:
- **Competencia** del órgano
- **Procedimiento** adecuado
- **Forma** requerida
- **Motivación** cuando sea preceptiva`,
    },
    {
      title: 'Normativa LPAC — Texto oficial y esquemas',
      order: 3,
      type: 'file',
      estimatedDurationMinutes: 5,
      xpReward: 5,
      contentText: null,
    },
  ];

  const PLACEHOLDER_FILE_URL = 'https://placeholder.r2.dev/resources/seed/documento.pdf';

  const seedLessonsForUnit = async (
    unitId: number,
    lessonsData: typeof UNIT1_LESSONS,
    label: string
  ) => {
    const ids: number[] = [];
    for (const lData of lessonsData) {
      const [lesson] = await db.insert(schema.lessons).values({
        unitId,
        title: lData.title,
        order: lData.order,
        type: lData.type,
        contentText: lData.contentText ?? undefined,
        estimatedDurationMinutes: lData.estimatedDurationMinutes,
        xpReward: lData.xpReward,
        active: true,
      }).returning();

      ids.push(lesson.id);

      // For file-type lessons, seed a placeholder resource
      if (lData.type === 'file') {
        await db.insert(schema.lessonResources).values({
          lessonId: lesson.id,
          title: `${lData.title}.pdf`,
          type: 'pdf',
          url: PLACEHOLDER_FILE_URL,
          order: 1,
        }).onConflictDoNothing();
      }
    }
    console.log(`   ✓ ${lessonsData.length} lessons seeded for ${label} (ids: ${ids.join(', ')})`);
    return ids;
  };

  const unit1LessonIds = await seedLessonsForUnit(unit1.id, UNIT1_LESSONS, 'Unit 1 (CE)');
  const unit2LessonIds = await seedLessonsForUnit(unit2.id, UNIT2_LESSONS, 'Unit 2 (LPAC)');

  // ── 6. Achievements ───────────────────────────────────────────────────────────

  console.log('\n🏆 Seeding achievements...');
  const ACHIEVEMENTS = [
    { name: 'Primera sangre', description: 'Completa tu primer quiz', threshold: 1, type: 'score', rarity: 'common' },
    { name: 'Racha de fuego', description: 'Mantén una racha de 3 días consecutivos', threshold: 3, type: 'streak', rarity: 'common' },
    { name: 'Imparable', description: 'Mantén una racha de 7 días', threshold: 7, type: 'streak', rarity: 'rare' },
    { name: 'Maestro del temario', description: 'Completa 10 quizzes', threshold: 10, type: 'completion', rarity: 'rare' },
    { name: 'Perfeccionista', description: 'Obtén un 100% en un quiz', threshold: 100, type: 'score', rarity: 'epic' },
  ] as const;

  for (const ach of ACHIEVEMENTS) {
    await db.insert(schema.achievements).values(ach).onConflictDoNothing();
  }
  console.log(`   ✓ ${ACHIEVEMENTS.length} achievements seeded`);

  // ── 7. Enrollments ────────────────────────────────────────────────────────────

  console.log('\n🔗 Seeding enrollments...');
  for (const student of STUDENTS) {
    await db.insert(schema.userSubjects).values({
      userId: student.id,
      subjectId: subject.id,
    }).onConflictDoNothing();
    console.log(`   ✓ ${student.email} enrolled in "${subject.name}"`);
  }

  // ── 8. UserStats ──────────────────────────────────────────────────────────────

  console.log('\n📊 Seeding user stats...');
  for (const student of STUDENTS) {
    await db.insert(schema.userStats).values({
      userId: student.id,
      totalQuizzesCompleted: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
    }).onConflictDoNothing();
  }
  console.log(`   ✓ UserStats rows created for ${STUDENTS.length} students`);

  // ── Summary ───────────────────────────────────────────────────────────────────

  console.log('\n' + '─'.repeat(60));
  console.log('✅ Seed complete!\n');
  console.log('Add these to your .env.local to enable all Playwright tests:\n');
  console.log(`TEACHER_EMAIL=${TEACHER.email}`);
  console.log(`TEACHER_PASSWORD=${TEACHER.password}`);
  console.log(`STUDENT_EMAIL=${STUDENTS[0].email}`);
  console.log(`STUDENT_PASSWORD=${STUDENTS[0].password}`);
  console.log(`TEST_SUBJECT_ID=${subject.id}`);
  console.log(`TEST_UNIT_ID=${unit1.id}`);
  console.log(`TEST_LOCKED_UNIT_ID=${unit2.id}`);
  console.log(`TEST_LESSON_ID=${unit1LessonIds[0]}`);
  console.log('─'.repeat(60));

  await client.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
