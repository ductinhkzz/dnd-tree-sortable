import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildTree,
  flattenTree,
  getAnnouncement,
  getProjection,
  removeChildrenOf,
  removeItem,
  setProperty,
} from '../lib/utilities';

test('tree round-trip preserves custom data and distinct string/numeric IDs, including root and zero', () => {
  const items = [
    {
      id: 'root',
      label: 'Root folder',
      children: [
        { id: 0, label: 'Zero', children: [] },
        { id: '0', label: 'String zero', children: [] },
      ],
    },
  ];
  assert.deepEqual(buildTree(flattenTree(items)), items);
});

test('dragging a parent with ID zero excludes its descendants', () => {
  const items = flattenTree([
    { id: 0, children: [{ id: 1, children: [{ id: 2, children: [] }] }] },
    { id: 3, children: [] },
  ]);
  assert.deepEqual(
    removeChildrenOf(items, [0]).map((item) => item.id),
    [0, 3],
  );
});

test('horizontal drag nests a root after a sibling without mutating the source', () => {
  const items = flattenTree([
    { id: 'a', children: [] },
    { id: 'b', children: [] },
  ]);
  const before = structuredClone(items);
  assert.deepEqual(getProjection(items, 'b', 'b', 24, 24), { depth: 1, minDepth: 0, maxDepth: 1, parentId: 'a' });
  assert.deepEqual(items, before);
});

test('a single-item drag has a safe screen-reader announcement', () => {
  const items = [{ id: 0, children: [] }];
  assert.equal(
    getAnnouncement('onDragEnd', 0, 0, items, { depth: 0, minDepth: 0, maxDepth: 0, parentId: null }),
    '0 was dropped.',
  );
});

test('utilities can be imported without browser globals during SSR', () => {
  assert.equal(typeof document, 'undefined');
  assert.equal(flattenTree([]).length, 0);
});

test('collapse and removal leave controlled data untouched and preserve function payloads', () => {
  const render = () => 'custom';
  const child = { id: 'child', render, children: [] };
  const items = [{ id: 0, collapsed: false, render, children: [child] }];
  const collapsed = setProperty(items, 0, 'collapsed', () => true);
  assert.equal(collapsed[0].collapsed, true);
  assert.equal(items[0].collapsed, false);
  assert.equal(collapsed[0].render, render);
  assert.equal(removeItem(items, 'child')[0].children.length, 0);
  assert.equal(items[0].children[0], child);
  assert.equal(buildTree(flattenTree(items))[0].render, render);
});
