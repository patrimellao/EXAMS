'use client';

/**
 * Insert / edit dialog for Mermaid diagram blocks. Two authoring tiers:
 *   - "Formulario": an indentable outline of labelled nodes; generates Mermaid for
 *     the common esquema shapes (tree, flow, steps) without the teacher writing syntax.
 *   - "Avanzado": the raw Mermaid source, for anything the form can't express.
 * Both feed a single `code` string (the diagram source) with a live preview.
 * Editing an existing diagram opens on the raw tab, since arbitrary Mermaid can't be
 * reliably parsed back into the outline.
 */
import * as React from 'react';
import { Workflow, Plus, Trash2, IndentIncrease, IndentDecrease, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MermaidDiagram } from '@/components/lesson/MermaidDiagram';
import { cn } from '@/lib/utils';

type Shape = 'tree' | 'flow' | 'steps';
type Row = { id: string; label: string; indent: number };

const SHAPES: { value: Shape; label: string; hint: string }[] = [
  { value: 'tree', label: 'Jerarquía', hint: 'Árbol de arriba a abajo' },
  { value: 'flow', label: 'Flujo', hint: 'Ramas de izquierda a derecha' },
  { value: 'steps', label: 'Pasos', hint: 'Secuencia lineal' },
];

// Monotonic row ids — stable keys for @dnd-kit sortable across reorders/edits.
let rowSeq = 0;
const makeRow = (label: string, indent: number): Row => ({ id: `row-${rowSeq++}`, label, indent });
const makeStarterRows = (): Row[] => [
  makeRow('Concepto principal', 0),
  makeRow('Subapartado 1', 1),
  makeRow('Subapartado 2', 1),
];

