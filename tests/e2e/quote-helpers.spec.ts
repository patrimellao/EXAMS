import { test, expect } from '@playwright/test';
import {
  findAnchors,
  unwrapAnchor,
  wrapAnchorAt,
  findSectionAt,
  deriveQuoteStatus,
} from '@/lib/lesson-quotes';

const CONTENT = [
  '## Capacidad de obrar',
  '',
  'La capacidad de obrar es la <QuoteAnchor id="qa_3">aptitud para realizar válidamente actos jurídicos</QuoteAnchor> por sí mismo.',
  '',
  '## Domicilio',
  '',
  'El domicilio es la sede jurídica de la persona.',
].join('\n');

test('findAnchors returns id, text and document order', () => {
  const hits = findAnchors(CONTENT);
  expect(hits).toHaveLength(1);
  expect(hits[0].id).toBe('qa_3');
  expect(hits[0].text).toBe('aptitud para realizar válidamente actos jurídicos');
  expect(hits[0].index).toBeGreaterThan(0);
});

test('unwrapAnchor removes the tag but keeps the text', () => {
  const out = unwrapAnchor(CONTENT, 'qa_3');
  expect(out).not.toContain('<QuoteAnchor');
  expect(out).toContain('aptitud para realizar válidamente actos jurídicos por sí mismo');
});

test('wrapAnchorAt wraps the first whitespace-flexible match', () => {
  const out = wrapAnchorAt(CONTENT, 'sede  jurídica de la persona', 'qa_9');
  expect(out).toContain('<QuoteAnchor id="qa_9">sede jurídica de la persona</QuoteAnchor>');
});

test('findSectionAt returns the nearest heading above an index', () => {
  const idx = CONTENT.indexOf('sede jurídica');
  expect(findSectionAt(CONTENT, idx)).toBe('Domicilio');
});

test('deriveQuoteStatus: synced when marked text matches the quote', () => {
  const anchors = findAnchors(CONTENT);
  const info = deriveQuoteStatus(
    { anchorId: 'qa_3', quote: 'aptitud para realizar válidamente actos jurídicos' },
    anchors,
    CONTENT,
  );
  expect(info.status).toBe('synced');
});

test('deriveQuoteStatus: drift when marked text was edited', () => {
  const edited = CONTENT.replace('realizar válidamente', 'celebrar');
  const anchors = findAnchors(edited);
  const info = deriveQuoteStatus(
    { anchorId: 'qa_3', quote: 'aptitud para realizar válidamente actos jurídicos' },
    anchors,
    edited,
  );
  expect(info.status).toBe('drift');
  expect(info.currentText).toContain('celebrar');
});

test('deriveQuoteStatus: orphan + relocatedSection when the anchor is gone but words exist elsewhere', () => {
  const moved =
    '## Domicilio\n\nEl domicilio es la sede jurídica de la persona.';
  const info = deriveQuoteStatus(
    { anchorId: 'qa_3', quote: 'sede jurídica de la persona' },
    findAnchors(moved),
    moved,
  );
  expect(info.status).toBe('orphan');
  expect(info.relocatedSection).toBe('Domicilio');
});

test('deriveQuoteStatus: frozen is always synced', () => {
  const info = deriveQuoteStatus(
    { quote: 'algo que ya no existe', frozen: true },
    [],
    'texto sin nada',
  );
  expect(info.status).toBe('synced');
});
