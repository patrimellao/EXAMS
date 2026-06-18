import Link from "next/link";
import { BookOpen, Layers, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/game/Button";

type Subject = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  units: number;
};

const subjects: Subject[] = [
  {
    id: "derecho-civil",
    name: "Derecho Civil",
    description: "Temario completo de civil para oposiciones de Justicia.",
    active: true,
    units: 18,
  },
  {
    id: "derecho-constitucional",
    name: "Derecho Constitucional",
    description: "Constitución española, Tribunal Constitucional y derechos.",
    active: true,
    units: 12,
  },
  {
    id: "derecho-penal",
    name: "Derecho Penal",
    description: "Parte general y especial. Borrador, aún sin publicar.",
    active: false,
    units: 4,
  },
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed bg-card px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-card bg-muted text-muted-foreground">
        <Layers className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold tracking-tight">
        Aún no hay asignaturas
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Crea tu primera asignatura para empezar a organizar unidades,
        preguntas y lecciones.
      </p>
      <Button variant="learning" className="mt-5">
        <Plus className="mr-2 h-4 w-4" />
        Nueva asignatura
      </Button>
    </div>
  );
}

export default function TeachSubjectsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Compact slate header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display">Asignaturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {subjects.length} asignaturas ·{" "}
            {subjects.filter((s) => s.active).length} publicadas
          </p>
        </div>
        <Button variant="learning">
          <Plus className="mr-2 h-4 w-4" />
          Nueva asignatura
        </Button>
      </header>

      {subjects.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <Link
                href={`/wireframes/teach/${s.id}`}
                className="group block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
              >
                <article className="flex h-full flex-col rounded-card border bg-card p-5 shadow-card transition-shadow duration-normal ease-out group-hover:shadow-card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-card bg-muted text-muted-foreground">
                      <BookOpen className="h-5 w-5" strokeWidth={2.25} />
                    </div>
                    <Badge variant={s.active ? "default" : "secondary"}>
                      {s.active ? "Publicada" : "Borrador"}
                    </Badge>
                  </div>
                  <h2 className="mt-4 text-lg font-bold tracking-tight">
                    {s.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {s.units} unidades
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      Editar contenido →
                    </span>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
