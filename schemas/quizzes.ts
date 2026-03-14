import { pgTable, serial, timestamp, text, smallint, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { units } from "./units";

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey().notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade", onUpdate: "cascade" }),
  score: smallint("score"),
  // Time tracking
  startedAt: timestamp("started_at", { mode: 'string' }),
  finishedAt: timestamp("finished_at", { mode: 'string' }),
  timeSpentSeconds: integer("time_spent_seconds"),
  // Review feature
  questionsMarkedForReview: jsonb("questions_marked_for_review").default([]),
  // Rewards
  xpEarned: integer("xp_earned").default(0).notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;
