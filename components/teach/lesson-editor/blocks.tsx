'use client';

/**
 * Plate plugins + render components for the lesson editor's custom blocks.
 * Visual styling mirrors the read-only render in BuilderWorkspace's legacy
 * `parseMarkdown` so the editor preview matches the student lesson view.
 */
import * as React from 'react';
import {
  createPlatePlugin,
  PlateElement,
  PlateLeaf,
  useEditorRef,
  type PlateElementProps,
  type PlateLeafProps,
} from 'platejs/react';
import { Target, Lightbulb, Play, Video as VideoIcon, Image as ImageIcon, Pencil, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MermaidDiagram } from '@/components/lesson/MermaidDiagram';
import { ChartView } from '@/components/lesson/ChartView';
import { InlineRich } from '@/components/lesson/inline-rich';
import { useCiteNumber } from '@/components/lesson/citations-view';
import { resourceExt } from '@/components/lesson/blocks';
import { OBJECTIVES, KEY_IDEA, VIDEO, DIAGRAM, CHART, DEFINITION, CITE, RESOURCE } from './markdown-rules';

export const OBJECTIVES_DEFAULT_TITLE = 'Al terminar serás capaz de:';

/**
 * Media (image / video) edit affordance. Like the diagram/chart blocks, the
 * Image and Video elements expose a hover "Editar" button that reopens the media
 * library to replace the asset at `path`. The dialog state lives in the editor
 * shell (LessonPlateEditor), provided through this context. The read-only preview
 * does not provide it, so the button only appears in the editor.
 */
export type MediaDialogCtx = {
  openEditor: (path: number[], type: 'image' | 'video' | 'resource') => void;
};
export const MediaDialogContext = React.createContext<MediaDialogCtx | null>(null);

// Shared hover "Editar" pill used by the void media/diagram/chart blocks.
function BlockEditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md border bg-card/95 px-2 py-1 font-sans text-xs font-medium text-muted-foreground opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
    >
      <Pencil className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ObjectivesElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const element = props.element as { title?: string };
  const title = element.title ?? OBJECTIVES_DEFAULT_TITLE;
  // Local draft so typing is smooth (writing to Slate on every keystroke resets
  // the field and staleens the element ref). Persist to Slate on blur.
  const [draft, setDraft] = React.useState(title);
  React.useEffect(() => setDraft(title), [title]);
  const commit = () => {
    const path = editor.api.findPath(props.element);
    if (path) editor.tf.setNodes({ title: draft } as any, { at: path });
  };
  return (
    <PlateElement
      {...props}
      className={cn('rounded-card border border-border bg-muted/50 p-5 my-6')}
    >
      <div
        contentEditable={false}
        className="mb-3 flex select-none items-center gap-2 font-sans text-sm font-semibold text-foreground"
      >
        <Target className="h-4 w-4 shrink-0 text-brand-warm" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          aria-label="Título del bloque de objetivos"
          className="w-full bg-transparent font-sans text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 focus:underline focus:decoration-dotted focus:underline-offset-4"
          placeholder={OBJECTIVES_DEFAULT_TITLE}
        />
      </div>
      <div className="[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 font-reader text-[16px] leading-[1.6] text-muted-foreground [&_li]:marker:text-brand-primary">
        {props.children}
      </div>
    </PlateElement>
  );
}

function KeyIdeaElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className={cn(
        'rounded-card border border-border bg-background p-5 my-6 shadow-card',
      )}
    >
      <div
        contentEditable={false}
        className="mb-2 flex select-none items-center gap-2 font-sans text-sm font-semibold text-foreground"
      >
        <Lightbulb className="h-4 w-4 text-brand-warm fill-brand-warm/25" />
        Idea clave
      </div>
      <div className="font-reader text-[15px] leading-[1.65] text-muted-foreground">
        {props.children}
      </div>
    </PlateElement>
  );
}

function VideoElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const ctx = React.useContext(MediaDialogContext);
  const element = props.element as { url?: string; label?: string };
  const label = element.label || '';
  const onEdit = () => {
    const path = editor.api.findPath(props.element);
    if (path && ctx) ctx.openEditor(path, 'video');
  };
  // Inline-editable label — local draft committed to the node on blur, mirroring
  // the image caption / Objectives title inputs.
  const [draft, setDraft] = React.useState(label);
  React.useEffect(() => setDraft(label), [label]);
  const commitLabel = () => {
    if (draft === label) return;
    const path = editor.api.findPath(props.element);
    if (path) editor.tf.setNodes({ label: draft } as any, { at: path });
  };
  return (
    <PlateElement {...props} className="my-6">
      <div contentEditable={false} className="group relative select-none space-y-3">
        <div className="overflow-hidden rounded-card border bg-card shadow-card">
          <div className="flex aspect-video items-center justify-center bg-slate-900">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 backdrop-blur-sm">
              <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <VideoIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitLabel}
            aria-label="Etiqueta del vídeo"
            placeholder="Añade una etiqueta…"
            className="w-full bg-transparent font-sans text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:underline focus:decoration-dotted focus:underline-offset-4"
          />
        </div>
        {ctx && <BlockEditButton onClick={onEdit} label="Editar vídeo" />}
      </div>
      {props.children}
    </PlateElement>
  );
}

function ResourceElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const ctx = React.useContext(MediaDialogContext);
  const element = props.element as { url?: string; name?: string; size?: string; ext?: string };
  const name = element.name || 'Recurso descargable';
  const badge = (element.ext || resourceExt(element.name)).toUpperCase();
  const meta = [badge, element.size].filter(Boolean).join(' · ');
  const onEdit = () => {
    const path = editor.api.findPath(props.element);
    if (path && ctx) ctx.openEditor(path, 'resource');
  };
  return (
    <PlateElement {...props} className="my-6">
      <div
        contentEditable={false}
        data-resource-url={element.url}
        className="group relative flex select-none items-center gap-4 rounded-card border-2 border-dashed border-border bg-card p-6 shadow-card"
      >
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-card bg-brand-primary/10 text-brand-primary">
          <FileText className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-base font-semibold text-foreground">
            {name}
          </span>
          <span className="block text-xs text-muted-foreground">{meta}</span>
        </span>
        <span className="flex flex-shrink-0 items-center gap-1.5 rounded-md bg-brand-primary px-4 py-2 font-sans text-sm font-medium text-white shadow-card">
          <Download className="h-4 w-4" />
          Descargar
        </span>
        {ctx && <BlockEditButton onClick={onEdit} label="Editar recurso" />}
      </div>
      {props.children}
    </PlateElement>
  );
}

function ImageElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const ctx = React.useContext(MediaDialogContext);
  const element = props.element as { url?: string; caption?: { text: string }[] };
  const alt = element.caption?.map((c) => c.text).join('') || '';
  const url = element.url || '';
  const isRemote = /^https?:\/\//.test(url);
  const onEdit = () => {
    const path = editor.api.findPath(props.element);
    if (path && ctx) ctx.openEditor(path, 'image');
  };
  // Inline-editable caption — local draft so typing stays smooth (writing to Slate
  // on every keystroke staleens the element ref); persist to the node on blur.
  // Mirrors the Objectives block title input.
  const [draft, setDraft] = React.useState(alt);
  React.useEffect(() => setDraft(alt), [alt]);
  const commitCaption = () => {
    if (draft === alt) return;
    const path = editor.api.findPath(props.element);
    if (path) editor.tf.setNodes({ caption: [{ text: draft }] } as any, { at: path });
  };
  return (
    <PlateElement {...props} className="my-6">
      <figure contentEditable={false} className="group relative select-none space-y-2">
        {isRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} className="w-full rounded-card border bg-card shadow-card" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-card border border-dashed bg-muted/40 text-muted-foreground">
            <span className="flex flex-col items-center gap-2 text-xs">
              <ImageIcon className="h-7 w-7 opacity-60" />
              {url || 'Imagen'}
            </span>
          </div>
        )}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitCaption}
          aria-label="Pie de foto"
          placeholder="Añade un pie de foto…"
          className="w-full bg-transparent px-1 font-sans text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:underline focus:decoration-dotted focus:underline-offset-4"
        />
        {ctx && <BlockEditButton onClick={onEdit} label="Editar imagen" />}
      </figure>
      {props.children}
    </PlateElement>
  );
}

/**
 * Diagram (Mermaid) — a void block rendering a live preview. The mermaid source
 * lives in the node's `code` prop and serializes to a ```mermaid fence (see
 * markdown-rules). Editing is done through a dialog (form builder + raw source),
 * opened via DiagramDialogContext so the dialog state can live in the editor shell.
 */
export type DiagramDialogCtx = {
  /** Open the dialog to edit the diagram at `path`, pre-filled with `code`. */
  openEditor: (path: number[], code: string) => void;
};
export const DiagramDialogContext = React.createContext<DiagramDialogCtx | null>(null);

function DiagramElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const ctx = React.useContext(DiagramDialogContext);
  const element = props.element as { code?: string };
  const code = element.code || '';
  const onEdit = () => {
    const path = editor.api.findPath(props.element);
    if (path && ctx) ctx.openEditor(path, code);
  };
  return (
    <PlateElement {...props} className="my-6">
      <div contentEditable={false} className="group relative select-none">
        <MermaidDiagram code={code} className="my-0" />
        <button
          type="button"
          onClick={onEdit}
          className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md border bg-card/95 px-2 py-1 font-sans text-xs font-medium text-muted-foreground opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar diagrama
        </button>
      </div>
      {props.children}
    </PlateElement>
  );
}

/**
 * Chart (recharts) — a void block rendering a live preview. The JSON config lives
 * in the node's `config` prop and serializes to a ```chart fence (see markdown-rules).
 * Edited via a dialog opened through ChartDialogContext.
 */
export type ChartDialogCtx = {
  /** Open the dialog to edit the chart at `path`, pre-filled with JSON `config`. */
  openEditor: (path: number[], config: string) => void;
};
export const ChartDialogContext = React.createContext<ChartDialogCtx | null>(null);

function ChartElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const ctx = React.useContext(ChartDialogContext);
  const element = props.element as { config?: string };
  const config = element.config || '';
  const onEdit = () => {
    const path = editor.api.findPath(props.element);
    if (path && ctx) ctx.openEditor(path, config);
  };
  return (
    <PlateElement {...props} className="my-6">
      <div contentEditable={false} className="group relative select-none">
        <ChartView config={config} className="my-0" />
        <button
          type="button"
          onClick={onEdit}
          className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md border bg-card/95 px-2 py-1 font-sans text-xs font-medium text-muted-foreground opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar gráfico
        </button>
      </div>
      {props.children}
    </PlateElement>
  );
}

export const ImagePlugin = createPlatePlugin({
  key: 'img',
  node: { isElement: true, isVoid: true, type: 'img' },
}).withComponent(ImageElement);

// Hyperlink — an inline element (type `a`, `url` prop) that serializes to the
// standard markdown `[text](url)`. Registering it as inline is what lets links
// wrap a run of text rather than breaking the line into a block. The render
// component lives in ./nodes (editor) and ./static-nodes (preview).
export const LinkPlugin = createPlatePlugin({
  key: 'a',
  node: { isElement: true, isInline: true, type: 'a' },
});

// Definition (glossary term) — an inline element wrapping a run of text, with the
// definition in a `def` prop. Dotted underline + a definition box on hover (CSS
// only, so it behaves the same in the editor, preview and student reader).
function DefinitionElement(props: PlateElementProps) {
  const def = (props.element as { def?: string }).def || '';
  return (
    <PlateElement
      {...props}
      as="span"
      className="group/def relative inline cursor-help underline decoration-dotted decoration-brand-primary/60 underline-offset-4"
    >
      {props.children}
      {def && (
        <span
          contentEditable={false}
          className="absolute left-0 top-full z-50 hidden w-max max-w-xs select-none rounded-md border bg-card px-3 py-2 font-sans text-xs font-normal leading-snug text-foreground shadow-card group-hover/def:block"
        >
          <InlineRich text={def} />
        </span>
      )}
    </PlateElement>
  );
}

export const DefinitionPlugin = createPlatePlugin({
  key: DEFINITION,
  node: { isElement: true, isInline: true, type: DEFINITION },
}).withComponent(DefinitionElement);

// Citation marker — an inline void element rendering a superscript number (its
// position among the lesson's citations). Clicking it opens the edit dialog
// (provided through CiteDialogContext from the editor shell).
export type CiteDialogCtx = {
  openEditor: (path: number[]) => void;
};
export const CiteDialogContext = React.createContext<CiteDialogCtx | null>(null);

function CiteElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const ctx = React.useContext(CiteDialogContext);
  const cid = (props.element as { cid?: string }).cid;
  const n = useCiteNumber(cid);
  const onEdit = () => {
    const path = editor.api.findPath(props.element);
    if (path && ctx) ctx.openEditor(path);
  };
  return (
    <PlateElement {...props} as="span">
      <sup
        contentEditable={false}
        onClick={onEdit}
        title="Editar cita"
        className="ml-0.5 cursor-pointer rounded px-0.5 text-[0.7em] font-semibold leading-none text-brand-primary hover:bg-brand-primary/10"
      >
        [{n ?? '?'}]
      </sup>
      {props.children}
    </PlateElement>
  );
}

