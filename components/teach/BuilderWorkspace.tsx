"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LessonPreview } from "@/components/teach/lesson-editor/LessonPreview";
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
  Library,
  Image as ImageIcon,
  Palette,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
  Settings,
  BookOpen,
  Layout,
  Sparkles,
  EyeOff,
  Video,
  FileCode,
  CheckSquare,
  AlertCircle,
  Save,
  ChevronRight,
  FlipHorizontal,
  Laptop,
  Target,
  Lightbulb,
  Play,
  Download,
  BookmarkPlus,
  Printer,
  ArrowLeft,
  MessageSquareQuote,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/game/Button";
import { Button as UIButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  MediaLibraryPanel,
  formatAssetInsert,
  type AssetType as MediaAssetType,
  type MediaAsset,
} from "@/components/teach/MediaLibraryPanel";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/teach/PageHeader";
import { LessonHistorySheet } from "@/components/teach/LessonHistorySheet";
import {
  LessonPlateEditor,
  type QuoteCapture,
} from "@/components/teach/lesson-editor/LessonPlateEditor";
import {
  QuoteSentence,
  LessonQuoteCard,
} from "@/components/lesson/quote-reference";

// Initial questions data with deep integration
const initialQuestions = [
  {
    id: 1,
    label: "Edad de plena capacidad de obrar",
    dirty: false,
    text: "¿Qué edad establece el Código Civil para la plena capacidad de obrar?",
    difficulty: "normal",
    lessonId: 1,
    lessonRef: {
      section: "Capacidad de obrar",
      quote: "aptitud para realizar válidamente actos jurídicos",
      // Full line the fragment was lifted from, so the box can highlight the
      // fragment in context. Falls back to `quote` when absent.
      sentence:
        "La capacidad de obrar es la aptitud para realizar válidamente actos jurídicos por sí mismo.",
      color: "234, 161, 70",
    } as { section: string; quote: string; color: string; sentence?: string } | null,
    explanation: "El art. 315 del Código Civil fija la mayoría de edad en los 18 años cumplidos.",
    answers: [
      { text: "16 años", correct: false },
      { text: "17 años", correct: false },
      { text: "18 años", correct: true },
      { text: "21 años", correct: false },
    ],
  },
  {
    id: 2,
    label: "Concepto de personalidad jurídica",
    dirty: false,
    text: "¿Cuándo se adquiere la personalidad jurídica de las personas físicas según el Código Civil?",
    difficulty: "normal",
    lessonId: 2,
    lessonRef: null,
    explanation: "El nacimiento determina la personalidad jurídica (art. 29 CC), con los requisitos del art. 30 CC.",
    answers: [
      { text: "Desde la concepción", correct: false },
      { text: "Desde el nacimiento con vida, una vez desprendido enteramente del seno materno", correct: true },
      { text: "A las 24 horas del nacimiento con vida", correct: false },
      { text: "Con la mayoría de edad", correct: false },
    ],
  },
  {
    id: 3,
    label: "Extinción de la personalidad",
    dirty: false,
    text: "¿Por qué causa se extingue la personalidad jurídica de las personas físicas?",
    difficulty: "difícil",
    lessonId: 2,
    lessonRef: {
      section: "1. Capacidad Jurídica",
      quote: "Aptitud para ser titular de derechos y obligaciones.",
      color: "34, 197, 94",
    },
    explanation: "El art. 32 del Código Civil establece de forma inequívoca que la personalidad civil se extingue por la muerte de las personas.",
    answers: [
      { text: "Por la declaración de prodigalidad", correct: false },
      { text: "Por la muerte de las personas", correct: true },
      { text: "Por la incapacitación judicial firme", correct: false },
      { text: "Por la pérdida de la nacionalidad española", correct: false },
    ],
  },
];

// Initial lessons data
const initialLessons = [
  {
    id: 1,
    title: "Introducción a la capacidad",
    subtitle: "Qué es, cómo se adquiere y por qué importa para los actos jurídicos del día a día.",
    hero: {
      type: "gradient" as "gradient" | "solid" | "image" | "image-gradient",
      gradient: "warm" as "warm" | "trust" | "brand",
      color: "brand-warm",
      image: { url: "", alt: "" },
    },
    order: 1,
    duration: 5,
    xp: 10,
    type: "article",
    content: `## Capacidad de obrar

La **capacidad de obrar** es la aptitud para realizar válidamente actos jurídicos por sí mismo.

- Se adquiere con la mayoría de edad (18 años).
- Puede estar limitada judicialmente.

> Ver art. 322 del Código Civil.

### Diferencias clave
Es fundamental no confundir la *capacidad jurídica* (que se tiene desde el nacimiento por el mero hecho de ser persona) con la *capacidad de obrar* (que es dinámica, susceptible de graduaciones y se alcanza plenamente a los 18 años).`,
    files: [
      { name: "apuntes-capacidad.pdf", size: "1.2 MB", status: "ready" }
    ]
  },
  {
    id: 2,
    title: "Capacidad jurídica vs. de obrar",
    subtitle: "Dos conceptos próximos, una distinción clave para las oposiciones de justicia.",
    hero: {
      type: "image-gradient" as "gradient" | "solid" | "image" | "image-gradient",
      gradient: "trust" as "warm" | "trust" | "brand",
      color: "brand-primary",
      image: {
        url: "storage.r2/civil/portada.jpg",
        alt: "Mazo de juez sobre un código civil abierto",
      },
    },
    order: 2,
    duration: 8,
    xp: 15,
    type: "article",
    content: `## Capacidad jurídica vs. de obrar

La delimitación entre ambos conceptos es una de las preguntas más recurrentes en las oposiciones de justicia.

### 1. Capacidad Jurídica
* **Definición**: Aptitud para ser titular de derechos y obligaciones.
* **Adquisición**: Se adquiere con el nacimiento (art. 29 y 30 del Código Civil).
* **Graduación**: Es igual para todos, no admite graduaciones.

### 2. Capacidad de Obrar
* **Definición**: Aptitud para realizar eficazmente actos jurídicos.
* **Adquisición**: Se adquiere plenamente con la mayoría de edad (18 años).
* **Graduación**: Es variable y puede limitarse en función de las condiciones de la persona.`,
    files: []
  },
  {
    id: 3,
    title: "Restricciones a la capacidad",
    subtitle: "Edad, medidas de apoyo y los límites que el Código Civil establece tras la reforma de 2021.",
    hero: {
      type: "solid" as "gradient" | "solid" | "image" | "image-gradient",
      gradient: "brand" as "warm" | "trust" | "brand",
      color: "brand-flame",
      image: { url: "", alt: "" },
    },
    order: 3,
    duration: 10,
    xp: 20,
    type: "file",
    content: `## Restricciones a la capacidad de obrar

Las restricciones son siempre de carácter judicial y tienen como objetivo la protección de la persona.

### Principales causas de restricción:
1. **Minoría de edad**: Sometimiento a patria potestad o tutela.
2. **Medidas de apoyo**: De acuerdo con la nueva legislación de apoyo a personas con discapacidad (Ley 8/2021).

> **Recuerda**: Ya no existe la "incapacitación" en el sentido clásico, sino un sistema de apoyos y salvaguardias.`,
    files: [
      { name: "esquema-reformas-2021.docx", size: "850 KB", status: "ready" }
    ]
  },
];

function MarkdownToolbarButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  icon: any;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <UIButton
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label={shortcut ? `${label} (${shortcut})` : label}
        >
          <Icon className="h-4 w-4" />
        </UIButton>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-muted-foreground">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}


// Extract Table of Contents items dynamically from markdown
function extractTOC(text: string) {
  if (!text) return [];
  const lines = text.split("\n");
  const items: { id: string; label: string; active?: boolean }[] = [];

  if (text.includes("<Video ")) {
    items.push({ id: "video-block", label: "Vídeo principal" });
  }

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      const label = trimmed.substring(3);
      items.push({
        id: encodeURIComponent(label.toLowerCase()),
        label: label
      });
    }
  });

  if (text.includes("<Objectives>")) {
    items.push({ id: "objectives-block", label: "Objetivos de aprendizaje" });
  }
  if (text.includes("<KeyIdea>")) {
    items.push({ id: "keyidea-block", label: "Idea clave" });
  }

  // Mark first item active by default for representation
  if (items.length > 0) {
    items[0].active = true;
  }

  return items;
}

type PillItem = {
  id: number;
  label: string;
  prefix?: string;
  icon?: React.ReactNode;
  dirty?: boolean;
};

// Strips markdown markers from a line so lesson text reads as clean prose when
// pulled into a quote.
function stripMarkdown(text: string) {
  return text
    .replace(/^[>\-*\d.\s]+/, "") // leading quote / list / number markers
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links → text
    .replace(/`(.+?)`/g, "$1") // inline code
    .trim();
}

