"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookmarkPlus,
  ChevronRight,
  Download,
  FileText,
  Lightbulb,
  Play,
  Printer,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Button as GameButton } from "@/components/game/Button";
import { Card } from "@/components/ui/card";
import { GradientHero } from "@/components/game/GradientHero";

const tocItems = [
  { id: "video", label: "Vídeo principal", active: false },
  { id: "intro", label: "Introducción", active: true },
  { id: "objectives", label: "Objetivos" },
  { id: "concepts", label: "Conceptos clave" },
  { id: "example", label: "Ejemplo práctico" },
];

const resources = [
  { name: "Apuntes de la lección.pdf", size: "1.2 MB" },
  { name: "Esquema visual.pdf", size: "640 KB" },
  { name: "Casos prácticos.docx", size: "320 KB" },
];

const dropCap =
  "[&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:mt-1 [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-semibold [&>p:first-of-type]:first-letter:leading-none [&>p:first-of-type]:first-letter:text-foreground";

// When the reader arrives from a quiz "Repasar" link, scroll to and highlight
// the exact passage the question was drawn from (passed as ?focus=…).
function highlightFocus(focus: string, color: string) {
  const article = document.querySelector("article");
  if (!article) return;
  const target = focus.replace(/\s+/g, " ").trim();
  if (!target) return;
  // Accept only an "r, g, b" triple from the link; fall back to amber.
  const rgb = /^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(color)
    ? color
    : "234, 161, 70";

  for (const el of Array.from(article.querySelectorAll("p, li"))) {
    // Only handle plain single-text-node blocks so we can wrap a clean range.
    const node = el.firstChild;
    if (el.childNodes.length !== 1 || !node || node.nodeType !== Node.TEXT_NODE)
      continue;

    const raw = node.nodeValue ?? "";
    // Collapse whitespace while mapping each collapsed char back to its raw index.
    let collapsed = "";
    const map: number[] = [];
    let prevSpace = true; // start "in space" to drop leading whitespace
    for (let i = 0; i < raw.length; i++) {
      if (/\s/.test(raw[i])) {
        if (prevSpace) continue;
        collapsed += " ";
        map.push(i);
        prevSpace = true;
      } else {
        collapsed += raw[i];
        map.push(i);
        prevSpace = false;
      }
    }
    if (collapsed.endsWith(" ")) {
      collapsed = collapsed.slice(0, -1);
      map.pop();
    }

    const idx = collapsed.indexOf(target);
    if (idx < 0) continue;

    const range = document.createRange();
    range.setStart(node, map[idx]);
    range.setEnd(node, map[idx + target.length - 1] + 1);
    const mark = document.createElement("mark");
    mark.style.cssText = `background: rgba(${rgb}, 0.28); border-radius: 3px; box-shadow: 0 0 0 3px rgba(${rgb}, 0.28); scroll-margin-top: 6rem;`;
    try {
      range.surroundContents(mark);
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      // surroundContents throws if the range crosses element boundaries — skip.
    }
    return;
  }
}

