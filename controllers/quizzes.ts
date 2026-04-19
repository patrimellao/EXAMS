"use server";
import { quizAnswers } from "@/app/(main)/quiz/[id]/Quiz";
import { quizDetails } from "@/drizzle/schema";
import { InsertQuiz, quizzes, Quiz } from "@/schemas/quizzes";
import { units, Unit } from "@/schemas/units";
import { db } from "@/utils/drizzle/db";
import { eq, and, count, gt, gte } from "drizzle-orm";
import { checkAndAssignAchievements } from "./achievements";
import { unlockNextUnit } from "./unit";
import { users } from "@/schemas/users";

// export const addQuiz = async (quiz: InsertQuiz) => {
//   await db
//     .insert(quizzes)
//     .values(quiz);
// };

// export const allQuizzes = async () => {
//   const data = await db
//     .select()
//     .from(quizzes);

//   return data;
// };

// export const deleteQuiz = async (id: number) => {
//   await db
//     .delete(quizzes)
//     .where(
//       eq(quizzes.id, id)
//     );
// };

// export const updateQuiz = async (id: number, quiz: InsertQuiz) => {
//   await db
//     .update(quizzes)
//     .set({
//       ...quiz,
//       updatedAt: new Date().toDateString(),
//     })
//     .where(
//       eq(quizzes.id, id)
//     );
// };

export const getActiveQuizzes = async (userId: string, subjectID: number) => {
  const data = await db
    .select({
      unit: {
        id: units.id,
        description: units.description,
        name: units.name
      },
      quiz: quizzes
    })
    .from(units)
    .where(eq(units.subjectId, subjectID))
    .leftJoin(quizzes, eq(units.id, quizzes.unitId))

  const result = data.reduce<Record<number, { unit: Unit; quizzes: Quiz[] }>>(
    (acc, row) => {
      const unit = row.unit;
      const quiz = row.quiz;
      if (!acc[unit.id]) {
        //@ts-ignore
        acc[unit.id] = { unit, quizzes: [] };
      }
      if (quiz) {
        acc[unit.id].quizzes.push(quiz);
      }
      return acc;
    },
    {}
  );

  return result;
}

export const getQuiz = async (quizId: number) => {

  const data = await db.query.quizzes.findFirst({
    where: (quizzes, { eq }) => (and(
      eq(quizzes.id, quizId),
    )),
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
                orderBy: (answers, { sql }) => [sql`RANDOM()`]
              }
            }
          }
        }
      },
    }
  })

  return data;

}

export const submitQuiz = async (
  allQuizzesAnswers: quizAnswers,
  score: number,
  previousScore: number,
  quizId: number,
): Promise<{ xpEarned: number; streak: number; achievements: { type: unknown; name: string; description: string }[] }> => {

  let xpEarned = 0;
  let streak = 0;
  let newAchievements: { type: unknown; name: string; description: string }[] = [];

  if (score > previousScore || previousScore == null) {

    try {
      await updateScore(score, quizId);
    } catch (error) {
      console.error("Error updating score");
    }

    try {
      for (const singularQuiz of allQuizzesAnswers.results) {
        await db
          .update(quizDetails)
          .set({ correct: singularQuiz.correct })
          .where(
            and(
              eq(quizDetails.userId, allQuizzesAnswers.userId),
              eq(quizDetails.questionId, singularQuiz.questionId)
            )
          );
      }
    } catch (error) {
      console.log("Error updating quiz details");
    }

    // Award XP: 10 per correct answer + 20 bonus if passing
    const correctCount = allQuizzesAnswers.results.filter(r => r.correct).length;
    xpEarned = correctCount * 10 + (score >= 60 ? 20 : 0);

    try {
      const today = new Date().toISOString().split('T')[0];
      const [userRow] = await db
        .select({ currentStreak: users.currentStreak, lastActivityDate: users.lastActivityDate, xp: users.xp })
        .from(users)
        .where(eq(users.id, allQuizzesAnswers.userId));

      if (userRow) {
        const lastDate = userRow.lastActivityDate;
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
        const newStreak = lastDate === yesterday ? (userRow.currentStreak ?? 0) + 1
          : lastDate === today ? (userRow.currentStreak ?? 0)
          : 1;
        streak = newStreak;
        await db.update(users).set({
          xp: (userRow.xp ?? 0) + xpEarned,
          currentStreak: newStreak,
          lastActivityDate: today,
        }).where(eq(users.id, allQuizzesAnswers.userId));
      }
    } catch (error) {
      console.error("Error updating XP/streak");
    }

    try {
      const raw = await checkAndAssignAchievements();
      newAchievements = (raw as unknown as { type: unknown; name: string; description: string }[]) ?? [];
    } catch (error) {
      console.log("Error updating achievements");
    }

    // UC-12: Unlock next unit if score passes (≥ 70)
    if (score >= 70) {
      try {
        const quiz = await db.query.quizzes.findFirst({
          where: (q, { eq }) => eq(q.id, quizId),
          columns: { unitId: true, userId: true },
        });
        if (quiz?.unitId && quiz?.userId) {
          await unlockNextUnit(quiz.userId, quiz.unitId);
        }
      } catch (error) {
        console.log("Error unlocking next unit");
      }
    }
  }

  return { xpEarned, streak, achievements: newAchievements };
}

export const updateScore = async (newScore: number, quizId: number) => {
  const data = await db
    .update(quizzes)
    .set({ score: newScore })
    .where(
      eq(quizzes.id, quizId)
    );


  return data;
}