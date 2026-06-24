/**
 * Shared Plate plugin list for lesson content. Used by BOTH the interactive
 * editor (LessonPlateEditor, via usePlateEditor) and the read-only live preview
 * (LessonPreview, via usePlateViewEditor + PlateView). Keeping one definition
 * means new block types / markdown rules can never drift between edit and preview.
 */
import { TrailingBlockPlugin } from 'platejs';
import { BasicBlocksPlugin, BasicMarksPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list-classic/react';
import { MarkdownPlugin, remarkMdx } from '@platejs/markdown';
import { lessonCustomPlugins } from './blocks';
import { lessonMarkdownOptions } from './markdown-rules';

/**
 * @param editing - When true (the interactive editor) append TrailingBlockPlugin,
 *   which keeps an empty paragraph as the last node so a teacher can place the
 *   cursor and keep typing after a void block (Diagram / Chart / Video / image)
 *   inserted at the very end. The read-only preview must NOT include it, or that
 *   empty paragraph renders as stray whitespace at the bottom.
 */
export function buildLessonPlugins({ editing = false } = {}) {
  return [
    BasicBlocksPlugin,
    BasicMarksPlugin,
    ListPlugin,
    ...lessonCustomPlugins,
    ...(editing ? [TrailingBlockPlugin.configure({ options: { type: 'p' } })] : []),
    MarkdownPlugin.configure({ options: lessonMarkdownOptions(remarkMdx) }),
  ];
}
