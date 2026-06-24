'use client';

/**
 * Client-side Mermaid renderer shared by the lesson reader (RSC-compiled MDX) and
 * the Plate editor's diagram preview. Mermaid needs the DOM, so it is dynamically
 * imported on the client only — it never enters the server/RSC bundle and only
 * loads on pages that actually contain a diagram.
 *
 * Diagrams are stored as a fenced ```mermaid code block in the lesson markdown
 * (see components/teach/lesson-editor/markdown-rules.ts). This component takes the
 * raw mermaid source and renders the SVG, with graceful fallbacks for empty/invalid
 * source so a lesson never blank-screens on a typo.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

type RenderState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ok'; svg: string }
  | { status: 'error'; message: string };

function isDarkMode() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function MermaidDiagram({ code, className }: { code?: string; className?: string }) {
  const source = (code ?? '').trim();
  const reactId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [state, setState] = React.useState<RenderState>(
    source ? { status: 'loading' } : { status: 'empty' },
  );

  React.useEffect(() => {
    let cancelled = false;
    if (!source) {
      setState({ status: 'empty' });
      return;
    }
    setState({ status: 'loading' });
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDarkMode() ? 'dark' : 'neutral',
          // A concrete, always-available system font (NOT `inherit`): mermaid sizes
          // node boxes by measuring the label, and `inherit` resolved to a different
          // font at measure time (page sans / pre-webfont) than at render time (the
          // lesson's serif reader font), making boxes too small and clipping labels.
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        });
        // Unique id per render; mermaid injects a temp node into the DOM keyed by it.
        const { svg } = await mermaid.render(`mmd-${reactId}`, source);
        if (!cancelled) setState({ status: 'ok', svg });
      } catch (err) {
        if (!cancelled)
          setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, reactId]);

  if (state.status === 'empty') {
    return (
      <div
        className={cn(
          'my-6 flex items-center justify-center rounded-card border border-dashed bg-muted/40 px-4 py-10 text-center font-sans text-xs text-muted-foreground',
          className,
        )}
      >
        Diagrama vacío
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={cn('my-6 space-y-2', className)}>
        <div className="rounded-card border border-destructive/40 bg-destructive/5 px-4 py-3 font-sans text-xs text-destructive">
          No se pudo dibujar el diagrama. Revisa la sintaxis Mermaid.
        </div>
        <pre className="overflow-x-auto rounded-card border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {source}
        </pre>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div
        className={cn(
          'my-6 flex items-center justify-center rounded-card border bg-card px-4 py-10 font-sans text-xs text-muted-foreground',
          className,
        )}
      >
        Dibujando diagrama…
      </div>
    );
  }

  return (
    <div
      className={cn(
        'my-6 flex justify-center overflow-x-auto rounded-card border bg-card p-4 shadow-card [&_svg]:h-auto [&_svg]:max-w-full',
        className,
      )}
      // Mermaid output is generated from author content with securityLevel:'strict'
      // (scripts stripped, links sandboxed); authoring is teacher-only.
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
}
