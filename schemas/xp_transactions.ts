import { pgTable, serial, timestamp, uuid, integer, varchar, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const xpTransactions = pgTable("xp_transactions", {
  id: serial("id").primaryKey().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  amount: integer("amount").notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // 'quiz' | 'lesson' | 'streak_bonus' | 'achievement'
  sourceId: integer("source_id"),
  description: varchar("description", { length: 256 }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
  (table) => ({
    userCreatedIdx: index("xp_transactions_user_created_idx").on(table.userId, table.createdAt),
  })
);

export type XpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = typeof xpTransactions.$inferInsert;
