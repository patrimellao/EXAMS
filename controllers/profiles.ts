"use server";
import { viewCounterAchievements } from "@/interfaces/viewCounterAchievements";
import { auth } from "@/lib/auth";
import { db } from "@/utils/drizzle/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const getProfileInfo = async () => {
  const session = await auth.api.getSession({ headers: headers() });

  if (!session?.user) {
    return { nameInitials: '??', userName: 'Unknown', joinedAt: null };
  }

  const userName = session.user.name ?? '';
  const nameParts = userName.trim().split(' ');
  const firstNameInitial = nameParts[0]?.charAt(0).toUpperCase() ?? '?';
  const lastNameInitial = nameParts[1]?.charAt(0).toUpperCase() ?? '?';
  const nameInitials = firstNameInitial + lastNameInitial;

  return {
    nameInitials,
    userName,
    joinedAt: session.user.createdAt.toISOString(),
  };
};

export const getUserGameStats = async () => {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.user) return null;

  const [row] = await db
    .select({
      xp: users.xp,
      level: users.level,
      currentStreak: users.currentStreak,
      totalPoints: users.totalPoints,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  return row ?? null;
};

export const getUserStats = async () => {
  const session = await auth.api.getSession({ headers: headers() });

  if (!session?.user) return null;

  const data = await db
    .select({
      quizzesDone: viewCounterAchievements.quizzesDone,
      quizzesPassed: viewCounterAchievements.quizzesPassed,
      quizzesPerfect: viewCounterAchievements.quizzesPerfect,
    })
    .from(viewCounterAchievements)
    .where(eq(viewCounterAchievements.userId, session.user.id));

  return data[0];
};