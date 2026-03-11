import { viewCounterAchievements } from "@/interfaces/viewCounterAchievements";
import { getUser } from "@/lib/getUser";
import { db } from "@/utils/drizzle/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "@/drizzle/schema";

export const getProfileInfo = async () => {
    const user = await getUser();

    if (!user){
        NextResponse.json("Unable to find user");
    }
    
    const nameParts = user?.user_metadata.full_name.trim().split(' ');

    const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
    const lastNameInitial = nameParts[1].charAt(0).toUpperCase();
    const fullNameInitials = firstNameInitial + lastNameInitial;

    return {
        nameInitials: fullNameInitials,
        userName: user?.user_metadata.full_name,
        joinedAt: user?.created_at
    }
}

export const getUserStats = async () => {
    const user = await getUser();

    if (!user){
        NextResponse.json("Unable to find user");
    }

    const data = await db
    .select({
        quizzesDone : viewCounterAchievements.quizzesDone,
        quizzesPassed : viewCounterAchievements.quizzesPassed,
        quizzesPerfect : viewCounterAchievements.quizzesPerfect,
    })
    .from(viewCounterAchievements)
    .where(
        eq(viewCounterAchievements.userId, user!.id)
    )

    return data[0];
}

/** Gamification stats from the users table (XP, level, streak, points). */
export const getUserGameStats = async () => {
    const user = await getUser();
    if (!user) return null;

    const [row] = await db
        .select({
            xp:             users.xp,
            level:          users.level,
            currentStreak:  users.currentStreak,
            longestStreak:  users.longestStreak,
            totalPoints:    users.totalPoints,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

    return row ?? null;
}