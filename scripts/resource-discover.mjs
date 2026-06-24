// Discovery: prove the <Resource url name size ext /> void block round-trips
// losslessly AND idempotently (serialize -> deserialize -> serialize is stable),
// exactly like the <Video> block. Mirrors diagram-discover.mjs / plate-discover.mjs.
//
// Run: node scripts/resource-discover.mjs
import { createSlateEditor } from 'platejs';
import { BaseBasicBlocksPlugin, BaseBasicMarksPlugin } from '@platejs/basic-nodes';
import { MarkdownPlugin, remarkMdx, parseAttributes, propsToAttributes } from '@platejs/markdown';
import remarkGfm from 'remark-gfm';

const RESOURCE = 'Resource';

// The exact rule shipped in components/teach/lesson-editor/markdown-rules.ts.
const rules = {
  [RESOURCE]: {
    deserialize: (mdastNode) => ({
      type: RESOURCE,
      children: [{ text: '' }],
      ...parseAttributes(mdastNode.attributes),
    }),
    serialize: (node) => {
      const { id, children, type, ...rest } = node;
      return {
        type: 'mdxJsxFlowElement',
        name: RESOURCE,
        attributes: propsToAttributes(rest),
        children: [],
      };
    },
  },
};

const options = { remarkPlugins: [remarkGfm, remarkMdx], rules };

function editor() {
  return createSlateEditor({
    plugins: [BaseBasicBlocksPlugin, BaseBasicMarksPlugin, MarkdownPlugin.configure({ options })],
  });
}

const SOURCE =
  '<Resource url="storage.r2/civil/u2/apuntes-capacidad.pdf" name="apuntes-capacidad.pdf" size="1.2 MB" ext="PDF" />\n';

// Pass 1: markdown -> Plate -> markdown
const e1 = editor();
const md1 = e1.getApi(MarkdownPlugin).markdown;
const value1 = md1.deserialize(SOURCE);
e1.children = value1;
const out1 = md1.serialize();

// Pass 2: feed pass-1 output back in (idempotency check)
const e2 = editor();
const md2 = e2.getApi(MarkdownPlugin).markdown;
const value2 = md2.deserialize(out1);
e2.children = value2;
const out2 = md2.serialize();

console.log('--- SOURCE ---\n' + SOURCE);
console.log('--- PLATE VALUE (pass 1) ---\n' + JSON.stringify(value1, null, 1));
console.log('--- RE-SERIALIZED (pass 1) ---\n' + out1);
console.log('--- RE-SERIALIZED (pass 2) ---\n' + out2);
console.log('lossless (source -> out1):', out1.trim() === SOURCE.trim());
console.log('idempotent (out1 === out2):', out1.trim() === out2.trim());
