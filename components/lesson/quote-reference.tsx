import * as React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

/**
 * Shared "Repasar" lesson-quote reference, used in two places so they never
 * drift: the question builder's preview (read-only) and the student's quiz
 * review (a deep link back into the lesson).
 */

// Highlights `quote` inside its surrounding `sentence` in the chosen rgb color,
// falling back to highlighting the whole quote when no sentence is available.
export function QuoteSentence({
  quote,
  sentence,
  color,
}: {
  quote: string;
  sentence?: string;
  color: string;
}) {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const text = norm(sentence && norm(sentence) ? sentence : quote);
  const q = norm(quote);
  const start = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  const mark = (s: string) => (
    <span
      className="rounded-[3px] px-0.5"
      style={{ backgroundColor: `rgba(${color}, 0.4)` }}
    >
      {s}
    </span>
  );
  if (start < 0) return <>{mark(text)}</>;
  return (
    <>
      {text.slice(0, start)}
      {mark(text.slice(start, start + q.length))}
      {text.slice(start + q.length)}
    </>
  );
}

// The carded reference (Variant A): "Repasar" tag + section label header, the
// fragment highlighted inside its sentence, and an "Ir a la lección" footer.
// Pass `href` to make the whole card a deep link (student review); omit it for
// a static preview (builder).
export function LessonQuoteCard({
  label,
  quote,
  sentence,
  color,
  href,
}: {
  label: string;
  quote: string;
  sentence?: string;
  color: string;
  href?: string;
}) {
  const card = (
    <div className="overflow-hidden rounded-card border border-brand-primary/30 bg-card transition-colors duration-fast group-hover:border-brand-primary/50">
      <div className="flex items-center gap-2 bg-brand-primary/10 px-3 py-1.5">
        <span className="inline-flex items-center gap-1 rounded-[5px] bg-brand-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white font-sans">
          <BookOpen className="h-2.5 w-2.5" />
          Repasar
        </span>
        <span className="text-[10px] font-bold text-brand-primary font-sans">
          {label}
        </span>
      </div>
      <p className="px-3 py-2.5 text-xs leading-relaxed text-foreground font-sans">
        <QuoteSentence quote={quote} sentence={sentence} color={color} />
      </p>
      <div className="flex justify-end border-t border-border/60 px-3 py-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary font-sans">
          Ir a la lección
          <ArrowRight className="h-2.5 w-2.5 transition-transform duration-fast group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  ) : (
    <div className="group">{card}</div>
  );
}