// Extracts a lesson's section headings (## / ###) plus the cleaned prose lines
// that follow each — lets a teacher open a section and pick the exact passage
// to quote in a question explanation.
function parseLessonSections(content: string) {
  const sections: { heading: string; excerpt: string; lines: string[] }[] = [];
  let current: { heading: string; body: string[] } | null = null;
  const flush = () => {
    if (current) {
      const lines = current.body.map(stripMarkdown).filter((l) => l.length > 0);
      const first = lines[0] ?? "";
      sections.push({
        heading: current.heading,
        excerpt: first.length > 160 ? first.slice(0, 157).trimEnd() + "…" : first,
        lines,
      });
    }
  };
  for (const line of content.split("\n")) {
    const m = line.match(/^#{2,3}\s+(.+)$/);
    if (m) {
      flush();
      current = { heading: m[1].trim(), body: [] };
    } else if (current && line.trim()) {
      current.body.push(line.trim());
    }
  }
  flush();
  return sections;
}

// Highlight colors offered when quoting a lesson passage. The rgb triple is
// reused for the sidebar preview, the explanation callout, and the lesson-page
// mark (passed through the deep link) so the color stays consistent end-to-end.
const HIGHLIGHT_COLORS = [
  { key: "amber", label: "Ámbar", rgb: "234, 161, 70" },
  { key: "green", label: "Verde", rgb: "34, 197, 94" },
  { key: "sky", label: "Azul", rgb: "56, 152, 236" },
  { key: "pink", label: "Rosa", rgb: "236, 72, 153" },
];
const DEFAULT_HL = "234, 161, 70";

// Scrollable selector strip. Fades only the edge(s) that actually have more
// content, lets a vertical mouse wheel scroll the row horizontally, and
// supports click-and-drag. Used by both the lessons and questions editors.
function PillStrip({
  items,
  activeId,
  onSelect,
  onCreate,
  createLabel,
}: {
  items: PillItem[];
  activeId: number;
  onSelect: (id: number) => void;
  onCreate: () => void;
  createLabel: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ down: false, moved: false, startX: 0, startScroll: 0 });
  const [edges, setEdges] = useState({ left: false, right: false });
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateEdges = () => {
      setEdges({
        left: el.scrollLeft > 1,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });
    };

    // Vertical wheel → horizontal scroll, but only while there's overflow.
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };

    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", updateEdges);
    };
  }, [items.length]);

  const maskImage =
    edges.left && edges.right
      ? "linear-gradient(to right, transparent, #000 2.5rem, #000 calc(100% - 2.5rem), transparent)"
      : edges.right
        ? "linear-gradient(to right, #000 calc(100% - 2.5rem), transparent)"
        : edges.left
          ? "linear-gradient(to right, transparent, #000 2.5rem)"
          : undefined;

  const overflowing = edges.left || edges.right;

  // Click-and-drag to scroll (mouse only — touch/trackpad scroll natively).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (e.pointerType !== "mouse" || !el || el.scrollWidth <= el.clientWidth)
      return;
    dragRef.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !dragRef.current.down) return;
    const dx = e.clientX - dragRef.current.startX;
    if (!dragRef.current.moved && Math.abs(dx) > 4) {
      // Capture only once a real drag begins, so a plain click still
      // reaches the pill it's on and selects it.
      dragRef.current.moved = true;
      setGrabbing(true);
      el.setPointerCapture(e.pointerId);
    }
    if (dragRef.current.moved) el.scrollLeft = dragRef.current.startScroll - dx;
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    dragRef.current.down = false;
    setGrabbing(false);
  };
  // Swallow the click that ends a drag so it doesn't select a pill.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerLeave={onPointerEnd}
      onClickCapture={onClickCapture}
      className={cn(
        "no-scrollbar flex items-center gap-2 overflow-x-auto pb-1",
        overflowing && "select-none",
        grabbing ? "cursor-grabbing" : overflowing ? "cursor-grab" : undefined,
      )}
      style={maskImage ? { maskImage, WebkitMaskImage: maskImage } : undefined}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-fast focus-ring",
              active
                ? "border-transparent bg-primary/10 text-primary"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.icon}
            {item.prefix && (
              <span className="tabular-nums opacity-60">{item.prefix}</span>
            )}
            <span className="max-w-[12rem] truncate">{item.label}</span>
            {item.dirty && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-brand-warm" />
            )}
          </button>
        );
      })}
      {/* Create action as the trailing pill */}
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-ring"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" />
        {createLabel}
      </button>
    </div>
  );
}

// Vertical question navigator — PowerPoint slide panel / Kahoot question list.
// Numbered entries previewing each question's wording, the active one
// highlighted, and a trailing "Nueva pregunta" action pinned at the foot.
function QuestionNavigator({
  questions,
  activeId,
  onSelect,
  onCreate,
}: {
  questions: { id: number; text: string; dirty: boolean }[];
  activeId: number;
  onSelect: (id: number) => void;
  onCreate: () => void;
}) {
  return (
    <aside className="flex flex-col rounded-card border bg-card shadow-card lg:max-h-[680px] lg:self-start lg:sticky lg:top-4">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Preguntas
        </span>
        <span className="rounded-pill bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
          {questions.length}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {questions.length === 0 ? (
          <p className="px-2 py-8 text-center text-[11px] text-muted-foreground">
            Sin preguntas todavía.
          </p>
        ) : (
          questions.map((q, i) => {
            const active = q.id === activeId;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelect(q.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "group flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors duration-fast focus-ring",
                  active
                    ? "border-primary/30 bg-primary/10"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-background",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "line-clamp-2 flex-1 text-xs font-medium leading-snug",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {q.text || "Pregunta sin enunciado"}
                </span>
                {q.dirty && (
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-pill bg-brand-warm" />
                )}
              </button>
            );
          })
        )}
      </div>
      <div className="border-t p-2">
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-ring"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          Nueva pregunta
        </button>
      </div>
    </aside>
  );
}

export type BuilderMode = "lessons" | "questions";