export default function LessonWireframe() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    if (!focus) return;
    const color = params.get("hl") ?? "";
    // Let the article paint before measuring/scrolling.
    const id = window.setTimeout(() => highlightFocus(focus, color), 80);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="min-h-[calc(100vh-2.5rem)]">
      {/* Hero header: warm gradient per spec §2 (Lesson reader) */}
      <GradientHero
        variant="warm"
        decorative={false}
        className="px-4 py-10 md:px-8"
      >
        <div className="mx-auto max-w-6xl space-y-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-3 text-white hover:bg-white/15 hover:text-white focus-visible:ring-white"
          >
            <Link href="/wireframes/courses/derecho-civil">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al temario
            </Link>
          </Button>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/75">
              Derecho civil · Unidad 2 · Lección 3 de 4
            </p>
            <h1 className="mt-2 font-sans text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Capacidad de obrar
            </h1>
            <p className="mt-3 max-w-2xl font-reader text-base leading-[1.6] text-white/90">
              Cómo se adquiere, dónde encuentra sus límites y por qué importa
              para los actos jurídicos del día a día.
            </p>
          </div>
        </div>
      </GradientHero>

      {/* Body */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        {/* TOC sidebar (left, sticky) */}
        <aside className="lg:sticky lg:top-14 lg:self-start">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            En esta lección
          </p>
          <nav className="space-y-1">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block rounded-md px-3 py-2 text-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                  item.active
                    ? "bg-brand-primary/10 font-medium text-brand-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <p className="mt-6 px-3 text-xs text-muted-foreground">
            Lección 3 de 4 · 12 min de lectura
          </p>
        </aside>

        {/* Article */}
        <article
          className="font-reader text-[17px] leading-[1.7] text-foreground"
          style={{ fontFeatureSettings: '"liga", "kern", "onum"' }}
        >
          <div className="max-w-2xl space-y-10">
            {/* Video block */}
            <section id="video" className="space-y-3">
              <Card className="overflow-hidden shadow-card">
                <div className="flex aspect-video items-center justify-center bg-slate-900 text-white">
                  <button
                    type="button"
                    aria-label="Reproducir vídeo"
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 transition-colors duration-fast hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
                    <Play className="h-7 w-7" fill="currentColor" />
                  </button>
                </div>
              </Card>
              <p className="font-sans text-xs text-muted-foreground">
                Vídeo de la profesora Marina Soler · 6 min
              </p>
            </section>

            {/* Intro */}
            <section id="intro" className={`space-y-4 ${dropCap}`}>
              <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
                Introducción
              </h2>
              <p>
                La capacidad de obrar es la aptitud para realizar válidamente
                actos jurídicos por sí mismo. A diferencia de la capacidad
                jurídica, que se tiene desde el nacimiento, la capacidad de
                obrar se adquiere de forma progresiva.
              </p>
              <p>
                En esta lección revisaremos el marco normativo, las
                restricciones legales y los efectos prácticos sobre los actos
                celebrados por menores y personas con capacidad modificada
                judicialmente.
              </p>
            </section>

            {/* Objectives */}
            <section id="objectives" className="space-y-4">
              <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
                Objetivos de aprendizaje
              </h2>
              <div className="rounded-card border border-border bg-muted/50 p-5">
                <div className="mb-3 flex items-center gap-2 font-sans text-sm font-medium text-foreground">
                  <Target className="h-4 w-4 text-brand-warm" />
                  Al terminar serás capaz de:
                </div>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>Definir el concepto de capacidad de obrar.</li>
                  <li>
                    Distinguir capacidad jurídica de capacidad de obrar y citar
                    sus fuentes en el Código Civil.
                  </li>
                  <li>
                    Identificar las restricciones legales y sus consecuencias
                    sobre los actos celebrados.
                  </li>
                </ol>
              </div>
            </section>

            {/* Concepts */}
            <section id="concepts" className={`space-y-4 ${dropCap}`}>
              <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
                Conceptos clave
              </h2>
              <p>
                La capacidad de obrar se gradúa según la edad y la situación
                personal. Conviene retener tres ejes: la mayoría de edad como
                regla general, la emancipación como excepción anticipada y la
                capacidad modificada judicialmente como restricción
                sobrevenida.
              </p>
              <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">
                Mayoría de edad
              </h3>
              <p>
                Se alcanza a los 18 años cumplidos, momento en que la persona
                adquiere plena capacidad de obrar. Es la regla por defecto del
                ordenamiento.
              </p>
              <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">
                Emancipación
              </h3>
              <p>
                Permite anticipar la capacidad de obrar plena en supuestos
                tasados (concesión paterna, judicial o por matrimonio). Hasta
                la mayoría de edad subsisten ciertas limitaciones para actos
                de disposición sobre bienes inmuebles.
              </p>

              <div className="rounded-card border border-border bg-background p-5 shadow-card">
                <div className="mb-2 flex items-center gap-2 font-sans text-sm font-medium text-foreground">
                  <Lightbulb className="h-4 w-4 text-brand-warm" />
                  Idea clave
                </div>
                <p className="font-reader text-[15px] leading-[1.65] text-muted-foreground">
                  La capacidad jurídica es titularidad, la capacidad de obrar
                  es ejercicio. Toda persona tiene la primera; la segunda se
                  adquiere progresivamente.
                </p>
              </div>
            </section>

            {/* Example */}
            <section id="example" className={`space-y-4 ${dropCap}`}>
              <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
                Ejemplo práctico
              </h2>
              <p>
                Marta, de 17 años y emancipada por concesión judicial, firma
                un contrato de arrendamiento sobre un local. ¿Es válido sin
                complemento de capacidad?
              </p>
              <p>
                Sí. La emancipación habilita para celebrar actos de
                administración ordinaria. Sin embargo, si Marta quisiera
                vender un inmueble heredado, necesitaría el complemento de
                capacidad de sus progenitores o curador hasta cumplir los 18.
              </p>
            </section>

            {/* Article CTAs */}
            <section className="flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="mr-1.5 h-4 w-4" />
                  Imprimir
                </Button>
                <Button variant="outline" size="sm">
                  <BookmarkPlus className="mr-1.5 h-4 w-4" />
                  Marcar para repaso
                </Button>
              </div>
              <GameButton variant="learning" size="lg">
                Marcar como leída y continuar
                <ChevronRight className="ml-1 h-4 w-4" />
              </GameButton>
            </section>
          </div>
        </article>

        {/* Resources sidebar (right) */}
        <aside className="space-y-6 lg:sticky lg:top-14 lg:self-start">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recursos descargables
            </p>
            <ul className="space-y-2">
              {resources.map((r) => (
                <li key={r.name}>
                  <a
                    href="#"
                    className="group flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-card transition-shadow duration-normal hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {r.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {r.size}
                      </span>
                    </span>
                    <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors duration-fast group-hover:text-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card border border-border bg-muted/40 p-4">
            <p className="mb-1 font-sans text-sm font-medium text-foreground">
              ¿Listo para comprobarlo?
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              5 preguntas, 3 minutos. Sin contrarreloj.
            </p>
            <GameButton variant="learning" size="lg" className="w-full">
              Hacer test al final
              <ChevronRight className="ml-1 h-4 w-4" />
            </GameButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
