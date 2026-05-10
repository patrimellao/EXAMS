import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function RankRow({
  rank,
  label,
  sub,
  trend,
  primary,
  className,
}: {
  rank: number | string;
  label: string;
  sub?: string;
  trend?: { dir: "up" | "down" | "flat"; label: string };
  primary?: boolean;
  className?: string;
}) {
  const trendBadge =
    trend?.dir === "up"
      ? "bg-brand-success/15 text-brand-success"
      : trend?.dir === "down"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-card border bg-card p-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-card text-sm font-black tabular-nums",
          primary
            ? "bg-brand-primary text-white shadow-card"
            : "bg-muted text-muted-foreground",
        )}
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{label}</p>
        {sub && (
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        )}
      </div>
      {trend && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-pill px-2 py-0.5 text-xs font-semibold",
            trendBadge,
          )}
        >
          {trend.dir === "up" ? "↑" : trend.dir === "down" ? "↓" : "─"}
          {trend.dir !== "flat" && <span>{trend.label}</span>}
        </span>
      )}
      {primary && <ArrowRight className="h-4 w-4 text-brand-primary" />}
    </div>
  );
}
