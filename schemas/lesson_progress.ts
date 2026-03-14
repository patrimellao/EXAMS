import { pgTable, serial, timestamp, text, integer, varchar, unique, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { lessons } from "./lessons";

export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade", onUpdate: "cascade" }),
  status: varchar("status", { length: 20 }).default('not_started').notNull(), // 'not_started' | 'in_progress' | 'completed'
  completedAt: timestamp("completed_at", { mode: 'string' }),
  timeSpentSeconds: integer("time_spent_seconds").default(0).notNull(),
  xpEarned: integer("xp_earned").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
  (table) => ({
    userLessonUnique: unique("lesson_progress_user_lesson_unique").on(table.userId, table.lessonId),
    userStatusIdx: index("lesson_progress_user_status_idx").on(table.userId, table.status),
  })
);

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;
