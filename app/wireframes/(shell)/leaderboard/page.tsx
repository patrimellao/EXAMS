"use client";

import { ArrowDown, ArrowUp, Crown, Medal, Minus, Share2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreakBadge } from "@/components/game/StreakBadge";

type Trend = "up" | "down" | "flat";

type Entry = {
  rank: number;
  name: string;
  subject: string;
  xp: number;
  streak: number;
  trend: Trend;
  trendValue?: number;
  isYou?: boolean;
};

const top3: Entry[] = [
  { rank: 1, name: "Lucía", subject: "Constitucional", xp: 4230, streak: 21, trend: "flat" },
  { rank: 2, name: "Marta", subject: "Derecho Civil", xp: 3890, streak: 14, trend: "up", trendValue: 1 },
  { rank: 3, name: "Luis", subject: "Penal", xp: 3650, streak: 8, trend: "down", trendValue: 1 },
];

const rest: Entry[] = [
  { rank: 4, name: "Manu", subject: "Derecho Civil", xp: 1240, streak: 12, trend: "up", trendValue: 2, isYou: true },
  { rank: 5, name: "Carmen", subject: "Constitucional", xp: 1180, streak: 3, trend: "flat" },
  { rank: 6, name: "Pablo", subject: "Penal", xp: 1090, streak: 7, trend: "down", trendValue: 1 },
  { rank: 7, name: "Sofía", subject: "Mercantil", xp: 1020, streak: 5, trend: "up", trendValue: 4 },
  { rank: 8, name: "David", subject: "Derecho Civil", xp: 980, streak: 2, trend: "down", trendValue: 2 },
  { rank: 9, name: "Elena", subject: "Penal", xp: 940, streak: 9, trend: "flat" },
];

const allEntries = [...top3, ...rest];

function TrendIndicator({ trend, value }: { trend: Trend; value?: number }) {
  if (trend === "flat") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
        <Minus className="h-3 w-3" aria-hidden />
        <span className="sr-only">Sin cambios</span>
      </span>
    );
  }
  const isUp = trend === "up";
  return (
    <span
      className={
        isUp
          ? "inline-flex items-center gap-1 text-xs font-medium text-emerald-600 tabular-nums dark:text-emerald-400"
          : "inline-flex items-center gap-1 text-xs font-medium text-rose-600 tabular-nums dark:text-rose-400"
      }
    >
      {isUp ? (
        <ArrowUp className="h-3 w-3" aria-hidden />
      ) : (
        <ArrowDown className="h-3 w-3" aria-hidden />
      )}
      {value}
      <span className="sr-only">
        {isUp ? "Subió" : "Bajó"} {value} {value === 1 ? "puesto" : "puestos"}
      </span>
    </span>
  );
}

function MedalBadge({ rank }: { rank: 1 | 2 | 3 }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-pill bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50">
        <Crown className="h-4 w-4" aria-hidden />
        <span className="sr-only">Primer puesto</span>
      </span>
    );
  }
  const tone =
    rank === 2
      ? "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700"
      : "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-800/50";
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-pill ring-1 ${tone}`}
    >
      <Medal className="h-4 w-4" aria-hidden />
      <span className="sr-only">
        {rank === 2 ? "Segundo puesto" : "Tercer puesto"}
      </span>
    </span>
  );
}

export default function LeaderboardWireframe() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ranking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compite con miles de opositores. Actualizado cada hora.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" aria-hidden />
          Compartir mi rank
        </Button>
      </header>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="week">Esta semana</TabsTrigger>
            <TabsTrigger value="month">Este mes</TabsTrigger>
            <TabsTrigger value="all">Histórico</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select defaultValue="global">
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Ranking global</SelectItem>
            <SelectItem value="course">Por curso</SelectItem>
            <SelectItem value="subject">Por asignatura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rank list */}
      <section className="mx-auto mt-6 max-w-3xl">
        <Card className="shadow-card">
          <CardContent className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_5rem_4rem] items-center gap-3 border-b border-border/60 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[3rem_1fr_8rem_5rem_4rem]">
              <span>#</span>
              <span>Estudiante</span>
              <span className="hidden sm:block">Asignatura top</span>
              <span className="text-right">XP</span>
              <span className="text-right">Tend.</span>
            </div>

            {/* Thin warm accent above rank #1 (the only warm-gradient surface on the page) */}
            <div className="h-0.5 bg-grad-warm" aria-hidden />

            <ul className="divide-y divide-border/50">
              {allEntries.map((entry) => {
                const isPodium = entry.rank <= 3;
                const rowBase =
                  "grid grid-cols-[3rem_1fr_5rem_4rem] items-center gap-3 px-4 py-3 transition-colors duration-fast sm:grid-cols-[3rem_1fr_8rem_5rem_4rem]";
                const rowState = entry.isYou
                  ? "bg-brand-primary/5 ring-1 ring-inset ring-brand-primary/20"
                  : "hover:bg-muted/50";

                return (
                  <li key={entry.rank} className={`${rowBase} ${rowState}`}>
                    {/* Rank cell */}
                    <div className="flex items-center">
                      {isPodium ? (
                        <MedalBadge rank={entry.rank as 1 | 2 | 3} />
                      ) : (
                        <span className="pl-2 text-sm font-semibold tabular-nums text-muted-foreground">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Student */}
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {entry.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {entry.name}
                          </span>
                          {entry.isYou && (
                            <Badge
                              variant="secondary"
                              className="h-5 bg-brand-primary/10 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary"
                            >
                              Tú
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground sm:hidden">
                          {entry.subject}
                        </p>
                      </div>
                    </div>

                    {/* Subject (sm+) */}
                    <span className="hidden truncate text-xs text-muted-foreground sm:block">
                      {entry.subject}
                    </span>

                    {/* XP + streak */}
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {entry.xp.toLocaleString("es-ES")}
                      </span>
                      <StreakBadge count={entry.streak} size="sm" />
                    </div>

                    {/* Trend */}
                    <div className="flex justify-end">
                      <TrendIndicator
                        trend={entry.trend}
                        value={entry.trendValue}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

          </CardContent>
        </Card>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Mostrando los primeros 9 puestos. Solo se cuentan estudiantes activos
          en los últimos 7 días.
        </p>
      </section>
    </div>
  );
}
