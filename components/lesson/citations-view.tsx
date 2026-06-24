'use client';

/**
 * Presentational citation pieces shared by the editor, preview and student reader:
 * a numbers context (cid → number), the superscript marker, and the end-of-lesson
 * reference list. Numbering itself lives in ./citations (pure).
 */
import * as React from 'react';
import { InlineRich } from './inline-rich';
import type { CiteRef } from './citations';

const NumbersContext = React.createContext<Record<string, number>>({});

export function CitationsProvider({
  numbers,
  children,
}: {
  numbers: Record<string, number>;
  children: React.ReactNode;
}) {
  return <NumbersContext.Provider value={numbers}>{children}</NumbersContext.Provider>;
}

export function useCiteNumber(cid?: string): number | undefined {
  const numbers = React.useContext(NumbersContext);
  return cid ? numbers[cid] : undefined;
}

/** The clickable superscript `[n]` that jumps to the matching reference entry. */
export function CiteSup({ cid, n }: { cid?: string; n?: number }) {
  return (
    <sup className="ml-0.5 text-[0.7em] font-semibold leading-none">
      <a
        href={cid ? `#cite-${cid}` : undefined}
        className="rounded px-0.5 text-brand-primary no-underline hover:bg-brand-primary/10 hover:underline"
      >
        [{n ?? '?'}]
      </a>
    </sup>
  );
}

/** Student/preview MDX marker — reads its number from context. */
export function CiteMarker({ cid }: { cid?: string; url?: string; source?: string }) {
  const n = useCiteNumber(cid);
  if (!n) return null;
  return <CiteSup cid={cid} n={n} />;
}

/**
 * Numbered reference list rendered after the lesson body. When `onSelect` is given
 * (the editor) each entry's source is clickable and jumps to its marker; usage
 * counts (reuse) are shown when a reference is cited more than once.
 */
export function ReferenceList({
  references,
  onSelect,
}: {
  references: CiteRef[];
  onSelect?: (cid: string) => void;
}) {
  if (!references.length) return null;
  return (
    <section className="mt-10 border-t pt-6" aria-label="Referencias">
      <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Referencias
      </h2>
      <ol className="space-y-1.5 pl-6 font-reader text-[14px] leading-[1.6] text-muted-foreground [&_li]:list-decimal">
        {references.map((r) => (
          <li key={r.cid} id={`cite-${r.cid}`} className="scroll-mt-20 list-decimal">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(r.cid)}
                title="Ir a la cita"
                className="text-left hover:text-foreground hover:underline"
              >
                <InlineRich text={r.source} />
              </button>
            ) : (
              <InlineRich text={r.source} />
            )}
            {r.url && (
              <>
                {' — '}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-primary underline underline-offset-2 hover:text-brand-primary/80"
                >
                  {r.url}
                </a>
              </>
            )}
            {/* Usage count is an authoring aid — only in the editor (onSelect), not
                the student reader. */}
            {onSelect && r.count > 1 && (
              <span className="ml-1.5 text-xs text-muted-foreground/70" title={`${r.count} usos`}>
                · {r.count} usos
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
