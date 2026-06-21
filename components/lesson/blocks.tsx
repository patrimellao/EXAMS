/**
 * Presentational lesson blocks for the student reader (MDX components map).
 * Plain React (server-renderable). Styling mirrors the Plate editor's render
 * (components/teach/lesson-editor/blocks.tsx) so authoring matches reading.
 */
import * as React from 'react';
import { Target, Lightbulb, Play, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';

export function Objectives({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-muted/50 p-5 my-6">
      <div className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold text-foreground">
        <Target className="h-4 w-4 text-brand-warm" />
        {title || 'Al terminar serás capaz de:'}
      </div>
      <div className="[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 font-reader text-[16px] leading-[1.6] text-muted-foreground [&_li]:marker:text-brand-primary">
        {children}
      </div>
    </div>
  );
}

export function KeyIdea({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-background p-5 my-6 shadow-card">
      <div className="mb-2 flex items-center gap-2 font-sans text-sm font-semibold text-foreground">
        <Lightbulb className="h-4 w-4 text-brand-warm fill-brand-warm/25" />
        Idea clave
      </div>
      <div className="font-reader text-[15px] leading-[1.65] text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export function Video({ url, label }: { url?: string; label?: string }) {
  return (
    <section className="my-6 space-y-3" data-video-url={url}>
      <div className="overflow-hidden rounded-card border bg-card shadow-card">
        <div className="flex aspect-video items-center justify-center bg-slate-900">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30 backdrop-blur-sm">
            <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
          </span>
        </div>
      </div>
      <p className="flex items-center gap-1.5 px-1 font-sans text-xs text-muted-foreground">
        <VideoIcon className="h-3.5 w-3.5 text-muted-foreground/80" />
        {label || 'Vídeo de la lección'}
      </p>
    </section>
  );
}

/** Highlighted text — `<Highlight color="…">` from the editor's background-color mark. */
export function Highlight({ color, children }: { color?: string; children?: React.ReactNode }) {
  return (
    <mark className="rounded px-0.5 text-foreground" style={{ backgroundColor: color }}>
      {children}
    </mark>
  );
}

/**
 * Styled standard markdown elements (the project has no @tailwindcss/typography,
 * so each element is styled explicitly to the lesson reader look — matching the
 * Plate editor's node styling in components/teach/lesson-editor/nodes.tsx).
 */
const baseMdxComponents = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...p} className="font-sans text-3xl font-bold tracking-tight text-foreground mt-8 mb-3" />
  ),
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...p} className="font-sans text-2xl font-bold tracking-tight text-foreground mt-7 mb-3 scroll-mt-20" />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...p} className="font-sans text-xl font-semibold text-foreground mt-6 mb-2 scroll-mt-20" />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...p} className="font-reader text-[17px] leading-[1.7] text-foreground my-3" />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...p} className="list-disc pl-6 my-3 space-y-1.5 font-reader text-[17px] leading-[1.7] text-foreground [&_li]:marker:text-brand-primary" />
  ),
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...p} className="list-decimal pl-6 my-3 space-y-1.5 font-reader text-[17px] leading-[1.7] text-foreground" />
  ),
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote {...p} className="border-l-4 border-brand-primary/40 pl-4 my-4 italic font-reader text-[17px] leading-[1.7] text-muted-foreground" />
  ),
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...p} className="text-brand-primary underline underline-offset-2 hover:text-brand-primary/80" />
  ),
  code: (p: React.HTMLAttributes<HTMLElement>) => (
    <code {...p} className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-pink-600 dark:text-pink-400" />
  ),
  img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const url = typeof src === 'string' ? src : '';
    const isRemote = /^https?:\/\//.test(url);
    return (
      <figure className="my-6 space-y-2">
        {isRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt || ''} className="w-full rounded-card border bg-card shadow-card" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-card border border-dashed bg-muted/40 text-muted-foreground">
            <span className="flex flex-col items-center gap-2 text-xs">
              <ImageIcon className="h-7 w-7 opacity-60" />
              {url || 'Imagen'}
            </span>
          </div>
        )}
        {alt && <figcaption className="px-1 font-sans text-xs text-muted-foreground">{alt}</figcaption>}
      </figure>
    );
  },
};

export const lessonMdxComponents = { ...baseMdxComponents, Objectives, KeyIdea, Video, Highlight };
