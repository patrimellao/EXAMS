import { cn } from "@/lib/utils";

export function AchievementCard({
  emoji,
  title,
  meta,
  className,
}: {
  emoji: string;
  title: string;
  meta: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-card border bg-card p-3 shadow-card transition-shadow duration-normal hover:shadow-card-hover",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-card text-2xl ring-1 transition-transform duration-fast group-hover:scale-105",
          "bg-brand-xp/10 ring-brand-xp/30 dark:bg-brand-xp/15 dark:ring-brand-xp/40",
        )}
        aria-hidden
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}
