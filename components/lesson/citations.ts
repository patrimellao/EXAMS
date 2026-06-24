/**
 * Citation collection + numbering, shared by the editor, the preview and the
 * server-side student reader. Pure (no React) so it can run in any of them.
 *
 * A citation marker is an inline `<Cite cid source url />`. Markers that share a
 * `cid` are the same reference (within-lesson reuse) and get the same number;
 * numbers are assigned by order of first appearance in the document.
 */
export type CiteItem = { cid: string; source: string; url?: string };
export type CiteRef = CiteItem & { n: number; count: number };

/**
 * Dedupe by `cid` (first occurrence wins) and assign 1-based numbers in order.
 * `count` is how many markers cite each reference (usage count / reuse).
 */
export function orderCitations(items: CiteItem[]): {
  references: CiteRef[];
  numbers: Record<string, number>;
} {
  const byCid = new Map<string, CiteRef>();
  for (const it of items) {
    if (!it.cid) continue;
    const existing = byCid.get(it.cid);
    if (existing) existing.count += 1;
    else byCid.set(it.cid, { ...it, n: byCid.size + 1, count: 1 });
  }
  const references = [...byCid.values()];
  const numbers: Record<string, number> = {};
  for (const r of references) numbers[r.cid] = r.n;
  return { references, numbers };
}

/** Collect citation markers from a Plate value, in document order. */
export function collectFromNodes(nodes: any[], out: CiteItem[] = []): CiteItem[] {
  for (const n of nodes ?? []) {
    if (n?.type === 'Cite' && n.cid) {
      out.push({ cid: n.cid, source: n.source ?? '', url: n.url });
    } else if (Array.isArray(n?.children)) {
      collectFromNodes(n.children, out);
    }
  }
  return out;
}

/**
 * Return a copy of the Plate value with each `Cite` node's number baked in as `n`.
 * Used by the read-only preview, whose static renderer can't read React context.
 */
export function injectCiteNumbers(nodes: any[], numbers: Record<string, number>): any[] {
  return (nodes ?? []).map((node) => {
    if (node?.type === 'Cite' && node.cid) {
      return { ...node, n: numbers[node.cid] };
    }
    if (Array.isArray(node?.children)) {
      return { ...node, children: injectCiteNumbers(node.children, numbers) };
    }
    return node;
  });
}

const CITE_RE = /<Cite\b([^>]*?)\/?>/g;
const ATTR_RE = /(\w+)="([^"]*)"/g;

function decode(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Collect citation markers from a raw markdown string, in document order. */
export function collectFromMarkdown(source: string): CiteItem[] {
  const items: CiteItem[] = [];
  let m: RegExpExecArray | null;
  CITE_RE.lastIndex = 0;
  while ((m = CITE_RE.exec(source))) {
    const attrs: Record<string, string> = {};
    let a: RegExpExecArray | null;
    ATTR_RE.lastIndex = 0;
    while ((a = ATTR_RE.exec(m[1]))) attrs[a[1]] = decode(a[2]);
    if (attrs.cid) items.push({ cid: attrs.cid, source: attrs.source ?? '', url: attrs.url });
  }
  return items;
}
