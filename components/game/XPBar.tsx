import { cn } from "@/lib/utils";

export function XPBar({
  value,
  max = 100,
  className,
  showLabel = false,
  size = "md",
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: "h-1", md: "h-2", lg: "h-3" } as const;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-pill bg-muted",
          heights[size],
        )}
      >
        <div
          className="h-full rounded-pill bg-gradient-to-r from-brand-xp via-brand-warm to-brand-flame transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {value.toLocaleString()}
            </span>{" "}
            / {max.toLocaleString()} XP
          </span>
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}
