import Link from "next/link";
import {
  Bold,
  Check,
  Eye,
  FileText,
  HelpCircle,
  Italic,
  Link2,
  List,
  Paperclip,
  Plus,
  Trash2,
  UploadCloud,
  X,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const questions = [
  { id: 1, label: "Edad de plena capacidad de obrar", dirty: true },
  { id: 2, label: "Concepto de personalidad jurídica", dirty: false },
  { id: 3, label: "Extinción de la personalidad", dirty: false },
];

const answers = [
  { text: "16 años", correct: false },
  { text: "17 años", correct: false },
  { text: "18 años", correct: true },
  { text: "21 años", correct: false },
];

const lessons = [
  { id: 1, title: "Introducción a la capacidad", order: 1, active: true },
  { id: 2, title: "Capacidad jurídica vs. de obrar", order: 2, active: false },
  { id: 3, title: "Restricciones a la capacidad", order: 3, active: false },
];

const markdownSample = `## Capacidad de obrar

La **capacidad de obrar** es la aptitud para ejercer derechos y
contraer obligaciones por sí mismo.

- Se adquiere con la mayoría de edad (18 años).
- Puede estar limitada judicialmente.

> Ver art. 322 del Código Civil.`;

function ListItem({
  active,
  dirty,
  children,
}: {
  active?: boolean;
  dirty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm " +
        (active
          ? "border-primary/40 bg-primary/10 font-medium text-primary"
          : "border-transparent text-muted-foreground hover:bg-muted")
      }
    >
      <span className="flex-1 truncate">{children}</span>
      {dirty && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-pill bg-brand-warm"
          aria-label="Cambios sin guardar"
        />
      )}
    </div>
  );
}

function MarkdownToolbarButton({
  icon: Icon,
  label,
}: {
  icon: typeof Bold;
  label: string;
}) {
  return (
    <UIButton
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground"
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </UIButton>
  );
}

