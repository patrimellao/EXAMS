/**
 * scripts/clear.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Removes ALL rows inserted by scripts/seed.ts.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   npm run seed:clear
 *
 * Clears:
 *   - Auth users: teacher@exams.test, student1/2@exams.test
 *   - Gamification personas: Alice, Bruno, Carmen
 *   - Subjects: "Derecho Administrativo" + "Constitución Española"
 *     (cascade-removes units → questions → answers, lessons → resources, quizzes)
 *   - Achievements seeded by name
 *
 * ⚠️  Never run against production.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client, { schema });

const ALL_SEED_USER_IDS = [
  'seed-teacher-001', 'seed-student-001', 'seed-student-002',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  // Alice
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  // Bruno
  'cccccccc-cccc-cccc-cccc-cccccccccccc',  // Carmen
];

const SEED_SUBJECT_NAMES = ['Derecho Administrativo', 'Constitución Española'];

const SEED_ACHIEVEMENT_NAMES = [
  'Primer paso', 'Constante', 'Experto',
  'Primera aprobada', 'En racha', 'Estudioso',
  'Perfeccionista', 'Impecable', 'Máquina perfecta',
];

async function clear() {
  console.log('🗑️  Clearing seed data…\n');

  // ── Users and all their FK-dependents ─────────────────────────────────────
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
  console.log(`   ✓ Deleted ${ALL_SEED_USER_IDS.length} seed users + related rows`);

  // ── Subjects → units → questions/answers/lessons ──────────────────────────
  const subjects = await db
    .select({ id: schema.subjects.id })
    .from(schema.subjects)
    .where(inArray(schema.subjects.name, SEED_SUBJECT_NAMES));

  const subjectIds = subjects.map(s => s.id);

  if (subjectIds.length > 0) {
    const units = await db.select({ id: schema.units.id })
      .from(schema.units)
      .where(inArray(schema.units.subjectId, subjectIds));
    const unitIds = units.map(u => u.id);

    if (unitIds.length > 0) {
      // Lessons → resources + progress
      const lessonRows = await db.select({ id: schema.lessons.id })
        .from(schema.lessons).where(inArray(schema.lessons.unitId, unitIds));
      const lessonIds = lessonRows.map(l => l.id);

      if (lessonIds.length > 0) {
        await db.delete(schema.lessonResources).where(inArray(schema.lessonResources.lessonId, lessonIds));
        await db.delete(schema.lessonProgress).where(inArray(schema.lessonProgress.lessonId, lessonIds));
        await db.delete(schema.lessons).where(inArray(schema.lessons.id, lessonIds));
        console.log(`   ✓ Deleted ${lessonIds.length} lessons`);
      }

      await db.delete(schema.unitProgress).where(inArray(schema.unitProgress.unitId, unitIds));

      // Questions → answers
      const questionRows = await db.select({ id: schema.questions.id })
        .from(schema.questions).where(inArray(schema.questions.unitId, unitIds));
      const questionIds = questionRows.map(q => q.id);
      if (questionIds.length > 0) {
        await db.delete(schema.answers).where(inArray(schema.answers.questionId, questionIds));
        await db.delete(schema.questions).where(inArray(schema.questions.id, questionIds));
        console.log(`   ✓ Deleted ${questionIds.length} questions`);
      }

      await db.delete(schema.units).where(inArray(schema.units.id, unitIds));
      console.log(`   ✓ Deleted ${unitIds.length} units`);
    }

    await db.delete(schema.userSubjects).where(inArray(schema.userSubjects.subjectId, subjectIds));
    await db.delete(schema.subjects).where(inArray(schema.subjects.id, subjectIds));
    console.log(`   ✓ Deleted ${subjectIds.length} subjects`);
  }

  // ── Achievements ──────────────────────────────────────────────────────────
  await db.delete(schema.achievements)
    .where(inArray(schema.achievements.name as any, SEED_ACHIEVEMENT_NAMES));
  console.log('   ✓ Deleted seeded achievements');

  console.log('\n✅  Seed data cleared.\n');
  await client.end();
}

clear().catch(err => {
  console.error('❌  Clear failed:', err);
  process.exit(1);
});
