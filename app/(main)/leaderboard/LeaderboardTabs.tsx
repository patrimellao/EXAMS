'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Subject } from "@/schemas/subjects";

type Props = {
  subjects:        Subject[];
  activeSubjectId: number | undefined;
};

export default function LeaderboardTabs({ subjects, activeSubjectId }: Props) {
  return (
    <div className="flex flex-wrap gap-2 w-full">
      <Link
        href="/leaderboard"
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
          activeSubjectId == null
            ? "bg-primary text-primary-foreground border-primary"
            : "border-muted hover:bg-muted",
        )}
      >
        Global
      </Link>
      {subjects.map(s => (
        <Link
          key={s.id}
          href={`/leaderboard?subjectId=${s.id}`}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
            activeSubjectId === s.id
              ? "bg-primary text-primary-foreground border-primary"
              : "border-muted hover:bg-muted",
          )}
        >
          {s.name}
        </Link>
      ))}
    </div>
  );
}
