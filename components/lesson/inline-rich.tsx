/**
 * Minimal inline-markdown renderer for short rich strings (e.g. a definition box).
 * Supports the subset the editor's format buttons produce:
 *   **bold**  *italic* / _italic_  `code`  ~~strike~~  ==highlight==  ++underline++
 *   [text](url)
 * with nesting (e.g. bold can contain italic). Plain (no client hooks) so it renders
 * the same in the server-side student reader and the client editor/preview.
 * Unbalanced markers are left as literal text.
 */
import * as React from 'react';

type Kind = 'code' | 'link' | 'bold' | 'strike' | 'highlight' | 'underline' | 'italic';
type Rule = { re: RegExp; kind: Kind };

// Multi-char markers are listed before their single-char prefixes, and at an equal
// start index the first match in this list wins — so `**` beats `*`, `~~`/`==`/`++`
// and links are recognised before italic.
const RULES: Rule[] = [
  { re: /`([^`]+)`/, kind: 'code' },
  { re: /\[([^\]]+)\]\(([^)\s]+)\)/, kind: 'link' },
  { re: /\*\*([\s\S]+?)\*\*/, kind: 'bold' },
  { re: /__([\s\S]+?)__/, kind: 'bold' },
  { re: /~~([\s\S]+?)~~/, kind: 'strike' },
  { re: /==([\s\S]+?)==/, kind: 'highlight' },
  { re: /\+\+([\s\S]+?)\+\+/, kind: 'underline' },
  { re: /\*([\s\S]+?)\*/, kind: 'italic' },
  { re: /_([\s\S]+?)_/, kind: 'italic' },
];

function render(input: string, keyPrefix: string): React.ReactNode[] {
  if (!input) return [];
  let best: { index: number; full: string; inner: string; url?: string; kind: Kind } | null = null;
  for (const { re, kind } of RULES) {
    const m = re.exec(input);
    if (m && (best === null || m.index < best.index)) {
      best = { index: m.index, full: m[0], inner: m[1], url: m[2], kind };
    }
  }
  if (!best) return [input];

  const out: React.ReactNode[] = [];
  if (best.index > 0) out.push(input.slice(0, best.index));
  const key = `${keyPrefix}-${best.index}`;
  const inner = () => render(best!.inner, `${key}x`);
  switch (best.kind) {
    case 'code':
      out.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {best.inner}
        </code>,
      );
      break;
    case 'link':
      out.push(
        <a
          key={key}
          href={best.url}
          target="_blank"
          rel="noreferrer"
          className="text-brand-primary underline underline-offset-2 hover:text-brand-primary/80"
        >
          {inner()}
        </a>,
      );
      break;
    case 'bold':
      out.push(
        <strong key={key} className="font-semibold">
          {inner()}
        </strong>,
      );
      break;
    case 'strike':
      out.push(<s key={key}>{inner()}</s>);
      break;
    case 'highlight':
      out.push(
        <mark key={key} className="rounded px-0.5 text-foreground" style={{ backgroundColor: 'rgba(250, 204, 21, 0.35)' }}>
          {inner()}
        </mark>,
      );
      break;
    case 'underline':
      out.push(
        <u key={key} className="underline underline-offset-2">
          {inner()}
        </u>,
      );
      break;
    default:
      out.push(<em key={key}>{inner()}</em>);
  }
  out.push(...render(input.slice(best.index + best.full.length), `${key}r`));
  return out;
}

export function InlineRich({ text }: { text?: string }) {
  return <>{render(text ?? '', 'r')}</>;
}
