"use client";

import Link from "next/link";
import {
  BookOpen,
  Check,
  Clock,
  FileQuestion,
  Lock,
  Play,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Button as GameButton } from "@/components/game/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContinueCTA } from "@/components/game/ContinueCTA";
import { GradientHero } from "@/components/game/GradientHero";
import { cn } from "@/lib/utils";

type LessonState = "done" | "active" | "todo" | "locked";

type Lesson = {
  n: string;
  title: string;
  state: LessonState;
  quizScore?: number;
};

type Unit = {
  n: number;
  title: string;
  progress: number;
  status: "done" | "active" | "locked";
  lessons: Lesson[];
};

const units: Unit[] = [
  {
    n: 1,
    title: "Conceptos generales",
    progress: 100,
    status: "done",
    lessons: [
      { n: "1.1", title: "Introducción", state: "done", quizScore: 95 },
      { n: "1.2", title: "Fuentes del derecho", state: "done", quizScore: 88 },
    ],
  },
  {
    n: 2,
    title: "Capacidad jurídica",
    progress: 65,
    status: "active",
    lessons: [
      { n: "2.1", title: "Personalidad", state: "done", quizScore: 92 },
      { n: "2.2", title: "Capacidad jurídica", state: "done", quizScore: 78 },
      { n: "2.3", title: "Capacidad de obrar", state: "active" },
      { n: "2.4", title: "Restricciones legales", state: "todo" },
    ],
  },
  {
    n: 3,
    title: "Estado civil",
    progress: 0,
    status: "locked",
    lessons: [],
  },
];

const stateMeta: Record<
  LessonState,
  { label: string; chip: string; icon: typeof Check }
> = {
  done: {
    label: "Completada",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    icon: Check,
  },
  active: {
    label: "En curso",
    chip: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
    icon: Clock,
  },
  todo: {
    label: "Pendiente",
    chip: "bg-muted text-muted-foreground",
    icon: BookOpen,
  },
  locked: {
    label: "Bloqueada",
    chip: "bg-muted text-muted-foreground",
    icon: Lock,
  },
};

