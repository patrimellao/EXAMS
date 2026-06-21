"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/teach/PageHeader";

type Unit = {
  order: number;
  name: string;
  /** Acceso de la unidad: secuencial (bloqueada) o libre */
  locked: boolean;
  /** Incluida en el plan gratuito */
  free: boolean;
};

type Lesson = {
  id: number;
  order: number;
  title: string;
  unitOrder: number;
  questions: number;
};

const units: Unit[] = [
  { order: 1, name: "Conceptos generales", locked: false, free: true },
  { order: 2, name: "Capacidad jurídica", locked: false, free: true },
  { order: 3, name: "Estado civil", locked: true, free: false },
  { order: 4, name: "Persona jurídica", locked: true, free: false },
];

const unitByOrder = new Map(units.map((u) => [u.order, u]));

const lessons: Lesson[] = [
  // Unidad 1 · Conceptos generales
  { id: 1, order: 1, title: "Qué es el Derecho Civil", unitOrder: 1, questions: 8 },
  { id: 2, order: 2, title: "Fuentes del ordenamiento", unitOrder: 1, questions: 6 },
  { id: 3, order: 3, title: "La norma jurídica", unitOrder: 1, questions: 7 },
  { id: 4, order: 4, title: "Eficacia de las normas", unitOrder: 1, questions: 3 },
  // Unidad 2 · Capacidad jurídica
  { id: 5, order: 1, title: "Capacidad jurídica y de obrar", unitOrder: 2, questions: 9 },
  { id: 6, order: 2, title: "La mayoría de edad", unitOrder: 2, questions: 5 },
  { id: 7, order: 3, title: "Incapacitación y tutela", unitOrder: 2, questions: 4 },
  // Unidad 3 · Estado civil
  { id: 8, order: 1, title: "Concepto de estado civil", unitOrder: 3, questions: 5 },
  { id: 9, order: 2, title: "La nacionalidad", unitOrder: 3, questions: 4 },
  { id: 10, order: 3, title: "La vecindad civil", unitOrder: 3, questions: 3 },
  // Unidad 4 · Persona jurídica
  { id: 11, order: 1, title: "Concepto de persona jurídica", unitOrder: 4, questions: 0 },
  { id: 12, order: 2, title: "Asociaciones y fundaciones", unitOrder: 4, questions: 0 },
];

const PAGE_SIZE = 10;

export default function TeachSubjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (term && !lesson.title.toLowerCase().includes(term)) return false;
      if (unitFilter !== "all" && String(lesson.unitOrder) !== unitFilter)
        return false;
      const locked = unitByOrder.get(lesson.unitOrder)?.locked ?? false;
      if (accessFilter === "free" && locked) return false;
      if (accessFilter === "sequential" && !locked) return false;
      return true;
    });
  }, [search, unitFilter, accessFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);

  // Cualquier cambio de filtro vuelve a la primera página.
  function resetTo(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        breadcrumb={
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
        }
        title={
          <span className="flex items-center gap-3">
            Derecho Civil
            <Badge variant="default">Publicada</Badge>
          </span>
        }
        subtitle={`Temario completo de civil para oposiciones de Justicia · ${units.length} unidades · ${lessons.length} lecciones`}
        actions={
          <>
            <UIButton variant="outline" size="sm">
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archivar asignatura
            </UIButton>
            <Button variant="learning">
              <Plus className="mr-2 h-4 w-4" />
              Nueva unidad
            </Button>
          </>
        }
      />

      {/* Toolbar: buscador + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => resetTo(setSearch)(e.target.value)}
            placeholder="Buscar lección…"
            className="pl-9"
            aria-label="Buscar lección por título"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={unitFilter} onValueChange={resetTo(setUnitFilter)}>
            <SelectTrigger className="w-[180px]" aria-label="Filtrar por unidad">
              <SelectValue placeholder="Unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las unidades</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.order} value={String(u.order)}>
                  {u.order}. {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={accessFilter} onValueChange={resetTo(setAccessFilter)}>
            <SelectTrigger className="w-[150px]" aria-label="Filtrar por acceso">
              <SelectValue placeholder="Acceso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo acceso</SelectItem>
              <SelectItem value="free">Libre</SelectItem>
              <SelectItem value="sequential">Secuencial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lessons table */}
      <div className="overflow-hidden rounded-card border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Lección</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Preguntas</TableHead>
              <TableHead>Acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((lesson) => {
              const unit = unitByOrder.get(lesson.unitOrder);
              const locked = unit?.locked ?? false;
              return (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium tabular-nums text-muted-foreground">
                    {lesson.order}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/wireframes/teach/build/lessons?subject=${params.id}&unit=${lesson.unitOrder}&lesson=${lesson.id}`}
                      className="font-medium hover:underline"
                    >
                      {lesson.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {unit?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {lesson.questions === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      lesson.questions
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      {locked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                      {locked ? "Secuencial" : "Libre"}
                      {unit?.free && (
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                          Gratis
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <UIButton
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8"
                      >
                        <Link
                          href={`/wireframes/teach/build/lessons?subject=${params.id}&unit=${lesson.unitOrder}&lesson=${lesson.id}`}
                        >
                          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                          Builder
                        </Link>
                      </UIButton>
                      <UIButton
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8"
                      >
                        <Link
                          href={`/wireframes/teach/build/questions?subject=${params.id}&unit=${lesson.unitOrder}&lesson=${lesson.id}`}
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
                            aria-label={`Más acciones de ${lesson.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </UIButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar lección
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
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">
              No hay lecciones que coincidan
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba a cambiar el término de búsqueda o los filtros aplicados.
            </p>
          </div>
        )}

        {/* Paginación */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {rangeStart}–{rangeEnd} de {filtered.length} lecciones
            </p>
            <div className="flex items-center gap-1">
              <UIButton
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Anterior
              </UIButton>
              <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <UIButton
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </UIButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
