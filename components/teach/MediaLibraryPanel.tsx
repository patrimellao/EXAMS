"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Download,
  FileText,
  Film,
  Grid3x3,
  Images,
  Image as ImageIcon,
  LayoutList,
  Link2,
  Paperclip,
  Pencil,
  Replace,
  Search,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button as UIButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type AssetType = "image" | "pdf" | "video" | "doc";

export type AssetUsage = {
  subjectId: string;
  subjectName: string;
  unit: number;
  lesson: string;
};

export type MediaAsset = {
  id: string;
  name: string;
  type: AssetType;
  size: string;
  subjects: string[];
  usage: AssetUsage[];
  alt?: string;
  description?: string;
  uploadedAt: string;
  r2Key: string;
  thumbBg?: string;
};

export const ALL_SUBJECTS = [
  { id: "civil", name: "Derecho Civil" },
  { id: "constitucional", name: "Derecho Constitucional" },
  { id: "penal", name: "Derecho Penal" },
];

export const MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "a1",
    name: "apuntes-capacidad.pdf",
    type: "pdf",
    size: "1.2 MB",
    subjects: ["civil"],
    usage: [{ subjectId: "civil", subjectName: "Derecho Civil", unit: 2, lesson: "Introducción a la capacidad" }],
    description: "Apuntes maquetados para la Unidad 2 de Civil. Repasa capacidad jurídica vs. capacidad de obrar.",
    uploadedAt: "2026-05-12",
    r2Key: "civil/u2/apuntes-capacidad.pdf",
  },
  {
    id: "a2",
    name: "civil-portada.jpg",
    type: "image",
    size: "240 KB",
    subjects: ["civil"],
    usage: [{ subjectId: "civil", subjectName: "Derecho Civil", unit: 1, lesson: "Bienvenida" }],
    alt: "Mazo de juez sobre un código civil abierto",
    uploadedAt: "2026-05-10",
    r2Key: "civil/portada.jpg",
    thumbBg: "bg-grad-warm",
  },
  {
    id: "a3",
    name: "video-emancipacion.mp4",
    type: "video",
    size: "18.4 MB",
    subjects: ["civil"],
    usage: [{ subjectId: "civil", subjectName: "Derecho Civil", unit: 2, lesson: "Capacidad jurídica vs. de obrar" }],
    description: "Explicación visual de los supuestos de emancipación (concesión paterna, judicial, matrimonial).",
    uploadedAt: "2026-05-11",
    r2Key: "civil/u2/video-emancipacion.mp4",
  },
  {
    id: "a4",
    name: "esquema-personalidad.png",
    type: "image",
    size: "88 KB",
    subjects: ["civil", "penal"],
    usage: [
      { subjectId: "civil", subjectName: "Derecho Civil", unit: 2, lesson: "Personalidad jurídica" },
      { subjectId: "penal", subjectName: "Derecho Penal", unit: 1, lesson: "El sujeto del delito" },
    ],
    alt: "Esquema de los tres planos de la personalidad jurídica",
    uploadedAt: "2026-05-08",
    r2Key: "shared/esquema-personalidad.png",
    thumbBg: "bg-grad-trust",
  },
  {
    id: "a5",
    name: "casos-practicos.docx",
    type: "doc",
    size: "320 KB",
    subjects: ["civil"],
    usage: [],
    uploadedAt: "2026-05-14",
    r2Key: "civil/casos-practicos.docx",
  },
  {
    id: "a6",
    name: "tribunal-supremo.jpg",
    type: "image",
    size: "412 KB",
    subjects: ["constitucional"],
    usage: [{ subjectId: "constitucional", subjectName: "Derecho Constitucional", unit: 3, lesson: "El TC y el TS" }],
    alt: "Fachada del Tribunal Supremo, Madrid",
    uploadedAt: "2026-04-29",
    r2Key: "constitucional/u3/tribunal-supremo.jpg",
    thumbBg: "bg-grad-brand",
  },
  {
    id: "a7",
    name: "constitucion-anotada.pdf",
    type: "pdf",
    size: "2.8 MB",
    subjects: ["constitucional"],
    usage: [
      { subjectId: "constitucional", subjectName: "Derecho Constitucional", unit: 1, lesson: "Preámbulo y Título I" },
      { subjectId: "constitucional", subjectName: "Derecho Constitucional", unit: 2, lesson: "Derechos fundamentales" },
    ],
    uploadedAt: "2026-04-22",
    r2Key: "constitucional/constitucion-anotada.pdf",
  },
  {
    id: "a8",
    name: "intro-constitucional.mp4",
    type: "video",
    size: "24.1 MB",
    subjects: ["constitucional"],
    usage: [{ subjectId: "constitucional", subjectName: "Derecho Constitucional", unit: 1, lesson: "Bienvenida" }],
    uploadedAt: "2026-04-22",
    r2Key: "constitucional/u1/intro.mp4",
  },
  {
    id: "a9",
    name: "tipos-penales.pdf",
    type: "pdf",
    size: "980 KB",
    subjects: ["penal"],
    usage: [],
    uploadedAt: "2026-05-15",
    r2Key: "penal/tipos-penales.pdf",
  },
  {
    id: "a10",
    name: "linea-temporal-constitucion.png",
    type: "image",
    size: "156 KB",
    subjects: ["constitucional", "civil"],
    usage: [],
    alt: "Línea temporal de las constituciones españolas, 1812–1978",
    uploadedAt: "2026-05-02",
    r2Key: "shared/linea-temporal-constitucion.png",
    thumbBg: "bg-grad-warm",
  },
  {
    id: "a11",
    name: "leyes-procesales.pdf",
    type: "pdf",
    size: "4.1 MB",
    subjects: [],
    usage: [],
    uploadedAt: "2026-05-18",
    r2Key: "unsorted/leyes-procesales.pdf",
  },
  {
    id: "a12",
    name: "logo-temario.svg",
    type: "image",
    size: "12 KB",
    subjects: [],
    usage: [],
    alt: "Logotipo del temario, monograma TF en slate",
    uploadedAt: "2026-05-18",
    r2Key: "unsorted/logo-temario.svg",
    thumbBg: "bg-grad-brand",
  },
];

