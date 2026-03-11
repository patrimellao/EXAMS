import { pgTable, varchar, timestamp, foreignKey, uuid, unique, integer, smallint, boolean, text, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  fullName: varchar("full_name", { length: 256 }),
  email: varchar("email", { length: 256 }),
  createdAt: timestamp("created_at", { mode: 'string' }),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
  // Gamification
  xp: integer("xp").default(0).notNull(),
  level: smallint("level").default(1).notNull(),
  currentStreak: smallint("current_streak").default(0).notNull(),
  longestStreak: smallint("longest_streak").default(0).notNull(),
  lastActivityDate: date("last_activity_date"),
  totalPoints: integer("total_points").default(0).notNull(),
  // Profile
  avatarUrl: varchar("avatar_url", { length: 512 }),
  bio: text("bio"),
  isProfilePublic: boolean("is_profile_public").default(false).notNull(),
  // Subscription (denormalized for fast middleware checks)
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default('free').notNull(),
},
  (table) => {
    return {
      usersIdFkey: foreignKey({
        columns: [table.id],
        foreignColumns: [table.id],
        name: "users_id_fkey"
      }).onUpdate("cascade").onDelete("cascade"),
      usersAuthIdUnique: unique("users_auth_id_unique").on(table.id),
    }
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
