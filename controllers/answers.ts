"use server";
import { InsertAnswer, answers } from "@/schemas/answers";
import { db } from "@/utils/drizzle/db";
import { eq, and } from "drizzle-orm";
import { assertTeacher } from "@/lib/assertTeacher";

export const addAnswer = async (answer: InsertAnswer) => {
  await assertTeacher();
  await db
    .insert(answers)
    .values(answer);
};

export const allAnswers = async () => {
  const data = await db
    .select()
    .from(answers);
  return data;
};
export const questionAnswers = async (questionId: number) => {
  return await db
    .select()
    .from(answers)
    .where(
      eq(answers.questionId, questionId)
    );
};

export const deleteQuestionAnswers = async (questionId: number) => {
  await assertTeacher();
  await db
  .delete(answers)
  .where(
    eq(answers.questionId, questionId)
  );
};
export const deleteAnswer = async (id: number) => {
  await assertTeacher();
  await db
  .delete(answers)
  .where(
    eq(answers.id, id)
  );
};

export const updateAnswer = async (id: number, answer: InsertAnswer) => {
  await assertTeacher();
  await db
    .update(answers)
    .set({
      ...answer,
      updatedAt: new Date().toDateString(),
    })
    .where(
      eq(answers.id, id)
    );
};