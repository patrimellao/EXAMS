import { pgTable, serial, timestamp, uuid, integer, boolean, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { units } from "./units";

export const unitProgress = pgTable("unit_progress", {
  id: serial("id").primaryKey().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "cascade", onUpdate: "cascade" }),
  lessonsCompleted: integer("lessons_completed").default(0).notNull(),
  lessonsTotal: integer("lessons_total").notNull(),
  isUnlocked: boolean("is_unlocked").default(false).notNull(),
  unlockedAt: timestamp("unlocked_at", { mode: 'string' }),
  completedAt: timestamp("completed_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
  (table) => ({
    userUnitUnique: unique("unit_progress_user_unit_unique").on(table.userId, table.unitId),
  })
);

export type UnitProgress = typeof unitProgress.$inferSelect;
export type InsertUnitProgress = typeof unitProgress.$inferInsert;
