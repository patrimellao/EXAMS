import { pgTable, serial, boolean, timestamp, integer, text } from "drizzle-orm/pg-core";
import { units } from "./units";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey().notNull(),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade", onUpdate: "cascade" }),
  question: text("question"),            // was varchar(256) — oposiciones questions can be long
  explanation: text("explanation"),      // shown to student after answering
  hard: boolean("hard").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
