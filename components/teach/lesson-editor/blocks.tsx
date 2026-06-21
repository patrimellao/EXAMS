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
import { Target, Lightbulb, Play, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OBJECTIVES, KEY_IDEA, VIDEO } from './markdown-rules';

export const OBJECTIVES_DEFAULT_TITLE = 'Al terminar serás capaz de:';

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
  const element = props.element as { url?: string; label?: string };
  const label = element.label || 'Vídeo de la lección';
  return (
    <PlateElement {...props} className="my-6">
      <div contentEditable={false} className="select-none space-y-3">
        <div className="overflow-hidden rounded-card border bg-card shadow-card">
          <div className="flex aspect-video items-center justify-center bg-slate-900">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 backdrop-blur-sm">
              <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
            </span>
          </div>
        </div>
        <p className="flex items-center gap-1.5 px-1 font-sans text-xs text-muted-foreground">
          <VideoIcon className="h-3.5 w-3.5 text-muted-foreground/80" />
          {label}
        </p>
      </div>
      {props.children}
    </PlateElement>
  );
}

function ImageElement(props: PlateElementProps) {
  const element = props.element as { url?: string; caption?: { text: string }[] };
  const alt = element.caption?.map((c) => c.text).join('') || '';
  const url = element.url || '';
  const isRemote = /^https?:\/\//.test(url);
  return (
    <PlateElement {...props} className="my-6">
      <figure contentEditable={false} className="select-none space-y-2">
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
        {alt && (
          <figcaption className="px-1 font-sans text-xs text-muted-foreground">{alt}</figcaption>
        )}
      </figure>
      {props.children}
    </PlateElement>
  );
}

export const ImagePlugin = createPlatePlugin({
  key: 'img',
  node: { isElement: true, isVoid: true, type: 'img' },
}).withComponent(ImageElement);

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

export const lessonCustomPlugins = [
  ObjectivesPlugin,
  KeyIdeaPlugin,
  VideoPlugin,
  ImagePlugin,
  HighlightColorPlugin,
];
