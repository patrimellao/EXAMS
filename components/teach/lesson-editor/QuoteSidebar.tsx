'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { QuoteStatus } from '@/lib/lesson-quotes';

export interface QuoteRow {
  questionId: number;
  label: string; // "P1"
  status: QuoteStatus;
  quote: string;
  sentence?: string;
  currentText?: string;
  relocatedSection?: string;
  orderIndex: number;
}

export interface QuoteSidebarProps {
  rows: QuoteRow[];
  onJump: (row: QuoteRow) => void;
  onGoToQuestion: (row: QuoteRow) => void;
  onUseCurrent: (row: QuoteRow) => void;
  onKeep: (row: QuoteRow) => void;
  onRelink: (row: QuoteRow) => void;
  onRemove: (row: QuoteRow) => void;
}

const DOT: Record<QuoteStatus, string> = {
  synced: 'bg-brand-primary',
  drift: 'bg-amber-500',
  orphan: 'bg-slate-400',
};

function DriftDiff({ was, now }: { was: string; now?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-semibold text-amber-700"
      >
        {open ? '▾ ocultar cambios' : '▸ ver cambios'}
      </button>
      {open && (
        <div className="mt-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] leading-snug">
          <span className="text-slate-400 line-through">{was}</span>
          {now ? <> → <span className="font-semibold text-amber-700">{now}</span></> : null}
        </div>
      )}
    </div>
  );
}

function Row(props: { row: QuoteRow } & Omit<QuoteSidebarProps, 'rows'>) {
  const { row } = props;
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-2.5',
        row.status === 'drift' && 'border-amber-200 bg-amber-50/40',
        row.status === 'orphan' && 'opacity-90',
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', DOT[row.status])} />
        <button
          type="button"
          onClick={() => props.onGoToQuestion(row)}
          className="text-[11px] font-bold text-brand-primary"
        >
          Pregunta {row.label.replace('P', '')}
        </button>
      </div>
      <button
        type="button"
        onClick={() => props.onJump(row)}
        className="block text-left font-reader text-[13px] leading-snug text-foreground"
      >
        &ldquo;{row.quote}&rdquo;
      </button>
      {row.sentence && row.sentence !== row.quote && (
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground italic">
          {row.sentence}
        </p>
      )}

      {row.status === 'synced' && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Sincronizada · clic para resaltar en el texto
        </p>
      )}

      {row.status === 'drift' && (
        <>
          <DriftDiff was={row.quote} now={row.currentText} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => props.onUseCurrent(row)}
              className="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              Usar texto actual
            </button>
            <button type="button" onClick={() => props.onKeep(row)}
              className="rounded-md border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Mantener redacción
            </button>
            <button type="button" onClick={() => props.onGoToQuestion(row)}
              className="rounded-md border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Ir a pregunta
            </button>
          </div>
        </>
      )}

      {row.status === 'orphan' && (
        <>
          {row.relocatedSection && (
            <p className="mt-1.5 text-[11px] text-amber-700">
              ↪ Parece estar ahora en <b>§{row.relocatedSection}</b>
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.relocatedSection && (
              <button type="button" onClick={() => props.onRelink(row)}
                className="rounded-md bg-brand-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                Re-vincular a §{row.relocatedSection}
              </button>
            )}
            <button type="button" onClick={() => props.onRemove(row)}
              className="rounded-md border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
              Quitar cita
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function QuoteSidebar(props: QuoteSidebarProps) {
  const [filter, setFilter] = React.useState<'all' | 'review'>('all');
  const review = props.rows.filter((r) => r.status !== 'synced').length;
  const shown = filter === 'all' ? props.rows : props.rows.filter((r) => r.status !== 'synced');
  return (
    <aside
      aria-label="Citas de la lección"
      className="flex w-80 shrink-0 flex-col rounded-card border bg-card shadow-card lg:max-h-[680px] lg:self-start"
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Citas de la lección
        </span>
        <span className="rounded-pill bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
          {props.rows.length}
        </span>
      </div>
      <div className="flex gap-1.5 border-b px-3 py-2">
        <button type="button" onClick={() => setFilter('all')}
          className={cn('rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold transition-colors duration-fast focus-ring',
            filter === 'all'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-transparent bg-card text-muted-foreground hover:bg-muted hover:text-foreground')}>
          Todas
        </button>
        <button type="button" onClick={() => setFilter('review')}
          className={cn('rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold transition-colors duration-fast focus-ring',
            filter === 'review'
              ? 'border-amber-300 bg-amber-100 text-amber-700'
              : 'border-transparent bg-card text-muted-foreground hover:bg-muted hover:text-foreground')}>
          ⚠ A revisar ({review})
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {shown.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Aún no hay citas en esta lección.
          </p>
        ) : (
          shown.map((r) => <Row key={r.questionId} row={r} {...props} />)
        )}
      </div>
    </aside>
  );
}
