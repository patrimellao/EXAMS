"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Layers, LoaderCircle, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/game/Button";
import { Button as UIButton } from "@/components/ui/button";
import { PageHeader } from "@/components/teach/PageHeader";
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
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertSubjectSchema, type Subject } from "@/schemas/subjects";
import { addSubject, updateSubject, activateSubject, deleteSubject } from "@/controllers/subjects";

export type SubjectWithUnitCount = Subject & { unitsCount: number };

const subjectFormSchema = insertSubjectSchema.pick({ name: true, description: true });
type SubjectFormInputs = z.infer<typeof subjectFormSchema>;

function EmptyState({ onCreate }: { onCreate: () => void }) {
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
      <Button variant="learning" className="mt-5" onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva asignatura
      </Button>
    </div>
  );
}

function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null;
  onSaved: () => void;
}) {
  const isEditing = !!subject;
  const [isPending, startTransition] = useTransition();

  const form = useForm<SubjectFormInputs>({
    resolver: zodResolver(subjectFormSchema),
    values: {
      name: subject?.name ?? "",
      description: subject?.description ?? "",
    },
  });

  const onSubmit = (values: SubjectFormInputs) => {
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateSubject(subject.id, values);
          toast({ title: "Asignatura actualizada", variant: "primary" });
        } else {
          await addSubject(values);
          toast({ title: "Asignatura creada", variant: "primary" });
        }
        onOpenChange(false);
        form.reset({ name: "", description: "" });
        onSaved();
      } catch (error) {
        toast({
          variant: "destructive",
          title: isEditing ? "No se pudo actualizar la asignatura" : "No se pudo crear la asignatura",
          description: (error as Error).message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar asignatura" : "Nueva asignatura"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza el nombre y la descripción de la asignatura."
              : "Crea una nueva asignatura para organizar unidades, preguntas y lecciones."}
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
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <UIButton type="submit" disabled={isPending}>
                {isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isEditing ? "Guardar cambios" : "Crear asignatura"}
              </UIButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function SubjectsBoard({ subjects }: { subjects: SubjectWithUnitCount[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [, startTransition] = useTransition();

  function openCreateDialog() {
    setEditingSubject(null);
    setFormOpen(true);
  }

  function openEditDialog(subject: Subject) {
    setEditingSubject(subject);
    setFormOpen(true);
  }

  function handleSaved() {
    router.refresh();
  }

  function togglePublish(subject: Subject) {
    startTransition(async () => {
      try {
        if (subject.active) {
          await updateSubject(subject.id, {
            name: subject.name,
            description: subject.description,
            active: false,
          });
          toast({ title: "Asignatura pasada a borrador", variant: "primary" });
        } else {
          await activateSubject(subject.id);
          toast({ title: "Asignatura publicada", variant: "primary" });
        }
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo cambiar el estado de la asignatura",
          description: (error as Error).message,
        });
      }
    });
  }

  function confirmDelete() {
    if (!deletingSubject) return;
    const subject = deletingSubject;
    startTransition(async () => {
      try {
        await deleteSubject(subject.id);
        toast({ title: "Asignatura eliminada", variant: "primary" });
        setDeletingSubject(null);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar la asignatura",
          description: (error as Error).message,
        });
      }
    });
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Asignaturas"
        subtitle={`${subjects.length} asignaturas · ${
          subjects.filter((s) => s.active).length
        } publicadas`}
        actions={
          <Button variant="learning" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva asignatura
          </Button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState onCreate={openCreateDialog} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <article className="flex h-full flex-col rounded-card border bg-card p-5 shadow-card transition-shadow duration-normal ease-out hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-card bg-muted text-muted-foreground">
                    <BookOpen className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.active ? "default" : "secondary"}>
                      {s.active ? "Publicada" : "Borrador"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <UIButton
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Más acciones de ${s.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </UIButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEditDialog(s)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(s)}>
                          {s.active ? "Pasar a borrador" : "Publicar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingSubject(s)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <Link
                  href={`/teach/${s.id}`}
                  className="mt-4 block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
                >
                  <h2 className="text-lg font-bold tracking-tight">{s.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </Link>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {s.unitsCount} {s.unitsCount === 1 ? "unidad" : "unidades"}
                  </span>
                  <Link
                    href={`/teach/${s.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Editar contenido →
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subject={editingSubject}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={!!deletingSubject}
        onOpenChange={(open) => {
          if (!open) setDeletingSubject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar asignatura</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar &quot;{deletingSubject?.name}&quot;? Esta
              acción no se puede deshacer y eliminará también sus unidades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
