import assert from 'node:assert/strict';
import { test } from 'vitest';
import { getTreeProjection, moveTreeNode } from '../lib/tree-moves';
import type { TreeItem } from '../lib/types';
import {
  buildTree,
  moveTreeItem,
  flattenTree,
  getAnnouncement,
  getProjection,
  removeChildrenOf,
  removeItem,
  setProperty,
} from '../lib/utilities';

test('tree round-trip preserves custom data and distinct string/numeric IDs, including root and zero', () => {
  const items: TreeItem<{ label: string }>[] = [
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
  const items: TreeItem<{ render: () => string }>[] = [{ id: 0, collapsed: false, render, children: [child] }];
  const collapsed = setProperty(items, 0, 'collapsed', () => true);
  assert.equal(collapsed[0].collapsed, true);
  assert.equal(items[0].collapsed, false);
  assert.equal(collapsed[0].render, render);
  assert.equal(removeItem(items, 'child')[0].children.length, 0);
  assert.equal(items[0].children[0], child);
  assert.equal(buildTree(flattenTree(items))[0].render, render);
});

test('moves ignore stale IDs, descendant targets, unchanged positions, and invalid indentation', () => {
  const items: TreeItem[] = [
    { id: 0, children: [{ id: 'child', children: [] }] },
    { id: 'other', children: [] },
  ];
  assert.equal(moveTreeItem(items, 'missing', 'other', 0, 24), null);
  assert.equal(moveTreeItem(items, 0, 'missing', 0, 24), null);
  assert.equal(moveTreeItem(items, 0, 'child', 0, 24), null);
  assert.equal(moveTreeItem(items, 0, 0, 0, 24), null);
  assert.equal(moveTreeItem(items, 0, 'other', 0, 0), null);
});

test('all valid reorder/nesting combinations preserve nodes, subtree payloads, and source data', () => {
  const payload = () => 'preserved';
  const items: TreeItem<{ payload?: () => string }>[] = [
    {
      id: 0,
      payload,
      children: [
        { id: 'a', children: [{ id: 'b', children: [] }] },
        { id: 'c', children: [] },
      ],
    },
    { id: '0', children: [{ id: 'd', children: [] }] },
    { id: 'last', children: [] },
  ];
  const original = flattenTree(items);
  const expectedIds = new Set(original.map((item) => item.id));
  for (const active of original)
    for (const target of original)
      for (const offset of [-1000, -24, 0, 24, 1000]) {
        const result = moveTreeItem(items, active.id, target.id, offset, 24);
        if (!result) continue;
        const next = flattenTree(result.items);
        assert.equal(next.length, original.length);
        assert.deepEqual(new Set(next.map((item) => item.id)), expectedIds);
        assert.equal(next.find((item) => item.id === 0)?.payload, payload);
        assert.deepEqual(
          result.after,
          next.find((item) => item.id === active.id),
        );
        assert.deepEqual(flattenTree(items), original);
      }
});

test('nesting into a collapsed folder expands it so the moved item remains visible', () => {
  const items: TreeItem[] = [
    { id: 'folder', collapsed: true, children: [{ id: 'hidden', children: [] }] },
    { id: 'file', children: [] },
  ];
  const result = moveTreeItem(items, 'file', 'file', 24, 24)!;
  assert.equal(result.items[0].collapsed, false);
  assert.equal(result.after.parentId, 'folder');
  assert.equal(items[0].collapsed, true);
  assert.deepEqual(
    result.items[0].children.map((item) => item.id),
    ['hidden', 'file'],
  );
});

test('Explorer projections prevent files from receiving children while empty folders accept them', () => {
  const leafItems: TreeItem[] = [
    { id: 'file', kind: 'file', children: [] },
    { id: 'source', kind: 'file', children: [] },
  ];
  const foldersOnly = (item: TreeItem) => item.kind === 'folder';
  assert.equal(getProjection(flattenTree(leafItems), 'source', 'source', 24, 24, foldersOnly)?.depth, 0);
  assert.equal(moveTreeItem(leafItems, 'source', 'source', 24, 24, foldersOnly), null);
  const folderItems: TreeItem[] = [{ id: 'folder', kind: 'folder', children: [] }, leafItems[1]];
  const result = moveTreeItem(folderItems, 'source', 'source', 24, 24, foldersOnly);
  assert.equal(result?.items[0].children[0].id, 'source');
});

test('Reorder preserves every parent and subtree, including drops onto expanded siblings', () => {
  const items: TreeItem[] = [
    { id: 'folder', children: [{ id: 'child', children: [] }] },
    { id: 'source', children: [{ id: 'subtree', children: [] }] },
  ];
  const result = moveTreeNode(items, 'source', 'folder', 100, 24, 'reorder', 'root-zone', () => true);
  assert.deepEqual(
    result?.items.map((item) => item.id),
    ['source', 'folder'],
  );
  assert.equal(result?.items[0].children[0].id, 'subtree');
  assert.equal(result?.items[1].children[0].id, 'child');
  assert.equal(
    moveTreeNode(items, 'source', 'child', 0, 24, 'reorder', 'root-zone', () => true),
    null,
  );
});

test('Folder moves reject sibling reorder, self and descendant targets and append only to a new parent', () => {
  const items: TreeItem[] = [
    { id: 'source', kind: 'folder', children: [{ id: 'child', kind: 'folder', children: [] }] },
    { id: 'target', kind: 'folder', children: [{ id: 'existing', kind: 'file', children: [] }] },
    { id: 0, kind: 'file', children: [] },
  ];
  const original = structuredClone(items);
  const folders = (item: TreeItem) => item.kind === 'folder';
  for (const target of ['source', 'child', 0, 'root-zone', 'missing']) {
    assert.equal(moveTreeNode(items, 'source', target, 0, 24, 'explorer', 'root-zone', folders), null);
  }
  const result = moveTreeNode(items, 'source', 'existing', 0, 24, 'explorer', 'root-zone', folders);
  assert.deepEqual(
    result?.items.map((item) => item.id),
    ['target', 0],
  );
  assert.deepEqual(
    result?.items[0].children.map((item) => item.id),
    ['existing', 'source'],
  );
  assert.equal(result?.items[0].children[1].children[0].id, 'child');
  assert.equal(result?.after.depth, 1);
  assert.equal(result?.after.index, 1);
  assert.deepEqual(items, original);
  assert.equal(getTreeProjection(flattenTree(items), 0, 'missing', 0, 24, 'explorer', 'root-zone', folders), null);
});
