/**
 * Markdown <-> Plate rules for the lesson editor's custom MDX blocks.
 *
 * Lesson content is stored as a markdown string in `lessons.contentText`, using
 * three custom MDX component tags that predate the Plate editor:
 *
 *   <Objectives> - a bulleted list of learning objectives
 *   <KeyIdea>    - a highlighted "key idea" callout (paragraph content)
 *   <Video url="..." label="..." /> - a self-closing video embed
 *
 * These rules make the blocks round-trip losslessly through Plate. The Plate
 * element `type` is intentionally the exact MDX tag name (`Objectives` etc.) so a
 * single rule key matches both the mdast JSX tag (deserialize) and the Plate node
 * type (serialize). See scripts/plate-discover.mjs for the discovery that proved
 * this mapping and its idempotency.
 */
import {
  convertChildrenDeserialize,
  convertNodesSerialize,
  parseAttributes,
  propsToAttributes,
} from '@platejs/markdown';

export const OBJECTIVES = 'Objectives';
export const KEY_IDEA = 'KeyIdea';
export const VIDEO = 'Video';

// A block whose children are regular markdown (a list, paragraphs, ...).
const blockRule = (name: string) => ({
  deserialize: (mdastNode: any, deco: any, options: any) => ({
    type: name,
    children: convertChildrenDeserialize(mdastNode.children, { ...deco }, options),
    ...parseAttributes(mdastNode.attributes),
  }),
  serialize: (node: any, options: any) => {
    const { id, children, type, ...rest } = node;
    return {
      type: 'mdxJsxFlowElement',
      name,
      attributes: propsToAttributes(rest),
      children: convertNodesSerialize(children, options),
    };
  },
});

export const lessonMarkdownRules = {
  [OBJECTIVES]: blockRule(OBJECTIVES),
  [KEY_IDEA]: blockRule(KEY_IDEA),
  // Self-closing void element: attributes (url, label) become element props.
  [VIDEO]: {
    deserialize: (mdastNode: any) => ({
      type: VIDEO,
      children: [{ text: '' }],
      ...parseAttributes(mdastNode.attributes),
    }),
    serialize: (node: any) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxFlowElement',
        name: VIDEO,
        attributes: propsToAttributes(rest),
        children: [],
      };
    },
  },
} as const;

/**
 * Options for `MarkdownPlugin.configure({ options })`.
 * - `remarkMdx` (Plate's tagged build) is REQUIRED for JSX tags to parse; the
 *   default config does not enable MDX.
 * - `bullet: '-'` keeps standalone lists using `-` to match existing content.
 */
export function lessonMarkdownOptions(remarkMdx: any) {
  return {
    remarkPlugins: [remarkMdx],
    rules: lessonMarkdownRules as any,
    remarkStringifyOptions: { bullet: '-' as const },
  };
}
