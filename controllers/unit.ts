"use server";
import { quizzes, unitProgress, lessons } from "@/drizzle/schema";
import { InsertUnit, units } from "@/schemas/units";
import { db } from "@/utils/drizzle/db";
import { UUID } from "crypto";
import { eq, and, sql, asc, count } from "drizzle-orm";

export const addUnit = async (unit: InsertUnit) => {
  await db
    .insert(units)
    .values(unit);
};

export const allUnits = async () => {
  const data = await db.select().from(units);
  return data;
};

export const deleteUnit = async (id: number) => {
  await db
    .delete(units)
    .where(eq(units.id, id));
};

export const updateUnit = async (id: number, unit: InsertUnit) => {
  await db
    .update(units)
    .set({
      ...unit,
      updatedAt: new Date().toDateString(),
    })
    .where(eq(units.id, id));
};

export const getUnits = async (subjectId: number) => {
  const data = await db
    .select()
    .from(units)
    .where(eq(units.subjectId, subjectId));
  return data;
}

export const getActiveUnits = async (subjectId: number, userId: UUID) => {
  const data = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.id)],
    where: (units, { eq }) => (and(
      eq(units.subjectId, subjectId),
      eq(units.active, true)
    )),
    extras: {numOfQuizzes: sql<number>`get_number_of_quizzes(${units.id})`.as('noQ'),},
    with: {
      quizzes: {
        where: (quiz, { eq }) => eq(quiz.userId, userId),
        orderBy: (quiz, { asc }) => [asc(quiz.id)],
      },
    }
  });

  return data;
}

export const getQuestionsAndAnswers = async (unitId : number) => {
  const data = await db.query.units.findFirst({
    where: (units, { eq }) => (and(
      eq(units.id, unitId),
    )),
    columns: {},
    with: {
      questions: {
        columns: { question: true, hard: true },
        with: {
          answers: {
            columns: { name: true, correct: true }
          }
        }
      },
    }

  })

  return data;
}

export const activateUnit = async (unitId : number) => {
  await db
  .update(units)
  .set({active : true})
  .where(eq(units.id, unitId));
}

// UC-12 — Sequential unit unlock
export const unlockNextUnit = async (userId: string, currentUnitId: number) => {
  // Get current unit to find subjectId and order
  const currentUnit = await db.query.units.findFirst({
    where: (u, { eq }) => eq(u.id, currentUnitId),
  });
  if (!currentUnit) return;

  // Find the next unit (lowest order > current, same subject)
  const nextUnits = await db
    .select()
    .from(units)
    .where(
      and(
        eq(units.subjectId, currentUnit.subjectId),
        eq(units.active, true),
        eq(units.unlockPreviousRequired, true),
        sql`${units.order} > ${currentUnit.order}`
      )
    )
    .orderBy(asc(units.order))
    .limit(1);

  if (nextUnits.length === 0) return;

  const nextUnit = nextUnits[0];
  const now = new Date().toISOString();

  // Count total active lessons for the next unit
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(lessons)
    .where(and(eq(lessons.unitId, nextUnit.id), eq(lessons.active, true)));

  // Upsert unit_progress for the next unit as unlocked
  await db
    .insert(unitProgress)
    .values({
      userId,
      unitId: nextUnit.id,
      lessonsCompleted: 0,
      lessonsTotal: totalCount,
      isUnlocked: true,
      unlockedAt: now,
    })
    .onConflictDoUpdate({
      target: [unitProgress.userId, unitProgress.unitId],
      set: { isUnlocked: true, unlockedAt: now, updatedAt: now },
    });
}

export const initializeUnitProgress = async (userId: string, unitId: number) => {
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(lessons)
    .where(and(eq(lessons.unitId, unitId), eq(lessons.active, true)));

  await db
    .insert(unitProgress)
    .values({
      userId,
      unitId,
      lessonsCompleted: 0,
      lessonsTotal: totalCount,
      isUnlocked: false,
    })
    .onConflictDoNothing();
}

export const getUnitProgressForUser = async (userId: string, subjectId: number) => {
  return db
    .select({
      unitId: unitProgress.unitId,
      lessonsCompleted: unitProgress.lessonsCompleted,
      lessonsTotal: unitProgress.lessonsTotal,
      isUnlocked: unitProgress.isUnlocked,
      completedAt: unitProgress.completedAt,
    })
    .from(unitProgress)
    .innerJoin(units, eq(unitProgress.unitId, units.id))
    .where(
      and(
        eq(unitProgress.userId, userId),
        eq(units.subjectId, subjectId)
      )
    );
}