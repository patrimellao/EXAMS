import { findAnchors, deriveQuoteStatus, type QuoteStatus } from '@/lib/lesson-quotes';

export type LessonRef = {
  section: string;
  quote: string;
  color: string;
  sentence?: string;
  anchorId?: string;
  frozen?: boolean;
};

/**
 * synced: anchor present and text matches (or ref is frozen);
 * drift: anchor present, text changed;
 * orphan: anchor missing (may still be relocatable elsewhere in the markdown).
 *
 * `LessonRef` is structurally compatible with `lib/lesson-quotes`'s `QuoteRefLite`
 * ({ anchorId?, quote, frozen? }), so we delegate straight to `deriveQuoteStatus`
 * instead of re-implementing anchor lookup/drift/orphan logic here.
 */
export function deriveLessonRefStatus(ref: LessonRef, lessonMarkdown: string): QuoteStatus {
  const anchors = findAnchors(lessonMarkdown);
  return deriveQuoteStatus(ref, anchors, lessonMarkdown).status;
}
