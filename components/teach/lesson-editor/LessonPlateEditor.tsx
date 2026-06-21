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
  Video as VideoIcon,
} from 'lucide-react';
import { Button as UIButton } from '@/components/ui/button';
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

function LessonEditorToolbar() {
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
      <ToolbarButton
        icon={VideoIcon}
        label="Insertar vídeo"
        onClick={run(() =>
          tf.insertNodes(
            { type: VIDEO, url: '', label: 'Vídeo de la lección', children: [{ text: '' }] },
            { select: true },
          ),
        )}
      />
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

  return (
    <Plate editor={editor} onChange={handleChange}>
      <div className="sticky top-0 z-30 border-b bg-card/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-8">
        <LessonEditorToolbar />
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
    </Plate>
  );
}
