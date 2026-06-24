'use client';

/**
 * Read-only live preview of lesson markdown, rendered with PlateView (PlateStatic).
 * Reuses the SAME Plate plugins as the editor (buildLessonPlugins) to deserialize
 * the markdown, and the student reader's presentational components
 * (lessonStaticComponents) to render — so the preview shows what the student will
 * see, with no separate parser to keep in sync.
 *
 * PlateView/PlateStatic is synchronous and client-side, so it can re-render on every
 * keystroke (unlike the server-only compileMDX used on the real student page).
 */
import * as React from 'react';
import { PlateView, usePlateViewEditor } from 'platejs/react';
import { MarkdownPlugin } from '@platejs/markdown';
import { buildLessonPlugins } from './lessonPlugins';
import { lessonStaticComponents } from './static-nodes';
import { collectFromNodes, orderCitations, injectCiteNumbers } from '@/components/lesson/citations';
import { ReferenceList } from '@/components/lesson/citations-view';

export function LessonPreview({ content }: { content: string }) {
  const editor = usePlateViewEditor({
    plugins: buildLessonPlugins(),
    components: lessonStaticComponents,
  });

  const { value, references } = React.useMemo(() => {
    const raw = editor.getApi(MarkdownPlugin).markdown.deserialize(content || '');
    const { references, numbers } = orderCitations(collectFromNodes(raw));
    // Bake each citation's number into the value — the static renderer can't read
    // React context — and pass the ordered references to the list below.
    return { value: injectCiteNumbers(raw, numbers), references };
  }, [editor, content]);

  return (
    <>
      <PlateView editor={editor} value={value} />
      <ReferenceList references={references} />
    </>
  );
}