export const CitePlugin = createPlatePlugin({
  key: CITE,
  node: { isElement: true, isInline: true, isVoid: true, type: CITE },
}).withComponent(CiteElement);

export const DiagramPlugin = createPlatePlugin({
  key: DIAGRAM,
  node: { isElement: true, isVoid: true, type: DIAGRAM },
}).withComponent(DiagramElement);

export const ChartPlugin = createPlatePlugin({
  key: CHART,
  node: { isElement: true, isVoid: true, type: CHART },
}).withComponent(ChartElement);

export const ObjectivesPlugin = createPlatePlugin({
  key: OBJECTIVES,
  node: { isElement: true, type: OBJECTIVES },
}).withComponent(ObjectivesElement);

export const KeyIdeaPlugin = createPlatePlugin({
  key: KEY_IDEA,
  node: { isElement: true, type: KEY_IDEA },
}).withComponent(KeyIdeaElement);

export const VideoPlugin = createPlatePlugin({
  key: VIDEO,
  node: { isElement: true, isVoid: true, type: VIDEO },
}).withComponent(VideoElement);

export const ResourcePlugin = createPlatePlugin({
  key: RESOURCE,
  node: { isElement: true, isVoid: true, type: RESOURCE },
}).withComponent(ResourceElement);

// Highlight (background-color) as a single leaf element — one rounded span, so it
// doesn't double-render a sharp full-line-height rectangle like the basic-styles
// font plugin does. The mark key is `backgroundColor` (see markdown-rules).
function HighlightLeaf(props: PlateLeafProps) {
  const color = (props.leaf as { backgroundColor?: string }).backgroundColor;
  return (
    <PlateLeaf
      {...props}
      as="span"
      className={cn('rounded px-0.5', props.className)}
      style={{ ...props.style, backgroundColor: color }}
    />
  );
}

export const HighlightColorPlugin = createPlatePlugin({
  key: 'backgroundColor',
  node: { isLeaf: true },
}).withComponent(HighlightLeaf);

// Quote anchor — a leaf mark carrying the id of the question quote that lifted
// this text. Rendered as a dotted underline (teal) or dashed amber when the
// source has drifted, plus a small question chip. The chip/drift state come from
// QuoteAnchorContext (supplied by BuilderWorkspace via LessonPlateEditor) keyed
// by anchor id, so the leaf itself stays serialization-only (just the id).
export type AnchorMeta = Record<string, { label: string; drift: boolean }>;
export const QuoteAnchorContext = React.createContext<AnchorMeta>({});

function QuoteAnchorLeaf(props: PlateLeafProps) {
  const id = (props.leaf as { quoteAnchor?: string }).quoteAnchor;
  const meta = React.useContext(QuoteAnchorContext);
  const info = id ? meta[id] : undefined;
  const drift = info?.drift ?? false;
  // Pass data-quote-anchor through props.attributes so PlateLeaf's useNodeAttributes
  // spreads it onto the DOM element (PlateLeaf only forwards attributes, className,
  // style from its props; arbitrary HTML attributes must go through attributes).
  const augmentedAttributes = { ...props.attributes, 'data-quote-anchor': id } as any;
  return (
    <PlateLeaf
      {...props}
      as="span"
      attributes={augmentedAttributes}
      className={cn(
        'quote-anchor',
        drift
          ? 'border-b-2 border-dashed border-amber-500 bg-amber-500/[0.07]'
          : 'border-b-2 border-dotted border-brand-primary',
        props.className,
      )}
    >
      {props.children}
      {info?.label ? (
        <sup
          contentEditable={false}
          className={cn(
            'ml-0.5 select-none rounded px-1 align-super text-[9px] font-bold text-white',
            drift ? 'bg-amber-600' : 'bg-brand-primary',
          )}
        >
          {info.label}
        </sup>
      ) : null}
    </PlateLeaf>
  );
}

export const QuoteAnchorPlugin = createPlatePlugin({
  key: 'quoteAnchor',
  node: { isLeaf: true },
}).withComponent(QuoteAnchorLeaf);

export const lessonCustomPlugins = [
  ObjectivesPlugin,
  KeyIdeaPlugin,
  VideoPlugin,
  ResourcePlugin,
  ImagePlugin,
  LinkPlugin,
  DefinitionPlugin,
  CitePlugin,
  DiagramPlugin,
  ChartPlugin,
  HighlightColorPlugin,
  QuoteAnchorPlugin,
];
