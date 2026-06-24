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
import remarkGfm from 'remark-gfm';

export const OBJECTIVES = 'Objectives';
export const KEY_IDEA = 'KeyIdea';
export const VIDEO = 'Video';
export const DIAGRAM = 'Diagram';
export const CHART = 'Chart';
export const DEFINITION = 'Definition';
export const CITE = 'Cite';
export const RESOURCE = 'Resource';

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
  // Highlight (background-color mark) — serialize to a capitalized <Highlight color>
  // component rather than `<span style>`, because MDX routes capitalized JSX through
  // the components map but renders lowercase JSX (like span) as a raw host element,
  // which crashes on a string `style` prop in the reader.
  backgroundColor: {
    mark: true,
    serialize: (node: any) => ({
      type: 'mdxJsxTextElement',
      name: 'Highlight',
      attributes: [{ type: 'mdxJsxAttribute', name: 'color', value: node.backgroundColor }],
      children: [{ type: 'text', value: node.text }],
    }),
  },
  Highlight: {
    mark: true,
    deserialize: (mdastNode: any, deco: any, options: any) =>
      convertChildrenDeserialize(
        mdastNode.children,
        { ...deco, backgroundColor: parseAttributes(mdastNode.attributes).color },
        options,
      ),
  },
  // Definition (glossary term) — an inline element wrapping a run of text, with the
  // definition in a `def` attribute. Serializes to <Definition def="…">term</Definition>
  // (capitalized JSX so MDX routes it through the components map, like Highlight).
  [DEFINITION]: {
    deserialize: (mdastNode: any, deco: any, options: any) => ({
      type: DEFINITION,
      def: parseAttributes(mdastNode.attributes).def,
      children: convertChildrenDeserialize(mdastNode.children, { ...deco }, options),
    }),
    serialize: (node: any, options: any) => ({
      type: 'mdxJsxTextElement',
      name: DEFINITION,
      attributes: [{ type: 'mdxJsxAttribute', name: 'def', value: node.def ?? '' }],
      children: convertNodesSerialize(node.children, options),
    }),
  },
  // Diagram (Mermaid) — stored as a fenced ```mermaid code block, the de-facto
  // standard for embedding Mermaid in markdown. A mermaid fence deserializes to a
  // void Diagram node holding the source in `code`; the Diagram node serializes
  // back to the same fence. Round-trip proven idempotent in scripts/diagram-discover.mjs.
  // Non-mermaid fences are rebuilt as the default code_block node so they are not lost.
  code_block: {
    deserialize: (mdastNode: any) => {
      if (mdastNode.lang === 'mermaid') {
        return { type: DIAGRAM, code: mdastNode.value ?? '', children: [{ text: '' }] };
      }
      // Data charts are stored as a ```chart fence holding JSON config — same
      // lossless round-trip as the diagram fence (attributes don't round-trip).
      if (mdastNode.lang === 'chart') {
        return { type: CHART, config: mdastNode.value ?? '', children: [{ text: '' }] };
      }
      const lines = String(mdastNode.value ?? '').split('\n');
      return {
        type: 'code_block',
        ...(mdastNode.lang ? { lang: mdastNode.lang } : {}),
        children: lines.map((line: string) => ({ type: 'code_line', children: [{ text: line }] })),
      };
    },
  },
  [DIAGRAM]: {
    serialize: (node: any) => ({ type: 'code', lang: 'mermaid', value: node.code ?? '' }),
  },
  [CHART]: {
    serialize: (node: any) => ({ type: 'code', lang: 'chart', value: node.config ?? '' }),
  },
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
  // Downloadable resource — a self-closing void block rendering a download card.
  // Attributes (url, name, size, ext) become element props; round-trips exactly
  // like <Video> (proven idempotent in scripts/resource-discover.mjs).
  [RESOURCE]: {
    deserialize: (mdastNode: any) => ({
      type: RESOURCE,
      children: [{ text: '' }],
      ...parseAttributes(mdastNode.attributes),
    }),
    serialize: (node: any) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxFlowElement',
        name: RESOURCE,
        attributes: propsToAttributes(rest),
        children: [],
      };
    },
  },
  // Citation marker — an inline, self-closing void element rendering a superscript
  // number. `cid` groups markers that cite the same source (within-lesson reuse);
  // `source` (text, may contain inline markdown) and optional `url` describe the
  // reference shown in the end-of-lesson list.
  [CITE]: {
    deserialize: (mdastNode: any) => ({
      type: CITE,
      children: [{ text: '' }],
      ...parseAttributes(mdastNode.attributes),
    }),
    serialize: (node: any) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxTextElement',
        name: CITE,
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
    // remarkGfm handles strikethrough (~~) on both parse and stringify; without it
    // serializing a `delete` node throws "Cannot handle unknown node".
    remarkPlugins: [remarkGfm, remarkMdx],
    rules: lessonMarkdownRules as any,
    remarkStringifyOptions: { bullet: '-' as const },
  };
}
