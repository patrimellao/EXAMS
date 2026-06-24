'use client';

/**
 * Client-side data-chart renderer (recharts) shared by the lesson reader, the Plate
 * editor block, and the live preview. Charts are stored as a fenced ```chart code
 * block holding JSON config (see markdown-rules.ts) — same lossless round-trip as
 * the diagram fence. This takes the raw config string, parses it, and renders a
 * single-series bar / line / pie chart, with graceful fallbacks for invalid/empty
 * config so a lesson never blank-screens.
 */
import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

export type ChartPoint = { label: string; value?: number; values?: number[] };
export type ChartConfig = {
  type?: 'bar' | 'line' | 'pie';
  title?: string;
  /** Series names. Absent/length<=1 ⇒ single-series (uses point.value). */
  series?: string[];
  data?: ChartPoint[];
};

// Readable, theme-neutral palette (teal-led to match the brand).
const PALETTE = ['#0d9488', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6', '#22c55e', '#ef4444', '#64748b'];

export function parseChartConfig(config?: string): ChartConfig | null {
  try {
    const parsed = JSON.parse(config || '');
    return parsed && typeof parsed === 'object' ? (parsed as ChartConfig) : null;
  } catch {
    return null;
  }
}

/**
 * Normalize single- or multi-series config into recharts-ready rows + series keys.
 * Single: keys = ['value'], rows = [{ label, value }]. Multi: keys = series names,
 * rows = [{ label, [name]: number }]. `multi` drives legend + per-series coloring.
 */
function normalizeChart(cfg: ChartConfig) {
  const points = (Array.isArray(cfg.data) ? cfg.data : []).filter((d) => d && d.label != null);
  const seriesNames = Array.isArray(cfg.series) ? cfg.series.filter((s) => s != null && s !== '') : [];
  const multi = seriesNames.length > 1;

  if (multi) {
    const rows = points
      .map((p) => {
        const row: Record<string, unknown> = { label: String(p.label) };
        const vals = Array.isArray(p.values) ? p.values : [];
        seriesNames.forEach((name, i) => {
          row[name] = Number(vals[i]);
        });
        return row;
      })
      .filter((row) => seriesNames.some((n) => Number.isFinite(row[n] as number)));
    return { multi: true, keys: seriesNames, rows };
  }

  const rows = points
    .map((p) => ({
      label: String(p.label),
      value: Number(Array.isArray(p.values) ? p.values[0] : p.value),
    }))
    .filter((r) => Number.isFinite(r.value));
  return { multi: false, keys: ['value'], rows };
}

export function ChartView({ config, className }: { config?: string; className?: string }) {
  const cfg = React.useMemo(() => parseChartConfig(config), [config]);

  if (!cfg) {
    return (
      <div className={cn('my-6 space-y-2', className)}>
        <div className="rounded-card border border-destructive/40 bg-destructive/5 px-4 py-3 font-sans text-xs text-destructive">
          No se pudo dibujar el gráfico. Revisa los datos.
        </div>
        <pre className="overflow-x-auto rounded-card border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
          {config}
        </pre>
      </div>
    );
  }

  const { multi, keys, rows: data } = normalizeChart(cfg);
  const type = cfg.type || 'bar';

  if (!data.length) {
    return (
      <div
        className={cn(
          'my-6 flex items-center justify-center rounded-card border border-dashed bg-muted/40 px-4 py-10 text-center font-sans text-xs text-muted-foreground',
          className,
        )}
      >
        Gráfico vacío
      </div>
    );
  }

  return (
    <figure className={cn('my-6 rounded-card border bg-card p-4 shadow-card', className)}>
      {cfg.title && (
        <figcaption className="mb-3 text-center font-sans text-sm font-semibold text-foreground">
          {cfg.title}
        </figcaption>
      )}
      <div className="h-[280px] w-full text-muted-foreground">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            // Pie is inherently single-series: use the first series' values.
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={data} dataKey={keys[0]} nameKey="label" outerRadius={90} label>
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : type === 'line' ? (
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'currentColor' }} />
              <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} />
              <Tooltip />
              {multi && <Legend />}
              {keys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'currentColor' }} />
              <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} />
              <Tooltip />
              {multi && <Legend />}
              {keys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]}>
                  {/* Single series: color each category distinctly (as before). */}
                  {!multi && data.map((_, j) => <Cell key={j} fill={PALETTE[j % PALETTE.length]} />)}
                </Bar>
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
