import { pgTable, serial, timestamp, text, varchar, unique, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  tier: varchar("tier", { length: 20 }).notNull(),       // 'free' | 'pro_monthly' | 'pro_yearly'
  status: varchar("status", { length: 20 }).notNull(),   // 'active' | 'cancelled' | 'past_due' | 'trialing'
  lsCustomerId: varchar("ls_customer_id", { length: 256 }),
  lsSubscriptionId: varchar("ls_subscription_id", { length: 256 }),
  currentPeriodStart: timestamp("current_period_start", { mode: 'string' }),
  currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }),
  cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
  (table) => ({
    lsSubIdUnique: unique("subscriptions_ls_sub_id_unique").on(table.lsSubscriptionId),
    userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
