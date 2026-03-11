"use server";
import { quizAnswers } from "@/app/(main)/quiz/[id]/Quiz";
import { quizDetails, quizzes, units, users, xpTransactions } from "@/drizzle/schema";
import { Quiz } from "@/schemas/quizzes";
import { Unit } from "@/schemas/units";
import { db } from "@/utils/drizzle/db";
import { UUID } from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { checkAndAssignAchievements } from "./achievements";
import { leaderboardService } from "@/lib/redis/leaderboard";

// ── XP constants ─────────────────────────────────────────────────────────────
const XP_PER_QUESTION  = 5;
const XP_BONUS_PASS    = 20; // score >= 70
const XP_BONUS_PERFECT = 30; // score === 100
const XP_PER_LEVEL     = 500;

// ── Private helpers ───────────────────────────────────────────────────────────

function calcXp(score: number, questionsCount: number): number {
  return (
    questionsCount * XP_PER_QUESTION +
    (score >= 70   ? XP_BONUS_PASS    : 0) +
    (score === 100 ? XP_BONUS_PERFECT : 0)
  );
}

async function awardXp(
  userId: string,
  quizId: number,
  score: number,
  questionsCount: number,
): Promise<number> {
  const xpEarned = calcXp(score, questionsCount);

  await db.insert(xpTransactions).values({
    userId,
    amount:      xpEarned,
    sourceType:  "quiz",
    sourceId:    quizId,
    description: `Quiz #${quizId} — score ${score}%`,
  });

  await db
    .update(users)
    .set({
      xp:          sql`${users.xp} + ${xpEarned}`,
      totalPoints: sql`${users.totalPoints} + ${score}`,
      level:       sql`(FLOOR((${users.xp} + ${xpEarned}) / ${XP_PER_LEVEL}) + 1)::smallint`,
    })
    .where(eq(users.id, userId));

  await db
    .update(quizzes)
    .set({ xpEarned, pointsEarned: score, finishedAt: new Date().toISOString() })
    .where(eq(quizzes.id, quizId));

  return xpEarned;
}

async function updateStreak(userId: string): Promise<number> {
  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

  const [user] = await db
    .select({ currentStreak: users.currentStreak, lastActivityDate: users.lastActivityDate })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return 0;
  if (user.lastActivityDate === today) return user.currentStreak ?? 0;

  const newStreak =
    user.lastActivityDate === yesterday ? (user.currentStreak ?? 0) + 1 : 1;

  await db
    .update(users)
    .set({
      currentStreak:    newStreak,
      longestStreak:    sql`GREATEST(${users.longestStreak}, ${newStreak})`,
      lastActivityDate: today,
    })
    .where(eq(users.id, userId));

  return newStreak;
}

// ── Public queries ────────────────────────────────────────────────────────────

export const getActiveQuizzes = async (userId: UUID, subjectID: number) => {
  const data = await db
    .select({
      unit: { id: units.id, description: units.description, name: units.name },
      quiz: quizzes,
    })
    .from(units)
    .where(eq(units.subjectId, subjectID))
    .leftJoin(quizzes, eq(units.id, quizzes.unitId));

  const result = data.reduce<Record<number, { unit: Unit; quizzes: Quiz[] }>>(
    (acc, row) => {
      const unit = row.unit;
      const quiz = row.quiz;
      if (!acc[unit.id]) {
        // @ts-ignore
        acc[unit.id] = { unit, quizzes: [] };
      }
      if (quiz) acc[unit.id].quizzes.push(quiz);
      return acc;
    },
    {},
  );

  return result;
};

export const getQuiz = async (quizId: number) => {
  return await db.query.quizzes.findFirst({
    where: (q, { eq }) => eq(q.id, quizId),
    columns: { score: true },
    with: {
      quizDetails: {
        columns: {},
        with: {
          question: {
            columns: { question: true, hard: true },
            with: {
              answers: {
                columns: { questionId: true, name: true, correct: true },
                orderBy: (_a, { sql }) => [sql`RANDOM()`],
              },
            },
          },
        },
      },
    },
  });
};

// ── Submit ────────────────────────────────────────────────────────────────────

/**
 * Persists quiz results when score improved.
 * Awards XP, updates streak, refreshes Redis leaderboard.
 * Returns { achievements, xpEarned, streak } or null when score did not improve.
 */
export const submitQuiz = async (
  allQuizzesAnswers: quizAnswers,
  score: number,
  previousScore: number,
  quizId: number,
): Promise<{ achievements: any[]; xpEarned: number; streak: number } | null> => {
  if (score <= previousScore && previousScore != null) return null;

  const userId       = allQuizzesAnswers.userId;
  const questionCount = allQuizzesAnswers.results.length;

  // 1 – Update per-question correctness in quiz_details
  try {
    for (const r of allQuizzesAnswers.results) {
      await db
        .update(quizDetails)
        .set({ correct: r.correct })
        .where(
          and(
            eq(quizDetails.userId, userId),
            eq(quizDetails.questionId, r.questionId),
          ),
        );
    }
  } catch (e) { console.error("quiz_details update failed", e); }

  // 2 – Update score on quiz record
  try { await updateScore(score, quizId); }
  catch (e) { console.error("score update failed", e); }

  // 3 – Award XP + points
  let xpEarned = 0;
  try { xpEarned = await awardXp(userId, quizId, score, questionCount); }
  catch (e) { console.error("XP award failed", e); }

  // 4 – Update streak
  let streak = 0;
  try { streak = await updateStreak(userId); }
  catch (e) { console.error("streak update failed", e); }

  // 5 – Refresh Redis leaderboard
  try {
    const [row] = await db
      .select({ subjectId: units.subjectId })
      .from(units)
      .innerJoin(quizzes, eq(quizzes.unitId, units.id))
      .where(eq(quizzes.id, quizId))
      .limit(1);

    await leaderboardService.addPoints(userId, score);
    if (row?.subjectId) await leaderboardService.addPoints(userId, score, row.subjectId);
  } catch (e) { console.error("leaderboard cache update failed", e); }

  // 6 – Check & assign achievements
  let achievements: any[] = [];
  try { achievements = (await checkAndAssignAchievements()) ?? []; }
  catch (e) { console.error("achievements check failed", e); }

  return { achievements, xpEarned, streak };
};

export const updateScore = async (newScore: number, quizId: number) => {
  return await db
    .update(quizzes)
    .set({ score: newScore })
    .where(eq(quizzes.id, quizId));
};
