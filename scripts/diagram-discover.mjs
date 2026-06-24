// Discovery: how does a Mermaid diagram round-trip through Plate's markdown,
// given the lesson editor has NO code-block plugin (BasicBlocks + inline code mark only)?
// Tests three candidate storage formats to pick the lossless one. Mirrors plate-discover.mjs.
import { createSlateEditor } from 'platejs';
import { BaseBasicBlocksPlugin, BaseBasicMarksPlugin } from '@platejs/basic-nodes';
import {
  MarkdownPlugin,
  remarkMdx,
  parseAttributes,
  propsToAttributes,
} from '@platejs/markdown';
import remarkGfm from 'remark-gfm';

const MERMAID = `graph TD
  A["Norma suprema"] --> B[Leyes orgánicas]
  A --> C[Leyes ordinarias]
  B --> D{"¿Reserva de ley?"}`;

// Candidate 1: bare fenced ```mermaid code block (the de-facto standard)
const fence = '```mermaid\n' + MERMAID + '\n```\n';

// Candidate 2: <Diagram> void element, source in a `code` attribute (mirrors <Video>)
const attr = `<Diagram code="${MERMAID.replace(/"/g, '&quot;').replace(/\n/g, '\\n')}" />\n`;

// Custom rule mapping a mermaid fence <-> a Diagram void node (intercept markdown `code`).
const diagramCodeRule = {
  code: {
    deserialize: (mdastNode) => {
      if (mdastNode.lang === 'mermaid') {
        return { type: 'Diagram', code: mdastNode.value, children: [{ text: '' }] };
      }
      return { type: 'code_block', lang: mdastNode.lang, children: [{ text: mdastNode.value }] };
    },
    serialize: (node) => {
      if (node.type === 'Diagram') {
        return { type: 'code', lang: 'mermaid', value: node.code || '' };
      }
      const text = (node.children || []).map((c) => c.text || '').join('');
      return { type: 'code', lang: node.lang, value: text };
    },
  },
};

const diagramAttrRule = {
  Diagram: {
    deserialize: (mdastNode) => ({
      type: 'Diagram',
      children: [{ text: '' }],
      ...parseAttributes(mdastNode.attributes),
    }),
    serialize: (node) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxFlowElement',
        name: 'Diagram',
        attributes: propsToAttributes(rest),
        children: [],
      };
    },
  },
};

function run(label, source, options) {
  const editor = createSlateEditor({
    plugins: [
      BaseBasicBlocksPlugin,
      BaseBasicMarksPlugin,
      MarkdownPlugin.configure({ options }),
    ],
  });
  const md = editor.getApi(MarkdownPlugin).markdown;
  let value, out, err;
  try {
    value = md.deserialize(source);
    editor.children = value;
    out = md.serialize();
  } catch (e) {
    err = e?.message || String(e);
  }
  console.log(`\n========== ${label} ==========`);
  console.log('--- SOURCE ---\n' + source);
  if (err) {
    console.log('--- ERROR ---\n' + err);
    return;
  }
  console.log('--- PLATE VALUE ---\n' + JSON.stringify(value, null, 1));
  console.log('--- RE-SERIALIZED ---\n' + out);
  console.log('--- IDEMPOTENT? ---', out.trim() === source.trim());
}

// Try intercepting the fence into a clean void `Diagram` node under different rule keys.
const codeBlockKeyRule = {
  code_block: {
    deserialize: (mdastNode) =>
      mdastNode.lang === 'mermaid'
        ? { type: 'Diagram', code: mdastNode.value, children: [{ text: '' }] }
        : undefined,
  },
  Diagram: {
    serialize: (node) => ({ type: 'code', lang: 'mermaid', value: node.code || '' }),
  },
};

// Round-trip starting FROM a void Diagram node (serialize side), then back.
function runFromNode(label, options) {
  const editor = createSlateEditor({
    plugins: [BaseBasicBlocksPlugin, BaseBasicMarksPlugin, MarkdownPlugin.configure({ options })],
  });
  const md = editor.getApi(MarkdownPlugin).markdown;
  editor.children = [{ type: 'Diagram', code: MERMAID, children: [{ text: '' }] }];
  let out, err;
  try { out = md.serialize(); } catch (e) { err = e?.message || String(e); }
  console.log(`\n========== ${label} ==========`);
  if (err) return console.log('--- ERROR ---\n' + err);
  console.log('--- SERIALIZED FROM Diagram NODE ---\n' + out);
  // and deserialize that back
  try {
    const v = md.deserialize(out);
    console.log('--- DESERIALIZED BACK ---\n' + JSON.stringify(v, null, 1));
  } catch (e) { console.log('deser err', e?.message); }
}

const base = { remarkPlugins: [remarkGfm, remarkMdx] };

run('1: bare ```mermaid fence (no custom rule)', fence, base);
run('5: fence + code_block-keyed deserialize rule', fence, { ...base, rules: codeBlockKeyRule });
runFromNode('6: serialize Diagram node -> fence', { ...base, rules: codeBlockKeyRule });
