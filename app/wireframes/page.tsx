import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mocks = [
  {
    href: "/wireframes/home",
    title: "/home",
    description: "Inicio: dashboard con racha, XP, continuar, logros.",
    section: "shell",
    wireframe: "3.2",
  },
  {
    href: "/wireframes/courses",
    title: "/study (Mis cursos)",
    description: "Grid de cursos inscritos con tabs filtro y catálogo.",
    section: "shell",
    wireframe: "3.3",
  },
  {
    href: "/wireframes/courses/derecho-civil",
    title: "/study/[id]",
    description: "Detalle de curso: header gradient, tabs sticky, acordeón.",
    section: "shell",
    wireframe: "3.4",
  },
  {
    href: "/wireframes/leaderboard",
    title: "/leaderboard",
    description: "Ranking: podio top 3 y tabla con tendencias.",
    section: "shell",
    wireframe: "3.7",
  },
  {
    href: "/wireframes/news",
    title: "/news (Noticias)",
    description:
      "Feed de convocatorias, cambios en temario y anuncios.",
    section: "shell",
    wireframe: "3.9",
  },
  {
    href: "/wireframes/quiz",
    title: "/quiz/[id] (focus)",
    description: "Modo focus: timer, pregunta, mapa lateral.",
    section: "focus",
    wireframe: "3.5",
  },
  {
    href: "/wireframes/lesson",
    title: "/study/[id]/lessons/[id] (focus)",
    description: "Lectura: header amber, 3 columnas, TOC sticky.",
    section: "focus",
    wireframe: "3.6",
  },
  {
    href: "/wireframes/sign-in",
    title: "/sign-in (split)",
    description: "Auth split layout con hero + testimonial.",
    section: "public",
    wireframe: "3.8",
  },
  {
    href: "/wireframes/teach",
    title: "/teach (Asignaturas)",
    description:
      "Backoffice profesor: listado de asignaturas, estado, accesos.",
    section: "teach",
    wireframe: "3.10",
  },
  {
    href: "/wireframes/teach/derecho-civil",
    title: "/teach/[id] (Temario)",
    description: "Tabla de unidades: orden, preguntas, lecciones, acciones.",
    section: "teach",
    wireframe: "3.11",
  },
  {
    href: "/wireframes/teach/build",
    title: "/build (editor)",
    description:
      "Builder dual-tab: form de pregunta completo + editor markdown y subida R2.",
    section: "teach",
    wireframe: "3.12",
  },
  {
    href: "/wireframes/teach/media",
    title: "/teach/media (biblioteca)",
    description:
      "Biblioteca global de media: subida, etiquetas por asignatura, panel de detalle. Reusable como picker desde el builder.",
    section: "teach",
    wireframe: "3.13",
  },
];

export default function WireframesIndex() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Phase 2B · Live Mocks
        </h1>
        <p className="mt-2 text-muted-foreground">
          Materializaciones reales (shadcn + Tailwind) de los wireframes ASCII
          en{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            docs/ui/wireframes.md
          </code>
          . Editables en código; no afectan rutas de producción.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {mocks.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
          >
            <Card className="h-full shadow-card transition-shadow duration-normal ease-out group-hover:shadow-card-hover">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {m.section}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    wireframe {m.wireframe}
                  </Badge>
                </div>
                <CardTitle className="font-mono text-base">{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