const TYPE_FILTERS: { id: AssetType | "all"; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "image", label: "Imágenes" },
  { id: "pdf", label: "PDF" },
  { id: "video", label: "Vídeo" },
  { id: "doc", label: "Documentos" },
];

function FileTypeIcon({ type, className }: { type: AssetType; className?: string }) {
  const Cmp = type === "image" ? ImageIcon : type === "video" ? Film : FileText;
  return <Cmp className={className} />;
}

export function AssetThumb({
  asset,
  size = "md",
}: {
  asset: MediaAsset;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-4 w-4" : "h-6 w-6";
  if (asset.type === "image") {
    return (
      <div className={cn("absolute inset-0", asset.thumbBg ?? "bg-grad-trust")}>
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          <ImageIcon className={iconSize} strokeWidth={1.5} />
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
      <FileTypeIcon type={asset.type} className={iconSize} />
      <span className="text-[10px] font-bold uppercase tracking-wide">
        {asset.type === "pdf" ? "PDF" : asset.type === "video" ? "MP4" : "DOC"}
      </span>
    </div>
  );
}

function subjectName(id: string) {
  return ALL_SUBJECTS.find((s) => s.id === id)?.name ?? id;
}

export type MediaPanelMode = "library" | "picker-insert" | "picker-resource";

export type MediaLibraryPanelProps = {
  mode?: MediaPanelMode;
  initialTypeFilter?: AssetType | "all";
  initialSubjectFilter?: string;
  onInsert?: (asset: MediaAsset) => void;
  onAttach?: (asset: MediaAsset) => void;
  /** Override the CTA label for picker-insert mode. */
  insertLabel?: string;
  /** When true, hides the page-level header (used inside Dialog). */
  embedded?: boolean;
};

export function MediaLibraryPanel({
  mode = "library",
  initialTypeFilter = "all",
  initialSubjectFilter = "all",
  onInsert,
  onAttach,
  insertLabel,
  embedded = false,
}: MediaLibraryPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    mode === "library" ? "a4" : null,
  );
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">(initialTypeFilter);
  const [subjectFilter, setSubjectFilter] = useState<string>(initialSubjectFilter);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dropzoneOpen, setDropzoneOpen] = useState(false);

  const filtered = useMemo(() => {
    return MEDIA_ASSETS.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (subjectFilter === "untagged" && a.subjects.length > 0) return false;
      if (
        subjectFilter !== "all" &&
        subjectFilter !== "untagged" &&
        !a.subjects.includes(subjectFilter)
      ) {
        return false;
      }
      if (search) {
        const haystack = (
          a.name +
          " " +
          (a.alt ?? "") +
          " " +
          (a.description ?? "")
        ).toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [typeFilter, subjectFilter, search]);

  const selected = MEDIA_ASSETS.find((a) => a.id === selectedId) ?? null;

  const isPicker = mode !== "library";

  return (
    <div className={cn("space-y-5", embedded ? "" : "mx-auto max-w-5xl")}>
      {!embedded && (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-display">Media</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {MEDIA_ASSETS.length} archivos · biblioteca global, etiquetada por asignatura
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={() => setDropzoneOpen((d) => !d)}
              className="h-10"
            >
              <UploadCloud className="mr-1.5 h-4 w-4" />
              {dropzoneOpen ? "Cerrar zona de subida" : "Subir archivos"}
            </UIButton>
          </div>
        </header>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, alt o descripción…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {TYPE_FILTERS.map((f) => {
              const active = typeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeFilter(f.id)}
                  className={cn(
                    "rounded-pill px-3 py-1 text-xs font-semibold transition-colors duration-fast focus-ring",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          {!isPicker && (
            <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Vista en cuadrícula"
                className={cn(
                  "rounded-md px-2 py-1 transition-colors duration-fast",
                  view === "grid"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="Vista en lista"
                className={cn(
                  "rounded-md px-2 py-1 transition-colors duration-fast",
                  view === "list"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subject tag filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Asignatura
        </span>
        {[
          { id: "all", label: "Todas" },
          ...ALL_SUBJECTS.map((s) => ({ id: s.id, label: s.name })),
          { id: "untagged", label: "Sin asignatura" },
        ].map((s) => {
          const active = subjectFilter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubjectFilter(s.id)}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-medium transition-colors duration-fast focus-ring",
                active
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {!isPicker && dropzoneOpen && (
        <div className="rounded-card border-2 border-dashed bg-muted/20 px-6 py-8 text-center animate-in fade-in duration-200">
          <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground/70" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Arrastra archivos aquí o haz clic para seleccionarlos
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF · DOCX · MP4 · JPG · PNG · SVG — hasta 50 MB por archivo
          </p>
          <UIButton variant="outline" size="sm" className="mt-4 h-9">
            <Upload className="mr-1.5 h-4 w-4" />
            Seleccionar archivos
          </UIButton>
        </div>
      )}

      {/* Body */}
      <div
        className={cn(
          "grid gap-6 transition-all duration-normal",
          selected ? "lg:grid-cols-[1fr_340px]" : "lg:grid-cols-1",
        )}
      >
        <section className="min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-card border border-dashed bg-card px-6 py-16 text-center">
              <Images className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 text-base font-bold tracking-tight">
                No hay resultados
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Ajusta los filtros{!isPicker && " o sube un archivo nuevo"}.
              </p>
            </div>
          ) : view === "grid" ? (
            <ul
              className={cn(
                "grid gap-3",
                isPicker
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              )}
            >
              {filtered.map((a) => {
                const isSelected = a.id === selectedId;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedId(a.id === selectedId ? null : a.id)
                      }
                      className="group block w-full rounded-card text-left focus-ring"
                    >
                      <div
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-card border transition-shadow duration-normal",
                          isSelected
                            ? "ring-2 ring-brand-primary ring-offset-2 shadow-card-hover"
                            : "shadow-card group-hover:shadow-card-hover",
                        )}
                      >
                        <AssetThumb asset={a} />
                        {a.usage.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="absolute right-2 top-2 gap-1 bg-background/90 text-[10px] font-semibold backdrop-blur-sm"
                          >
                            <Link2 className="h-3 w-3" />
                            {a.usage.length}
                          </Badge>
                        )}
                        {isSelected && (
                          <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-pill bg-brand-primary text-white shadow-card">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 px-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.size} ·{" "}
                          {a.subjects.length === 0
                            ? "sin asignatura"
                            : a.subjects.length === 1
                              ? subjectName(a.subjects[0])
                              : `${a.subjects.length} asignaturas`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-card border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-12 px-3 py-2 text-left"></th>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Asignatura</th>
                    <th className="px-3 py-2 text-right">Tamaño</th>
                    <th className="px-3 py-2 text-right">Usado en</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const isSelected = a.id === selectedId;
                    return (
                      <tr
                        key={a.id}
                        onClick={() =>
                          setSelectedId(a.id === selectedId ? null : a.id)
                        }
                        className={cn(
                          "cursor-pointer border-t transition-colors duration-fast hover:bg-muted/30",
                          isSelected && "bg-brand-primary/5",
                        )}
                      >
                        <td className="px-3 py-2">
                          <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                            <AssetThumb asset={a} size="sm" />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="truncate font-medium">{a.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Subido {a.uploadedAt}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          {a.subjects.length === 0 ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Sin asignatura
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {a.subjects.map((s) => (
                                <Badge
                                  key={s}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {subjectName(s)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {a.size}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {a.usage.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium">
                              <Link2 className="h-3 w-3 text-muted-foreground" />
                              {a.usage.length}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <UIButton
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Descargar"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </UIButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <aside className="lg:sticky lg:top-6 lg:self-start animate-in slide-in-from-right-2 duration-200">
            <div className="rounded-card border bg-card shadow-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Detalles del archivo
                </p>
                <UIButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedId(null)}
                  className="h-7 w-7"
                  aria-label="Cerrar panel"
                >
                  <X className="h-4 w-4" />
                </UIButton>
              </div>

              <div className="space-y-4 p-4">
                <div className="relative aspect-video overflow-hidden rounded-card border">
                  <AssetThumb asset={selected} size="lg" />
                </div>

                {isPicker ? (
                  <>
                    <div>
                      <p className="text-sm font-bold tracking-tight">
                        {selected.name}
                      </p>
                      {selected.alt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {selected.alt}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="m-title" className="text-xs font-semibold">
                        Nombre
                      </Label>
                      <Input
                        id="m-title"
                        defaultValue={selected.name}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="m-alt" className="text-xs font-semibold">
                        Texto alternativo
                        <span className="ml-1 font-normal text-muted-foreground">
                          (accesibilidad)
                        </span>
                      </Label>
                      <Input
                        id="m-alt"
                        defaultValue={selected.alt ?? ""}
                        placeholder="Describe brevemente la imagen…"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="m-desc" className="text-xs font-semibold">
                        Descripción
                      </Label>
                      <Textarea
                        id="m-desc"
                        defaultValue={selected.description ?? ""}
                        rows={2}
                        placeholder="Notas internas, contexto, autoría…"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Etiquetas de asignatura
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_SUBJECTS.map((s) => {
                          const active = selected.subjects.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              className={cn(
                                "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[11px] font-medium transition-colors duration-fast focus-ring",
                                active
                                  ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
                                  : "border-input bg-card text-muted-foreground hover:bg-muted/40",
                              )}
                            >
                              {active && <Check className="h-3 w-3" />}
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <dl className="grid grid-cols-2 gap-y-2 text-[11px]">
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="text-right font-medium uppercase tracking-wide">
                    {selected.type}
                  </dd>
                  <dt className="text-muted-foreground">Tamaño</dt>
                  <dd className="text-right tabular-nums">{selected.size}</dd>
                  <dt className="text-muted-foreground">Subido</dt>
                  <dd className="text-right">{selected.uploadedAt}</dd>
                  <dt className="text-muted-foreground">R2</dt>
                  <dd className="truncate text-right font-mono text-[10px] text-muted-foreground">
                    {selected.r2Key}
                  </dd>
                </dl>

                {!isPicker && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">
                        Usado en{" "}
                        <span className="text-muted-foreground">
                          ({selected.usage.length})
                        </span>
                      </p>
                      {selected.usage.length === 0 ? (
                        <p className="rounded-md border border-dashed px-3 py-2 text-center text-[11px] text-muted-foreground">
                          Aún no se ha usado en ninguna lección.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {selected.usage.map((u, i) => (
                            <li
                              key={i}
                              className="rounded-md border bg-muted/30 px-2.5 py-1.5 text-[11px]"
                            >
                              <p className="font-medium text-foreground">
                                {u.subjectName} · U{u.unit}
                              </p>
                              <p className="text-muted-foreground">{u.lesson}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {mode === "library" && (
                  <div className="flex flex-col gap-1.5">
                    <UIButton variant="outline" size="sm" className="h-9 justify-start">
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Editar metadatos
                    </UIButton>
                    <UIButton variant="outline" size="sm" className="h-9 justify-start">
                      <Replace className="mr-2 h-3.5 w-3.5" />
                      Reemplazar archivo
                    </UIButton>
                    <UIButton variant="outline" size="sm" className="h-9 justify-start">
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Descargar
                    </UIButton>
                    <UIButton
                      variant="ghost"
                      size="sm"
                      disabled={selected.usage.length > 0}
                      title={
                        selected.usage.length > 0
                          ? "Quita el archivo de las lecciones antes de eliminarlo."
                          : undefined
                      }
                      className="h-9 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Eliminar archivo
                    </UIButton>
                  </div>
                )}

                {mode === "picker-insert" && (
                  <UIButton
                    onClick={() => onInsert?.(selected)}
                    className="h-10 w-full"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {insertLabel ?? "Insertar en texto"}
                  </UIButton>
                )}

                {mode === "picker-resource" && (
                  <UIButton
                    onClick={() => onAttach?.(selected)}
                    className="h-10 w-full"
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Adjuntar como recurso
                  </UIButton>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/** Returns the markdown snippet that should be inserted into the lesson body. */
export function formatAssetInsert(asset: MediaAsset): string {
  const url = `storage.r2/${asset.r2Key}`;
  if (asset.type === "video") {
    const label = asset.alt || asset.description || "Vídeo de la lección";
    return `\n<Video url="${url}" label="${label}" />\n`;
  }
  if (asset.type === "image") {
    const alt = asset.alt || asset.name;
    return `\n![${alt}](${url})\n`;
  }
  const label = asset.alt || asset.name;
  return `[${label}](${url})`;
}
