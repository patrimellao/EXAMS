'use client';

/**
 * Static (read-only) render components for PlateView/PlateStatic — used by the
 * live lesson preview (LessonPreview). PlateStatic renders WITHOUT the editable
 * Plate context, so it can't use the interactive components (which call
 * useEditorRef / hooks). These are plain presentational components, keyed by Plate
 * node type, that reuse the student reader's block components so the preview shows
 * what the student will see. Passed via the `components` editor option, which
 * overrides the plugins' interactive components for static rendering.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Objectives, KeyIdea, Video, Resource, Highlight, Definition } from '@/components/lesson/blocks';
import { CiteSup } from '@/components/lesson/citations-view';
import { MermaidDiagram } from '@/components/lesson/MermaidDiagram';
import { ChartView } from '@/components/lesson/ChartView';
import { OBJECTIVES, KEY_IDEA, VIDEO, DIAGRAM, CHART, DEFINITION, CITE, RESOURCE } from './markdown-rules';

type StaticProps = {
  attributes?: Record<string, unknown> & { className?: string };
  element?: Record<string, unknown>;
  leaf?: Record<string, unknown>;
  text?: Record<string, unknown>;
  children?: React.ReactNode;
};

const el =
  (Tag: React.ElementType, className: string) =>
  function El({ attributes, children }: StaticProps) {
    return (
      <Tag {...attributes} className={cn(className, attributes?.className)}>
        {children}
      </Tag>
    );
  };

const leaf =
  (Tag: React.ElementType, className?: string) =>
  function Leaf({ attributes, children }: StaticProps) {
    return (
      <Tag {...attributes} className={cn(className, attributes?.className)}>
        {children}
      </Tag>
    );
  };

// Class strings mirror the student reader (components/lesson/blocks.tsx).
const READER = {
  p: 'font-reader text-[17px] leading-[1.7] text-foreground my-3',
  h1: 'font-sans text-3xl font-bold tracking-tight text-foreground mt-8 mb-3',
  h2: 'font-sans text-2xl font-bold tracking-tight text-foreground mt-7 mb-3 scroll-mt-20',
  h3: 'font-sans text-xl font-semibold text-foreground mt-6 mb-2 scroll-mt-20',
  h4: 'font-sans text-lg font-semibold text-foreground mt-5 mb-2',
  h5: 'font-sans text-base font-semibold text-foreground mt-4 mb-2',
  h6: 'font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-2',
  blockquote:
    'border-l-4 border-brand-primary/40 pl-4 my-4 italic font-reader text-[17px] leading-[1.7] text-muted-foreground',
  ul: 'list-disc pl-6 my-3 space-y-1.5 font-reader text-[17px] leading-[1.7] text-foreground [&_li]:marker:text-brand-primary',
  ol: 'list-decimal pl-6 my-3 space-y-1.5 font-reader text-[17px] leading-[1.7] text-foreground',
  a: 'text-brand-primary underline underline-offset-2 hover:text-brand-primary/80',
  code: 'rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-pink-600 dark:text-pink-400',
} as const;

function LinkStatic({ attributes, element, children }: StaticProps) {
  const url = (element?.url as string) || undefined;
  return (
    <a {...attributes} href={url} className={cn(READER.a, attributes?.className)}>
      {children}
    </a>
  );
}

function CiteStatic({ attributes, element, children }: StaticProps) {
  const cid = element?.cid as string | undefined;
  const n = element?.n as number | undefined;
  return (
    <span {...attributes}>
      <CiteSup cid={cid} n={n} />
      {children}
    </span>
  );
}

function DefinitionStatic({ attributes, element, children }: StaticProps) {
  return (
    <span {...attributes}>
      <Definition def={element?.def as string | undefined}>{children}</Definition>
    </span>
  );
}

function HighlightStatic({ attributes, leaf, text, children }: StaticProps) {
  const color = ((leaf ?? text)?.backgroundColor as string) || undefined;
  return (
    <Highlight color={color}>
      <span {...attributes}>{children}</span>
    </Highlight>
  );
}

function ObjectivesStatic({ attributes, element, children }: StaticProps) {
  return (
    <div {...attributes}>
      <Objectives title={element?.title as string | undefined}>{children}</Objectives>
    </div>
  );
}

function KeyIdeaStatic({ attributes, children }: StaticProps) {
  return (
    <div {...attributes}>
      <KeyIdea>{children}</KeyIdea>
    </div>
  );
}

function VideoStatic({ attributes, element, children }: StaticProps) {
  return (
    <div {...attributes}>
      <Video url={element?.url as string | undefined} label={element?.label as string | undefined} />
      {children}
    </div>
  );
}

function ResourceStatic({ attributes, element, children }: StaticProps) {
  return (
    <div {...attributes}>
      <Resource
        url={element?.url as string | undefined}
        name={element?.name as string | undefined}
        size={element?.size as string | undefined}
        ext={element?.ext as string | undefined}
      />
      {children}
    </div>
  );
}

function DiagramStatic({ attributes, element, children }: StaticProps) {
  return (
    <div {...attributes}>
      <MermaidDiagram code={element?.code as string | undefined} />
      {children}
    </div>
  );
}

function ChartStatic({ attributes, element, children }: StaticProps) {
  return (
    <div {...attributes}>
      <ChartView config={element?.config as string | undefined} />
      {children}
    </div>
  );
}

function ImageStatic({ attributes, element, children }: StaticProps) {
  const url = (element?.url as string) || '';
  const caption = element?.caption as { text: string }[] | undefined;
  const alt = caption?.map((c) => c.text).join('') || '';
  const isRemote = /^https?:\/\//.test(url);
  return (
    <div {...attributes}>
      <figure className="my-6 space-y-2">
        {isRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} className="w-full rounded-card border bg-card shadow-card" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-card border border-dashed bg-muted/40 text-muted-foreground">
            <span className="text-xs">{url || 'Imagen'}</span>
          </div>
        )}
        {alt && <figcaption className="px-1 font-sans text-xs text-muted-foreground">{alt}</figcaption>}
      </figure>
      {children}
    </div>
  );
}

export const lessonStaticComponents = {
  p: el('p', READER.p),
  h1: el('h1', READER.h1),
  h2: el('h2', READER.h2),
  h3: el('h3', READER.h3),
  h4: el('h4', READER.h4),
  h5: el('h5', READER.h5),
  h6: el('h6', READER.h6),
  blockquote: el('blockquote', READER.blockquote),
  ul: el('ul', READER.ul),
  ol: el('ol', READER.ol),
  li: el('li', ''),
  lic: el('div', ''),
  a: LinkStatic,
  bold: leaf('strong', 'font-semibold'),
  italic: leaf('em'),
  underline: leaf('u'),
  strikethrough: leaf('s'),
  code: leaf('code', READER.code),
  backgroundColor: HighlightStatic,
  [OBJECTIVES]: ObjectivesStatic,
  [KEY_IDEA]: KeyIdeaStatic,
  [VIDEO]: VideoStatic,
  [RESOURCE]: ResourceStatic,
  [DIAGRAM]: DiagramStatic,
  [CHART]: ChartStatic,
  [DEFINITION]: DefinitionStatic,
  [CITE]: CiteStatic,
  img: ImageStatic,
};
