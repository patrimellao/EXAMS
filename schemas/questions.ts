import { pgTable, serial, boolean, timestamp, integer, text, varchar, jsonb } from "drizzle-orm/pg-core";
import { units } from "./units";
import { lessons } from "./lessons";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey().notNull(),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade", onUpdate: "cascade" }),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "set null", onUpdate: "cascade" }),
  label: varchar("label", { length: 256 }),           // short question name
  question: text("question"),            // was varchar(256) — oposiciones questions can be long
  explanation: text("explanation"),      // shown to student after answering
  difficulty: varchar("difficulty", { length: 10 }).default('normal').notNull(), // 'facil'|'normal'|'dificil'
  hard: boolean("hard").default(false),               // kept in sync: hard = difficulty === 'dificil'
  lessonRef: jsonb("lesson_ref"),                     // { section, quote, color, sentence?, anchorId?, frozen? }
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
