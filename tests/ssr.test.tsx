import { renderToString } from 'react-dom/server';
import { expect, test } from 'vitest';
import { SortableTree } from '../lib';

test('the complete component renders on the server without navigator or document', () => {
  expect(typeof document).toBe('undefined');
  expect(renderToString(<SortableTree defaultItems={[{ id: 0, children: [] }]} />)).toContain('400px');
});
