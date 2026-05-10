import Link from "next/link";
import {
  Award,
  ChevronRight,
  Flame,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { AchievementCard } from "@/components/game/AchievementCard";
import { Button as GameButton } from "@/components/game/Button";
import { ContinueCTA } from "@/components/game/ContinueCTA";
import { RankRow } from "@/components/game/RankRow";

export default function HomeWireframe() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Greeting */}
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Lunes, 28 abril 2026
        </p>
        <h1 className="text-display md:text-hero">
          Hola, Manu <span aria-hidden>👋</span>
        </h1>
        <p className="text-muted-foreground">
          Te quedan <span className="font-semibold text-foreground">2 lecciones</span> para llegar a tu objetivo de hoy.
        </p>
      </header>

      {/* Continue */}
      <ContinueCTA
        href="/wireframes/lesson"
        course="Derecho Civil"
        unit="Unidad 2.3"
        lesson="Capacidad de obrar"
        progress={65}
      />

      {/* Stat strip (compact inline metrics) */}
      <section className="rounded-card border bg-card p-4 shadow-card">
        <div className="grid gap-4 divide-y divide-border sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 pb-3 sm:pb-0 sm:px-4 sm:first:pl-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-brand-warm/15 text-brand-warm">
              <Flame className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Racha
              </p>
              <p className="text-xl font-bold tabular-nums">
                12{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  días
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 sm:py-0 sm:px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-brand-primary/15 text-brand-primary">
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                XP hoy
              </p>
              <p className="text-xl font-bold tabular-nums">
                240{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / 500
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-4 sm:last:pr-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-brand-cool/15 text-brand-cool">
              <Target className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Objetivo
              </p>
              <p className="text-xl font-bold tabular-nums">
                3 / 5{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  lecciones
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions strip */}
      <section className="rounded-card border bg-muted/40 p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sesión rápida
          </p>
          <GameButton variant="learning" size="sm" asChild>
            <Link href="/wireframes/quiz">Hacer test</Link>
          </GameButton>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              label: "Test de 5 preguntas",
              meta: "≈ 3 min",
              href: "/wireframes/quiz",
            },
            {
              icon: Target,
              label: "Repasar fallos",
              meta: "8 pendientes",
              href: "#",
            },
            {
              icon: Sparkles,
              label: "Lección flash",
              meta: "≈ 5 min",
              href: "/wireframes/lesson",
            },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className="group flex items-center gap-3 rounded-card border bg-card p-3 shadow-card transition-shadow duration-normal hover:shadow-card-hover"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-card bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {a.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.meta}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-fast group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Two col bottom: ranking + logros */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border bg-card p-5 shadow-card">
          <header className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Trophy className="h-5 w-5 text-amber-500" />
                Ranking semanal
              </h2>
              <p className="text-sm text-muted-foreground">
                Tu posición actual
              </p>
            </div>
            <Link
              href="/wireframes/leaderboard"
              className="text-xs font-semibold text-brand-primary transition-colors duration-fast hover:underline"
            >
              Ver ranking →
            </Link>
          </header>
          <div className="space-y-2">
            <RankRow
              rank={4}
              label="Derecho Civil"
              sub="Asignatura"
              trend={{ dir: "up", label: "2" }}
              primary
            />
            <RankRow
              rank={12}
              label="Global"
              sub="Todos los estudiantes"
              trend={{ dir: "flat", label: "" }}
            />
          </div>
        </div>

        <div className="rounded-card border bg-card p-5 shadow-card">
          <header className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Award className="h-5 w-5 text-purple-500" />
                Logros recientes
              </h2>
              <p className="text-sm text-muted-foreground">Últimos 7 días</p>
            </div>
            <Link
              href="#"
              className="text-xs font-semibold text-brand-primary transition-colors duration-fast hover:underline"
            >
              Ver todos →
            </Link>
          </header>
          <div className="space-y-2">
            <AchievementCard
              emoji="🔥"
              title="Racha de 7 días"
              meta="Hace 3 días · +50 XP"
            />
            <AchievementCard
              emoji="📚"
              title="100 lecciones completadas"
              meta="Hace 5 días · +200 XP"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