function UnitTrigger({ unit }: { unit: Unit }) {
  const StatusIcon =
    unit.status === "done" ? Check : unit.status === "locked" ? Lock : Play;
  const tone =
    unit.status === "done"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
      : unit.status === "active"
        ? "bg-grad-trust text-white"
        : "bg-muted text-muted-foreground";
  return (
    <div className="flex w-full items-center gap-4 pr-4 text-left">
      <div
        className={cn(
          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-card",
          tone,
        )}
      >
        <StatusIcon className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-base font-bold leading-tight",
            unit.status === "locked" && "text-muted-foreground",
          )}
        >
          Unidad {unit.n} · {unit.title}
        </p>
        {unit.status === "locked" ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Completa la unidad anterior para desbloquear
          </p>
        ) : (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 max-w-[180px] flex-1 overflow-hidden rounded-pill bg-muted">
              <div
                className={cn(
                  "h-full rounded-pill",
                  unit.status === "done" ? "bg-emerald-500" : "bg-grad-trust",
                )}
                style={{ width: `${unit.progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {unit.progress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const Meta = stateMeta[lesson.state];
  const canRead = lesson.state !== "locked";
  const canTest = lesson.state === "done" || lesson.state === "active";
  return (
    <li
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-card border bg-card px-3 py-2.5 shadow-card transition-colors duration-fast hover:bg-muted/50 sm:grid-cols-[auto_1fr_auto_auto]",
        lesson.state === "locked" && "opacity-60",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-card",
          Meta.chip,
        )}
      >
        <Meta.icon className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">
          {lesson.n} · {lesson.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{Meta.label}</span>
          {lesson.quizScore !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px]",
                lesson.quizScore >= 70
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
              )}
            >
              Test {lesson.quizScore}%
            </Badge>
          )}
        </div>
      </div>
      {lesson.state === "active" ? (
        <GameButton
          size="sm"
          variant="learning"
          asChild
          className="hidden sm:inline-flex"
        >
          <Link href="/wireframes/lesson">
            <BookOpen className="mr-1 h-3.5 w-3.5" />
            Continuar
          </Link>
        </GameButton>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={!canRead}
          asChild={canRead}
          className="hidden sm:inline-flex"
        >
          {canRead ? (
            <Link href="/wireframes/lesson">
              <BookOpen className="mr-1 h-3.5 w-3.5" />
              {lesson.state === "done" ? "Repasar" : "Leer"}
            </Link>
          ) : (
            <span>
              <Lock className="mr-1 h-3.5 w-3.5" />
              Bloqueada
            </span>
          )}
        </Button>
      )}
      {canTest ? (
        <GameButton size="sm" variant="learning" asChild>
          <Link href="/wireframes/quiz">
            <FileQuestion className="mr-1 h-3.5 w-3.5" />
            Hacer test
          </Link>
        </GameButton>
      ) : (
        <Button size="sm" variant="ghost" disabled>
          <FileQuestion className="mr-1 h-3.5 w-3.5" />
          Test
        </Button>
      )}
    </li>
  );
}

export default function CourseDetailWireframe() {
  return (
    <div className="-mx-4 -mt-6 md:-mx-8">
      {/* Hero */}
      <GradientHero variant="trust" decorative={false}>
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-10 md:px-8 md:py-14">
          <Breadcrumb>
            <BreadcrumbList className="text-white/80">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="hover:text-white">
                  <Link href="/wireframes/courses">Mis cursos</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/50" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">
                  Derecho Civil
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-3">
            <h1 className="text-hero text-white">Derecho Civil</h1>
            <p className="text-white/80">
              Prof. García · 18 unidades · 240 lecciones
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 md:gap-4">
            {[
              { label: "Progreso", value: "65%", icon: TrendingUp },
              { label: "Unidades", value: "12 / 18", icon: BookOpen },
              { label: "Ranking", value: "#4", icon: Trophy },
              { label: "Tiempo", value: "8h 40m", icon: Clock },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-card border border-white/30 bg-white/[0.18] px-4 py-3 ring-1 ring-white/10 backdrop-blur"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
                    {stat.label}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Icon
                      className="h-5 w-5 text-white/85"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <p className="text-3xl font-black tracking-tight md:text-4xl">
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GradientHero>

      {/* Sticky tabs */}
      <div className="sticky top-[6rem] z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8">
          <Tabs defaultValue="syllabus">
            <TabsList>
              <TabsTrigger
                value="syllabus"
                className="transition-colors duration-fast"
              >
                Temario
              </TabsTrigger>
              <TabsTrigger
                value="exams"
                className="transition-colors duration-fast"
              >
                Exámenes
              </TabsTrigger>
              <TabsTrigger
                value="ranking"
                className="transition-colors duration-fast"
              >
                <Trophy className="mr-1 h-3 w-3" />
                Ranking del curso
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        {/* Continue inside course */}
        <ContinueCTA
          href="/wireframes/lesson"
          course="Derecho Civil"
          unit="Unidad 2"
          lesson="2.3 · Capacidad de obrar"
          progress={65}
        />

        {/* Syllabus */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-display">Temario</h2>
            <p className="text-sm text-muted-foreground">
              {units.length} unidades · {units.reduce((a, u) => a + u.lessons.length, 0)} lecciones
            </p>
          </div>

          <Accordion
            type="multiple"
            defaultValue={["unit-2"]}
            className="space-y-3"
          >
            {units.map((unit) => (
              <AccordionItem
                key={unit.n}
                value={`unit-${unit.n}`}
                disabled={unit.status === "locked"}
                className={cn(
                  "rounded-card border bg-card px-4 shadow-card transition-shadow duration-normal hover:shadow-card-hover",
                  unit.status === "active" &&
                    "bg-brand-primary/5 ring-1 ring-brand-primary/20",
                  unit.status === "locked" && "opacity-60 hover:shadow-card",
                )}
              >
                <AccordionTrigger className="transition-colors duration-fast hover:no-underline">
                  <UnitTrigger unit={unit} />
                </AccordionTrigger>
                {unit.lessons.length > 0 && (
                  <AccordionContent>
                    <ul className="space-y-2 pb-2">
                      {unit.lessons.map((l) => (
                        <LessonRow key={l.n} lesson={l} />
                      ))}
                    </ul>
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