// Mermaid labels go inside "..."; swap any double quotes for single to avoid breaking it.
const escapeLabel = (s: string) => (s.trim() || '…').replace(/"/g, "'");

export function outlineToMermaid(shape: Shape, rows: Row[]): string {
  const clean = rows.filter((r) => r.label.trim().length > 0);
  if (clean.length === 0) return '';
  const id = (i: number) => `n${i}`;
  const node = (i: number) => `${id(i)}["${escapeLabel(clean[i].label)}"]`;

  if (shape === 'steps') {
    if (clean.length === 1) return `graph LR\n  ${node(0)}`;
    const edges = clean.slice(1).map((_, i) => `  ${node(i)} --> ${node(i + 1)}`);
    return ['graph LR', ...edges].join('\n');
  }

  const dir = shape === 'flow' ? 'LR' : 'TD';
  const lines: string[] = [`graph ${dir}`];
  const stack: { indent: number; idx: number }[] = [];
  clean.forEach((row, i) => {
    while (stack.length && stack[stack.length - 1].indent >= row.indent) stack.pop();
    const parent = stack.length ? stack[stack.length - 1].idx : null;
    lines.push(parent === null ? `  ${node(i)}` : `  ${node(parent)} --> ${node(i)}`);
    stack.push({ indent: row.indent, idx: i });
  });
  return lines.join('\n');
}

/** A single draggable node row in the form builder. */
function SortableRow({
  row,
  index,
  shape,
  canIndentMore,
  canRemove,
  onLabel,
  onIndent,
  onRemove,
}: {
  row: Row;
  index: number;
  shape: Shape;
  canIndentMore: boolean;
  canRemove: boolean;
  onLabel: (value: string) => void;
  onIndent: (delta: number) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1.5 rounded-md bg-background',
        isDragging && 'relative z-10 shadow-md ring-1 ring-brand-primary/40',
      )}
    >
      <button
        type="button"
        aria-label="Reordenar nodo"
        className="shrink-0 cursor-grab touch-none rounded-md border p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      {shape !== 'steps' && (
        <div className="flex shrink-0">
          <button
            type="button"
            aria-label="Reducir sangría"
            onClick={() => onIndent(-1)}
            disabled={row.indent === 0}
            className="rounded-l-md border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <IndentDecrease className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Aumentar sangría"
            onClick={() => onIndent(1)}
            disabled={!canIndentMore}
            className="rounded-r-md border border-l-0 p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <IndentIncrease className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <Input
        value={row.label}
        onChange={(e) => onLabel(e.target.value)}
        placeholder={`Nodo ${index + 1}`}
        style={shape !== 'steps' ? { marginLeft: row.indent * 16 } : undefined}
        className="h-9"
      />
      <button
        type="button"
        aria-label="Eliminar nodo"
        onClick={onRemove}
        disabled={!canRemove}
        className="shrink-0 rounded-md border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function DiagramDialog({
  open,
  mode,
  initialCode,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: 'insert' | 'edit';
  initialCode: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => void;
}) {
  const [tab, setTab] = React.useState<'form' | 'code'>('form');
  const [shape, setShape] = React.useState<Shape>('tree');
  const [rows, setRows] = React.useState<Row[]>(makeStarterRows);
  const [code, setCode] = React.useState('');

  // Reset to a clean state whenever the dialog opens. Editing starts on the raw
  // tab (we can't round-trip arbitrary Mermaid back into the outline); inserting
  // starts on the form with starter rows.
  React.useEffect(() => {
    if (!open) return;
    if (mode === 'edit') {
      setTab('code');
      setCode(initialCode);
    } else {
      const starter = makeStarterRows();
      setTab('form');
      setShape('tree');
      setRows(starter);
      setCode(outlineToMermaid('tree', starter));
    }
  }, [open, mode, initialCode]);

  // Keep `code` in sync while editing the form.
  const syncFromForm = (nextShape: Shape, nextRows: Row[]) => {
    setShape(nextShape);
    setRows(nextRows);
    setCode(outlineToMermaid(nextShape, nextRows));
  };

  const updateRow = (i: number, patch: Partial<Row>) =>
    syncFromForm(shape, rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const indentRow = (i: number, delta: number) =>
    updateRow(i, { indent: Math.max(0, Math.min(rows[i].indent + delta, (rows[i - 1]?.indent ?? -1) + 1)) });
  const removeRow = (i: number) => syncFromForm(shape, rows.filter((_, idx) => idx !== i));
  const addRow = () =>
    syncFromForm(shape, [...rows, makeRow('', rows[rows.length - 1]?.indent ?? 0)]);

  // Drag-to-reorder (vertical only). Nesting stays on the indent buttons.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((r) => r.id === active.id);
    const to = rows.findIndex((r) => r.id === over.id);
    if (from === -1 || to === -1) return;
    syncFromForm(shape, arrayMove(rows, from, to));
  };

  const canSubmit = code.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-card">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Workflow className="h-4 w-4 text-brand-primary" />
            {mode === 'edit' ? 'Editar diagrama' : 'Insertar diagrama'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Crea un esquema con el formulario o escribe el código Mermaid directamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 p-5 md:grid-cols-[1fr_minmax(0,360px)]">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'form' | 'code')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Formulario</TabsTrigger>
              <TabsTrigger value="code">Avanzado</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de esquema</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SHAPES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => syncFromForm(s.value, rows)}
                      className={cn(
                        'rounded-md border px-2 py-2 text-left transition',
                        shape === s.value
                          ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      <div className="text-xs font-semibold text-foreground">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">{s.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nodos</Label>
                <p className="text-[11px] text-muted-foreground">
                  Arrastra <GripVertical className="inline h-3 w-3 align-text-bottom" /> para
                  reordenar.{' '}
                  {shape === 'steps'
                    ? 'Cada nodo se conecta con el siguiente en orden.'
                    : 'Usa la sangría para anidar un nodo bajo el anterior.'}
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={rows.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {rows.map((row, i) => (
                        <SortableRow
                          key={row.id}
                          row={row}
                          index={i}
                          shape={shape}
                          canIndentMore={i > 0 && row.indent <= (rows[i - 1]?.indent ?? -1)}
                          canRemove={rows.length > 1}
                          onLabel={(v) => updateRow(i, { label: v })}
                          onIndent={(d) => indentRow(i, d)}
                          onRemove={() => removeRow(i)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-1 gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Añadir nodo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-2 pt-4">
              <Label htmlFor="mermaid-source" className="text-xs font-semibold">
                Código Mermaid
              </Label>
              <Textarea
                id="mermaid-source"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                rows={12}
                className="font-mono text-xs leading-relaxed"
                placeholder={'graph TD\n  A[Inicio] --> B[Fin]'}
              />
              <p className="text-[11px] text-muted-foreground">
                Sintaxis de{' '}
                <a
                  href="https://mermaid.js.org/intro/syntax-reference.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-primary underline underline-offset-2"
                >
                  Mermaid
                </a>
                . Editar aquí no modifica el formulario.
              </p>
            </TabsContent>
          </Tabs>

          {/* Live preview */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Vista previa</Label>
            <div className="rounded-card border bg-muted/30 p-2">
              <MermaidDiagram code={code} className="my-0 border-0 bg-transparent p-0 shadow-none" />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => onSubmit(code.trim())}>
            {mode === 'edit' ? 'Guardar cambios' : 'Insertar diagrama'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
