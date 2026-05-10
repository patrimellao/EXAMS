import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakBadge({
  count,
  className,
  size = "md",
}: {
  count: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: { wrap: "px-2 py-0.5 text-xs gap-1", icon: "h-3 w-3" },
    md: { wrap: "px-2.5 py-1 text-sm gap-1.5", icon: "h-4 w-4" },
    lg: { wrap: "px-3 py-1.5 text-base gap-2", icon: "h-5 w-5" },
  } as const;
  const s = sizeMap[size];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill font-semibold ring-1",
        "bg-brand-xp/12 text-brand-warm ring-brand-warm/25 dark:bg-brand-xp/15 dark:text-brand-warm dark:ring-brand-warm/35",
        s.wrap,
        className,
      )}
    >
      <Flame
        className={cn(
          s.icon,
          "fill-brand-warm text-brand-warm animate-streak-flame",
        )}
      />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
