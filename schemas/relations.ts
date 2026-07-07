import { relations } from "drizzle-orm";
import { units } from "./units";
import { quizzes } from "./quizzes";
import { quizDetails } from "./quiz_details";
import { questions } from "./questions";
import { answers } from "./answers";
import { lessons } from "./lessons";
import { subjects } from "./subjects";

export const subjectsRelations = relations(subjects, ({ many }) => ({
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  subject: one(subjects, { fields: [units.subjectId], references: [subjects.id] }),
  quizzes: many(quizzes),
  questions: many(questions),
  lessons: many(lessons),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  unit: one(units, { fields: [quizzes.unitId], references: [units.id] }),
  quizDetails: many(quizDetails),
}));

export const quizDetailsRelations = relations(quizDetails, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizDetails.quizId], references: [quizzes.id] }),
  question: one(questions, { fields: [quizDetails.questionId], references: [questions.id] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  unit: one(units, { fields: [questions.unitId], references: [units.id] }),
  lesson: one(lessons, { fields: [questions.lessonId], references: [lessons.id] }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, { fields: [lessons.unitId], references: [units.id] }),
  questions: many(questions),
}));
