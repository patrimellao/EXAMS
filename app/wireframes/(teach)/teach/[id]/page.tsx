import Link from "next/link";
import {
  HelpCircle,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  Unlock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/game/Button";
import { Button as UIButton } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Unit = {
  order: number;
  name: string;
  questions: number;
  lessons: number;
  free: boolean;
  locked: boolean;
};

const units: Unit[] = [
  {
    order: 1,
    name: "Conceptos generales",
    questions: 24,
    lessons: 4,
    free: true,
    locked: false,
  },
  {
    order: 2,
    name: "Capacidad jurídica",
    questions: 18,
    lessons: 3,
    free: true,
    locked: false,
  },
  {
    order: 3,
    name: "Estado civil",
    questions: 12,
    lessons: 3,
    free: false,
    locked: true,
  },
  {
    order: 4,
    name: "Persona jurídica",
    questions: 0,
    lessons: 2,
    free: false,
    locked: true,
  },
];

export default function TeachSubjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/wireframes/teach">Asignaturas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Derecho Civil</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Subject header + status toggle */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display">Derecho Civil</h1>
            <Badge variant="default">Publicada</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Temario completo de civil para oposiciones de Justicia ·{" "}
            {units.length} unidades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UIButton variant="outline" size="sm">
            Despublicar
          </UIButton>
          <Button variant="learning">
            <Plus className="mr-2 h-4 w-4" />
            Nueva unidad
          </Button>
        </div>
      </header>

      {/* Units table */}
      <div className="overflow-hidden rounded-card border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Preguntas</TableHead>
              <TableHead className="text-right">Lecciones</TableHead>
              <TableHead>Acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((u) => (
              <TableRow key={u.order}>
                <TableCell className="font-medium tabular-nums text-muted-foreground">
                  {u.order}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/wireframes/teach/build/lessons?subject=${params.id}&unit=${u.order}`}
                    className="font-medium hover:underline"
                  >
                    {u.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {u.questions === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    u.questions
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {u.lessons}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {u.locked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                    {u.locked ? "Secuencial" : "Libre"}
                    {u.free && (
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        Gratis
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <UIButton variant="outline" size="sm" asChild className="h-8">
                      <Link
                        href={`/wireframes/teach/build/lessons?subject=${params.id}&unit=${u.order}`}
                      >
                        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                        Builder
                      </Link>
                    </UIButton>
                    <UIButton variant="outline" size="sm" asChild className="h-8">
                      <Link
                        href={`/wireframes/teach/build/questions?subject=${params.id}&unit=${u.order}`}
                      >
                        <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                        Preguntas
                      </Link>
                    </UIButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <UIButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Más acciones de ${u.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </UIButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar unidad
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {units.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">Esta asignatura no tiene unidades</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera unidad para empezar a añadir preguntas y
              lecciones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
