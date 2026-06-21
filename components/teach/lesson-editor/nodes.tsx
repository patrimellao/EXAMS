'use client';

/**
 * Minimal render components for standard Plate nodes used in lessons.
 * Plate is headless, so every node type needs a component. Styling targets the
 * lesson reader look (Source Serif / `font-reader`, brand markers).
 */
import * as React from 'react';
import { PlateElement, PlateLeaf, type PlateElementProps, type PlateLeafProps } from 'platejs/react';
import { cn } from '@/lib/utils';

const el = (tag: any, className?: string) =>
  function Element(props: PlateElementProps) {
    return <PlateElement as={tag} {...props} className={cn(className, props.className)} />;
  };

const leaf = (tag: any, className?: string) =>
  function Leaf(props: PlateLeafProps) {
    return <PlateLeaf as={tag} {...props} className={cn(className, props.className)} />;
  };

function LinkElement(props: PlateElementProps) {
  const element = props.element as { url?: string };
  return (
    <PlateElement
      as="a"
      {...props}
      attributes={{ ...props.attributes, href: element.url }}
      className="text-brand-primary underline underline-offset-2 hover:text-brand-primary/80"
    />
  );
}

export const lessonNodeComponents = {
  p: el('p', 'font-reader text-[17px] leading-[1.7] text-foreground my-3'),
  h1: el('h1', 'font-sans text-3xl font-bold tracking-tight text-foreground mt-8 mb-3'),
  h2: el('h2', 'font-sans text-2xl font-bold tracking-tight text-foreground mt-7 mb-3'),
  h3: el('h3', 'font-sans text-xl font-semibold text-foreground mt-6 mb-2'),
  h4: el('h4', 'font-sans text-lg font-semibold text-foreground mt-5 mb-2'),
  h5: el('h5', 'font-sans text-base font-semibold text-foreground mt-4 mb-2'),
  h6: el('h6', 'font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-2'),
  blockquote: el(
    'blockquote',
    'border-l-4 border-brand-primary/40 pl-4 my-4 italic font-reader text-[17px] leading-[1.7] text-muted-foreground',
  ),
  ul: el('ul', 'list-disc pl-6 my-3 space-y-1.5 font-reader text-[17px] leading-[1.7] text-foreground [&_li]:marker:text-brand-primary'),
  ol: el('ol', 'list-decimal pl-6 my-3 space-y-1.5 font-reader text-[17px] leading-[1.7] text-foreground'),
  li: el('li', ''),
  lic: el('div', ''),
  a: LinkElement,
  bold: leaf('strong', 'font-semibold'),
  italic: leaf('em'),
  underline: leaf('u'),
  strikethrough: leaf('s'),
  code: leaf('code', 'rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-pink-600 dark:text-pink-400'),
  highlight: leaf('mark', 'rounded bg-brand-warm/30 px-0.5 text-foreground'),
};
