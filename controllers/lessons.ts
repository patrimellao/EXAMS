"use server";
import { db } from "@/utils/drizzle/db";
import { lessons, lessonProgress, lessonResources, unitProgress, units } from "@/drizzle/schema";
import { InsertLesson, Lesson } from "@/schemas/lessons";
import { InsertLessonProgress } from "@/schemas/lesson_progress";
import { InsertLessonResource } from "@/schemas/lesson_resources";
import { eq, and, asc, count } from "drizzle-orm";
import { getUser } from "@/lib/getUser";
import { assertTeacher } from "@/lib/assertTeacher";

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getLessonsForUnit(unitId: number) {
  return db
    .select()
    .from(lessons)
    .where(and(eq(lessons.unitId, unitId), eq(lessons.active, true)))
    .orderBy(asc(lessons.order));
}

export async function addLesson(data: InsertLesson) {
  await assertTeacher();
  const [lesson] = await db.insert(lessons).values(data).returning();
  return lesson;
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  await assertTeacher();
  const [lesson] = await db
    .update(lessons)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(lessons.id, id))
    .returning();
  return lesson;
}

export async function deleteLesson(id: number) {
  await assertTeacher();
  await db.delete(lessons).where(eq(lessons.id, id));
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────

export async function getLessonWithProgress(lessonId: number, userId: string) {
  const lesson = await db.query.lessons.findFirst({
    where: (l, { eq }) => eq(l.id, lessonId),
  });
  if (!lesson) return null;

  const progress = await db
    .select()
    .from(lessonProgress)
    .where(
      and(eq(lessonProgress.lessonId, lessonId), eq(lessonProgress.userId, userId))
    )
    .limit(1);

  const resources = await db
    .select()
    .from(lessonResources)
    .where(eq(lessonResources.lessonId, lessonId))
    .orderBy(asc(lessonResources.order));

  return { lesson, progress: progress[0] ?? null, resources };
}

export async function markLessonComplete(
  lessonId: number,
  userId: string,
  timeSpentSeconds = 0
) {
  // 1. Fetch lesson to get unitId and xpReward
  const lesson = await db.query.lessons.findFirst({
    where: (l, { eq }) => eq(l.id, lessonId),
  });
  if (!lesson) throw new Error("Lesson not found");

  const now = new Date().toISOString();

  // 2. Upsert lesson_progress
  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      status: "completed",
      completedAt: now,
      timeSpentSeconds,
      xpEarned: lesson.xpReward,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        status: "completed",
        completedAt: now,
        timeSpentSeconds,
        xpEarned: lesson.xpReward,
        updatedAt: now,
      },
    });

  // 3. Recalculate unit progress
  const [{ completedCount }] = await db
    .select({ completedCount: count() })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.status, "completed"),
        eq(lessons.unitId, lesson.unitId)
      )
    );

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(lessons)
    .where(and(eq(lessons.unitId, lesson.unitId), eq(lessons.active, true)));

  // Upsert unit_progress
  await db
    .insert(unitProgress)
    .values({
      userId,
      unitId: lesson.unitId,
      lessonsCompleted: completedCount,
      lessonsTotal: totalCount,
      isUnlocked: true,
      ...(completedCount >= totalCount ? { completedAt: now } : {}),
    })
    .onConflictDoUpdate({
      target: [unitProgress.userId, unitProgress.unitId],
      set: {
        lessonsCompleted: completedCount,
        lessonsTotal: totalCount,
        ...(completedCount >= totalCount ? { completedAt: now } : {}),
        updatedAt: now,
      },
    });

  // 4. If all lessons done, attempt to unlock next unit
  if (completedCount >= totalCount) {
    const { unlockNextUnit } = await import("@/controllers/unit");
    await unlockNextUnit(userId, lesson.unitId);
  }

  return { completedCount, totalCount };
}

// ─── RESOURCES ───────────────────────────────────────────────────────────────

export async function addLessonResource(data: InsertLessonResource) {
  await assertTeacher();
  const [resource] = await db.insert(lessonResources).values(data).returning();
  return resource;
}

export async function deleteLessonResource(id: number) {
  await assertTeacher();
  await db.delete(lessonResources).where(eq(lessonResources.id, id));
}

export async function getLessonResources(lessonId: number) {
  return db
    .select()
    .from(lessonResources)
    .where(eq(lessonResources.lessonId, lessonId))
    .orderBy(asc(lessonResources.order));
}
