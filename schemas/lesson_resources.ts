import { pgTable, serial, timestamp, integer, varchar, smallint } from "drizzle-orm/pg-core";
import { lessons } from "./lessons";

export const lessonResources = pgTable("lesson_resources", {
  id: serial("id").primaryKey().notNull(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: varchar("title", { length: 256 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'pdf' | 'file' | 'link'
  url: varchar("url", { length: 512 }).notNull(),
  order: smallint("order").default(1).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export type LessonResource = typeof lessonResources.$inferSelect;
export type InsertLessonResource = typeof lessonResources.$inferInsert;
