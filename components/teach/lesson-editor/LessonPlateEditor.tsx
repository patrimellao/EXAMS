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
import { BasicBlocksPlugin, BasicMarksPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list-classic/react';
import { MarkdownPlugin, remarkMdx } from '@platejs/markdown';
import {
  Bold,
  Italic,
  Code as CodeIcon,
  Heading2,
  Heading3,
  Quote,
  List as ListIcon,
  Target,
  Lightbulb,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Library,
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
  MediaLibraryPanel,
  type MediaAsset,
} from '@/components/teach/MediaLibraryPanel';
import { cn } from '@/lib/utils';
import { lessonCustomPlugins } from './blocks';
import { lessonNodeComponents } from './nodes';
import { lessonMarkdownOptions, OBJECTIVES, KEY_IDEA, VIDEO } from './markdown-rules';

export interface LessonPlateEditorProps {
  /** Initial markdown content. */
  value: string;
  /** Called with serialized markdown whenever the document changes. */
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
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

function LessonEditorToolbar({ onPickMedia }: { onPickMedia: (type: 'image' | 'video') => void }) {
  const editor = useEditorRef();
  // Plugin-provided transforms (tf.bold.toggle, tf.h2.toggle, tf.toggle.bulletedList,
  // ...) are not visible through useEditorRef's generic type, though present at runtime.
  const tf = editor.tf as any;
  const run = (fn: () => void) => () => {
    fn();
    editor.tf.focus();
  };
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <ToolbarButton icon={Bold} label="Negrita (⌘B)" onClick={run(() => tf.bold.toggle())} />
      <ToolbarButton icon={Italic} label="Cursiva (⌘I)" onClick={run(() => tf.italic.toggle())} />
      <ToolbarButton icon={CodeIcon} label="Código" onClick={run(() => tf.code.toggle())} />
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton icon={Heading2} label="Título" onClick={run(() => tf.h2.toggle())} />
      <ToolbarButton icon={Heading3} label="Subtítulo" onClick={run(() => tf.h3.toggle())} />
      <ToolbarButton icon={ListIcon} label="Lista" onClick={run(() => tf.toggle.bulletedList())} />
      <ToolbarButton icon={Quote} label="Cita" onClick={run(() => tf.blockquote.toggle())} />
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        icon={Target}
        label="Bloque de Objetivos"
        onClick={run(() =>
          tf.insertNodes(
            {
              type: OBJECTIVES,
              children: [
                {
                  type: 'ul',
                  children: [{ type: 'li', children: [{ type: 'lic', children: [{ text: '' }] }] }],
                },
              ],
            },
            { select: true },
          ),
        )}
      />
      <ToolbarButton
        icon={Lightbulb}
        label="Bloque de Idea Clave"
        onClick={run(() =>
          tf.insertNodes(
            { type: KEY_IDEA, children: [{ type: 'p', children: [{ text: '' }] }] },
            { select: true },
          ),
        )}
      />
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function LessonPlateEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí el contenido de la lección…',
  className,
}: LessonPlateEditorProps) {
  const editor = usePlateEditor({
    plugins: [
      BasicBlocksPlugin,
      BasicMarksPlugin,
      ListPlugin,
      ...lessonCustomPlugins,
      MarkdownPlugin.configure({ options: lessonMarkdownOptions(remarkMdx) }),
    ],
    components: lessonNodeComponents,
    value: (ed) => ed.getApi(MarkdownPlugin).markdown.deserialize(value || ''),
  });

  const handleChange = React.useCallback(() => {
    onChange(editor.getApi(MarkdownPlugin).markdown.serialize());
  }, [editor, onChange]);

  // Media library picker — remembers where to insert (selection captured on open).
  const [mediaPick, setMediaPick] = React.useState<'image' | 'video' | null>(null);
  const savedSelection = React.useRef<typeof editor.selection>(null);

  const handlePickMedia = React.useCallback(
    (type: 'image' | 'video') => {
      savedSelection.current = editor.selection;
      setMediaPick(type);
    },
    [editor],
  );

  const handleInsertAsset = React.useCallback(
    (asset: MediaAsset) => {
      const url = `storage.r2/${asset.r2Key}`;
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
      const tf = editor.tf as any;
      const at = savedSelection.current ?? [editor.children.length];
      tf.insertNodes(node, { at, select: true });
      setMediaPick(null);
      setTimeout(() => editor.tf.focus(), 0);
    },
    [editor],
  );

  return (
    <Plate editor={editor} onChange={handleChange}>
      <div className="sticky top-0 z-30 border-b bg-card/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-8">
        <LessonEditorToolbar onPickMedia={handlePickMedia} />
      </div>
      <div className="px-4 py-6 md:px-8">
        <PlateContent
          placeholder={placeholder}
          className={cn(
            'min-h-[480px] w-full outline-none font-reader text-[17px] leading-[1.7] text-foreground',
            'placeholder:text-muted-foreground/30',
            className,
          )}
        />
      </div>

      <Dialog open={!!mediaPick} onOpenChange={(open) => !open && setMediaPick(null)}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto p-0 sm:rounded-card">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Library className="h-4 w-4 text-brand-primary" />
              {mediaPick === 'video' ? 'Insertar vídeo desde la biblioteca' : 'Insertar imagen desde la biblioteca'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5">
            {mediaPick && (
              <MediaLibraryPanel
                mode="picker-insert"
                initialTypeFilter={mediaPick}
                initialSubjectFilter="civil"
                onInsert={handleInsertAsset}
                insertLabel={mediaPick === 'video' ? 'Insertar vídeo' : 'Insertar imagen'}
                embedded
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Plate>
  );
}
