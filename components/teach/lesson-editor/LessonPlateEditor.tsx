'use client';

/**
 * Block editor for lesson bodies. Reads/writes a markdown string (stored in
 * `lessons.contentText`), so it is a drop-in for the legacy <Textarea>.
 *
 * Mount with `key={lessonId}` so switching lessons remounts with fresh content
 * (the editor is created once per mount from the initial `value`).
 */
import * as React from 'react';
import { Plate, PlateContent, usePlateEditor, useEditorRef } from 'platejs/react';
import { MarkdownPlugin } from '@platejs/markdown';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Ban,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  ChevronDown,
  Quote,
  List as ListIcon,
  Target,
  Lightbulb,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Library,
  Workflow,
  BarChart3,
  Link2,
  Unlink,
  BookMarked,
  Superscript,
  FileDown,
  MessageSquareQuote,
} from 'lucide-react';
import { Button as UIButton } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  MediaLibraryPanel,
  type MediaAsset,
} from '@/components/teach/MediaLibraryPanel';
import { cn } from '@/lib/utils';
import { InlineRich } from '@/components/lesson/inline-rich';
import { collectFromNodes, orderCitations, type CiteRef } from '@/components/lesson/citations';
import { CitationsProvider, ReferenceList } from '@/components/lesson/citations-view';
import { DiagramDialogContext, ChartDialogContext, MediaDialogContext, CiteDialogContext, QuoteAnchorContext, type AnchorMeta } from './blocks';
import { lessonNodeComponents } from './nodes';
import { DiagramDialog } from './DiagramDialog';
import { ChartDialog } from './ChartDialog';
import { buildLessonPlugins } from './lessonPlugins';
import { OBJECTIVES, KEY_IDEA, VIDEO, DIAGRAM, CHART, DEFINITION, CITE, RESOURCE } from './markdown-rules';
import { resourceExt } from '@/components/lesson/blocks';

export interface LessonPlateEditorProps {
  /** Initial markdown content. */
  value: string;
  /** Called with serialized markdown whenever the document changes. */
  onChange: (markdown: string) => void;
  /**
   * Called when a downloadable resource is inserted, so the parent can attach the
   * file to the lesson's R2 resources sidebar (insertion-time linking). The parent
   * is expected to dedupe by name.
   */
  onAttachResource?: (file: { name: string; size: string; url: string }) => void;
  /**
   * Called when the teacher chooses "usar como cita en una pregunta" on a text
   * selection, with the captured reference and a screen anchor for the menu.
   */
  onUseAsQuote?: (data: QuoteCapture, anchor: { x: number; y: number }) => void;
  /** id → { chip label, drift } for rendering quote anchors in the body. */
  anchorMeta?: AnchorMeta;
  placeholder?: string;
  className?: string;
}

// Highlight palette — soft, readable background colors. Values are CSS colors so
// they round-trip as `<span style="background-color: …">`.
// Translucent (alpha) so highlights tint the page rather than paint an opaque
// block — keeps text readable in both light and dark mode.
const HIGHLIGHT_COLORS: { label: string; value: string }[] = [
  { label: 'Amarillo', value: 'rgba(250, 204, 21, 0.35)' },
  { label: 'Verde', value: 'rgba(74, 222, 128, 0.35)' },
  { label: 'Azul', value: 'rgba(56, 189, 248, 0.35)' },
  { label: 'Rosa', value: 'rgba(244, 114, 182, 0.35)' },
  { label: 'Naranja', value: 'rgba(251, 146, 60, 0.35)' },
];

// Shared editor actions (used by both the toolbar and the right-click menu).
// Read the current selection's text (empty if nothing selected), removing it so
// a new block replaces it.
function takeSelectedText(editor: any) {
  const hasSel = editor.selection && !editor.api.isCollapsed();
  const text = hasSel ? editor.api.string(editor.selection) : '';
  if (hasSel) editor.tf.delete();
  return text;
}

// Result of reading a quotable reference out of the current selection.
export type QuoteCapture =
  | { invalid: true }
  | { invalid: false; quote: string; sentence: string; section: string; anchorId: string }
  | null;

