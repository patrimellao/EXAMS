'use client';

/**
 * Insert / edit dialog for data-chart blocks. Supports single- and multi-series:
 *   - "Datos": pick a type, name one or more series, fill a label × series table.
 *   - "Avanzado": the raw JSON config.
 * Bar/line support multiple series (grouped bars / multiple lines); pie is always
 * single-series. Output stays backward-compatible: a single series emits the simple
 * `{ data: [{ label, value }] }` shape; multiple series emit
 * `{ series: [...], data: [{ label, values: [...] }] }`.
 */
import * as React from 'react';
import { BarChart3, Plus, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChartView, parseChartConfig } from '@/components/lesson/ChartView';
import { cn } from '@/lib/utils';

type ChartType = 'bar' | 'line' | 'pie';
type Row = { id: string; label: string; values: string[] };

const TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Líneas' },
  { value: 'pie', label: 'Circular' },
];

let rowSeq = 0;
const makeRow = (label: string, values: string[]): Row => ({ id: `crow-${rowSeq++}`, label, values });
const starterState = () => ({
  series: ['Valor'],
  rows: [makeRow('Categoría A', ['30']), makeRow('Categoría B', ['50']), makeRow('Categoría C', ['20'])],
});

function buildConfig(type: ChartType, title: string, series: string[], rows: Row[]): string {
  // Pie is single-series; otherwise multi when more than one series exists.
  const multi = type !== 'pie' && series.length > 1;
  const named = series.length ? series : ['Valor'];
  const clean = rows.filter((r) => r.label.trim());
  const base: Record<string, unknown> = { type };
  if (title.trim()) base.title = title.trim();

  if (multi) {
    const data = clean
      .map((r) => ({ label: r.label.trim(), values: named.map((_, i) => Number(r.values[i])) }))
      .filter((d) => d.values.some((v) => Number.isFinite(v)));
    return JSON.stringify({ ...base, series: named, data }, null, 2);
  }
  const data = clean
    .map((r) => ({ label: r.label.trim(), value: Number(r.values[0]) }))
    .filter((d) => Number.isFinite(d.value));
  return JSON.stringify({ ...base, data }, null, 2);
}

