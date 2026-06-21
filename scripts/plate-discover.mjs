// Discovery v2: use Plate's OWN tagged remarkMdx + real custom rules, and verify
// round-trip of <Objectives>/<KeyIdea>/<Video>.
import { createSlateEditor } from 'platejs';
import { BaseBasicBlocksPlugin, BaseBasicMarksPlugin } from '@platejs/basic-nodes';
import {
  MarkdownPlugin,
  remarkMdx,
  parseAttributes,
  propsToAttributes,
  convertChildrenDeserialize,
  convertNodesSerialize,
} from '@platejs/markdown';

const sample = `## Título

Texto con **negrita**.

<Objectives>
- Primer objetivo
- Segundo objetivo
</Objectives>

<KeyIdea>
Esta es la idea clave.
</KeyIdea>

<Video url="https://r2.example/clip.mp4" label="Introducción" />

Cierre.
`;

const customRules = {
  Objectives: {
    deserialize: (mdastNode, deco, options) => ({
      type: 'Objectives',
      children: convertChildrenDeserialize(mdastNode.children, { ...deco }, options),
      ...parseAttributes(mdastNode.attributes),
    }),
    serialize: (node, options) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxFlowElement',
        name: 'Objectives',
        attributes: propsToAttributes(rest),
        children: convertNodesSerialize(children, options),
      };
    },
  },
  KeyIdea: {
    deserialize: (mdastNode, deco, options) => ({
      type: 'KeyIdea',
      children: convertChildrenDeserialize(mdastNode.children, { ...deco }, options),
      ...parseAttributes(mdastNode.attributes),
    }),
    serialize: (node, options) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxFlowElement',
        name: 'KeyIdea',
        attributes: propsToAttributes(rest),
        children: convertNodesSerialize(children, options),
      };
    },
  },
  Video: {
    deserialize: (mdastNode) => {
      const props = parseAttributes(mdastNode.attributes);
      return { type: 'Video', children: [{ text: '' }], ...props };
    },
    serialize: (node) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxFlowElement',
        name: 'Video',
        attributes: propsToAttributes(rest),
        children: [],
      };
    },
  },
};

function run(label, options) {
  const editor = createSlateEditor({
    plugins: [
      BaseBasicBlocksPlugin,
      BaseBasicMarksPlugin,
      MarkdownPlugin.configure({ options }),
    ],
  });
  const md = editor.getApi(MarkdownPlugin).markdown;
  const value = md.deserialize(sample);
  console.log(`\n========== ${label} ==========`);
  console.log('--- PLATE VALUE ---');
  console.log(JSON.stringify(value, null, 1));
  editor.children = value;
  console.log('--- RE-SERIALIZED ---');
  console.log(md.serialize());
}

run('A: defaults + rules (no remarkPlugins override)', { rules: customRules });
run('B: explicit remarkMdx + rules', { remarkPlugins: [remarkMdx], rules: customRules });
