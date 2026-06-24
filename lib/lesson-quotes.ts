/**
 * Pure helpers for lesson quote anchors. A quote anchor is a leaf mark that
 * serializes into the lesson markdown as `<QuoteAnchor id="…">…</QuoteAnchor>`
 * (see components/teach/lesson-editor/markdown-rules.ts). These functions read
 * and rewrite that markdown string and derive each quote's sync status. No React,
 * no Plate — safe to unit test.
 */

export type QuoteStatus = 'synced' | 'drift' | 'orphan';

export interface AnchorHit {
  id: string;
  text: string;
  index: number; // char offset of the tag in the markdown
}

export interface QuoteRefLite {
  anchorId?: string;
  quote: string;
  frozen?: boolean;
}

export interface QuoteStatusInfo {
  status: QuoteStatus;
  currentText?: string;
  relocatedSection?: string;
}

const ANCHOR_RE = /<QuoteAnchor id="([^"]*)">([\s\S]*?)<\/QuoteAnchor>/g;
const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findAnchors(markdown: string): AnchorHit[] {
  const hits: AnchorHit[] = [];
  ANCHOR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ANCHOR_RE.exec(markdown)) !== null) {
    hits.push({ id: m[1], text: norm(m[2]), index: m.index });
  }
  return hits;
}

export function unwrapAnchor(markdown: string, id: string): string {
  const re = new RegExp(
    `<QuoteAnchor id="${escapeRegExp(id)}">([\\s\\S]*?)<\\/QuoteAnchor>`,
    'g',
  );
  return markdown.replace(re, '$1');
}

// Wraps the first whitespace-flexible, case-insensitive occurrence of `quote`.
export function wrapAnchorAt(markdown: string, quote: string, id: string): string {
  const pattern = escapeRegExp(norm(quote)).replace(/ /g, '\\s+');
  const re = new RegExp(pattern, 'i');
  const m = re.exec(markdown);
  if (!m) return markdown;
  return (
    markdown.slice(0, m.index) +
    `<QuoteAnchor id="${id}">${m[0]}</QuoteAnchor>` +
    markdown.slice(m.index + m[0].length)
  );
}

export function findSectionAt(markdown: string, charIndex: number): string {
  const headingRe = /^#{1,6}\s+(.+)$/gm;
  let section = '';
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(markdown)) !== null) {
    if (m.index <= charIndex) section = norm(m[1]);
    else break;
  }
  return section;
}

export function deriveQuoteStatus(
  ref: QuoteRefLite,
  anchors: AnchorHit[],
  markdown: string,
): QuoteStatusInfo {
  if (ref.frozen) return { status: 'synced' };
  if (ref.anchorId) {
    const hit = anchors.find((a) => a.id === ref.anchorId);
    if (hit) {
      return norm(hit.text) === norm(ref.quote)
        ? { status: 'synced' }
        : { status: 'drift', currentText: hit.text };
    }
  }
  // Anchor missing — try to relocate the words elsewhere in the lesson.
  const pattern = escapeRegExp(norm(ref.quote)).replace(/ /g, '\\s+');
  const m = new RegExp(pattern, 'i').exec(markdown);
  if (m) {
    return { status: 'orphan', relocatedSection: findSectionAt(markdown, m.index) };
  }
  return { status: 'orphan' };
}
