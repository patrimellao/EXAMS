import { getUserGameStats } from "@/controllers/profiles";
import { Progress } from "@/components/ui/progress";
import { Flame, Zap, Trophy } from "lucide-react";
import Link from "next/link";

const XP_PER_LEVEL = 500;

export async function UserStatsBar() {
  const stats = await getUserGameStats();
  if (!stats) return null;

  const { xp, level, currentStreak, totalPoints } = stats;
  const xpInLevel     = xp % XP_PER_LEVEL;
  const xpProgress    = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="px-4 py-3 border-t space-y-3">
      {/* Level + XP bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <Zap className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            Level {level}
          </span>
          <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
        </div>
        <Progress value={xpProgress} className="h-2" />
      </div>

      {/* Streak + Points */}
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1 text-orange-500 font-medium">
          <Flame className="h-3.5 w-3.5 fill-orange-500" />
          {currentStreak} day{currentStreak !== 1 ? "s" : ""}
        </span>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trophy className="h-3.5 w-3.5" />
          {totalPoints.toLocaleString()} pts
        </Link>
      </div>
    </div>
  );
}
