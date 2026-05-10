"use client";

import { ArrowLeft, ArrowRight, Flag, Timer } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const questionMap: Array<"correct" | "wrong" | "current" | "pending"> = [
  "correct",
  "correct",
  "wrong",
  "current",
  "pending",
  "pending",
  "pending",
  "pending",
  "pending",
  "pending",
];

// Quiz timer: 20 minutes total, ~12 minutes elapsed in this mock state.
const TIMER_TOTAL_SECONDS = 20 * 60;
const TIMER_REMAINING_SECONDS = 8 * 60 + 24;

function formatTime(seconds: number) {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function QuizWireframe() {
  const [answer, setAnswer] = useState<string | undefined>("c");

  const timerPercent = (TIMER_REMAINING_SECONDS / TIMER_TOTAL_SECONDS) * 100;

  return (
    <div className="flex h-[calc(100vh-2.5rem)] flex-col bg-muted/20">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Salir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Salir del test?</AlertDialogTitle>
                <AlertDialogDescription>
                  Perderás el progreso de esta tentativa. ¿Seguro?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction>Salir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              Test U2.3 · Derecho Civil
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Capacidad de obrar (modo práctica)
            </p>
          </div>

          {/* Timer: monospace digits, neutral foreground, no flashing. */}
          <div className="hidden items-center gap-2 sm:flex">
            <Timer
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span
              className="font-mono text-sm font-semibold tabular-nums text-foreground"
              aria-label="Tiempo restante"
            >
              {formatTime(TIMER_REMAINING_SECONDS)}
            </span>
          </div>

          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Flag className="mr-1 h-4 w-4" />
            Marcar para revisar
          </Button>
        </div>

        {/* Progress strip: question position + subtle timer track. */}
        <div className="border-t bg-muted/30">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-pill bg-muted"
                role="progressbar"
                aria-valuenow={4}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-label="Progreso del test"
              >
                <div
                  className="h-full rounded-pill bg-foreground transition-all duration-normal ease-out"
                  style={{ width: "40%" }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                4 / 10
              </span>
            </div>

            {/* Timer track: thin, brand-primary fill, no flash. */}
            <div
              className="h-1 overflow-hidden rounded-pill bg-brand-primary/10"
              role="progressbar"
              aria-valuenow={TIMER_REMAINING_SECONDS}
              aria-valuemin={0}
              aria-valuemax={TIMER_TOTAL_SECONDS}
              aria-label="Tiempo restante"
            >
              <div
                className="h-full rounded-pill bg-brand-primary transition-all duration-normal ease-out"
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_300px]">
        {/* Question */}
        <main className="overflow-y-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-2xl">
            {/* Question card: prominent surface, popover-tier shadow. */}
            <article className="space-y-6 rounded-hero border bg-card p-6 shadow-popover md:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pregunta 4 de 10
                </p>
                <h2 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-foreground md:text-3xl">
                  ¿Qué edad establece el Código Civil para la plena capacidad
                  de obrar?
                </h2>
              </div>

              <RadioGroup
                value={answer}
                onValueChange={setAnswer}
                className="space-y-3"
                aria-label="Opciones de respuesta"
              >
                {[
                  { v: "a", label: "16 años" },
                  { v: "b", label: "17 años" },
                  { v: "c", label: "18 años" },
                  { v: "d", label: "21 años" },
                ].map((opt) => {
                  const isSelected = answer === opt.v;
                  return (
                    <Label
                      key={opt.v}
                      htmlFor={`opt-${opt.v}`}
                      className={cn(
                        "group flex cursor-pointer items-center gap-4 rounded-card border bg-card p-4 font-normal shadow-card transition-shadow duration-normal ease-out",
                        "hover:bg-muted/30 hover:shadow-card-hover",
                        "focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2",
                        isSelected
                          ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary"
                          : "border-border",
                      )}
                    >
                      <RadioGroupItem
                        id={`opt-${opt.v}`}
                        value={opt.v}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-card font-mono text-sm font-bold uppercase transition-colors duration-fast",
                          isSelected
                            ? "bg-brand-primary text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                        )}
                      >
                        {opt.v}
                      </span>
                      <span className="text-base font-medium text-foreground">
                        {opt.label}
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </article>

            <Separator className="my-6" />

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <Button disabled={!answer}>
                Siguiente
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Sidebar map */}
        <aside className="hidden border-l bg-muted/20 lg:block">
          <div className="space-y-4 p-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Mapa de preguntas
              </h3>
              <p className="text-xs text-muted-foreground">
                Click para revisar
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questionMap.map((state, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={cn(
                    "flex h-10 items-center justify-center rounded-card border text-sm font-bold tabular-nums transition-colors duration-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                    state === "correct" &&
                      "border-brand-success/30 bg-brand-success/15 text-brand-success hover:bg-brand-success/20",
                    state === "wrong" &&
                      "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
                    state === "current" &&
                      "border-brand-primary bg-brand-primary text-white shadow-card",
                    state === "pending" &&
                      "border-border bg-card text-muted-foreground hover:bg-muted/50",
                  )}
                  aria-label={`Pregunta ${idx + 1}, ${
                    state === "correct"
                      ? "acertada"
                      : state === "wrong"
                        ? "fallada"
                        : state === "current"
                          ? "actual"
                          : "pendiente"
                  }`}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-success" />
                <span className="text-muted-foreground">Acertada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Fallada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-primary" />
                <span className="text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full border border-muted-foreground/40 bg-card" />
                <span className="text-muted-foreground">Pendiente</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