export default function TeachBuilderPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/wireframes/teach">Asignaturas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/wireframes/teach/derecho-civil">Derecho Civil</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>U2 · Builder</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-display">Unidad 2 · Capacidad jurídica</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            Editor de contenido
            <Badge variant="secondary" className="gap-1 text-brand-warm">
              <span className="h-1.5 w-1.5 rounded-pill bg-brand-warm" />
              Cambios sin guardar
            </Badge>
          </p>
        </div>
      </header>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">
            Preguntas ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="lessons">
            Lecciones ({lessons.length})
          </TabsTrigger>
        </TabsList>

        {/* ---------- Questions: full form ---------- */}
        <TabsContent value="questions" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-2">
              <UIButton
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva pregunta
              </UIButton>
              {questions.map((q, i) => (
                <ListItem key={q.id} active={i === 0} dirty={q.dirty}>
                  {q.label}
                </ListItem>
              ))}
            </aside>

            <section className="space-y-5 rounded-card border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Editar pregunta
                </div>
                <div className="flex items-center gap-2">
                  {/* Difficulty segmented control */}
                  <div className="flex overflow-hidden rounded-lg border text-xs font-medium">
                    <span className="bg-primary px-3 py-1.5 text-primary-foreground">
                      Normal
                    </span>
                    <span className="px-3 py-1.5 text-muted-foreground">
                      Difícil
                    </span>
                  </div>
                  <UIButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label="Eliminar pregunta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </UIButton>
                </div>
              </div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="q-text">Enunciado</Label>
                <Textarea
                  id="q-text"
                  rows={3}
                  defaultValue="¿Qué edad establece el Código Civil para la plena capacidad de obrar?"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Respuestas</Label>
                  <span className="text-xs text-muted-foreground">
                    Marca la(s) correcta(s) · mínimo 2
                  </span>
                </div>
                <div className="space-y-2">
                  {answers.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <UIButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={
                          a.correct
                            ? "Respuesta correcta"
                            : "Marcar como correcta"
                        }
                        className={
                          "h-9 w-9 shrink-0 rounded-lg border " +
                          (a.correct
                            ? "border-brand-success bg-brand-success text-white hover:bg-brand-success/90 hover:text-white"
                            : "border-input text-muted-foreground")
                        }
                      >
                        <Check className="h-4 w-4" />
                      </UIButton>
                      <Input
                        defaultValue={a.text}
                        className={
                          a.correct
                            ? "border-brand-success/40 bg-brand-success/5"
                            : ""
                        }
                      />
                      <UIButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar respuesta"
                        disabled={answers.length <= 2}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </UIButton>
                    </div>
                  ))}
                </div>
                <UIButton type="button" variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir respuesta
                </UIButton>
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-exp">Explicación</Label>
                <Textarea
                  id="q-exp"
                  rows={2}
                  defaultValue="El art. 315 del Código Civil fija la mayoría de edad en los 18 años cumplidos."
                />
                <p className="text-xs text-muted-foreground">
                  Se muestra al estudiante tras responder.
                </p>
              </div>

              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-brand-warm">
                  <span className="h-1.5 w-1.5 rounded-pill bg-brand-warm" />
                  Cambios sin guardar
                </span>
                <div className="flex gap-2">
                  <UIButton variant="ghost" size="sm">
                    Descartar
                  </UIButton>
                  <Button variant="learning">
                    <Check className="mr-2 h-4 w-4" />
                    Guardar pregunta
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ---------- Lessons: full editor (markdown + R2) ---------- */}
        <TabsContent value="lessons" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-2">
              <UIButton
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva lección
              </UIButton>
              {lessons.map((l) => (
                <ListItem key={l.id} active={l.active}>
                  {l.order}. {l.title}
                </ListItem>
              ))}
            </aside>

            <section className="space-y-5 rounded-card border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Editar lección
              </div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="l-title">Título</Label>
                <Input
                  id="l-title"
                  defaultValue="Introducción a la capacidad"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="l-type">Tipo</Label>
                  <Select defaultValue="article">
                    <SelectTrigger id="l-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Artículo (texto)</SelectItem>
                      <SelectItem value="file">Archivo (recurso)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-order">Orden</Label>
                  <Input id="l-order" type="number" defaultValue={1} min={1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-dur">Duración (min)</Label>
                  <Input id="l-dur" type="number" defaultValue={5} min={1} />
                </div>
              </div>

              <div className="space-y-2 sm:max-w-[12rem]">
                <Label htmlFor="l-xp">XP al completar</Label>
                <Input id="l-xp" type="number" defaultValue={10} min={0} />
              </div>

              {/* Markdown editor with preview */}
              <div className="space-y-2">
                <Label>Contenido (Markdown)</Label>
                <div className="overflow-hidden rounded-card border">
                  <div className="flex items-center gap-1 border-b bg-muted/40 px-2 py-1">
                    <MarkdownToolbarButton icon={Bold} label="Negrita" />
                    <MarkdownToolbarButton icon={Italic} label="Cursiva" />
                    <MarkdownToolbarButton icon={List} label="Lista" />
                    <MarkdownToolbarButton icon={Link2} label="Enlace" />
                    <span className="ml-auto inline-flex items-center gap-1 px-2 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      Vista previa en vivo
                    </span>
                  </div>
                  <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                    <Textarea
                      aria-label="Markdown"
                      defaultValue={markdownSample}
                      className="min-h-[220px] resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
                    />
                    <div className="min-h-[220px] space-y-2 p-4 text-sm">
                      <h2 className="text-lg font-bold">Capacidad de obrar</h2>
                      <p className="text-muted-foreground">
                        La <strong className="text-foreground">capacidad
                        de obrar</strong> es la aptitud para ejercer derechos
                        y contraer obligaciones por sí mismo.
                      </p>
                      <ul className="list-inside list-disc text-muted-foreground">
                        <li>Se adquiere con la mayoría de edad (18 años).</li>
                        <li>Puede estar limitada judicialmente.</li>
                      </ul>
                      <blockquote className="border-l-2 border-primary pl-3 text-muted-foreground">
                        Ver art. 322 del Código Civil.
                      </blockquote>
                    </div>
                  </div>
                </div>
              </div>

              {/* R2 upload affordance */}
              <div className="space-y-2">
                <Label>Recursos adjuntos</Label>
                <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed bg-muted/20 px-6 py-8 text-center">
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm">
                    Arrastra un archivo o súbelo a almacenamiento
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, PPTX, imágenes · sube directo a R2 (URL
                    prefirmada)
                  </p>
                  <UIButton variant="outline" size="sm" className="mt-1">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Subir archivo
                  </UIButton>
                </div>
                {/* Already-attached resource (uploaded state) */}
                <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      apuntes-capacidad.pdf
                    </p>
                    <p className="text-xs text-muted-foreground">
                      1.2 MB · subido a R2
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1 text-brand-success">
                    <Check className="h-3 w-3" />
                    Listo
                  </Badge>
                  <UIButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Quitar recurso"
                  >
                    <X className="h-4 w-4" />
                  </UIButton>
                </div>
              </div>

              <Separator />
              <div className="flex items-center justify-end gap-2">
                <UIButton variant="ghost" size="sm">
                  Cancelar
                </UIButton>
                <Button variant="learning">
                  <Check className="mr-2 h-4 w-4" />
                  Guardar lección
                </Button>
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
