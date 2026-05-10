import { type LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "warm" | "cool" | "primary" | "success";

const toneIconBg: Record<Tone, string> = {
  warm: "bg-brand-warm/15 text-brand-warm",
  cool: "bg-brand-cool/15 text-brand-cool",
  primary: "bg-brand-primary/15 text-brand-primary",
  success: "bg-brand-success/15 text-brand-success",
};

const toneFill: Record<Tone, string> = {
  warm: "bg-brand-warm",
  cool: "bg-brand-cool",
  primary: "bg-brand-primary",
  success: "bg-brand-success",
};

export function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  progress,
  tone = "primary",
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  trend?: { dir: "up" | "down" | "flat"; label: string };
  progress?: number;
  tone?: Tone;
  caption?: string;
}) {
  const TrendIcon =
    trend?.dir === "up"
      ? TrendingUp
      : trend?.dir === "down"
        ? TrendingDown
        : Minus;
  const trendColor =
    trend?.dir === "up"
      ? "text-brand-success"
      : trend?.dir === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="group relative overflow-hidden rounded-card border bg-card p-5">
      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-card",
            toneIconBg[tone],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              trendColor,
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trend.label}
          </span>
        )}
      </div>

      <div className="relative mt-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black tracking-tight tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="relative mt-4">
          <div className="h-1.5 overflow-hidden rounded-pill bg-muted">
            <div
              className={cn("h-full rounded-pill", toneFill[tone])}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {caption && (
        <p className="relative mt-3 text-xs text-muted-foreground">{caption}</p>
      )}
    </div>
  );
}