export function BuilderWorkspace({ mode }: { mode: BuilderMode }) {
  // Which editor is shown is decided by the route (full-page editor per mode),
  // not by local tab state.
  const activeTab = mode;

  // Lesson states
  const [lessonsList, setLessonsList] = useState(initialLessons);
  const [activeLessonId, setActiveLessonId] = useState(1);
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"edit" | "preview" | "split">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved">("idle");

  // Question states
  const [questionsList, setQuestionsList] = useState(initialQuestions);
  const [activeQuestionId, setActiveQuestionId] = useState(1);
  const [questionSaveStatus, setQuestionSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved">("idle");
  // Questions are scoped to one lesson at a time, so the author never faces the
  // whole unit's pool at once. Defaults to the first lesson.
  const [questionLessonId, setQuestionLessonId] = useState(1);
  // Sidebar for picking the exact lesson passage to quote in an explanation.
  const [refSheetOpen, setRefSheetOpen] = useState(false);
  const [pendingQuote, setPendingQuote] = useState("");
  // The line the fragment was lifted from + the section that line lives in —
  // both inferred from the selection so the quote box can highlight in context.
  const [pendingSentence, setPendingSentence] = useState("");
  const [pendingSection, setPendingSection] = useState("");
  const [pendingColor, setPendingColor] = useState(DEFAULT_HL);

  // Picker scroll container + the section currently scrolled into view, so the
  // sticky header can show "Estás en {section}" as you move through the lesson.
  const pickerScrollRef = useRef<HTMLDivElement>(null);
  const [pickerSection, setPickerSection] = useState("");

  // Opens the lesson quote picker, seeding the highlight color (from an
  // existing reference when re-selecting) and clearing the pending selection.
  const openQuotePicker = (seedColor: string = DEFAULT_HL) => {
    setPendingQuote("");
    setPendingSentence("");
    setPendingSection("");
    setPickerSection("");
    setPendingColor(seedColor);
    setRefSheetOpen(true);
  };

  // Scroll-spy: the heading nearest the top of the picker viewport.
  const handlePickerScroll = () => {
    const root = pickerScrollRef.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top;
    const headings = root.querySelectorAll<HTMLElement>("h1, h2, h3, h4");
    let current = headings[0]?.textContent?.trim() ?? "";
    headings.forEach((h) => {
      if (h.getBoundingClientRect().top - top <= 12) {
        current = h.textContent?.trim() || current;
      }
    });
    setPickerSection(current);
  };

  // Captures a text selection (or click) inside the rendered lesson: the exact
  // fragment, the block it sits in (sentence), and the nearest heading above
  // it (section). Multimedia is non-selectable, so this only ever sees prose.
  const capturePickerSelection = () => {
    const root = pickerScrollRef.current;
    const selObj = window.getSelection();
    const fragment = selObj?.toString().replace(/\s+/g, " ").trim();
    if (!fragment || !root) return;
    const anchor =
      selObj?.anchorNode?.nodeType === 3
        ? selObj.anchorNode.parentElement
        : (selObj?.anchorNode as HTMLElement | null);
    const block = anchor?.closest<HTMLElement>(
      "p, li, h1, h2, h3, h4, blockquote",
    );
    // Use the block as surrounding context only when the fragment actually fits
    // inside it. A selection that spans blocks (e.g. a paragraph into a list)
    // has no single sentence, so the fragment IS the quote — otherwise the box
    // would fall back to highlighting the whole block.
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    const blockText = norm(block?.textContent ?? "");
    const sentence =
      blockText && blockText.toLowerCase().includes(fragment.toLowerCase())
        ? blockText
        : fragment;
    // Nearest heading that appears before the block in document order.
    let section = "";
    if (block) {
      root.querySelectorAll<HTMLElement>("h1, h2, h3, h4").forEach((h) => {
        if (
          block.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_PRECEDING
        ) {
          section = h.textContent?.trim() || section;
        }
      });
    }
    setPendingQuote(fragment);
    setPendingSentence(sentence);
    setPendingSection(section);
  };

  // Seed the sticky section header once the rendered lesson has mounted.
  useEffect(() => {
    if (!refSheetOpen) return;
    const id = setTimeout(handlePickerScroll, 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refSheetOpen]);

  // Floating / context menu states
  const [bubbleMenu, setBubbleMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    targetId: string;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    targetId: string;
  } | null>(null);

  // "Usar como cita en una pregunta" submenu — opened from the lesson editor's
  // bubble/context menu. Holds the captured selection and where to anchor it.
  const [quoteToQuestion, setQuoteToQuestion] = useState<{
    x: number;
    y: number;
    section: string;
    quote: string;
    sentence: string;
    color: string;
  } | null>(null);
  // Transient confirmation pill shown after a quote is pushed to a question.
  const [quoteConfirm, setQuoteConfirm] = useState<string | null>(null);

  // WordPress-style Media/Link Modal state
  const [mediaModal, setMediaModal] = useState<{
    show: boolean;
    type: "video" | "link";
    selectedText: string;
    start: number;
    end: number;
    targetId: string;
  } | null>(null);

  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaLabel, setMediaLabel] = useState("");

  // Media library picker (WP-style)
  const [mediaPicker, setMediaPicker] = useState<{
    open: boolean;
    mode: "insert" | "resource" | "hero";
    typeFilter: MediaAssetType | "all";
    targetId: string;
    start: number;
    end: number;
  } | null>(null);

  // Global click and scroll listener to close floating menus when appropriate
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".floating-bubble-menu") && !target.closest(".custom-context-menu")) {
        setBubbleMenu(null);
        setContextMenu(null);
      }
      if (!target.closest(".quote-question-menu")) {
        setQuoteToQuestion(null);
      }
    };

    const handleGlobalScroll = () => {
      setBubbleMenu(null);
      setContextMenu(null);
      setQuoteToQuestion(null);
    };

    document.addEventListener("mousedown", handleGlobalClick);
    window.addEventListener("scroll", handleGlobalScroll, true);
    
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      window.removeEventListener("scroll", handleGlobalScroll, true);
    };
  }, []);

  // Derived Active Data
  const activeLesson = lessonsList.find((l) => l.id === activeLessonId) || lessonsList[0];
  // Only the selected lesson's questions are shown; the active question always
  // resolves within that set (falling back to its first, or none if empty).
  const filteredQuestions = questionsList.filter((q) => q.lessonId === questionLessonId);
  const activeQuestion = filteredQuestions.find((q) => q.id === activeQuestionId) || filteredQuestions[0];

  // The lesson this question belongs to, and its sections — used to offer a
  // "related lesson section" reference (with an auto-pulled quote) on the
  // explanation, surfaced back to the student in the quiz review.
  const activeQuestionLesson = lessonsList.find((l) => l.id === activeQuestion?.lessonId);
  const lessonSections = activeQuestionLesson
    ? parseLessonSections(activeQuestionLesson.content)
    : [];
  const lessonRef = activeQuestion?.lessonRef ?? null;

  // Auto-dirty state triggers
  const handleLessonChange = (fields: Partial<typeof initialLessons[0]>) => {
    setLessonsList((prev) =>
      prev.map((l) => (l.id === activeLessonId ? { ...l, ...fields } : l))
    );
    setSaveStatus("dirty");
  };

  const handleQuestionChange = (fields: Partial<typeof initialQuestions[0]>) => {
    const targetId = activeQuestion?.id;
    setQuestionsList((prev) =>
      prev.map((q) => (q.id === targetId ? { ...q, ...fields, dirty: true } : q))
    );
    setQuestionSaveStatus("dirty");
  };

  // Simulated actions
  const saveLesson = () => {
    if (saveStatus !== "dirty") return;
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  const saveQuestion = () => {
    if (questionSaveStatus !== "dirty") return;
    setQuestionSaveStatus("saving");
    const targetId = activeQuestion?.id;
    setTimeout(() => {
      setQuestionsList((prev) =>
        prev.map((q) => (q.id === targetId ? { ...q, dirty: false } : q))
      );
      setQuestionSaveStatus("saved");
      setTimeout(() => setQuestionSaveStatus("idle"), 2000);
    }, 800);
  };

  const deleteLesson = (id: number) => {
    if (lessonsList.length <= 1) return;
    const nextActive = lessonsList.find((l) => l.id !== id)?.id || 1;
    setLessonsList((prev) => prev.filter((l) => l.id !== id));
    setActiveLessonId(nextActive);
    setSaveStatus("dirty");
  };

  // Reads the lesson textarea's current selection and derives a quotable
  // reference from it: the clean fragment, the sentence (its line), and the
  // section (nearest heading above). Returns { invalid } when the selection is
  // empty or touches media/MDX blocks — quotes are plain prose only.
  const buildQuoteFromSelection = (targetId: string) => {
    const ta = document.getElementById(targetId) as HTMLTextAreaElement | null;
    if (!ta) return null;
    const content = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return null;
    const raw = content.slice(start, end);
    // Safeguard: reject images, fenced blocks (chart/diagram) and MDX tags.
    if (/!\[|```|<[A-Za-z]/.test(raw)) return { invalid: true as const };
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    const fragment = norm(stripMarkdown(raw));
    if (!fragment) return { invalid: true as const };
    // Sentence = the line the selection sits in; multi-line → just the fragment.
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = content.indexOf("\n", end);
    const lineEnd = lineEndRaw === -1 ? content.length : lineEndRaw;
    const sentence = raw.includes("\n")
      ? fragment
      : norm(stripMarkdown(content.slice(lineStart, lineEnd))) || fragment;
    // Section = nearest heading above the selection.
    let section = "";
    const before = content.slice(0, start).split("\n");
    for (let i = before.length - 1; i >= 0; i--) {
      const m = before[i].match(/^#{1,3}\s+(.+)$/);
      if (m) {
        section = m[1].trim();
        break;
      }
    }
    return { invalid: false as const, section, quote: fragment, sentence, color: DEFAULT_HL };
  };

  // Opens the question submenu from a lesson-editor selection, or warns when the
  // selection isn't quotable (empty / contains multimedia).
  const openQuoteToQuestion = (targetId: string, x: number, y: number) => {
    const res = buildQuoteFromSelection(targetId);
    setBubbleMenu(null);
    setContextMenu(null);
    if (!res || res.invalid) {
      setQuoteConfirm("Selecciona solo texto (sin multimedia) para citar.");
      window.setTimeout(() => setQuoteConfirm(null), 2400);
      return;
    }
    setQuoteToQuestion({
      x,
      y,
      section: res.section,
      quote: res.quote,
      sentence: res.sentence,
      color: res.color,
    });
  };

  const flashQuoteConfirm = (msg: string) => {
    setQuoteConfirm(msg);
    window.setTimeout(() => setQuoteConfirm(null), 2400);
  };

  // Entry from the Plate lesson editor (toolbar / right-click). Opens the
  // question submenu with the captured quote, or warns if it isn't quotable.
  const handlePlateUseAsQuote = (
    data: QuoteCapture,
    anchor: { x: number; y: number },
  ) => {
    if (!data || data.invalid) {
      flashQuoteConfirm("Selecciona solo texto (sin multimedia) para citar.");
      return;
    }
    setQuoteToQuestion({
      x: anchor.x,
      y: anchor.y,
      section: data.section,
      quote: data.quote,
      sentence: data.sentence,
      color: DEFAULT_HL,
    });
  };

  // Attaches the captured quote to an existing question.
  const applyQuoteToQuestion = (questionId: number) => {
    if (!quoteToQuestion) return;
    const { section, quote, sentence, color } = quoteToQuestion;
    setQuestionsList((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, lessonRef: { section, quote, sentence, color }, dirty: true }
          : q,
      ),
    );
    const target = questionsList.find((q) => q.id === questionId);
    flashQuoteConfirm(`Cita añadida a «${target?.label ?? "la pregunta"}»`);
    setQuoteToQuestion(null);
  };

  // Creates a new question for this lesson, seeded with the captured quote.
  const createQuestionWithQuote = () => {
    if (!quoteToQuestion) return;
    const { section, quote, sentence, color } = quoteToQuestion;
    const nextId = Math.max(...questionsList.map((q) => q.id), 0) + 1;
    setQuestionsList((prev) => [
      ...prev,
      {
        id: nextId,
        label: `Nueva pregunta ${nextId}`,
        dirty: true,
        text: "¿Enunciado de la nueva pregunta?",
        difficulty: "normal",
        lessonId: activeLesson?.id ?? questionLessonId,
        lessonRef: { section, quote, sentence, color },
        explanation: "",
        answers: [
          { text: "Opción A", correct: true },
          { text: "Opción B", correct: false },
        ],
      },
    ]);
    flashQuoteConfirm("Nueva pregunta creada con la cita");
    setQuoteToQuestion(null);
  };

  const createNewQuestion = () => {
    const nextId = Math.max(...questionsList.map((q) => q.id), 0) + 1;
    const newQ = {
      id: nextId,
      label: `Nueva pregunta ${nextId}`,
      dirty: true,
      text: "¿Enunciado de la nueva pregunta?",
      difficulty: "normal",
      // New questions belong to the lesson currently being authored.
      lessonId: questionLessonId,
      lessonRef: null as { section: string; quote: string; color: string; sentence?: string } | null,
      explanation: "",
      answers: [
        { text: "Opción A", correct: true },
        { text: "Opción B", correct: false },
      ],
    };
    setQuestionsList((prev) => [...prev, newQ]);
    setActiveQuestionId(nextId);
    setQuestionSaveStatus("dirty");
  };

  const deleteQuestion = (id: number) => {
    // A lesson may legitimately drop to zero questions, so only block when
    // there's nothing to delete. Re-anchor to a sibling within the lesson.
    const remaining = filteredQuestions.filter((q) => q.id !== id);
    setQuestionsList((prev) => prev.filter((q) => q.id !== id));
    setActiveQuestionId(remaining[0]?.id ?? -1);
    setQuestionSaveStatus("dirty");
  };

  // Switch which lesson's questions are shown, anchoring to its first question.
  const selectQuestionLesson = (lessonId: number) => {
    setQuestionLessonId(lessonId);
    const first = questionsList.find((q) => q.lessonId === lessonId);
    setActiveQuestionId(first ? first.id : -1);
  };

  // Mock File Upload directly to simulated R2
  const simulateFileUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const mockFiles = [
        ...activeLesson.files,
        { name: `recurso-unidad-${Date.now().toString().slice(-4)}.pdf`, size: "1.4 MB", status: "ready" },
      ];
      handleLessonChange({ files: mockFiles });
      setIsUploading(false);
    }, 1200);
  };

  const removeFile = (fileName: string) => {
    const mockFiles = activeLesson.files.filter((f) => f.name !== fileName);
    handleLessonChange({ files: mockFiles });
  };

  // Standardized caret text inserter that preserves browser undo/redo history (Ctrl+Z)
  const insertTextAtCursor = (textarea: HTMLTextAreaElement, replacement: string, start: number, end: number) => {
    textarea.focus();
    textarea.setSelectionRange(start, end);
    
    try {
      // Use standard execCommand to register natively in browser undo stack
      const success = document.execCommand("insertText", false, replacement);
      if (!success) {
        throw new Error("execCommand insertText failed");
      }
    } catch (err) {
      // Fallback: React manual update if execCommand is blocked/not supported in host environment
      const text = textarea.value;
      const newText = text.substring(0, start) + replacement + text.substring(end);
      handleLessonChange({ content: newText });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      }, 50);
    }
  };

  // Inline styling formats helpers
  const insertMarkdown = (format: string, targetId?: string) => {
    const activeId = targetId || (bubbleMenu?.targetId) || (contextMenu?.targetId) || "l-content";
    const textarea = (document.getElementById(activeId) || document.getElementById("l-content") || document.getElementById("l-content-split")) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    // Media picker (R2 library) for video and generic library inserts
    if (format === "video" || format === "library" || format === "image") {
      setMediaPicker({
        open: true,
        mode: "insert",
        typeFilter:
          format === "video" ? "video" : format === "image" ? "image" : "all",
        targetId: activeId,
        start,
        end,
      });
      setBubbleMenu(null);
      setContextMenu(null);
      return;
    }

    // External link still opens the URL-input modal (links are not always R2)
    if (format === "link") {
      setMediaModal({
        show: true,
        type: format,
        selectedText: selected,
        start,
        end,
        targetId: activeId,
      });
      setMediaUrl("");
      setMediaLabel(selected || "Enlace");
      setBubbleMenu(null);
      setContextMenu(null);
      return;
    }

    let replacement = "";

    switch (format) {
      case "bold":
        replacement = `**${selected || "texto"}**`;
        break;
      case "italic":
        replacement = `*${selected || "texto"}*`;
        break;
      case "list":
        replacement = `\n- ${selected || "elemento"}`;
        break;
      case "code":
        replacement = `\`${selected || "codigo"}\``;
        break;
      case "quote":
        replacement = `\n> ${selected || "cita"}`;
        break;
      case "objectives":
        replacement = `\n<Objectives>\n- ${selected || "Definir el concepto de capacidad de obrar."}\n- Distinguir capacidad jurídica de de obrar.\n- Identificar las restricciones de la capacidad.\n</Objectives>\n`;
        break;
      case "keyidea":
        replacement = `\n<KeyIdea>\n${selected || "La capacidad jurídica es titularidad; la capacidad de obrar es ejercicio. Toda persona tiene la primera, la segunda se adquiere."}\n</KeyIdea>\n`;
        break;
    }

    insertTextAtCursor(textarea, replacement, start, end);

    // Hide floating menus on insert
    setBubbleMenu(null);
    setContextMenu(null);
  };

  // Keyboard shortcuts for the common formatting actions, mirroring the
  // toolbar (and the ⌘X hints shown in its tooltips). Works with both Cmd
  // (mac) and Ctrl (win/linux).
  const FORMAT_SHORTCUTS: Record<string, string> = {
    b: "bold",
    i: "italic",
    k: "link",
    e: "code",
  };
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const format = FORMAT_SHORTCUTS[e.key.toLowerCase()];
    if (!format) return;
    e.preventDefault();
    insertMarkdown(format, e.currentTarget.id);
  };

  // Media library picker callbacks
  const handlePickerInsert = (asset: MediaAsset) => {
    if (!mediaPicker) return;
    const textarea = document.getElementById(mediaPicker.targetId) as HTMLTextAreaElement;
    if (!textarea) {
      setMediaPicker(null);
      return;
    }
    const replacement = formatAssetInsert(asset);
    insertTextAtCursor(textarea, replacement, mediaPicker.start, mediaPicker.end);
    setMediaPicker(null);
  };

  const handlePickerHero = (asset: MediaAsset) => {
    if (!activeLesson) {
      setMediaPicker(null);
      return;
    }
    handleLessonChange({
      hero: {
        ...activeLesson.hero,
        type:
          activeLesson.hero.type === "image-gradient"
            ? "image-gradient"
            : "image",
        image: {
          url: `storage.r2/${asset.r2Key}`,
          alt: asset.alt ?? asset.name,
        },
      },
    });
    setMediaPicker(null);
  };

  const handlePickerAttach = (asset: MediaAsset) => {
    if (!activeLesson) {
      setMediaPicker(null);
      return;
    }
    // Skip if already attached
    const already = activeLesson.files?.some((f) => f.name === asset.name);
    if (already) {
      setMediaPicker(null);
      return;
    }
    handleLessonChange({
      files: [
        ...(activeLesson.files ?? []),
        { name: asset.name, size: asset.size, status: "ready" },
      ],
    });
    setMediaPicker(null);
  };

  // Handles active selection insertion after media dialog confirmation
  const handleMediaInsert = () => {
    if (!mediaModal) return;
    const textarea = document.getElementById(mediaModal.targetId) as HTMLTextAreaElement;
    if (!textarea) return;

    let replacement = "";
    if (mediaModal.type === "video") {
      replacement = `\n<Video url="${mediaUrl || "storage.r2/civil-u2-l1.mp4"}" label="${mediaLabel || "Vídeo de la lección"}" />\n`;
    } else {
      replacement = `[${mediaLabel || "Enlace"}](${mediaUrl || "https://"})`;
    }

    insertTextAtCursor(textarea, replacement, mediaModal.start, mediaModal.end);
    setMediaModal(null);
  };

  // Textarea selection / mouseUp handler
  const handleTextareaMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      setBubbleMenu({
        show: true,
        x: e.clientX,
        y: e.clientY - 12,
        targetId: textarea.id,
      });
      setContextMenu(null);
    } else {
      setBubbleMenu(null);
    }
  };

  // Textarea keyUp handler (for keyboard selections)
  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const rect = textarea.getBoundingClientRect();
      setBubbleMenu({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top + 30,
        targetId: textarea.id,
      });
      setContextMenu(null);
    } else {
      setBubbleMenu(null);
    }
  };

  // Textarea context menu handler
  const handleTextareaContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const textarea = e.currentTarget;
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      targetId: textarea.id,
    });
    setBubbleMenu(null);
  };

  return (
    <TooltipProvider delayDuration={300}>
    <div className="w-full space-y-6 transition-all duration-normal">
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/wireframes/teach" className="transition-colors duration-fast hover:text-foreground">
                    Asignaturas
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/wireframes/teach/derecho-civil" className="transition-colors duration-fast hover:text-foreground">
                    Derecho Civil
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {mode === "lessons" ? (
                  <BreadcrumbLink asChild>
                    <Link href="/wireframes/teach/derecho-civil" className="transition-colors duration-fast hover:text-foreground">
                      U2 · Lecciones
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>U2 · Preguntas</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {mode === "lessons" && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {activeLesson?.title || "Lección sin título"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={
          <span className="flex items-center gap-3">
            Unidad 2 · Capacidad jurídica
            {saveStatus === "dirty" || questionSaveStatus === "dirty" ? (
              <Badge variant="secondary" className="gap-1 bg-brand-warm/10 text-brand-warm border-brand-warm/20 font-medium">
                <span className="h-1.5 w-1.5 rounded-pill bg-brand-warm animate-pulse" />
                Cambios sin guardar
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20 font-medium">
                <Check className="h-3 w-3" />
                Guardado
              </Badge>
            )}
          </span>
        }
        subtitle="Gestiona las preguntas y lecciones con el editor premium."
        actions={
          activeTab === "lessons" ? (
            <>
              {saveStatus === "dirty" ? (
                <UIButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLessonsList(initialLessons);
                    setSaveStatus("idle");
                  }}
                  className="text-muted-foreground hover:bg-muted font-medium transition-colors duration-fast h-9"
                >
                  Descartar
                </UIButton>
              ) : null}
              <Button
                onClick={saveLesson}
                disabled={saveStatus !== "dirty"}
                className="transition-all duration-normal font-semibold shadow-card focus-ring h-10"
              >
                {saveStatus === "saving" ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Guardando...
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-success" />
                    ¡Guardado!
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar lección
                  </>
                )}
              </Button>
              {/* View mode segmented control (Escribir · Vista previa · Dividido) */}
              <div
                role="group"
                aria-label="Modo de vista del editor"
                className="hidden h-10 items-center overflow-hidden rounded-lg border bg-muted/40 p-0.5 sm:flex"
              >
                <button
                  type="button"
                  onClick={() => setEditorMode("edit")}
                  aria-label="Escribir"
                  title="Escribir"
                  aria-pressed={editorMode === "edit"}
                  className={`flex h-8 items-center justify-center rounded-md px-2.5 transition-colors duration-fast focus-ring ${
                    editorMode === "edit"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  aria-label="Vista previa"
                  title="Vista previa"
                  aria-pressed={editorMode === "preview"}
                  className={`flex h-8 items-center justify-center rounded-md px-2.5 transition-colors duration-fast focus-ring ${
                    editorMode === "preview"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("split")}
                  aria-label="Vista dividida"
                  title="Vista dividida"
                  aria-pressed={editorMode === "split"}
                  className={`flex h-8 items-center justify-center rounded-md px-2.5 transition-colors duration-fast focus-ring ${
                    editorMode === "split"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FlipHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Mobile fallback: cycle button */}
              <UIButton
                variant="outline"
                size="icon"
                onClick={() =>
                  setEditorMode(
                    editorMode === "edit"
                      ? "preview"
                      : editorMode === "preview"
                        ? "split"
                        : "edit",
                  )
                }
                aria-label={`Vista actual: ${editorMode}. Pulsa para cambiar.`}
                title="Cambiar vista"
                className="h-10 w-10 border sm:hidden"
              >
                {editorMode === "edit" ? (
                  <Pencil className="h-4 w-4" />
                ) : editorMode === "preview" ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <FlipHorizontal className="h-4 w-4" />
                )}
              </UIButton>
              <UIButton
                variant="outline"
                size="icon"
                onClick={() => setHistorySheetOpen(true)}
                className="h-10 w-10 border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-fast"
                title="Historial de versiones"
                aria-label="Historial de versiones"
              >
                <History className="h-4 w-4" />
              </UIButton>
              <UIButton
                variant="outline"
                size="icon"
                onClick={() => setConfigSheetOpen(true)}
                className="h-10 w-10 border text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-fast"
                title="Configurar lección"
                aria-label="Configurar lección"
              >
                <Settings className="h-4 w-4" />
              </UIButton>
            </>
          ) : (
            <>
              {questionSaveStatus === "dirty" ? (
                <UIButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuestionsList(initialQuestions);
                    setQuestionSaveStatus("idle");
                  }}
                  className="text-muted-foreground hover:bg-muted font-medium transition-colors duration-fast h-9"
                >
                  Descartar
                </UIButton>
              ) : null}
              <Button
                onClick={saveQuestion}
                disabled={questionSaveStatus !== "dirty"}
                className="transition-all duration-normal font-semibold shadow-card focus-ring h-10"
              >
                {questionSaveStatus === "saving" ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Guardando...
                  </>
                ) : questionSaveStatus === "saved" ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-success" />
                    ¡Guardado!
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar pregunta
                  </>
                )}
              </Button>
            </>
          )
        }
      />

      {/* Full-width editor tool bar — pinned flush under the header (WordPress-style).
          Edit/split: markdown tools. Preview: the "what the student sees" banner. */}
      {/* In "edit" mode the Plate editor renders its own WYSIWYG toolbar, so this
          legacy markdown toolbar is only shown for preview (banner) and split (source). */}
      {mode === "lessons" && editorMode !== "edit" && (
        <div className="sticky -top-6 z-30 -mx-4 -mt-6 border-b bg-card/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:-mx-8 md:px-8">
          {editorMode === "preview" ? (
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground font-sans">
                Vista previa · esto es lo que verá el estudiante
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-0.5">
              <MarkdownToolbarButton icon={Bold} label="Negrita" shortcut="⌘B" onClick={() => insertMarkdown("bold")} />
              <MarkdownToolbarButton icon={Italic} label="Cursiva" shortcut="⌘I" onClick={() => insertMarkdown("italic")} />
              <MarkdownToolbarButton icon={List} label="Lista" onClick={() => insertMarkdown("list")} />
              <MarkdownToolbarButton icon={Link2} label="Enlace" shortcut="⌘K" onClick={() => insertMarkdown("link")} />
              <MarkdownToolbarButton icon={FileCode} label="Código" shortcut="⌘E" onClick={() => insertMarkdown("code")} />
              <MarkdownToolbarButton icon={HelpCircle} label="Cita" onClick={() => insertMarkdown("quote")} />

              <div className="mx-1 h-4 w-px bg-border" />

              {/* Single attach entry point — opens the media flow with
                  both the library and video (R2) options inside. */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <UIButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-primary data-[state=open]:bg-muted data-[state=open]:text-foreground"
                        aria-label="Adjuntar media"
                      >
                        <Paperclip className="h-4 w-4" />
                      </UIButton>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Adjuntar media</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuItem onClick={() => insertMarkdown("library")}>
                    <Library className="mr-2 h-4 w-4" />
                    Desde biblioteca de media
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertMarkdown("video")}>
                    <Video className="mr-2 h-4 w-4" />
                    Insertar vídeo (R2)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <MarkdownToolbarButton icon={Target} label="Bloque de Objetivos" onClick={() => insertMarkdown("objectives")} />
              <MarkdownToolbarButton icon={Lightbulb} label="Bloque de Idea Clave" onClick={() => insertMarkdown("keyidea")} />
            </div>
          )}
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs value={activeTab}>
        {/* ---------- LECCIONES TAB (WordPress Editor) ---------- */}
        <TabsContent value="lessons" className="mt-4 outline-none">
          <div>
            {/* Content Editor Canvas (WordPress Gutenberg Style) — full width now that
                lesson switching lives in the subject-detail lessons table */}
            <main className="min-w-0">
              {/* Full-bleed writing canvas — no card chrome, rides the layout gutter
                  from the sidebar to the screen edge; modest internal text padding. */}
              <section className="relative -mx-4 flex min-h-[620px] flex-col bg-card md:-mx-8">
                <div className="flex-1 w-full">
                  {editorMode === "edit" && (
                    <LessonPlateEditor
                      key={activeLessonId}
                      value={activeLesson?.content || ""}
                      onChange={(md) => handleLessonChange({ content: md })}
                      onAttachResource={(file) => {
                        if (!activeLesson) return;
                        // Insertion-time linking: attach the resource to the lesson's
                        // downloadable-resources sidebar, deduping by name (mirrors
                        // handlePickerAttach).
                        const already = activeLesson.files?.some(
                          (f) => f.name === file.name,
                        );
                        if (already) return;
                        handleLessonChange({
                          files: [
                            ...(activeLesson.files ?? []),
                            { name: file.name, size: file.size, status: "ready" },
                          ],
                        });
                      }}
                      onUseAsQuote={handlePlateUseAsQuote}
                    />
                  )}

                  {editorMode === "preview" && (
                    <div className="w-full animate-in fade-in duration-300 bg-background min-h-[620px]">
                      {/* Hero header — type comes from lesson.hero (gradient | solid | image | image-gradient) */}
                      <header className="relative overflow-hidden text-white px-6 py-10 md:px-8">
                        <div
                          className={`absolute inset-0 ${
                            activeLesson?.hero.type === "gradient"
                              ? activeLesson.hero.gradient === "trust"
                                ? "bg-grad-trust"
                                : activeLesson.hero.gradient === "brand"
                                  ? "bg-grad-brand"
                                  : "bg-grad-warm"
                              : activeLesson?.hero.type === "solid"
                                ? {
                                    "brand-primary": "bg-brand-primary",
                                    "brand-cool": "bg-brand-cool",
                                    "brand-warm": "bg-brand-warm",
                                    "brand-flame": "bg-brand-flame",
                                    "brand-xp": "bg-brand-xp",
                                    primary: "bg-primary",
                                  }[activeLesson.hero.color ?? "brand-primary"] ?? "bg-brand-primary"
                                : "bg-slate-700"
                          }`}
                          aria-hidden
                        />
                        {(activeLesson?.hero.type === "image" ||
                          activeLesson?.hero.type === "image-gradient") && (
                          <>
                            <div
                              className="absolute inset-0 flex items-center justify-end pr-12 text-white/15"
                              aria-hidden
                            >
                              <ImageIcon className="h-32 w-32" strokeWidth={1.2} />
                            </div>
                            {activeLesson.hero.type === "image-gradient" && (
                              <div
                                aria-hidden
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `linear-gradient(90deg, hsl(var(${
                                    activeLesson.hero.gradient === "trust"
                                      ? "--brand-primary"
                                      : activeLesson.hero.gradient === "brand"
                                        ? "--grad-brand-to"
                                        : "--brand-warm"
                                  })) 0%, transparent 75%)`,
                                }}
                              />
                            )}
                          </>
                        )}
                        <div className="relative mx-auto max-w-6xl space-y-4 text-left">
                          <UIButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditorMode("edit")}
                            className="-ml-3 text-white hover:bg-white/15 hover:text-white focus-visible:ring-white h-9 text-xs font-semibold"
                          >
                            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                            Volver al editor
                          </UIButton>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 font-sans">
                              Derecho civil · Unidad 2 · Lección {activeLesson?.order || 1} de {lessonsList.length}
                            </p>
                            <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-white md:text-4xl">
                              {activeLesson?.title || "Sin título"}
                            </h1>
                            {activeLesson?.subtitle && (
                              <p className="mt-3 max-w-2xl font-reader text-sm leading-[1.6] text-white/90">
                                {activeLesson.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </header>

                      {/* Mirror Body Container */}
                      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:px-8 grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)_240px] text-left">
                        {/* TOC sidebar (left, sticky) */}
                        <aside className="hidden md:block sticky top-6 self-start space-y-3">
                          <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground font-sans">
                            En esta lección
                          </p>
                          <nav className="space-y-1">
                            {extractTOC(activeLesson?.content || "").map((item) => (
                              <a
                                key={item.id}
                                href={`#${item.id}`}
                                className={`block rounded-md px-3 py-1.5 text-xs transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                                  item.active
                                    ? "bg-brand-primary/10 font-medium text-brand-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                              >
                                {item.label}
                              </a>
                            ))}
                          </nav>
                          <p className="mt-6 px-1 text-[10px] text-muted-foreground font-sans">
                            Lección {activeLesson?.order || 1} de {lessonsList.length} · {activeLesson?.duration || 5} min de lectura
                          </p>
                        </aside>

                        {/* Article Column */}
                        <article
                          className="font-reader text-[16px] leading-[1.7] text-foreground min-w-0"
                          style={{ fontFeatureSettings: '"liga", "kern", "onum"' }}
                        >
                          <div className="max-w-2xl space-y-8">
                            {activeLesson?.content ? (
                              <LessonPreview content={activeLesson.content} />
                            ) : (
                              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                                <BookOpen className="h-8 w-8 mb-2 opacity-40" />
                                <p className="text-sm">No hay contenido escrito aún.</p>
                                <p className="text-xs text-muted-foreground/80 mt-1">Usa la pestaña Escribir para redactar la lección.</p>
                              </div>
                            )}

                            {/* Article CTAs */}
                            <section className="flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between font-sans">
                              <div className="flex flex-wrap gap-2">
                                <UIButton variant="outline" size="sm" className="h-9">
                                  <Printer className="mr-1.5 h-4 w-4" />
                                  Imprimir
                                </UIButton>
                                <UIButton variant="outline" size="sm" className="h-9">
                                  <BookmarkPlus className="mr-1.5 h-4 w-4" />
                                  Marcar para repaso
                                </UIButton>
                              </div>
                              <Button variant="learning" size="lg" className="h-10 text-xs font-semibold">
                                Marcar como leída y continuar
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </section>
                          </div>
                        </article>

                        {/* Resources sidebar (right) */}
                        <aside className="space-y-6 sticky top-6 self-start">
                          <div>
                            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground font-sans">
                              Recursos descargables
                            </p>
                            {activeLesson?.files && activeLesson.files.length > 0 ? (
                              <ul className="space-y-2">
                                {activeLesson.files.map((file, idx) => (
                                  <li key={idx}>
                                    <a
                                      href="#"
                                      onClick={(e) => e.preventDefault()}
                                      className="group flex items-center gap-2 rounded-card border border-border bg-card p-2.5 shadow-card transition-shadow duration-normal hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                                    >
                                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-medium text-foreground font-sans">
                                          {file.name}
                                        </span>
                                        <span className="block text-[10px] text-muted-foreground font-sans">
                                          {file.size}
                                        </span>
                                      </span>
                                      <Download className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors duration-fast group-hover:text-foreground" />
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="rounded-card border border-dashed border-border p-4 text-center text-xs text-muted-foreground font-sans">
                                Sin recursos adjuntos.
                              </div>
                            )}
                          </div>

                          <div className="rounded-card border border-border bg-muted/40 p-4">
                            <p className="mb-1 font-sans text-xs font-semibold text-foreground">
                              ¿Listo para comprobarlo?
                            </p>
                            <p className="mb-3 text-[10px] text-muted-foreground font-sans">
                              5 preguntas, 3 minutos. Sin contrarreloj.
                            </p>
                            <Button variant="learning" size="lg" className="w-full h-9 text-xs font-semibold">
                              Hacer test al final
                              <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </aside>
                      </div>
                    </div>
                  )}

                  {editorMode === "split" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[480px] px-4 py-6 md:px-8">
                      {/* Left: Input */}
                      <div className="border-r pr-6 border-muted/50">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2 font-mono">Editor Markdown</span>
                        <Textarea
                          id="l-content-split"
                          value={activeLesson?.content || ""}
                          onChange={(e) => handleLessonChange({ content: e.target.value })}
                          onMouseUp={handleTextareaMouseUp}
                          onKeyUp={handleTextareaKeyUp}
                          onKeyDown={handleEditorKeyDown}
                          onContextMenu={handleTextareaContextMenu}
                          placeholder="Escribe en Markdown..."
                          className="w-full h-[450px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none resize-none font-mono text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/30 p-0"
                        />
                      </div>
                      {/* Right: Real-time Live parsed preview */}
                      <div className="overflow-y-auto max-h-[450px] pr-2 scrollbar-thin">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2 font-mono flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-brand-primary" />
                          Vista Previa En Vivo
                        </span>
                        <div className="font-reader text-sm leading-relaxed text-muted-foreground">
                          {activeLesson?.content ? (
                            <LessonPreview content={activeLesson.content} />
                          ) : (
                            <p className="text-xs italic text-muted-foreground/60">Esperando texto...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </main>

          </div>

          {/* Version history Sheet (slides in from the right, like config) */}
          <LessonHistorySheet
            open={historySheetOpen}
            onOpenChange={setHistorySheetOpen}
            lessonTitle={activeLesson?.title}
          />

          {/* Lesson configuration Sheet (slides in from the right) */}
          <Sheet open={configSheetOpen} onOpenChange={setConfigSheetOpen}>
            <SheetContent
              side="right"
              className="w-full p-0 sm:max-w-lg flex flex-col gap-0"
            >
              <SheetHeader className="px-6 py-4 text-left">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Configurar lección
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Título, subtítulo, ajustes, archivos y acciones de la lección actual.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5">
              {/* Meta box 1: Ajustes de Lección (now hosts title + subtitle) */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide px-0.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                  Ajustes de Lección
                </div>
                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="l-title" className="text-xs font-semibold text-foreground">
                    Título
                  </Label>
                  <Input
                    id="l-title"
                    value={activeLesson?.title || ""}
                    onChange={(e) => handleLessonChange({ title: e.target.value })}
                    placeholder="Título de la lección"
                    className="h-9 text-sm focus-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="l-subtitle" className="text-xs font-semibold text-foreground">
                    Subtítulo
                    <span className="ml-1 font-normal text-muted-foreground">
                      (aparece bajo el título en el hero)
                    </span>
                  </Label>
                  <Textarea
                    id="l-subtitle"
                    value={activeLesson?.subtitle || ""}
                    onChange={(e) => handleLessonChange({ subtitle: e.target.value })}
                    placeholder="Describe en una frase qué aprenderá el estudiante…"
                    rows={2}
                    className="text-xs focus-ring leading-relaxed"
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="l-type" className="text-xs font-semibold text-foreground">
                    Tipo de lección
                  </Label>
                  <Select
                    value={activeLesson?.type || "article"}
                    onValueChange={(val) => handleLessonChange({ type: val })}
                  >
                    <SelectTrigger id="l-type" className="h-9 text-xs focus-ring">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent className="shadow-popover rounded-md">
                      <SelectItem value="article" className="text-xs">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          Artículo (texto)
                        </span>
                      </SelectItem>
                      <SelectItem value="file" className="text-xs">
                        <span className="flex items-center gap-2">
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          Archivo (recurso)
                        </span>
                      </SelectItem>
                      <SelectItem value="video" className="text-xs">
                        <span className="flex items-center gap-2">
                          <Play className="h-3.5 w-3.5 text-muted-foreground" />
                          Vídeo instructivo
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="l-order" className="text-xs font-semibold text-foreground">
                      Orden
                    </Label>
                    <Input
                      id="l-order"
                      type="number"
                      value={activeLesson?.order || 1}
                      onChange={(e) => handleLessonChange({ order: parseInt(e.target.value) || 1 })}
                      min={1}
                      className="h-9 text-xs focus-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="l-dur" className="text-xs font-semibold text-foreground">
                      Duración (min)
                    </Label>
                    <Input
                      id="l-dur"
                      type="number"
                      value={activeLesson?.duration || 5}
                      onChange={(e) => handleLessonChange({ duration: parseInt(e.target.value) || 1 })}
                      min={1}
                      className="h-9 text-xs focus-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="l-xp" className="text-xs font-semibold text-foreground">
                    Puntos de XP al completar
                  </Label>
                  <div className="relative">
                    <Input
                      id="l-xp"
                      type="number"
                      value={activeLesson?.xp || 10}
                      onChange={(e) => handleLessonChange({ xp: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="h-9 text-xs pl-8 focus-ring"
                    />
                    <Sparkles className="absolute left-2.5 top-2.5 h-4 w-4 text-brand-warm" />
                  </div>
                </div>
              </div>

              {/* Meta box: Hero (cabecera) */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide px-0.5">
                  <Palette className="h-3.5 w-3.5 text-primary/80" />
                  Hero · Cabecera
                </div>
                <Separator />

                {/* Style picker — 2×2 grid of mode cards */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "gradient", label: "Degradado", swatch: "bg-grad-warm" },
                    { id: "solid", label: "Color sólido", swatch: "bg-brand-primary" },
                    { id: "image", label: "Imagen", swatch: "bg-grad-trust" },
                    { id: "image-gradient", label: "Imagen + degradado", swatch: "bg-grad-brand" },
                  ] as const).map((opt) => {
                    const active = activeLesson?.hero.type === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          activeLesson &&
                          handleLessonChange({
                            hero: { ...activeLesson.hero, type: opt.id },
                          })
                        }
                        className={`flex flex-col gap-2 rounded-md border p-2 text-left transition-all duration-fast focus-ring ${
                          active
                            ? "border-brand-primary/40 bg-brand-primary/5 ring-2 ring-brand-primary/30"
                            : "border-input hover:bg-muted/30"
                        }`}
                      >
                        <div className={`h-8 w-full rounded ${opt.swatch}`} />
                        <span className="text-[11px] font-semibold text-foreground">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Per-mode controls */}
                {activeLesson?.hero.type === "gradient" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Paleta del degradado
                    </Label>
                    <div className="flex gap-2">
                      {(["warm", "trust", "brand"] as const).map((g) => {
                        const active = activeLesson.hero.gradient === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              handleLessonChange({
                                hero: { ...activeLesson.hero, gradient: g },
                              })
                            }
                            className={`flex-1 h-10 rounded-md transition-all duration-fast focus-ring ${
                              g === "warm"
                                ? "bg-grad-warm"
                                : g === "trust"
                                  ? "bg-grad-trust"
                                  : "bg-grad-brand"
                            } ${active ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                            aria-label={`Paleta ${g}`}
                            title={g === "warm" ? "Cálido" : g === "trust" ? "Confianza" : "Marca"}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeLesson?.hero.type === "solid" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Color
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: "brand-primary", className: "bg-brand-primary" },
                          { id: "brand-cool", className: "bg-brand-cool" },
                          { id: "brand-warm", className: "bg-brand-warm" },
                          { id: "brand-flame", className: "bg-brand-flame" },
                          { id: "brand-xp", className: "bg-brand-xp" },
                          { id: "primary", className: "bg-primary" },
                        ] as const
                      ).map((c) => {
                        const active = activeLesson.hero.color === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              handleLessonChange({
                                hero: { ...activeLesson.hero, color: c.id },
                              })
                            }
                            className={`h-8 w-8 rounded-md transition-all duration-fast focus-ring ${c.className} ${
                              active
                                ? "ring-2 ring-offset-2 ring-foreground"
                                : ""
                            }`}
                            aria-label={`Color ${c.id}`}
                            title={c.id}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {(activeLesson?.hero.type === "image" ||
                  activeLesson?.hero.type === "image-gradient") && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Imagen
                      </Label>
                      {activeLesson.hero.image?.url ? (
                        <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
                          <div className="relative h-12 w-16 overflow-hidden rounded bg-grad-trust">
                            <div className="absolute inset-0 flex items-center justify-center text-white/70">
                              <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium font-mono text-foreground">
                              {activeLesson.hero.image.url}
                            </p>
                            {activeLesson.hero.image.alt && (
                              <p className="truncate text-[10px] text-muted-foreground">
                                alt: {activeLesson.hero.image.alt}
                              </p>
                            )}
                          </div>
                          <UIButton
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setMediaPicker({
                                open: true,
                                mode: "hero",
                                typeFilter: "image",
                                targetId: "l-content",
                                start: 0,
                                end: 0,
                              })
                            }
                            className="h-8 text-[10px]"
                          >
                            Cambiar
                          </UIButton>
                        </div>
                      ) : (
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setMediaPicker({
                              open: true,
                              mode: "hero",
                              typeFilter: "image",
                              targetId: "l-content",
                              start: 0,
                              end: 0,
                            })
                          }
                          className="w-full justify-center h-10 text-xs border-dashed"
                        >
                          <ImageIcon className="mr-2 h-3.5 w-3.5" />
                          Elegir imagen de la biblioteca
                        </UIButton>
                      )}
                    </div>

                    {activeLesson.hero.type === "image-gradient" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Degradado superpuesto (izquierda → derecha)
                        </Label>
                        <div className="flex gap-2">
                          {(["warm", "trust", "brand"] as const).map((g) => {
                            const active = activeLesson.hero.gradient === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() =>
                                  handleLessonChange({
                                    hero: { ...activeLesson.hero, gradient: g },
                                  })
                                }
                                className={`flex-1 h-10 rounded-md transition-all duration-fast focus-ring ${
                                  g === "warm"
                                    ? "bg-grad-warm"
                                    : g === "trust"
                                      ? "bg-grad-trust"
                                      : "bg-grad-brand"
                                } ${active ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                                aria-label={`Paleta ${g}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Vista previa en vivo en la pestaña <span className="font-semibold">Vista previa</span> del editor.
                </p>
              </div>

              {/* Meta box 2: Archivos en R2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide px-0.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary/80" />
                  Archivos en R2
                </div>
                <Separator />

                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center transition-colors duration-fast hover:bg-muted/30">
                  <UploadCloud className="h-5 w-5 text-muted-foreground/60" />
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    PDF, DOCX o esquemas al almacenamiento
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                    <UIButton
                      variant="outline"
                      size="sm"
                      onClick={simulateFileUpload}
                      disabled={isUploading}
                      className="h-9 text-[10px] px-2.5 border focus-ring"
                    >
                      {isUploading ? (
                        <>
                          <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Paperclip className="mr-1 h-3 w-3" />
                          Subir archivo
                        </>
                      )}
                    </UIButton>
                    <UIButton
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setMediaPicker({
                          open: true,
                          mode: "resource",
                          typeFilter: "all",
                          targetId: "l-content",
                          start: 0,
                          end: 0,
                        })
                      }
                      className="h-9 text-[10px] px-2.5 focus-ring text-muted-foreground hover:text-foreground"
                    >
                      <Library className="mr-1 h-3 w-3" />
                      Desde biblioteca
                    </UIButton>
                  </div>
                </div>

                {activeLesson?.files && activeLesson.files.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {activeLesson.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border bg-card/60 p-2 text-xs transition-shadow duration-fast hover:shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground/80 leading-tight">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {file.size} · R2
                          </p>
                        </div>
                        <Badge variant="secondary" className="px-1 py-0 text-[9px] bg-success/10 text-success border-success/20 font-medium">
                          Listo
                        </Badge>
                        <UIButton
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.name)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0"
                          aria-label="Quitar recurso"
                        >
                          <X className="h-3 w-3" />
                        </UIButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/80 text-center italic py-2">
                    Sin archivos adjuntos.
                  </p>
                )}
              </div>

              {/* Meta box 3: Acciones de Peligro */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-destructive uppercase tracking-wide px-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  Acciones de Peligro
                </div>
                <Separator />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Eliminar una lección la borra de forma definitiva junto a sus referencias.
                </p>
                <UIButton
                  variant="ghost"
                  onClick={() => deleteLesson(activeLessonId)}
                  disabled={lessonsList.length <= 1}
                  className="w-full text-xs font-semibold justify-center h-9 text-destructive hover:text-destructive-foreground hover:bg-destructive border border-destructive/30 rounded-md transition-colors duration-fast disabled:opacity-40 disabled:hover:bg-transparent disabled:text-muted-foreground"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar Lección
                </UIButton>
              </div>
              </div>
              <SheetFooter className="px-6 py-3">
                <SheetClose asChild>
                  <UIButton variant="outline" size="sm" className="h-9">
                    Cerrar
                  </UIButton>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ---------- PREGUNTAS TAB (Sleek Form & Sidebar) ---------- */}
        <TabsContent value="questions" className="mt-4 outline-none">
          <div className="space-y-4">
            {/* Lesson scope — questions belong to a lesson, so the author picks
                a lesson first and only ever edits that lesson's short list. */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Preguntas por lección
              </div>
              <div className="flex flex-wrap gap-2">
                {[...lessonsList]
                  .sort((a, b) => a.order - b.order)
                  .map((l) => {
                    const count = questionsList.filter((q) => q.lessonId === l.id).length;
                    const active = l.id === questionLessonId;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => selectQuestionLesson(l.id)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors duration-fast focus-ring",
                          active
                            ? "border-primary/30 bg-primary/10"
                            : "bg-card hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "font-mono text-xs font-bold tabular-nums",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          2.{l.order}
                        </span>
                        <span
                          className={cn(
                            "max-w-[9rem] truncate text-xs font-semibold",
                            active ? "text-primary" : "text-foreground",
                          )}
                        >
                          {l.title}
                        </span>
                        <span
                          className={cn(
                            "rounded-pill px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                            active
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Two-column workspace: a vertical question navigator on the left
                (PowerPoint slide panel / Kahoot question list) and the editor on
                the right. Scope stays per-lesson via the selector above. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <QuestionNavigator
                questions={filteredQuestions}
                activeId={activeQuestion?.id ?? -1}
                onSelect={(id) => setActiveQuestionId(id)}
                onCreate={createNewQuestion}
              />

              {/* Right column — editor for the active question */}
              <div className="min-w-0">
            {activeQuestion ? (
            <section className="space-y-5 rounded-card border bg-card p-5 shadow-card md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground font-sans">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Editar Enunciado de Pregunta
                </div>
                <div className="flex items-center gap-2">
                  {/* Difficulty toggle segment */}
                  <div className="flex overflow-hidden rounded-lg border text-xs font-semibold p-0.5 bg-muted/40">
                    <button
                      onClick={() => handleQuestionChange({ difficulty: "fácil" })}
                      className={`px-3 py-1 rounded-md transition-colors duration-fast ${
                        activeQuestion?.difficulty === "fácil"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Fácil
                    </button>
                    <button
                      onClick={() => handleQuestionChange({ difficulty: "normal" })}
                      className={`px-3 py-1 rounded-md transition-colors duration-fast ${
                        activeQuestion?.difficulty === "normal"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => handleQuestionChange({ difficulty: "difícil" })}
                      className={`px-3 py-1 rounded-md transition-colors duration-fast ${
                        activeQuestion?.difficulty === "difícil"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Difícil
                    </button>
                  </div>

                  <UIButton
                    variant="ghost"
                    size="icon"
                    onClick={() => activeQuestion && deleteQuestion(activeQuestion.id)}
                    disabled={!activeQuestion}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-40"
                    title="Eliminar pregunta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </UIButton>
                </div>
              </div>
              <Separator />

              {/* Enunciation field — full width now that the internal label is
                  gone; the navigator labels each question by its wording/number. */}
              <div className="space-y-2">
                <Label htmlFor="q-text" className="text-xs font-semibold text-foreground">
                  Enunciado de la Pregunta
                </Label>
                <Input
                  id="q-text"
                  value={activeQuestion?.text || ""}
                  onChange={(e) => handleQuestionChange({ text: e.target.value })}
                  className="h-10 text-sm focus-ring"
                />
              </div>

              {/* Answers Panel */}
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Opciones de Respuestas
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Marca la opción correcta con el botón verde. Mínimo 2 opciones.
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeQuestion?.answers.map((answer, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <UIButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newAnswers = activeQuestion.answers.map((ans, idx) =>
                            idx === i ? { ...ans, correct: !ans.correct } : ans
                          );
                          handleQuestionChange({ answers: newAnswers });
                        }}
                        className={
                          "h-10 w-10 shrink-0 rounded-lg border transition-all duration-fast focus-ring " +
                          (answer.correct
                            ? "border-success bg-success text-success-foreground hover:bg-success/90"
                            : "border-input bg-card text-muted-foreground hover:bg-muted/40")
                        }
                        title={answer.correct ? "Opción correcta" : "Marcar como correcta"}
                      >
                        <Check className="h-4 w-4" />
                      </UIButton>
                      <Input
                        value={answer.text}
                        onChange={(e) => {
                          const newAnswers = activeQuestion.answers.map((ans, idx) =>
                            idx === i ? { ...ans, text: e.target.value } : ans
                          );
                          handleQuestionChange({ answers: newAnswers });
                        }}
                        className={
                          "h-10 text-sm focus-ring " +
                          (answer.correct
                            ? "border-success/40 bg-success/[0.03] text-foreground font-medium"
                            : "")
                        }
                      />
                      <UIButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newAnswers = activeQuestion.answers.filter((_, idx) => idx !== i);
                          handleQuestionChange({ answers: newAnswers });
                        }}
                        disabled={activeQuestion.answers.length <= 2}
                        className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-40"
                        title="Eliminar respuesta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </UIButton>
                    </div>
                  ))}
                </div>

                <UIButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newAnswers = [
                      ...activeQuestion.answers,
                      { text: `Nueva opción ${activeQuestion.answers.length + 1}`, correct: false },
                    ];
                    handleQuestionChange({ answers: newAnswers });
                  }}
                  className="text-xs font-semibold focus-ring h-9 border hover:bg-muted/40 transition-colors duration-fast"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Añadir respuesta
                </UIButton>
              </div>

              {/* Explanation + related lesson section, unified into one block:
                  the didactic explanation with its related-section selector and
                  quote integrated directly beneath it. */}
              <div className="space-y-4 rounded-card border bg-muted/30 p-4">
                <div className="space-y-2">
                <Label htmlFor="q-exp" className="text-xs font-semibold text-foreground">
                  Explicación didáctica
                </Label>
                <Textarea
                  id="q-exp"
                  rows={2}
                  value={activeQuestion?.explanation || ""}
                  onChange={(e) => handleQuestionChange({ explanation: e.target.value })}
                  placeholder="Explica detalladamente por qué la respuesta marcada es la correcta..."
                  className="text-sm focus-ring leading-relaxed placeholder:text-muted-foreground/30"
                />
                <p className="text-[11px] text-muted-foreground/80 leading-normal">
                  Esta explicación se presentará al estudiante en cuanto envíe su respuesta para consolidar el aprendizaje.
                </p>
                </div>

                <Separator />

                {/* Cita de la lección — an OPTIONAL deep-link back into the
                    lesson. Not a second textarea: empty by default behind a
                    button, and once linked it renders as the read-only styled
                    blockquote the student actually sees. The exact fragment is
                    chosen from the lesson (sidebar), never re-typed here. */}
                <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Cita de la lección
                  <span className="ml-1.5 font-normal text-muted-foreground/70">
                    · opcional
                  </span>
                </Label>

                {!lessonRef ? (
                  // Empty state — opens the lesson picker directly. No section
                  // step: the question already belongs to a specific lesson.
                  <UIButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openQuotePicker()}
                    className="h-9 w-full justify-center border-dashed text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    Citar de la lección
                  </UIButton>
                ) : (
                  // Linked — read-only quote exactly as the student sees it
                  // (same shared card as the quiz review, minus the deep link).
                  <div className="space-y-2">
                    <LessonQuoteCard
                      label={`Lección 2.${activeQuestionLesson?.order} · ${lessonRef.section}`}
                      quote={lessonRef.quote}
                      sentence={lessonRef.sentence}
                      color={lessonRef.color}
                    />
                    <div className="flex items-center gap-2">
                      <UIButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openQuotePicker(lessonRef.color)}
                        className="h-8 text-xs font-semibold"
                      >
                        <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                        Cambiar cita
                      </UIButton>
                      <UIButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuestionChange({ lessonRef: null })}
                        className="h-8 text-xs font-semibold text-muted-foreground hover:text-destructive"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Quitar
                      </UIButton>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground/80 leading-normal">
                  Al revisar su respuesta, el estudiante verá esta cita y un enlace directo a la sección de la lección.
                </p>
                </div>
              </div>

              <Separator />

              {/* Action buttons footer for questions */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {activeQuestion?.dirty ? (
                    <span className="flex items-center gap-1 text-brand-warm font-medium">
                      <span className="h-1.5 w-1.5 rounded-pill bg-brand-warm animate-pulse" />
                      Cambios sin guardar en pregunta
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-success font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Pregunta sincronizada
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  {questionSaveStatus === "dirty" ? (
                    <UIButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQuestionsList(initialQuestions);
                        setQuestionSaveStatus("idle");
                      }}
                      className="text-muted-foreground font-medium h-9 text-xs"
                    >
                      Descartar
                    </UIButton>
                  ) : null}
                  <Button
                    onClick={saveQuestion}
                    disabled={questionSaveStatus !== "dirty"}
                    className="transition-all duration-normal text-xs font-semibold shadow-card focus-ring h-10"
                  >
                    {questionSaveStatus === "saving" ? (
                      <>
                        <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        Guardando...
                      </>
                    ) : questionSaveStatus === "saved" ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-success" />
                        ¡Guardado con éxito!
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Guardar pregunta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </section>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed bg-card p-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground font-sans">
                    Esta lección aún no tiene preguntas
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground font-sans">
                    Añade la primera pregunta del test de esta lección.
                  </p>
                </div>
                <UIButton
                  onClick={createNewQuestion}
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nueva pregunta
                </UIButton>
              </div>
            )}
              </div>
            </div>

            {/* Sidebar: pick the exact lesson passage to quote. Whatever the
                teacher highlights becomes the quote AND the deep-link target,
                so the student lands on that exact text in the lesson. */}
            <Sheet open={refSheetOpen} onOpenChange={setRefSheetOpen}>
              <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
              >
                <SheetHeader className="px-6 pt-6 text-left">
                  <SheetTitle className="text-base">
                    Seleccionar cita de la lección
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Arrastra para resaltar (o pulsa) el texto exacto de «
                    {activeQuestionLesson?.title ?? "la lección"}» que verá el
                    estudiante. La sección y la frase se detectan solas.
                  </SheetDescription>
                </SheetHeader>
                {/* Real student-rendered lesson. Text is selectable; multimedia
                    (charts, diagrams, images, video) renders for context but is
                    not selectable, so a drag only ever captures clean prose. */}
                <div
                  ref={pickerScrollRef}
                  onScroll={handlePickerScroll}
                  onMouseUp={capturePickerSelection}
                  className="quote-picker relative flex-1 overflow-y-auto"
                >
                  <style>{`
                    .quote-picker [data-slate-void="true"] {
                      user-select: none;
                      opacity: 0.6;
                    }
                    /* Scale the rendered lesson down so its reader typography
                       sits closer to the sidebar's scale (the shared READER
                       classes that drive the real student page stay untouched). */
                    .quote-picker-doc :is(p, ul, ol, blockquote, li) {
                      font-size: 13.5px;
                      line-height: 1.6;
                    }
                    .quote-picker-doc :is(p, ul, ol, blockquote) {
                      margin-top: 0.5rem;
                      margin-bottom: 0.5rem;
                    }
                    .quote-picker-doc :is(h1, h2) {
                      font-size: 1.05rem;
                      margin: 1rem 0 0.35rem;
                    }
                    .quote-picker-doc :is(h3, h4, h5, h6) {
                      font-size: 0.95rem;
                      margin: 0.85rem 0 0.3rem;
                    }
                  `}</style>
                  {pickerSection && (
                    <div className="sticky top-0 z-10 border-b bg-background/95 px-6 py-1.5 backdrop-blur">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-primary font-sans">
                        <BookOpen className="h-3 w-3" />
                        Estás en · {pickerSection}
                      </p>
                    </div>
                  )}
                  <div className="quote-picker-doc px-6 py-4">
                    {activeQuestionLesson ? (
                      <LessonPreview content={activeQuestionLesson.content} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Esta pregunta no tiene una lección asociada.
                      </p>
                    )}
                  </div>
                </div>
                <SheetFooter className="flex-col gap-2.5 border-t px-6 py-3 sm:flex-col sm:space-x-0">
                  {/* Highlight color picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Color del resaltado
                    </span>
                    <div className="flex items-center gap-1.5">
                      {HIGHLIGHT_COLORS.map((c) => {
                        const selected = c.rgb === pendingColor;
                        return (
                          <button
                            key={c.key}
                            type="button"
                            title={c.label}
                            aria-label={c.label}
                            aria-pressed={selected}
                            onClick={() => setPendingColor(c.rgb)}
                            className={cn(
                              "h-6 w-6 rounded-full border transition-transform duration-fast focus-ring",
                              selected
                                ? "ring-2 ring-offset-1 ring-foreground/40 scale-110"
                                : "hover:scale-110",
                            )}
                            style={{
                              backgroundColor: `rgba(${c.rgb}, 0.55)`,
                              borderColor: `rgb(${c.rgb})`,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {/* Live preview — the fragment in its sentence, as the
                      student's quote box (Variant A) will render it. */}
                  {pendingQuote ? (
                    <div className="rounded-md bg-muted/50 px-3 py-2">
                      {pendingSection && (
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand-primary font-sans">
                          {pendingSection}
                        </p>
                      )}
                      <p className="text-xs leading-relaxed text-foreground font-sans">
                        <QuoteSentence
                          quote={pendingQuote}
                          sentence={pendingSentence}
                          color={pendingColor}
                        />
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      Selecciona o pulsa un texto arriba…
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <SheetClose asChild>
                      <UIButton variant="outline" size="sm" className="h-9">
                        Cancelar
                      </UIButton>
                    </SheetClose>
                    <Button
                      size="sm"
                      disabled={!pendingQuote}
                      onClick={() => {
                        if (pendingQuote) {
                          handleQuestionChange({
                            lessonRef: {
                              section:
                                pendingSection ||
                                lessonRef?.section ||
                                lessonSections[0]?.heading ||
                                "",
                              quote: pendingQuote,
                              sentence: pendingSentence || pendingQuote,
                              color: pendingColor,
                            },
                          });
                        }
                        setRefSheetOpen(false);
                      }}
                      className="h-9 text-xs font-semibold"
                    >
                      Usar como cita
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Bubble Menu (Notion-style) */}
      {bubbleMenu && bubbleMenu.show && (
        <div
          className="floating-bubble-menu fixed z-50 flex items-center gap-0.5 rounded-full border bg-background/95 backdrop-blur-md px-2 py-1 shadow-popover animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${bubbleMenu.y}px`,
            left: `${bubbleMenu.x}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("bold", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground animate-none"
            title="Negrita"
          >
            <Bold className="h-3.5 w-3.5" />
          </UIButton>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("italic", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground animate-none"
            title="Cursiva"
          >
            <Italic className="h-3.5 w-3.5" />
          </UIButton>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("link", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground animate-none"
            title="Enlace"
          >
            <Link2 className="h-3.5 w-3.5" />
          </UIButton>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("list", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground animate-none"
            title="Lista de viñetas"
          >
            <List className="h-3.5 w-3.5" />
          </UIButton>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("code", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground animate-none"
            title="Código"
          >
            <FileCode className="h-3.5 w-3.5" />
          </UIButton>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("video", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-brand-primary animate-none"
            title="Vídeo"
          >
            <Video className="h-3.5 w-3.5" />
          </UIButton>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("objectives", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-brand-primary animate-none"
            title="Objetivos"
          >
            <Target className="h-3.5 w-3.5" />
          </UIButton>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => insertMarkdown("keyidea", bubbleMenu.targetId)}
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-brand-primary animate-none"
            title="Idea clave"
          >
            <Lightbulb className="h-3.5 w-3.5" />
          </UIButton>
          <div className="mx-0.5 h-5 w-px self-center bg-border" />
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              openQuoteToQuestion(bubbleMenu.targetId, bubbleMenu.x, bubbleMenu.y + 34)
            }
            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-brand-primary animate-none"
            title="Usar como cita en una pregunta"
          >
            <MessageSquareQuote className="h-3.5 w-3.5" />
          </UIButton>
        </div>
      )}

      {/* Custom Context Menu */}
      {contextMenu && contextMenu.show && (
        <div
          className="custom-context-menu fixed z-50 w-52 rounded-xl border bg-background/95 backdrop-blur-md p-1.5 shadow-popover animate-in fade-in zoom-in-95 duration-100 text-left"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">
            Formato de Texto
          </div>
          <button
            type="button"
            onClick={() => insertMarkdown("bold", contextMenu.targetId)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <Bold className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Negrita</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("italic", contextMenu.targetId)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <Italic className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Cursiva</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("link", contextMenu.targetId)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Insertar Enlace</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("list", contextMenu.targetId)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <List className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Lista de viñetas</span>
          </button>

          <Separator className="my-1.5" />

          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">
            Bloques MDX
          </div>
          <button
            type="button"
            onClick={() => insertMarkdown("video", contextMenu.targetId)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <Video className="h-3.5 w-3.5 text-brand-primary" />
            <span>Insertar Vídeo</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("objectives", contextMenu.targetId)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <Target className="h-3.5 w-3.5 text-brand-warm" />
            <span>Insertar Objetivos</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("keyidea", contextMenu.targetId)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <Lightbulb className="h-3.5 w-3.5 text-brand-warm" />
            <span>Insertar Idea Clave</span>
          </button>

          <Separator className="my-1.5" />

          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">
            Pregunta
          </div>
          <button
            type="button"
            onClick={() =>
              openQuoteToQuestion(
                contextMenu.targetId,
                contextMenu.x + 12,
                contextMenu.y + 12,
              )
            }
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
          >
            <MessageSquareQuote className="h-3.5 w-3.5 text-brand-primary" />
            <span>Usar como cita en una pregunta</span>
          </button>
        </div>
      )}

      {/* Submenu: pick which question the selected quote attaches to */}
      {quoteToQuestion && (
        <div
          className="quote-question-menu fixed z-50 w-64 rounded-xl border bg-background/95 backdrop-blur-md p-1.5 shadow-popover animate-in fade-in zoom-in-95 duration-100 text-left"
          style={{ top: `${quoteToQuestion.y}px`, left: `${quoteToQuestion.x}px` }}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-sans">
            Añadir cita a…
          </div>
          <p className="mb-1 px-2.5 text-[11px] italic leading-snug text-muted-foreground line-clamp-2">
            “{quoteToQuestion.quote}”
          </p>
          <div className="max-h-56 overflow-y-auto">
            {questionsList.filter((q) => q.lessonId === activeLesson?.id).length === 0 ? (
              <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
                Esta lección aún no tiene preguntas.
              </p>
            ) : (
              questionsList
                .filter((q) => q.lessonId === activeLesson?.id)
                .map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => applyQuoteToQuestion(q.id)}
                    className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <span className="mt-0.5 shrink-0 font-bold text-brand-primary">
                      P{i + 1}
                    </span>
                    <span className="line-clamp-2 leading-snug">{q.text}</span>
                    {q.lessonRef && (
                      <BookOpen className="ml-auto mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                    )}
                  </button>
                ))
            )}
          </div>

          <Separator className="my-1.5" />

          <button
            type="button"
            onClick={createQuestionWithQuote}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 transition-colors text-left"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva pregunta con esta cita</span>
          </button>
        </div>
      )}

      {/* Transient confirmation after pushing a quote to a question */}
      {quoteConfirm && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 rounded-full border bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-popover">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            {quoteConfirm}
          </div>
        </div>
      )}

      {/* WordPress-style Media/Link Insertion Modal */}
      {mediaModal && mediaModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="floating-bubble-menu w-full max-w-md rounded-xl border bg-background p-5 shadow-modal animate-in zoom-in-95 duration-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold font-sans text-foreground flex items-center gap-2">
                {mediaModal.type === "video" ? (
                  <>
                    <Video className="h-4 w-4 text-brand-primary animate-pulse" />
                    Insertar Vídeo (WordPress R2 Block)
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 text-brand-primary" />
                    Insertar Enlace
                  </>
                )}
              </h3>
              <UIButton
                variant="ghost"
                size="icon"
                onClick={() => setMediaModal(null)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </UIButton>
            </div>

            <div className="space-y-3.5 font-sans">
              <div className="space-y-1.5">
                <Label htmlFor="media-url" className="text-xs font-semibold text-foreground">
                  {mediaModal.type === "video" ? "Ruta o URL del vídeo" : "URL del enlace"}
                </Label>
                <Input
                  id="media-url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={mediaModal.type === "video" ? "storage.r2/civil-u2-l1.mp4" : "https://ejemplo.com"}
                  className="h-9 text-xs focus-ring"
                />
              </div>

              {mediaModal.type === "video" && (
                <>
                  {activeLesson?.files && activeLesson.files.length > 0 ? (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Usar recurso de R2
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {activeLesson.files.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setMediaUrl(`storage.r2/${file.name}`)}
                            className="text-[10px] bg-muted/60 hover:bg-muted text-foreground px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all duration-fast"
                          >
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                            {file.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-3 text-center text-[10px] text-muted-foreground bg-muted/10">
                      Consejo: Puedes subir un vídeo en la barra lateral "Archivos en R2" y aparecerá aquí para usarlo rápidamente.
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="media-label" className="text-xs font-semibold text-foreground">
                  {mediaModal.type === "video" ? "Etiqueta del vídeo" : "Texto a mostrar"}
                </Label>
                <Input
                  id="media-label"
                  value={mediaUrl && mediaLabel === "storage.r2/civil-u2-l1.mp4" ? "Vídeo de la lección" : mediaLabel}
                  onChange={(e) => setMediaLabel(e.target.value)}
                  placeholder={mediaModal.type === "video" ? "Vídeo explicativo" : "Haz clic aquí"}
                  className="h-9 text-xs focus-ring"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <UIButton
                variant="ghost"
                onClick={() => setMediaModal(null)}
                className="h-9 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </UIButton>
              <Button
                onClick={handleMediaInsert}
                className="h-9 text-xs font-semibold"
              >
                Insertar bloque
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library picker (WP-style, replaces the URL prompt for video/library) */}
      <Dialog
        open={!!mediaPicker?.open}
        onOpenChange={(open) => {
          if (!open) setMediaPicker(null);
        }}
      >
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto p-0 sm:rounded-card">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Library className="h-4 w-4 text-brand-primary" />
              {mediaPicker?.mode === "resource"
                ? "Adjuntar recurso desde la biblioteca"
                : mediaPicker?.mode === "hero"
                  ? "Elegir imagen para el hero"
                  : "Insertar desde la biblioteca"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5">
            {mediaPicker && (
              <MediaLibraryPanel
                mode={mediaPicker.mode === "resource" ? "picker-resource" : "picker-insert"}
                initialTypeFilter={mediaPicker.typeFilter}
                initialSubjectFilter="civil"
                onInsert={
                  mediaPicker.mode === "hero" ? handlePickerHero : handlePickerInsert
                }
                onAttach={handlePickerAttach}
                insertLabel={
                  mediaPicker.mode === "hero" ? "Usar como imagen del hero" : undefined
                }
                embedded
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
