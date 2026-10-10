import { renderToString } from 'react-dom/server';
import { expect, test } from 'vitest';
import { SortableTree } from '../lib';

test('the complete component renders on the server without navigator or document', () => {
  expect(typeof document).toBe('undefined');
  expect(renderToString(<SortableTree defaultItems={[{ id: 0, children: [] }]} />)).toContain('400px');
});

test('large virtual Explorer trees render a limited server snapshot with hierarchy metadata', () => {
  const html = renderToString(
    <SortableTree
      mode='explorer'
      defaultItems={Array.from({ length: 1000 }, (_, id) => ({ id, kind: 'file', children: [] }))}
    />,
  );
  expect(html).toContain('aria-setsize="1000"');
  expect((html.match(/data-tree-row/g) ?? []).length).toBeLessThan(40);
});
