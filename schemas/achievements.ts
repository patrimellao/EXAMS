import { pgTable, serial, smallint, timestamp, varchar } from "drizzle-orm/pg-core";

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 256 }),
  description: varchar("description", { length: 256 }),
  threshold: smallint("threshold").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // was smallint — now readable: 'streak' | 'score' | 'speed' | 'completion'
  badgeImageUrl: varchar("badge_image_url", { length: 512 }),
  rarity: varchar("rarity", { length: 20 }).default('common').notNull(), // 'common' | 'rare' | 'epic' | 'legendary'
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