// Applies the quoteAnchor mark to the current selection and returns its new id.
// Mutating the doc triggers onChange, so the <QuoteAnchor> tag lands in the
// serialized markdown immediately (even before a question is picked).
function applyQuoteAnchor(editor: any): string {
  const id = `qa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  // addMark is the canonical Plate API for applying a mark to the active selection
  // (same pattern as backgroundColor highlight). It calls setNodes with split:true
  // internally, so the selection is correctly split at its boundaries.
  editor.tf.addMark('quoteAnchor', id);
  return id;
}

// Non-destructively derives a quote from the selection: the clean fragment, its
// sentence (the block's text), and the section (nearest heading above). Returns
// { invalid } for empty selections or ones inside media/void blocks.
export function captureQuoteSelection(editor: any): QuoteCapture {
  const sel = editor.selection;
  if (!sel || editor.api.isCollapsed()) return null;
  const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
  const quote = norm(editor.api.string(sel));
  if (!quote) return { invalid: true };
  const kids = (editor.children as any[]) || [];
  const topIndex = Math.min(sel.focus?.path?.[0] ?? 0, kids.length - 1);
  const MEDIA = ['img', 'image', 'mermaid', 'chart', 'video', 'hr', 'file'];
  const blockType = kids[topIndex]?.type;
  if (typeof blockType === 'string' && MEDIA.includes(blockType)) {
    return { invalid: true };
  }
  // Use the block as context only when the fragment fits inside it (single
  // block); a cross-block selection falls back to the fragment itself.
  let sentence = norm(editor.api.string([topIndex]));
  if (!sentence || !sentence.toLowerCase().includes(quote.toLowerCase())) {
    sentence = quote;
  }
  let section = '';
  for (let i = topIndex; i >= 0; i--) {
    const t = kids[i]?.type;
    if (typeof t === 'string' && /^h[1-6]$/.test(t)) {
      section = norm(editor.api.string([i]));
      break;
    }
  }
  // anchorId is a placeholder here — the real id is generated by applyQuoteAnchor
  // and spread in at the call sites; never rely on this value from captureQuoteSelection directly.
  return { invalid: false, quote, sentence, section, anchorId: '' };
}

// Screen anchor for the follow-up menu: just below the current selection.
function selectionAnchor(): { x: number; y: number } {
  const s = typeof window !== 'undefined' ? window.getSelection() : null;
  if (s && s.rangeCount > 0) {
    const r = s.getRangeAt(0).getBoundingClientRect();
    if (r && (r.width || r.height)) return { x: r.left, y: r.bottom + 8 };
  }
  return { x: 220, y: 180 };
}
function insertObjectivesNode(editor: any) {
  const text = takeSelectedText(editor);
  const items = text ? text.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
  const lis = (items.length ? items : ['']).map((t: string) => ({
    type: 'li',
    children: [{ type: 'lic', children: [{ text: t }] }],
  }));
  editor.tf.insertNodes({ type: OBJECTIVES, children: [{ type: 'ul', children: lis }] }, { select: true });
  editor.tf.focus();
}
function insertKeyIdeaNode(editor: any) {
  const text = takeSelectedText(editor);
  editor.tf.insertNodes(
    { type: KEY_IDEA, children: [{ type: 'p', children: [{ text: text.replace(/\n+/g, ' ') }] }] },
    { select: true },
  );
  editor.tf.focus();
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <UIButton
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      // keep focus in the editor so the transform applies to the selection
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-primary"
    >
      <Icon className="h-4 w-4" />
    </UIButton>
  );
}

function LessonEditorToolbar({
  onPickMedia,
  onInsertDiagram,
  onInsertChart,
  onInsertLink,
  onInsertDefinition,
  onInsertCite,
  onUseAsQuote,
}: {
  onPickMedia: (type: 'image' | 'video' | 'resource') => void;
  onInsertDiagram: () => void;
  onInsertChart: () => void;
  onInsertLink: () => void;
  onInsertDefinition: () => void;
  onInsertCite: () => void;
  onUseAsQuote?: (data: QuoteCapture, anchor: { x: number; y: number }) => void;
}) {
  const editor = useEditorRef();
  // Plugin-provided transforms (tf.bold.toggle, tf.h2.toggle, tf.toggle.bulletedList,
  // ...) are not visible through useEditorRef's generic type, though present at runtime.
  const tf = editor.tf as any;
  const run = (fn: () => void) => () => {
    fn();
    editor.tf.focus();
  };
  const insertObjectives = () => insertObjectivesNode(editor);
  const insertKeyIdea = () => insertKeyIdeaNode(editor);
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {/* Block type — headings are block-level, so this converts the whole line. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UIButton
            type="button"
            variant="ghost"
            size="sm"
            title="Tipo de bloque"
            aria-label="Tipo de bloque"
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 gap-1 px-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-primary data-[state=open]:bg-muted"
          >
            <Pilcrow className="h-4 w-4" />
            <ChevronDown className="h-3 w-3 opacity-60" />
          </UIButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={run(() => tf.toggleBlock('p'))}>
            <Pilcrow className="mr-2 h-4 w-4" />
            Texto normal
          </DropdownMenuItem>
          <DropdownMenuItem onClick={run(() => tf.toggleBlock('h1'))}>
            <Heading1 className="mr-2 h-4 w-4" />
            Título 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={run(() => tf.toggleBlock('h2'))}>
            <Heading2 className="mr-2 h-4 w-4" />
            Título 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={run(() => tf.toggleBlock('h3'))}>
            <Heading3 className="mr-2 h-4 w-4" />
            Título 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton icon={Bold} label="Negrita (⌘B)" onClick={run(() => tf.bold.toggle())} />
      <ToolbarButton icon={Italic} label="Cursiva (⌘I)" onClick={run(() => tf.italic.toggle())} />
      <ToolbarButton icon={UnderlineIcon} label="Subrayado (⌘U)" onClick={run(() => tf.underline.toggle())} />
      <ToolbarButton icon={Strikethrough} label="Tachado" onClick={run(() => tf.strikethrough.toggle())} />
      {/* Highlight with a color palette (background-color mark) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            title="Resaltar"
            aria-label="Resaltar"
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-primary data-[state=open]:bg-muted"
          >
            <Highlighter className="h-4 w-4" />
          </UIButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {HIGHLIGHT_COLORS.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={run(() => tf.addMark('backgroundColor', c.value))}
            >
              <span
                className="mr-2 h-4 w-4 rounded border border-border"
                style={{ backgroundColor: c.value }}
              />
              {c.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={run(() => tf.removeMark('backgroundColor'))}>
            <Ban className="mr-2 h-4 w-4" />
            Sin resaltado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToolbarButton icon={CodeIcon} label="Código" onClick={run(() => tf.code.toggle())} />
      <ToolbarButton icon={Link2} label="Insertar enlace" onClick={onInsertLink} />
      <ToolbarButton icon={BookMarked} label="Definición" onClick={onInsertDefinition} />
      <ToolbarButton icon={Superscript} label="Referencia / cita" onClick={onInsertCite} />
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton icon={ListIcon} label="Lista" onClick={run(() => tf.toggle.bulletedList())} />
      <ToolbarButton icon={Quote} label="Cita" onClick={run(() => tf.blockquote.toggle())} />
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        icon={Target}
        label="Bloque de Objetivos (usa el texto seleccionado)"
        onClick={insertObjectives}
      />
      <ToolbarButton
        icon={Lightbulb}
        label="Bloque de Idea Clave (usa el texto seleccionado)"
        onClick={insertKeyIdea}
      />
      <ToolbarButton icon={Workflow} label="Insertar diagrama" onClick={onInsertDiagram} />
      <ToolbarButton icon={BarChart3} label="Insertar gráfico" onClick={onInsertChart} />
      {onUseAsQuote && (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <ToolbarButton
            icon={MessageSquareQuote}
            label="Usar como cita en una pregunta"
            onClick={() => {
              const data = captureQuoteSelection(editor);
              if (data && !data.invalid) {
                const anchorId = applyQuoteAnchor(editor);
                onUseAsQuote({ ...data, anchorId }, selectionAnchor());
              } else {
                onUseAsQuote(data, selectionAnchor());
              }
            }}
          />
        </>
      )}
      {/* Attach media (image / video) from the media library */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UIButton
            type="button"
            variant="ghost"
            size="icon"
            title="Adjuntar media"
            aria-label="Adjuntar media"
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-primary data-[state=open]:bg-muted data-[state=open]:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </UIButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => onPickMedia('image')}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Insertar imagen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPickMedia('video')}>
            <VideoIcon className="mr-2 h-4 w-4" />
            Insertar vídeo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPickMedia('resource')}>
            <FileDown className="mr-2 h-4 w-4" />
            Recurso descargable
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Right-click menu over the editor — mirrors the toolbar's common actions, like
// the legacy markdown editor's context menu.
function EditorContextMenu({
  children,
  onPickMedia,
  onInsertDiagram,
  onInsertChart,
  onInsertLink,
  onInsertDefinition,
  onInsertCite,
  onUseAsQuote,
}: {
  children: React.ReactNode;
  onPickMedia: (type: 'image' | 'video' | 'resource') => void;
  onInsertDiagram: () => void;
  onInsertChart: () => void;
  onInsertLink: () => void;
  onInsertDefinition: () => void;
  onInsertCite: () => void;
  onUseAsQuote?: (data: QuoteCapture, anchor: { x: number; y: number }) => void;
}) {
  const editor = useEditorRef();
  const tf = editor.tf as any;
  const act = (fn: () => void) => () => {
    fn();
    editor.tf.focus();
  };
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onUseAsQuote && (
          <>
            <ContextMenuItem
              onClick={() => {
                const data = captureQuoteSelection(editor);
                if (data && !data.invalid) {
                  const anchorId = applyQuoteAnchor(editor);
                  onUseAsQuote({ ...data, anchorId }, selectionAnchor());
                } else {
                  onUseAsQuote(data, selectionAnchor());
                }
              }}
            >
              <MessageSquareQuote className="mr-2 h-4 w-4 text-brand-primary" />{' '}
              Usar como cita en una pregunta
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={act(() => tf.bold.toggle())}>
          <Bold className="mr-2 h-4 w-4" /> Negrita
        </ContextMenuItem>
        <ContextMenuItem onClick={act(() => tf.italic.toggle())}>
          <Italic className="mr-2 h-4 w-4" /> Cursiva
        </ContextMenuItem>
        <ContextMenuItem onClick={act(() => tf.underline.toggle())}>
          <UnderlineIcon className="mr-2 h-4 w-4" /> Subrayado
        </ContextMenuItem>
        <ContextMenuItem onClick={act(() => tf.code.toggle())}>
          <CodeIcon className="mr-2 h-4 w-4" /> Código
        </ContextMenuItem>
        <ContextMenuItem onClick={onInsertLink}>
          <Link2 className="mr-2 h-4 w-4" /> Insertar enlace
        </ContextMenuItem>
        <ContextMenuItem onClick={onInsertDefinition}>
          <BookMarked className="mr-2 h-4 w-4" /> Definición
        </ContextMenuItem>
        <ContextMenuItem onClick={onInsertCite}>
          <Superscript className="mr-2 h-4 w-4" /> Referencia / cita
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={act(() => tf.toggle.bulletedList())}>
          <ListIcon className="mr-2 h-4 w-4" /> Lista
        </ContextMenuItem>
        <ContextMenuItem onClick={act(() => tf.blockquote.toggle())}>
          <Quote className="mr-2 h-4 w-4" /> Cita
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => insertObjectivesNode(editor)}>
          <Target className="mr-2 h-4 w-4" /> Bloque de Objetivos
        </ContextMenuItem>
        <ContextMenuItem onClick={() => insertKeyIdeaNode(editor)}>
          <Lightbulb className="mr-2 h-4 w-4" /> Bloque de Idea Clave
        </ContextMenuItem>
        <ContextMenuItem onClick={onInsertDiagram}>
          <Workflow className="mr-2 h-4 w-4" /> Insertar diagrama
        </ContextMenuItem>
        <ContextMenuItem onClick={onInsertChart}>
          <BarChart3 className="mr-2 h-4 w-4" /> Insertar gráfico
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onPickMedia('image')}>
          <ImageIcon className="mr-2 h-4 w-4" /> Insertar imagen
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onPickMedia('video')}>
          <VideoIcon className="mr-2 h-4 w-4" /> Insertar vídeo
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onPickMedia('resource')}>
          <FileDown className="mr-2 h-4 w-4" /> Recurso descargable
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function LessonPlateEditor({
  value,
  onChange,
  onAttachResource,
  onUseAsQuote,
  anchorMeta,
  placeholder = 'Escribe aquí el contenido de la lección…',
  className,
}: LessonPlateEditorProps) {
  const editor = usePlateEditor({
    plugins: buildLessonPlugins({ editing: true }),
    components: lessonNodeComponents,
    value: (ed) => ed.getApi(MarkdownPlugin).markdown.deserialize(value || ''),
    // Normalize the initial value so TrailingBlockPlugin appends its empty
    // paragraph on mount. Without this, remounting (e.g. switching back from the
    // live preview) deserializes markdown that ends in a void block with no
    // trailing paragraph, leaving nowhere to type. This runs before onChange is
    // wired, so it doesn't mark the lesson dirty.
    shouldNormalizeEditor: true,
  });

  // Bumped on every real edit so the citation numbering (derived from the document)
  // recomputes; citations renumber live as they are added, removed or reordered.
  const [citeVersion, setCiteVersion] = React.useState(0);

  const handleChange = React.useCallback(() => {
    // Plate fires onChange for selection moves too; only propagate real edits so
    // clicking around doesn't mark the lesson dirty.
    const docChanged = editor.operations.some((op) => op.type !== 'set_selection');
    if (!docChanged) return;
    setCiteVersion((v) => v + 1);
    // TrailingBlockPlugin keeps an empty paragraph as the last node so the cursor
    // can sit after a trailing void block. Plate serializes that empty paragraph as
    // a zero-width space (U+200B) — which `\s` does NOT match — so strip trailing
    // whitespace AND zero-width/BOM chars, or it round-trips back into an empty
    // paragraph that renders as stray whitespace in the preview and student view.
    const markdown = editor
      .getApi(MarkdownPlugin)
      .markdown.serialize()
      .replace(/[\s\u200B\uFEFF]+$/, '');
    onChange(markdown);
  }, [editor, onChange]);

  // Media library picker — remembers where to insert (selection captured on open).
  // `mediaEditPath` is null when inserting a new asset, or the node path when
  // replacing an existing image/video (set via context from the block's "Editar"
  // button), mirroring the diagram/chart edit flow.
  const [mediaPick, setMediaPick] = React.useState<'image' | 'video' | 'resource' | null>(null);
  const savedSelection = React.useRef<typeof editor.selection>(null);
  const mediaEditPath = React.useRef<number[] | null>(null);
  // The current node's caption/label when opening the replace dialog, and whether
  // to keep it instead of overwriting it with the new asset's alt text. Defaults to
  // preserving (so hand-written captions aren't silently lost on replace).
  const [mediaText, setMediaText] = React.useState('');
  const [preserveMediaText, setPreserveMediaText] = React.useState(true);

  const handlePickMedia = React.useCallback(
    (type: 'image' | 'video' | 'resource') => {
      savedSelection.current = editor.selection;
      mediaEditPath.current = null;
      setMediaPick(type);
    },
    [editor],
  );

  const handleEditMedia = React.useCallback(
    (path: number[], type: 'image' | 'video' | 'resource') => {
      mediaEditPath.current = path;
      const node = editor.api.node(path)?.[0] as
        | { label?: string; caption?: { text: string }[] }
        | undefined;
      // The resource card has no inline caption/label to preserve — replacing it
      // always overwrites name/size/ext from the new asset.
      const text =
        type === 'video'
          ? node?.label ?? ''
          : type === 'image'
            ? node?.caption?.map((c) => c.text).join('') ?? ''
            : '';
      setMediaText(text);
      setPreserveMediaText(!!text);
      setMediaPick(type);
    },
    [editor],
  );

  const handleInsertAsset = React.useCallback(
    (asset: MediaAsset) => {
      const url = `storage.r2/${asset.r2Key}`;
      const tf = editor.tf as any;
      const isResource = mediaPick === 'resource';
      if (mediaEditPath.current) {
        if (isResource) {
          // Replace the resource at the existing node, refreshing its metadata.
          tf.setNodes(
            { url, name: asset.name, size: asset.size, ext: resourceExt(asset.name) },
            { at: mediaEditPath.current },
          );
        } else {
          // Replace the asset at the existing node, keeping its position. Keep the
          // current caption/label when the teacher opted to preserve it.
          const newText =
            asset.type === 'video'
              ? asset.alt || asset.description || 'Vídeo de la lección'
              : asset.alt || asset.name;
          const fields = preserveMediaText
            ? { url }
            : asset.type === 'video'
              ? { url, label: newText }
              : { url, caption: [{ text: newText }] };
          tf.setNodes(fields, { at: mediaEditPath.current });
        }
      } else if (isResource) {
        const node = {
          type: RESOURCE,
          url,
          name: asset.name,
          size: asset.size,
          ext: resourceExt(asset.name),
          children: [{ text: '' }],
        };
        const at = savedSelection.current ?? [editor.children.length];
        tf.insertNodes(node, { at, select: true });
        // Insertion-time linking: attach the file to the lesson's resources sidebar.
        onAttachResource?.({ name: asset.name, size: asset.size, url });
      } else {
        const node =
          asset.type === 'video'
            ? {
                type: VIDEO,
                url,
                label: asset.alt || asset.description || 'Vídeo de la lección',
                children: [{ text: '' }],
              }
            : {
                type: 'img',
                url,
                caption: [{ text: asset.alt || asset.name }],
                children: [{ text: '' }],
              };
        const at = savedSelection.current ?? [editor.children.length];
        tf.insertNodes(node, { at, select: true });
      }
      setMediaPick(null);
      mediaEditPath.current = null;
      setTimeout(() => editor.tf.focus(), 0);
    },
    [editor, preserveMediaText, mediaPick, onAttachResource],
  );

  const mediaCtx = React.useMemo(() => ({ openEditor: handleEditMedia }), [handleEditMedia]);

  // Diagram (Mermaid) insert/edit dialog. `editPath` is null when inserting a new
  // diagram, or the node path when editing an existing one (set via context from
  // the DiagramElement's "Editar diagrama" button).
  const [diagramOpen, setDiagramOpen] = React.useState(false);
  const [diagramCode, setDiagramCode] = React.useState('');
  const diagramEditPath = React.useRef<number[] | null>(null);

  const handleInsertDiagram = React.useCallback(() => {
    savedSelection.current = editor.selection;
    diagramEditPath.current = null;
    setDiagramCode('');
    setDiagramOpen(true);
  }, [editor]);

  const handleEditDiagram = React.useCallback((path: number[], code: string) => {
    diagramEditPath.current = path;
    setDiagramCode(code);
    setDiagramOpen(true);
  }, []);

  const handleSubmitDiagram = React.useCallback(
    (code: string) => {
      const tf = editor.tf as any;
      if (diagramEditPath.current) {
        tf.setNodes({ code }, { at: diagramEditPath.current });
      } else {
        const at = savedSelection.current ?? [editor.children.length];
        tf.insertNodes({ type: DIAGRAM, code, children: [{ text: '' }] }, { at, select: true });
      }
      setDiagramOpen(false);
      diagramEditPath.current = null;
      setTimeout(() => editor.tf.focus(), 0);
    },
    [editor],
  );

  const diagramCtx = React.useMemo(() => ({ openEditor: handleEditDiagram }), [handleEditDiagram]);

  // Chart (recharts) insert/edit dialog — mirrors the diagram dialog.
  const [chartOpen, setChartOpen] = React.useState(false);
  const [chartConfig, setChartConfig] = React.useState('');
  const chartEditPath = React.useRef<number[] | null>(null);

  const handleInsertChart = React.useCallback(() => {
    savedSelection.current = editor.selection;
    chartEditPath.current = null;
    setChartConfig('');
    setChartOpen(true);
  }, [editor]);

  const handleEditChart = React.useCallback((path: number[], config: string) => {
    chartEditPath.current = path;
    setChartConfig(config);
    setChartOpen(true);
  }, []);

  const handleSubmitChart = React.useCallback(
    (config: string) => {
      const tf = editor.tf as any;
      if (chartEditPath.current) {
        tf.setNodes({ config }, { at: chartEditPath.current });
      } else {
        const at = savedSelection.current ?? [editor.children.length];
        tf.insertNodes({ type: CHART, config, children: [{ text: '' }] }, { at, select: true });
      }
      setChartOpen(false);
      chartEditPath.current = null;
      setTimeout(() => editor.tf.focus(), 0);
    },
    [editor],
  );

  const chartCtx = React.useMemo(() => ({ openEditor: handleEditChart }), [handleEditChart]);

  // Hyperlink insert / edit dialog. `linkSelection` restores the caret after the
  // dialog steals focus; `linkEditPath` is set when the caret was inside an
  // existing link (edit/remove), and `linkHasRange` when a run of text is selected
  // (wrap it, preserving its formatting) vs. a collapsed caret (insert new text).
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkText, setLinkText] = React.useState('');
  const linkSelection = React.useRef<typeof editor.selection>(null);
  const linkEditPath = React.useRef<number[] | null>(null);
  const linkHasRange = React.useRef(false);

  const handleInsertLink = React.useCallback(() => {
    const sel = editor.selection;
    linkSelection.current = sel;
    const existing = sel
      ? (editor.api.above({ at: sel, match: (n: any) => n.type === 'a' }) as
          | [{ url?: string; children: { text: string }[] }, number[]]
          | undefined)
      : undefined;
    if (existing) {
      linkEditPath.current = existing[1];
      linkHasRange.current = false;
      setLinkUrl(existing[0].url || '');
      setLinkText(existing[0].children?.map((c) => c.text).join('') || '');
    } else {
      linkEditPath.current = null;
      const hasRange = !!sel && !editor.api.isCollapsed();
      linkHasRange.current = hasRange;
      setLinkUrl('');
      setLinkText(hasRange ? editor.api.string(sel) : '');
    }
    setLinkOpen(true);
  }, [editor]);

  const handleSubmitLink = React.useCallback(() => {
    const url = linkUrl.trim();
    if (!url) return;
    const tf = editor.tf as any;
    const text = linkText.trim() || url;
    if (linkSelection.current) editor.tf.select(linkSelection.current);
    if (linkEditPath.current) {
      // Replace the existing link node with the updated url/text in place.
      tf.removeNodes({ at: linkEditPath.current });
      tf.insertNodes({ type: 'a', url, children: [{ text }] }, { at: linkEditPath.current, select: true });
    } else if (linkHasRange.current && linkSelection.current) {
      // Wrap the selected run, keeping any inline formatting it carries.
      tf.wrapNodes({ type: 'a', url, children: [] }, { at: linkSelection.current, split: true });
    } else {
      tf.insertNodes({ type: 'a', url, children: [{ text }] }, { select: true });
    }
    setLinkOpen(false);
    linkEditPath.current = null;
    setTimeout(() => editor.tf.focus(), 0);
  }, [editor, linkUrl, linkText]);

  const handleRemoveLink = React.useCallback(() => {
    if (linkEditPath.current) {
      (editor.tf as any).unwrapNodes({
        at: linkEditPath.current,
        match: (n: any) => n.type === 'a',
      });
    }
    setLinkOpen(false);
    linkEditPath.current = null;
    setTimeout(() => editor.tf.focus(), 0);
  }, [editor]);

  // Definition (glossary term) dialog — same insert/edit/remove flow as links, but
  // the inline element carries a `def` (the definition shown on hover).
  const [defOpen, setDefOpen] = React.useState(false);
  const [defText, setDefText] = React.useState('');
  const [defValue, setDefValue] = React.useState('');
  const defSelection = React.useRef<typeof editor.selection>(null);
  const defEditPath = React.useRef<number[] | null>(null);
  const defHasRange = React.useRef(false);
  const defTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Wrap the textarea's current selection in a markdown marker (** / * / `), the
  // formatting the definition box renders via InlineRich. Re-selects the wrapped
  // text so the buttons can be chained.
  const wrapDefSelection = React.useCallback(
    (marker: string, fallback: string) => {
      const ta = defTextareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      setDefValue((prev) => {
        const selected = prev.slice(start, end) || fallback;
        const next = prev.slice(0, start) + marker + selected + marker + prev.slice(end);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(start + marker.length, start + marker.length + selected.length);
        });
        return next;
      });
    },
    [],
  );

  // Insert a markdown link into the definition, selecting the `url` placeholder so
  // the teacher can type the address straight away.
  const insertDefLink = React.useCallback(() => {
    const ta = defTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setDefValue((prev) => {
      const text = prev.slice(start, end) || 'texto';
      const next = `${prev.slice(0, start)}[${text}](url)${prev.slice(end)}`;
      const urlStart = start + 1 + text.length + 2; // past "[text]("
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(urlStart, urlStart + 3);
      });
      return next;
    });
  }, []);

  const handleInsertDefinition = React.useCallback(() => {
    const sel = editor.selection;
    defSelection.current = sel;
    const existing = sel
      ? (editor.api.above({ at: sel, match: (n: any) => n.type === DEFINITION }) as
          | [{ def?: string; children: { text: string }[] }, number[]]
          | undefined)
      : undefined;
    if (existing) {
      defEditPath.current = existing[1];
      defHasRange.current = false;
      setDefValue(existing[0].def || '');
      setDefText(existing[0].children?.map((c) => c.text).join('') || '');
    } else {
      defEditPath.current = null;
      const hasRange = !!sel && !editor.api.isCollapsed();
      defHasRange.current = hasRange;
      setDefValue('');
      setDefText(hasRange ? editor.api.string(sel) : '');
    }
    setDefOpen(true);
  }, [editor]);

  const handleSubmitDefinition = React.useCallback(() => {
    // Collapse newlines — the definition is stored as a single MDX attribute value.
    const def = defValue.replace(/\s*\n\s*/g, ' ').trim();
    if (!def) return;
    const tf = editor.tf as any;
    const text = defText.trim();
    if (defSelection.current) editor.tf.select(defSelection.current);
    if (defEditPath.current) {
      tf.removeNodes({ at: defEditPath.current });
      tf.insertNodes({ type: DEFINITION, def, children: [{ text: text || def }] }, { at: defEditPath.current, select: true });
    } else if (defHasRange.current && defSelection.current) {
      tf.wrapNodes({ type: DEFINITION, def, children: [] }, { at: defSelection.current, split: true });
    } else {
      tf.insertNodes({ type: DEFINITION, def, children: [{ text: text || def }] }, { select: true });
    }
    setDefOpen(false);
    defEditPath.current = null;
    setTimeout(() => editor.tf.focus(), 0);
  }, [editor, defValue, defText]);

  const handleRemoveDefinition = React.useCallback(() => {
    if (defEditPath.current) {
      (editor.tf as any).unwrapNodes({
        at: defEditPath.current,
        match: (n: any) => n.type === DEFINITION,
      });
    }
    setDefOpen(false);
    defEditPath.current = null;
    setTimeout(() => editor.tf.focus(), 0);
  }, [editor]);

  // Citations — numbered references derived from the document (recomputed on every
  // edit via citeVersion). The same data feeds the markers' numbers (via context),
  // the end-of-lesson list, and the dialog's "reuse" picker.
  const { references: citeReferences, numbers: citeNumbers } = React.useMemo(
    () => orderCitations(collectFromNodes(editor.children)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, citeVersion],
  );

  const [citeOpen, setCiteOpen] = React.useState(false);
  const [citeSource, setCiteSource] = React.useState('');
  const [citeUrl, setCiteUrl] = React.useState('');
  const citeSelection = React.useRef<typeof editor.selection>(null);
  const citeEditPath = React.useRef<number[] | null>(null);
  const citeEditCid = React.useRef<string | null>(null);

  const newCid = () => `c${Math.random().toString(36).slice(2, 9)}`;

  // Place the caret just after the current selection (so the marker sits after the
  // cited text), or at the end of the document if nothing was selected.
  const collapseForCite = () => {
    if (citeSelection.current) {
      editor.tf.select(citeSelection.current);
      editor.tf.collapse({ edge: 'end' });
    } else {
      editor.tf.select(editor.api.end([]));
    }
  };

  const handleInsertCite = React.useCallback(() => {
    citeSelection.current = editor.selection;
    citeEditPath.current = null;
    citeEditCid.current = null;
    setCiteSource('');
    setCiteUrl('');
    setCiteOpen(true);
  }, [editor]);

  const handleEditCite = React.useCallback(
    (path: number[]) => {
      const node = editor.api.node(path)?.[0] as { cid?: string; source?: string; url?: string } | undefined;
      citeEditPath.current = path;
      citeEditCid.current = node?.cid ?? null;
      setCiteSource(node?.source ?? '');
      setCiteUrl(node?.url ?? '');
      setCiteOpen(true);
    },
    [editor],
  );

  const handleSubmitCite = React.useCallback(() => {
    const source = citeSource.trim();
    if (!source) return;
    const url = citeUrl.trim();
    const tf = editor.tf as any;
    if (citeEditPath.current) {
      // Propagate the edit to every marker that shares this citation's id.
      const cid = citeEditCid.current;
      const entries = Array.from(
        editor.api.nodes({ at: [], match: (n: any) => n.type === CITE && n.cid === cid }),
      ) as Array<[unknown, number[]]>;
      for (const [, path] of entries) {
        tf.setNodes({ source }, { at: path });
        if (url) tf.setNodes({ url }, { at: path });
        else tf.unsetNodes(['url'], { at: path });
      }
    } else {
      collapseForCite();
      tf.insertNodes(
        { type: CITE, cid: newCid(), source, ...(url ? { url } : {}), children: [{ text: '' }] },
        { select: true },
      );
    }
    setCiteOpen(false);
    citeEditPath.current = null;
    setTimeout(() => editor.tf.focus(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, citeSource, citeUrl]);

  // Reuse: insert another marker for an existing reference (same cid → same number).
  const handleReuseCite = React.useCallback(
    (ref: CiteRef) => {
      const tf = editor.tf as any;
      collapseForCite();
      tf.insertNodes(
        { type: CITE, cid: ref.cid, source: ref.source, ...(ref.url ? { url: ref.url } : {}), children: [{ text: '' }] },
        { select: true },
      );
      setCiteOpen(false);
      setTimeout(() => editor.tf.focus(), 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor],
  );

  const handleRemoveCite = React.useCallback(() => {
    if (citeEditPath.current) {
      (editor.tf as any).removeNodes({ at: citeEditPath.current });
    }
    setCiteOpen(false);
    citeEditPath.current = null;
    setTimeout(() => editor.tf.focus(), 0);
  }, [editor]);

  // Scroll the first marker of a reference into view (clicking a list entry).
  const handleJumpToCite = React.useCallback(
    (cid: string) => {
      const entries = Array.from(
        editor.api.nodes({ at: [], match: (n: any) => n.type === CITE && n.cid === cid }),
      ) as Array<[any, number[]]>;
      const first = entries[0];
      if (!first) return;
      editor.tf.focus();
      try {
        editor.tf.select(editor.api.start(first[1])!);
      } catch {
        /* selecting into a void can throw — scrolling is the important part */
      }
      const dom = (editor.api as any).toDOMNode?.(first[0]) as HTMLElement | undefined;
      dom?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    [editor],
  );

  const citeCtx = React.useMemo(() => ({ openEditor: handleEditCite }), [handleEditCite]);

  return (
    <CiteDialogContext.Provider value={citeCtx}>
    <CitationsProvider numbers={citeNumbers}>
    <DiagramDialogContext.Provider value={diagramCtx}>
    <ChartDialogContext.Provider value={chartCtx}>
    <MediaDialogContext.Provider value={mediaCtx}>
    <Plate editor={editor} onChange={handleChange}>
      {/* -top-6 cancels the teach layout <main> py-6 padding so the toolbar pins
          flush to the scrollport top instead of leaving a 24px blank strip above it. */}
      <div className="sticky -top-6 z-30 border-b bg-card/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-8">
        <LessonEditorToolbar
          onPickMedia={handlePickMedia}
          onInsertDiagram={handleInsertDiagram}
          onInsertChart={handleInsertChart}
          onInsertLink={handleInsertLink}
          onInsertDefinition={handleInsertDefinition}
          onInsertCite={handleInsertCite}
          onUseAsQuote={onUseAsQuote}
        />
      </div>
      <EditorContextMenu
        onPickMedia={handlePickMedia}
        onInsertDiagram={handleInsertDiagram}
        onInsertChart={handleInsertChart}
        onInsertLink={handleInsertLink}
        onInsertDefinition={handleInsertDefinition}
        onInsertCite={handleInsertCite}
        onUseAsQuote={onUseAsQuote}
      >
        <div className="px-4 py-6 md:px-8">
          <QuoteAnchorContext.Provider value={anchorMeta ?? {}}>
            <PlateContent
              placeholder={placeholder}
              className={cn(
                'min-h-[480px] w-full outline-none font-reader text-[17px] leading-[1.7] text-foreground',
                'placeholder:text-muted-foreground/30',
                className,
              )}
            />
          </QuoteAnchorContext.Provider>
          {/* Numbered references, like the student reader will show. Entries jump
              to their marker; usage counts surface reuse. */}
          <ReferenceList references={citeReferences} onSelect={handleJumpToCite} />
        </div>
      </EditorContextMenu>

      <Dialog
        open={!!mediaPick}
        onOpenChange={(open) => {
          if (!open) {
            setMediaPick(null);
            mediaEditPath.current = null;
          }
        }}
      >
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto p-0 sm:rounded-card">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Library className="h-4 w-4 text-brand-primary" />
              {`${mediaEditPath.current ? 'Reemplazar' : 'Insertar'} ${
                mediaPick === 'video' ? 'vídeo' : mediaPick === 'resource' ? 'recurso' : 'imagen'
              } desde la biblioteca`}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5">
            {mediaPick && (
              <MediaLibraryPanel
                mode="picker-insert"
                initialTypeFilter={mediaPick === 'resource' ? 'all' : mediaPick}
                initialSubjectFilter="civil"
                onInsert={handleInsertAsset}
                insertLabel={`${mediaEditPath.current ? 'Reemplazar' : 'Insertar'} ${
                  mediaPick === 'video' ? 'vídeo' : mediaPick === 'resource' ? 'recurso' : 'imagen'
                }`}
                // On replace, let the teacher keep the current caption/label instead
                // of overwriting it with the new asset's alt text. Sits right under
                // the replace button so it isn't overlooked. Only shown when there is
                // existing text to preserve.
                insertFooter={
                  mediaEditPath.current && mediaText ? (
                    <label className="mt-3 flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 font-sans text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={preserveMediaText}
                        onChange={(e) => setPreserveMediaText(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-primary"
                      />
                      <span>
                        {mediaPick === 'video' ? 'Conservar la etiqueta actual' : 'Conservar el pie de foto actual'}
                        <span className="ml-1 text-muted-foreground">«{mediaText}»</span>
                      </span>
                    </label>
                  ) : null
                }
                embedded
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DiagramDialog
        open={diagramOpen}
        mode={diagramEditPath.current ? 'edit' : 'insert'}
        initialCode={diagramCode}
        onOpenChange={setDiagramOpen}
        onSubmit={handleSubmitDiagram}
      />

      <ChartDialog
        open={chartOpen}
        mode={chartEditPath.current ? 'edit' : 'insert'}
        initialConfig={chartConfig}
        onOpenChange={setChartOpen}
        onSubmit={handleSubmitChart}
      />

      <Dialog
        open={linkOpen}
        onOpenChange={(open) => {
          if (!open) {
            setLinkOpen(false);
            linkEditPath.current = null;
          }
        }}
      >
        <DialogContent className="max-w-md sm:rounded-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Link2 className="h-4 w-4 text-brand-primary" />
              {linkEditPath.current ? 'Editar enlace' : 'Insertar enlace'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitLink();
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label htmlFor="link-text" className="font-sans text-xs font-medium text-muted-foreground">
                Texto
              </label>
              <input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                disabled={linkHasRange.current}
                placeholder="Texto del enlace"
                className="w-full rounded-md border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
              {linkHasRange.current && (
                <p className="font-sans text-[11px] text-muted-foreground">
                  Se enlazará el texto seleccionado.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="link-url" className="font-sans text-xs font-medium text-muted-foreground">
                URL
              </label>
              <input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
                placeholder="https://…"
                className="w-full rounded-md border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-brand-primary"
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              {linkEditPath.current ? (
                <UIButton
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveLink}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Quitar enlace
                </UIButton>
              ) : (
                <span />
              )}
              <UIButton type="submit" disabled={!linkUrl.trim()}>
                Guardar
              </UIButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={defOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDefOpen(false);
            defEditPath.current = null;
          }
        }}
      >
        <DialogContent className="max-w-md sm:rounded-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <BookMarked className="h-4 w-4 text-brand-primary" />
              {defEditPath.current ? 'Editar definición' : 'Añadir definición'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitDefinition();
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label htmlFor="def-text" className="font-sans text-xs font-medium text-muted-foreground">
                Término
              </label>
              <input
                id="def-text"
                value={defText}
                onChange={(e) => setDefText(e.target.value)}
                disabled={defHasRange.current}
                placeholder="Palabra o expresión"
                className="w-full rounded-md border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
              {defHasRange.current && (
                <p className="font-sans text-[11px] text-muted-foreground">
                  Se definirá el texto seleccionado.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="def-value" className="font-sans text-xs font-medium text-muted-foreground">
                Definición
              </label>
              {/* Format buttons — wrap the selection in markdown the box renders. */}
              <div className="flex items-center gap-0.5">
                <UIButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Negrita"
                  aria-label="Negrita"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapDefSelection('**', 'negrita')}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Bold className="h-3.5 w-3.5" />
                </UIButton>
                <UIButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Cursiva"
                  aria-label="Cursiva"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapDefSelection('*', 'cursiva')}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Italic className="h-3.5 w-3.5" />
                </UIButton>
                <UIButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Subrayado"
                  aria-label="Subrayado"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapDefSelection('++', 'subrayado')}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <UnderlineIcon className="h-3.5 w-3.5" />
                </UIButton>
                <UIButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Tachado"
                  aria-label="Tachado"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapDefSelection('~~', 'tachado')}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </UIButton>
                <UIButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Resaltar"
                  aria-label="Resaltar"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapDefSelection('==', 'resaltado')}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Highlighter className="h-3.5 w-3.5" />
                </UIButton>
                <UIButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Código"
                  aria-label="Código"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapDefSelection('`', 'código')}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <CodeIcon className="h-3.5 w-3.5" />
                </UIButton>
                <UIButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Enlace"
                  aria-label="Enlace"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertDefLink}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </UIButton>
              </div>
              <textarea
                id="def-value"
                ref={defTextareaRef}
                value={defValue}
                onChange={(e) => setDefValue(e.target.value)}
                autoFocus
                rows={3}
                placeholder="Texto que se mostrará al pasar el cursor"
                className="w-full resize-y rounded-md border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-brand-primary"
              />
              {/* Live rendered preview — shows exactly how the definition box reads. */}
              <div className="space-y-1 pt-1">
                <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  Vista previa
                </span>
                <div
                  aria-label="Vista previa de la definición"
                  className="min-h-[2.25rem] rounded-md border bg-muted/30 px-3 py-2 font-sans text-sm leading-snug text-foreground"
                >
                  {defValue.trim() ? (
                    <InlineRich text={defValue} />
                  ) : (
                    <span className="text-muted-foreground/40">La vista previa aparecerá aquí…</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              {defEditPath.current ? (
                <UIButton
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveDefinition}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Quitar definición
                </UIButton>
              ) : (
                <span />
              )}
              <UIButton type="submit" disabled={!defValue.trim()}>
                Guardar
              </UIButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={citeOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCiteOpen(false);
            citeEditPath.current = null;
          }
        }}
      >
        <DialogContent className="max-w-md sm:rounded-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Superscript className="h-4 w-4 text-brand-primary" />
              {citeEditPath.current ? 'Editar referencia' : 'Añadir referencia'}
            </DialogTitle>
          </DialogHeader>

          {/* Reuse an existing reference (same number) — only when inserting new. */}
          {!citeEditPath.current && citeReferences.length > 0 && (
            <div className="space-y-1">
              <span className="font-sans text-xs font-medium text-muted-foreground">
                Reutilizar una referencia de esta lección
              </span>
              <div className="max-h-36 divide-y overflow-y-auto rounded-md border">
                {citeReferences.map((r) => (
                  <button
                    key={r.cid}
                    type="button"
                    onClick={() => handleReuseCite(r)}
                    className="flex w-full items-baseline gap-2 px-3 py-2 text-left font-sans text-sm hover:bg-muted"
                  >
                    <span className="shrink-0 font-semibold text-brand-primary">[{r.n}]</span>
                    <span className="truncate">
                      <InlineRich text={r.source} />
                    </span>
                    {r.count > 1 && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground/70">·{r.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitCite();
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label htmlFor="cite-source" className="font-sans text-xs font-medium text-muted-foreground">
                Fuente
              </label>
              <input
                id="cite-source"
                value={citeSource}
                onChange={(e) => setCiteSource(e.target.value)}
                autoFocus
                placeholder="p. ej. STS 1234/2020, FJ 3"
                className="w-full rounded-md border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="cite-url" className="font-sans text-xs font-medium text-muted-foreground">
                URL (opcional)
              </label>
              <input
                id="cite-url"
                value={citeUrl}
                onChange={(e) => setCiteUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-md border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-brand-primary"
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              {citeEditPath.current ? (
                <UIButton
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveCite}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Quitar
                </UIButton>
              ) : (
                <span />
              )}
              <UIButton type="submit" disabled={!citeSource.trim()}>
                Guardar
              </UIButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Plate>
    </MediaDialogContext.Provider>
    </ChartDialogContext.Provider>
    </DiagramDialogContext.Provider>
    </CitationsProvider>
    </CiteDialogContext.Provider>
  );
}
