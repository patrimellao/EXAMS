/**
 * scripts/clear.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Removes ALL data inserted by scripts/seed.ts.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   npm run seed:clear
 *
 * WARNING: This deletes the seed users, subject, units, questions, answers,
 * lessons, achievements and enrollments. It does NOT wipe tables entirely —
 * only rows identifiable as seed data (by email or the seeded subject name).
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema';
import { eq, inArray, or } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

const SEED_USER_IDS = ['seed-teacher-001', 'seed-student-001', 'seed-student-002'];
const SEED_SUBJECT_NAME = 'Administrativo General';
const SEED_ACHIEVEMENT_NAMES = [
  'Primera sangre',
  'Racha de fuego',
  'Imparable',
  'Maestro del temario',
  'Perfeccionista',
];

async function clear() {
  console.log('🗑️  Clearing seed data...\n');

  // Find seeded subject(s) first so we can cascade-delete via FK or manually
  const subjects = await db
    .select({ id: schema.subjects.id })
    .from(schema.subjects)
    .where(eq(schema.subjects.name, SEED_SUBJECT_NAME));

  const subjectIds = subjects.map((s) => s.id);

  if (subjectIds.length > 0) {
    // Units (cascade deletes questions → answers, quizzes → quiz_details)
    const units = await db
      .select({ id: schema.units.id })
      .from(schema.units)
      .where(inArray(schema.units.subjectId, subjectIds));

    const unitIds = units.map((u) => u.id);

    if (unitIds.length > 0) {
      // Lessons (cascade deletes lesson_resources, lesson_progress)
      const lessonRows = await db
        .select({ id: schema.lessons.id })
        .from(schema.lessons)
        .where(inArray(schema.lessons.unitId, unitIds));

      const lessonIds = lessonRows.map((l) => l.id);

      if (lessonIds.length > 0) {
        await db.delete(schema.lessonResources).where(inArray(schema.lessonResources.lessonId, lessonIds));
        await db.delete(schema.lessonProgress).where(inArray(schema.lessonProgress.lessonId, lessonIds));
        await db.delete(schema.lessons).where(inArray(schema.lessons.id, lessonIds));
        console.log(`   ✓ Deleted ${lessonIds.length} lessons`);
      }

      // Unit progress
      await db.delete(schema.unitProgress).where(inArray(schema.unitProgress.unitId, unitIds));

      // Questions (cascade deletes answers and quiz_details via FK)
      const questionRows = await db
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(inArray(schema.questions.unitId, unitIds));
      const questionIds = questionRows.map((q) => q.id);
      if (questionIds.length > 0) {
        await db.delete(schema.answers).where(inArray(schema.answers.questionId, questionIds));
        await db.delete(schema.questions).where(inArray(schema.questions.id, questionIds));
        console.log(`   ✓ Deleted ${questionIds.length} questions`);
      }

      // Quizzes
      await db.delete(schema.quizzes).where(inArray(schema.quizzes.unitId, unitIds));

      // Units
      await db.delete(schema.units).where(inArray(schema.units.id, unitIds));
      console.log(`   ✓ Deleted ${unitIds.length} units`);
    }

    // User enrollments
    await db.delete(schema.userSubjects).where(inArray(schema.userSubjects.subjectId, subjectIds));

    // Subjects
    await db.delete(schema.subjects).where(inArray(schema.subjects.id, subjectIds));
    console.log(`   ✓ Deleted ${subjectIds.length} subject(s)`);
  }

  // Achievements
  await db.delete(schema.achievements).where(inArray(schema.achievements.name as any, SEED_ACHIEVEMENT_NAMES));
  console.log(`   ✓ Deleted seeded achievements`);

  // Users (cascade deletes accounts, sessions, students, teachers via FK)
  await db.delete(schema.accounts).where(inArray(schema.accounts.userId, SEED_USER_IDS));
  await db.delete(schema.userStats).where(inArray(schema.userStats.userId, SEED_USER_IDS));
  await db.delete(schema.students).where(inArray(schema.students.userId, SEED_USER_IDS));
  await db.delete(schema.teachers).where(inArray(schema.teachers.userId, SEED_USER_IDS));
  await db.delete(schema.users).where(inArray(schema.users.id, SEED_USER_IDS));
  console.log(`   ✓ Deleted ${SEED_USER_IDS.length} seed users`);

  console.log('\n✅ Seed data cleared.\n');

  await client.end();
}

clear().catch((err) => {
  console.error('❌ Clear failed:', err);
  process.exit(1);
});
