"use server";
import { db } from "@/utils/drizzle/db";
import { users } from "@/drizzle/schema";
import { desc, inArray } from "drizzle-orm";
import { leaderboardService } from "@/lib/redis/leaderboard";

export type LeaderboardEntry = {
  rank:       number;
  userId:     string;
  name:       string;
  totalPoints: number;
};

/**
 * Returns the leaderboard for a subject (or global).
 * Tries Redis first; falls back to PostgreSQL when cache is cold (< 3 entries).
 */
export async function getLeaderboard(
  subjectId?: number,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  // ── Try Redis ──────────────────────────────────────────────────────────────
  try {
    const cached = await leaderboardService.getTopN(limit, subjectId);

    if (cached.length >= 3) {
      const userIds = cached.map(e => e.userId);
      const dbUsers = await db
        .select({ id: users.id, fullName: users.fullName })
        .from(users)
        .where(inArray(users.id, userIds));

      const nameMap = new Map(dbUsers.map(u => [u.id, u.fullName ?? "–"]));

      return cached.map((e, i) => ({
        rank:        i + 1,
        userId:      e.userId,
        name:        nameMap.get(e.userId) ?? "–",
        totalPoints: e.points,
      }));
    }
  } catch (e) {
    console.error("Redis leaderboard read failed, falling back to DB", e);
  }

  // ── Fallback: PostgreSQL ───────────────────────────────────────────────────
  const rows = await db
    .select({ id: users.id, fullName: users.fullName, totalPoints: users.totalPoints })
    .from(users)
    .orderBy(desc(users.totalPoints))
    .limit(limit);

  return rows.map((u, i) => ({
    rank:        i + 1,
    userId:      u.id,
    name:        u.fullName ?? "–",
    totalPoints: u.totalPoints,
  }));
}
