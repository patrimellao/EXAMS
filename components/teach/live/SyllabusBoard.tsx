"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/teach/PageHeader";
import type { Subject } from "@/schemas/subjects";
import { insertUnitSchema, type Unit } from "@/schemas/units";
import { insertLessonSchema, type Lesson } from "@/schemas/lessons";
import { addUnit, updateUnit, deleteUnit } from "@/controllers/unit";
import { updateLesson, deleteLesson } from "@/controllers/lessons";

const PAGE_SIZE = 10;

// ─── Unit form dialog (create / edit) ───────────────────────────────────────

const unitFormSchema = insertUnitSchema
  .pick({ name: true, order: true, unlockPreviousRequired: true, isFree: true })
  .extend({
    // Kept optional here even though `description` is NOT NULL in the DB —
    // the "Nueva unidad" quick-create flow only asks for a name; we default
    // to "" when submitting so the DB constraint is still satisfied.
    description: z.string().max(256).optional(),
  });
type UnitFormInputs = z.infer<typeof unitFormSchema>;

function UnitFormDialog({
  open,
  onOpenChange,
  subjectId,
  unit,
  nextOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: number;
  unit: Unit | null;
  nextOrder: number;
  onSaved: () => void;
}) {
  const isEditing = !!unit;
  const [isPending, startTransition] = useTransition();

  const form = useForm<UnitFormInputs>({
    resolver: zodResolver(unitFormSchema),
    values: {
      name: unit?.name ?? "",
      description: unit?.description ?? "",
      order: unit?.order ?? nextOrder,
      unlockPreviousRequired: unit?.unlockPreviousRequired ?? false,
      isFree: unit?.isFree ?? false,
    },
  });

  const onSubmit = (values: UnitFormInputs) => {
    startTransition(async () => {
      try {
        const payload = {
          name: values.name,
          description: values.description ?? "",
          order: values.order,
          unlockPreviousRequired: values.unlockPreviousRequired,
          isFree: values.isFree,
          subjectId,
        };
        if (isEditing) {
          await updateUnit(unit.id, payload);
          toast({ title: "Unidad actualizada", variant: "primary" });
        } else {
          await addUnit(payload);
          toast({ title: "Unidad creada", variant: "primary" });
        }
        onOpenChange(false);
        onSaved();
      } catch (error) {
        toast({
          variant: "destructive",
          title: isEditing ? "No se pudo actualizar la unidad" : "No se pudo crear la unidad",
          description: (error as Error).message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar unidad" : "Nueva unidad"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza el nombre, el orden y las reglas de acceso de la unidad."
              : "Crea una nueva unidad para organizar las lecciones de esta asignatura."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unlockPreviousRequired"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-card border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Acceso secuencial</FormLabel>
                    <FormDescription>
                      El alumno debe completar la unidad anterior para desbloquear ésta.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-card border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Gratis</FormLabel>
                    <FormDescription>
                      Incluida en el plan gratuito.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <UIButton type="submit" disabled={isPending}>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditing ? "Guardar cambios" : "Crear unidad"}
              </UIButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lesson form dialog (edit only — creation happens in the unit builder) ──

const lessonFormSchema = insertLessonSchema.pick({
  title: true,
  order: true,
  type: true,
  contentText: true,
  estimatedDurationMinutes: true,
  xpReward: true,
});
type LessonFormInputs = z.infer<typeof lessonFormSchema>;

function LessonFormDialog({
  open,
  onOpenChange,
  lesson,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LessonFormInputs>({
    resolver: zodResolver(lessonFormSchema),
    values: {
      title: lesson?.title ?? "",
      order: lesson?.order ?? 1,
      type: lesson?.type ?? "article",
      contentText: lesson?.contentText ?? "",
      estimatedDurationMinutes: lesson?.estimatedDurationMinutes ?? 5,
      xpReward: lesson?.xpReward ?? 10,
    },
  });

  const onSubmit = (values: LessonFormInputs) => {
    if (!lesson) return;
    startTransition(async () => {
      try {
        await updateLesson(lesson.id, values);
        toast({ title: "Lección actualizada", variant: "primary" });
        onOpenChange(false);
        onSaved();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar la lección",
          description: (error as Error).message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar lección</DialogTitle>
          <DialogDescription>
            Actualiza el título, el orden y el contenido de la lección.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="article">Artículo</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contentText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido (Markdown)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={6} className="font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <UIButton type="submit" disabled={isPending}>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar cambios
              </UIButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Board ───────────────────────────────────────────────────────────────

type LessonWithUnit = Lesson & { unit: Unit };

export function SyllabusBoard({
  subject,
  units,
  lessonsByUnit,
  questionCountByLesson,
}: {
  subject: Subject;
  units: Unit[];
  lessonsByUnit: Record<number, Lesson[]>;
  questionCountByLesson: Record<number, number>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.order - b.order),
    [units]
  );

  const allLessons: LessonWithUnit[] = useMemo(() => {
    const list: LessonWithUnit[] = [];
    for (const unit of sortedUnits) {
      const lessons = lessonsByUnit[unit.id] ?? [];
      for (const lesson of [...lessons].sort((a, b) => a.order - b.order)) {
        list.push({ ...lesson, unit });
      }
    }
    return list;
  }, [sortedUnits, lessonsByUnit]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allLessons.filter((lesson) => {
      if (term && !lesson.title.toLowerCase().includes(term)) return false;
      if (unitFilter !== "all" && String(lesson.unit.id) !== unitFilter) return false;
      const locked = lesson.unit.unlockPreviousRequired;
      if (accessFilter === "free" && locked) return false;
      if (accessFilter === "sequential" && !locked) return false;
      return true;
    });
  }, [allLessons, search, unitFilter, accessFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);

  function resetTo(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function openCreateUnitDialog() {
    setEditingUnit(null);
    setUnitFormOpen(true);
  }

  function openEditUnitDialog(unit: Unit) {
    setEditingUnit(unit);
    setUnitFormOpen(true);
  }

  function handleUnitSaved() {
    router.refresh();
  }

  function confirmDeleteUnit() {
    if (!deletingUnit) return;
    const unit = deletingUnit;
    startTransition(async () => {
      try {
        await deleteUnit(unit.id);
        toast({ title: "Unidad eliminada", variant: "primary" });
        setDeletingUnit(null);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar la unidad",
          description: (error as Error).message,
        });
      }
    });
  }

  function handleLessonSaved() {
    router.refresh();
  }

  function confirmDeleteLesson() {
    if (!deletingLesson) return;
    const lesson = deletingLesson;
    startTransition(async () => {
      try {
        await deleteLesson(lesson.id);
        toast({ title: "Lección eliminada", variant: "primary" });
        setDeletingLesson(null);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar la lección",
          description: (error as Error).message,
        });
      }
    });
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/teach">Asignaturas</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{subject.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={
          <span className="flex items-center gap-3">
            {subject.name}
            <Badge variant={subject.active ? "default" : "secondary"}>
              {subject.active ? "Publicada" : "Borrador"}
            </Badge>
          </span>
        }
        subtitle={`${subject.description ?? ""} · ${units.length} ${
          units.length === 1 ? "unidad" : "unidades"
        } · ${allLessons.length} ${allLessons.length === 1 ? "lección" : "lecciones"}`}
        actions={
          <Button variant="learning" onClick={openCreateUnitDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva unidad
          </Button>
        }
      />

      {/* Units table — order, name, access, gratis, actions */}
      <div className="overflow-hidden rounded-card border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Acceso</TableHead>
              <TableHead className="text-right">Lecciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUnits.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium tabular-nums text-muted-foreground">
                  {unit.order}
                </TableCell>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {unit.unlockPreviousRequired ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                    {unit.unlockPreviousRequired ? "Secuencial" : "Libre"}
                    {unit.isFree && (
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        Gratis
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {(lessonsByUnit[unit.id] ?? []).length}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <UIButton variant="outline" size="sm" asChild className="h-8">
                      <Link href={`/teach/${subject.id}/${unit.id}`}>
                        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                        Abrir builder
                      </Link>
                    </UIButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <UIButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Más acciones de ${unit.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </UIButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openEditUnitDialog(unit)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar unidad
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingUnit(unit)}
                        >
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

        {sortedUnits.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">Aún no hay unidades</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera unidad para empezar a organizar las lecciones.
            </p>
          </div>
        )}
      </div>

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
              {sortedUnits.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
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
              const questionCount = questionCountByLesson[lesson.id] ?? 0;
              const locked = lesson.unit.unlockPreviousRequired;
              return (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium tabular-nums text-muted-foreground">
                    {lesson.order}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{lesson.title}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{lesson.unit.name}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {questionCount === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      questionCount
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
                      {lesson.unit.isFree && (
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                          Gratis
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <UIButton variant="outline" size="sm" asChild className="h-8">
                        <Link href={`/teach/${subject.id}/${lesson.unit.id}`}>
                          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                          Builder
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
                          <DropdownMenuItem onClick={() => setEditingLesson(lesson)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar lección
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingLesson(lesson)}
                          >
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
            <p className="text-sm font-medium">No hay lecciones que coincidan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba a cambiar el término de búsqueda o los filtros aplicados, o abre
              el builder de una unidad para crear su primera lección.
            </p>
          </div>
        )}

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

      <UnitFormDialog
        open={unitFormOpen}
        onOpenChange={setUnitFormOpen}
        subjectId={subject.id}
        unit={editingUnit}
        nextOrder={units.length + 1}
        onSaved={handleUnitSaved}
      />

      <AlertDialog
        open={!!deletingUnit}
        onOpenChange={(open) => {
          if (!open) setDeletingUnit(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar unidad</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar &quot;{deletingUnit?.name}&quot;? Esta acción
              no se puede deshacer y eliminará también sus lecciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteUnit}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LessonFormDialog
        open={!!editingLesson}
        onOpenChange={(open) => {
          if (!open) setEditingLesson(null);
        }}
        lesson={editingLesson}
        onSaved={handleLessonSaved}
      />

      <AlertDialog
        open={!!deletingLesson}
        onOpenChange={(open) => {
          if (!open) setDeletingLesson(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar lección</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar &quot;{deletingLesson?.title}&quot;? Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteLesson}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
