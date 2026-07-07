import { pgTable, serial, timestamp, integer, varchar, smallint, text, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from "zod";
import { units } from "./units";

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey().notNull(),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: varchar("title", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),        // NEW — optional lesson subtitle
  hero: jsonb("hero"),                                    // NEW — { type, gradient, color, image:{url,alt} }
  order: smallint("order").notNull(),
  type: varchar("type", { length: 20 }).default('article').notNull(), // 'article' | 'video'
  contentText: text("content_text"),           // markdown body
  videoUrl: varchar("video_url", { length: 512 }), // deferred — kept for future video support
  estimatedDurationMinutes: smallint("estimated_duration_minutes"),
  xpReward: integer("xp_reward").default(10).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
  (table) => ({
    unitOrderIdx: index("lessons_unit_order_idx").on(table.unitId, table.order),
  })
);

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

export const insertLessonSchema = createInsertSchema(lessons, {
  unitId: z.optional(z.number()),
});
export const selectLessonSchema = createSelectSchema(lessons);
