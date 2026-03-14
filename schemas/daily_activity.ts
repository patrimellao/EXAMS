import { pgTable, serial, timestamp, text, integer, date, unique, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const dailyActivity = pgTable("daily_activity", {
  id: serial("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  activityDate: date("activity_date").notNull(),
  quizzesDone: integer("quizzes_done").default(0).notNull(),
  lessonsCompleted: integer("lessons_completed").default(0).notNull(),
  xpEarned: integer("xp_earned").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
  (table) => ({
    userDateUnique: unique("daily_activity_user_date_unique").on(table.userId, table.activityDate),
    userDateIdx: index("daily_activity_user_date_idx").on(table.userId, table.activityDate),
  })
);

export type DailyActivity = typeof dailyActivity.$inferSelect;
export type InsertDailyActivity = typeof dailyActivity.$inferInsert;
