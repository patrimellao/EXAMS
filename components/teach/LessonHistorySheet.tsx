"use client";

import { useState } from "react";
import { History, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Mock data -------------------------------------------------------------
// Wireframe only. In Phase 2 these come from a `lesson_revisions` table
// (full markdown snapshot per save) and the diff is computed at read time.

type DiffLine = {
  type: "add" | "del" | "ctx";
  /** Line number in the new revision (blank for deletions) */
  no?: number;
  text: string;
};

type Revision = {
  id: string;
  author: string;
  initial: string;
  /** Relative label, e.g. "hace 2 horas" */
  when: string;
  date: string;
  label?: string;
  current?: boolean;
  added: number;
  removed: number;
  diff: DiffLine[];
};

const REVISIONS: Revision[] = [
  {
    id: "r-now",
    author: "García",
    initial: "G",
    when: "ahora",
    date: "20 jun 2026 · 12:40",
    label: "Actual",
    current: true,
    added: 0,
    removed: 0,
    diff: [],
  },
  {
    id: "r-1",
    author: "García",
    initial: "G",
    when: "hace 2 horas",
    date: "20 jun 2026 · 10:15",
    label: "Autoguardado",
    added: 4,
    removed: 1,
    diff: [
      { type: "ctx", no: 11, text: "## Capacidad de obrar" },
      { type: "ctx", no: 12, text: "" },
      { type: "del", text: "La capacidad de obrar se adquiere con la mayoría de edad." },
      { type: "add", no: 13, text: "La **capacidad de obrar** se adquiere, con carácter general," },
      { type: "add", no: 14, text: "con la mayoría de edad a los 18 años (art. 315 CC)." },
      { type: "ctx", no: 15, text: "" },
      { type: "add", no: 16, text: "> [!objetivo] Al terminar sabrás distinguir capacidad jurídica" },
      { type: "add", no: 17, text: "> de capacidad de obrar." },
    ],
  },
  {
    id: "r-2",
    author: "García",
    initial: "G",
    when: "ayer",
    date: "19 jun 2026 · 18:02",
    label: "Publicada",
    added: 7,
    removed: 2,
    diff: [
      { type: "ctx", no: 1, text: "# Capacidad jurídica" },
      { type: "ctx", no: 2, text: "" },
      { type: "del", text: "Intro pendiente de redactar." },
      { type: "del", text: "TODO: ejemplos." },
      { type: "add", no: 3, text: "La capacidad jurídica es la aptitud para ser titular" },
      { type: "add", no: 4, text: "de derechos y obligaciones." },
      { type: "ctx", no: 5, text: "" },
      { type: "add", no: 6, text: "## Capacidad de obrar" },
    ],
  },
  {
    id: "r-3",
    author: "García",
    initial: "G",
    when: "hace 3 días",
    date: "17 jun 2026 · 09:30",
    label: "Borrador inicial",
    added: 12,
    removed: 0,
    diff: [
      { type: "add", no: 1, text: "# Capacidad jurídica" },
      { type: "add", no: 2, text: "" },
      { type: "add", no: 3, text: "Intro pendiente de redactar." },
      { type: "add", no: 4, text: "TODO: ejemplos." },
    ],
  },
];

export function LessonHistorySheet({
  open,
  onOpenChange,
  lessonTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonTitle?: string;
}) {
  const current = REVISIONS.find((r) => r.current);
  const past = REVISIONS.filter((r) => !r.current);
  const [selectedId, setSelectedId] = useState(past[0]?.id);
  const selected = REVISIONS.find((r) => r.id === selectedId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="px-6 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-muted-foreground" />
            Historial de versiones
          </SheetTitle>
          <SheetDescription className="text-xs">
            {lessonTitle ? `«${lessonTitle}» · ` : ""}Compara cualquier versión
            con la actual y restáurala.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Revision list */}
          <ul className="space-y-1 border-b p-3">
            {REVISIONS.map((r) => {
              const active = !r.current && r.id === selectedId;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={r.current}
                    onClick={() => setSelectedId(r.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary",
                      r.current
                        ? "cursor-default border-transparent opacity-80"
                        : active
                          ? "border-primary/30 bg-primary/10"
                          : "border-transparent hover:bg-muted",
                    )}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-grad-brand text-[10px] font-semibold text-white">
                        {r.initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {r.author}
                        </span>
                        {r.label ? (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "h-4 px-1.5 text-[9px] font-medium",
                              r.current &&
                                "bg-success/10 text-success border-success/20",
                            )}
                          >
                            {r.label}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="block text-[10px] text-muted-foreground">
                        {r.when} · {r.date}
                      </span>
                    </div>
                    {!r.current ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold tabular-nums">
                        <span className="text-success">+{r.added}</span>
                        <span className="text-destructive">−{r.removed}</span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Diff for the selected revision */}
          {selected && !selected.current ? (
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {selected.when} → {current?.label ?? "Actual"}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold tabular-nums">
                  <span className="text-success">+{selected.added}</span>
                  <span className="text-destructive">−{selected.removed}</span>
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border bg-muted/20">
                {selected.diff.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start font-mono text-[12px] leading-relaxed",
                      line.type === "add" && "bg-success/10",
                      line.type === "del" && "bg-destructive/10",
                    )}
                  >
                    <span className="w-8 shrink-0 select-none px-1 text-right tabular-nums text-muted-foreground/50">
                      {line.no ?? ""}
                    </span>
                    <span
                      className={cn(
                        "w-4 shrink-0 select-none text-center",
                        line.type === "add" && "text-success",
                        line.type === "del" && "text-destructive",
                        line.type === "ctx" && "text-muted-foreground/40",
                      )}
                    >
                      {line.type === "add" ? "+" : line.type === "del" ? "−" : ""}
                    </span>
                    <span
                      className={cn(
                        "flex-1 whitespace-pre-wrap break-words px-1 pr-2",
                        line.type === "add" && "text-foreground",
                        line.type === "del" &&
                          "text-muted-foreground line-through decoration-destructive/40",
                        line.type === "ctx" && "text-muted-foreground",
                      )}
                    >
                      {line.text || " "}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer: restore action */}
        {selected && !selected.current ? (
          <div className="flex items-center justify-between gap-3 border-t px-6 py-3">
            <span className="text-[11px] text-muted-foreground">
              Restaurar reemplaza el contenido actual y guarda una versión nueva.
            </span>
            <UIButton size="sm" className="h-9 shrink-0 font-semibold">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Restaurar
            </UIButton>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
