import { pgTable, timestamp, text, integer, numeric } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userStats = pgTable("user_stats", {
  userId: text("user_id").primaryKey().notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  totalQuizzesCompleted: integer("total_quizzes_completed").default(0).notNull(),
  totalQuestionsAnswered: integer("total_questions_answered").default(0).notNull(),
  totalCorrectAnswers: integer("total_correct_answers").default(0).notNull(),
  averageQuizScore: numeric("average_quiz_score", { precision: 5, scale: 2 }),
  lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
});

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