export function ChartDialog({
  open,
  mode,
  initialConfig,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: 'insert' | 'edit';
  initialConfig: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (config: string) => void;
}) {
  const [tab, setTab] = React.useState<'form' | 'code'>('form');
  const [type, setType] = React.useState<ChartType>('bar');
  const [title, setTitle] = React.useState('');
  const [series, setSeries] = React.useState<string[]>(['Valor']);
  const [rows, setRows] = React.useState<Row[]>(() => starterState().rows);
  const [config, setConfig] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    if (mode === 'edit') {
      const parsed = parseChartConfig(initialConfig);
      if (parsed && Array.isArray(parsed.data)) {
        const names = Array.isArray(parsed.series) && parsed.series.length ? parsed.series : ['Valor'];
        const multi = names.length > 1;
        setType((parsed.type as ChartType) || 'bar');
        setTitle(parsed.title || '');
        setSeries(names);
        setRows(
          parsed.data.map((d) =>
            makeRow(
              String(d.label ?? ''),
              multi
                ? names.map((_, i) => String((d.values ?? [])[i] ?? ''))
                : [String(d.value ?? (d.values ?? [])[0] ?? '')],
            ),
          ),
        );
        setConfig(initialConfig);
        setTab('form');
      } else {
        setConfig(initialConfig);
        setTab('code');
      }
    } else {
      const s = starterState();
      setType('bar');
      setTitle('');
      setSeries(s.series);
      setRows(s.rows);
      setConfig(buildConfig('bar', '', s.series, s.rows));
      setTab('form');
    }
  }, [open, mode, initialConfig]);

  const sync = (nextType: ChartType, nextTitle: string, nextSeries: string[], nextRows: Row[]) => {
    setType(nextType);
    setTitle(nextTitle);
    setSeries(nextSeries);
    setRows(nextRows);
    setConfig(buildConfig(nextType, nextTitle, nextSeries, nextRows));
  };

  // Number of value columns shown (pie collapses to one).
  const shown = type === 'pie' ? 1 : series.length;

  const renameSeries = (i: number, name: string) =>
    sync(type, title, series.map((s, idx) => (idx === i ? name : s)), rows);
  const addSeries = () =>
    sync(type, title, [...series, `Serie ${series.length + 1}`], rows.map((r) => ({ ...r, values: [...r.values, ''] })));
  const removeSeries = (i: number) =>
    sync(
      type,
      title,
      series.filter((_, idx) => idx !== i),
      rows.map((r) => ({ ...r, values: r.values.filter((_, idx) => idx !== i) })),
    );

  const updateLabel = (i: number, label: string) =>
    sync(type, title, series, rows.map((r, idx) => (idx === i ? { ...r, label } : r)));
  const updateValue = (i: number, s: number, value: string) =>
    sync(
      type,
      title,
      series,
      rows.map((r, idx) => (idx === i ? { ...r, values: r.values.map((v, vi) => (vi === s ? value : v)) } : r)),
    );
  const removeRow = (i: number) => sync(type, title, series, rows.filter((_, idx) => idx !== i));
  const addRow = () => sync(type, title, series, [...rows, makeRow('', series.map(() => ''))]);

  const canSubmit = (() => {
    const parsed = parseChartConfig(config);
    return !!parsed && Array.isArray(parsed.data) && parsed.data.length > 0;
  })();

  const gridCols = `1fr repeat(${shown}, minmax(72px, 110px)) auto`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-card">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <BarChart3 className="h-4 w-4 text-brand-primary" />
            {mode === 'edit' ? 'Editar gráfico' : 'Insertar gráfico'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Elige el tipo, define las series y rellena los datos, o edita el JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 p-5 md:grid-cols-[1fr_minmax(0,360px)]">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'form' | 'code')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Datos</TabsTrigger>
              <TabsTrigger value="code">Avanzado</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de gráfico</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => sync(t.value, title, series, rows)}
                      className={cn(
                        'rounded-md border px-2 py-2 text-center text-xs font-semibold transition',
                        type === t.value
                          ? 'border-brand-primary bg-brand-primary/5 text-foreground ring-1 ring-brand-primary'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chart-title" className="text-xs font-semibold">
                  Título (opcional)
                </Label>
                <Input
                  id="chart-title"
                  value={title}
                  onChange={(e) => sync(type, e.target.value, series, rows)}
                  placeholder="Ej. Distribución de competencias"
                  className="h-9"
                />
              </div>

              {/* Series (hidden for pie — single-series only). */}
              {type !== 'pie' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Series</Label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {series.map((s, i) => (
                      <div key={i} className="flex items-center">
                        <Input
                          value={s}
                          onChange={(e) => renameSeries(i, e.target.value)}
                          placeholder={`Serie ${i + 1}`}
                          className="h-8 w-32 rounded-r-none"
                        />
                        <button
                          type="button"
                          aria-label="Quitar serie"
                          onClick={() => removeSeries(i)}
                          disabled={series.length === 1}
                          className="flex h-8 items-center rounded-r-md border border-l-0 px-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addSeries} className="h-8 gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Serie
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Datos</Label>
                <div className="grid items-center gap-1.5 text-[11px] font-medium text-muted-foreground" style={{ gridTemplateColumns: gridCols }}>
                  <span>Etiqueta</span>
                  {Array.from({ length: shown }).map((_, s) => (
                    <span key={s} className="truncate">
                      {type === 'pie' ? 'Valor' : series[s]}
                    </span>
                  ))}
                  <span />
                </div>
                <div className="space-y-1.5">
                  {rows.map((row, i) => (
                    <div key={row.id} className="grid items-center gap-1.5" style={{ gridTemplateColumns: gridCols }}>
                      <Input
                        value={row.label}
                        onChange={(e) => updateLabel(i, e.target.value)}
                        placeholder={`Etiqueta ${i + 1}`}
                        className="h-9"
                      />
                      {Array.from({ length: shown }).map((_, s) => (
                        <Input
                          key={s}
                          type="number"
                          value={row.values[s] ?? ''}
                          onChange={(e) => updateValue(i, s, e.target.value)}
                          placeholder="0"
                          className="h-9"
                        />
                      ))}
                      <button
                        type="button"
                        aria-label="Eliminar fila"
                        onClick={() => removeRow(i)}
                        disabled={rows.length === 1}
                        className="shrink-0 rounded-md border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-1 gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Añadir fila
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-2 pt-4">
              <Label htmlFor="chart-source" className="text-xs font-semibold">
                Configuración JSON
              </Label>
              <Textarea
                id="chart-source"
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                spellCheck={false}
                rows={12}
                className="font-mono text-xs leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                Una serie: {'{ "type", "data": [{ "label", "value" }] }'}. Varias:{' '}
                {'{ "series": [...], "data": [{ "label", "values": [...] }] }'}.
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Vista previa</Label>
            <div className="rounded-card border bg-muted/30 p-2">
              <ChartView config={config} className="my-0 border-0 bg-transparent p-0 shadow-none" />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => onSubmit(config.trim())}>
            {mode === 'edit' ? 'Guardar cambios' : 'Insertar gráfico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
