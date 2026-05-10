import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContinueCTA({
  href,
  course,
  unit,
  lesson,
  progress,
  className,
}: {
  href: string;
  course: string;
  unit: string;
  lesson: string;
  progress: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-hero border-2 border-brand-primary/30 bg-card shadow-card transition-colors duration-normal hover:border-brand-primary/50 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="relative rounded-hero p-6 md:p-7">
        <div className="relative grid items-center gap-5 sm:grid-cols-[auto_1fr_auto]">
          {/* play button */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-card transition-transform duration-fast group-hover:scale-105 md:h-20 md:w-20">
            <Play
              className="h-7 w-7 translate-x-0.5 fill-current md:h-9 md:w-9"
              strokeWidth={0}
            />
          </div>

          {/* meta */}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
              Continuar donde lo dejaste
            </p>
            <h3 className="mt-1 truncate text-xl font-bold md:text-2xl">
              {lesson}
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {course} · {unit}
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-pill bg-muted">
                <div
                  className="h-full rounded-pill bg-brand-primary transition-[width] duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
          </div>

          {/* arrow */}
          <div className="hidden items-center gap-2 self-center text-brand-primary transition-transform duration-fast group-hover:translate-x-1 sm:flex">
            <span className="text-sm font-semibold">Continuar</span>
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
