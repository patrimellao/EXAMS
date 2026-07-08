"use server";
import { InsertQuestion, questions } from "@/schemas/questions";
import { db } from "@/utils/drizzle/db";
import { eq, and } from "drizzle-orm";
import { addAnswer, deleteQuestionAnswers, questionAnswers } from "./answers";
import { assertTeacher } from "@/lib/assertTeacher";


type Difficulty = 'facil' | 'normal' | 'dificil';
type QAnswer = { name: string; correct: boolean };

export const addQuestionWithAnswers = async ({ question, label, explanation, difficulty, unitId, lessonId, lessonRef, answers }: {
  question: string;
  label?: string;
  explanation?: string;
  difficulty: Difficulty;
  unitId: number;
  lessonId?: number | null;
  lessonRef?: unknown | null;
  answers: QAnswer[];
}) => {
  await assertTeacher();
  const newQuestion = await addQuestion({
    question, label, explanation, difficulty,
    hard: difficulty === 'dificil',
    unitId, lessonId: lessonId ?? null, lessonRef: lessonRef ?? null,
  });
  for (const answer of answers) {
    await addAnswer({ ...answer, questionId: newQuestion[0].id });
  }
  return newQuestion[0].id;
};

export const updateQuestionWithAnswers = async ({ id, question, label, explanation, difficulty, lessonId, lessonRef, answers }: {
  id: number;
  question: string;
  label?: string;
  explanation?: string;
  difficulty: Difficulty;
  lessonId?: number | null;
  lessonRef?: unknown | null;
  answers: QAnswer[];
}) => {
  await assertTeacher();
  await updateQuestion(id, {
    question, label, explanation, difficulty,
    hard: difficulty === 'dificil',
    lessonId: lessonId ?? null, lessonRef: lessonRef ?? null,
  });
  await deleteQuestionAnswers(id);
  for (const answer of answers) {
    await addAnswer({ ...answer, questionId: id });
  }
};

export const addQuestion = async (question: InsertQuestion) => {
  await assertTeacher();
  return await db
    .insert(questions)
    .values(question)
    .returning({ id: questions.id })
};

export const allquestions = async () => {
  const data = await db
    .select()
    .from(questions);
  return data;
};

export const allActiveQuestions = async () => {
  const data = await db
    .select()
    .from(questions)
    .where(
      eq(questions.active, true)
    );
  return data;
};

export const deleteQuestion = async (id: number) => {
  await assertTeacher();
  await db
    .delete(questions)
    .where(
      eq(questions.id, id)
    );
};

export const updateQuestion = async (id: number, question: InsertQuestion) => {
  await assertTeacher();
  await db
    .update(questions)
    .set({
      ...question,
      updatedAt: new Date().toDateString(),
    })
    .where(
      eq(questions.id, id)
    );
};

export const disableQuestion = async (id: number) => {
  await assertTeacher();
  await db
    .update(questions)
    .set({
      active: false,
      updatedAt: new Date().toDateString(),
    })
    .where(
      eq(questions.id, id)
    );
};

export const getQuestionsFromUnit = async (unit_id: number) => {

  const data = await db.query.questions.findMany({
    where: (questions, { eq }) => (and(
      eq(questions.unitId, unit_id),
    )),
    // Task 7 (§3.12): the wired builder needs the full authoring shape, not just
    // { id, question }. Return label/difficulty/explanation/lessonId/lessonRef and
    // the answer ids so the client can map DB rows → BuilderQuestion view-models.
    columns: {
      id: true,
      question: true,
      label: true,
      difficulty: true,
      explanation: true,
      lessonId: true,
      lessonRef: true,
    },
    with: {
      answers: {
        columns: { id: true, name: true, correct: true },
      },
    }
  })

  return data;
}