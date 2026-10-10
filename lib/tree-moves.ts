import type { UniqueIdentifier } from '@dnd-kit/abstract';
import type { FlattenedItem, ProjectedType, TreeItem, TreeMode } from './types';
import {
  arrayMove,
  buildTree,
  flattenTree,
  getProjection,
  moveTreeItem,
  removeChildrenOf,
  setProperty,
} from './utilities';

/** All previews and commits share the same mode rules. */
export function getTreeProjection<T extends object>(
  visible: FlattenedItem<T>[],
  sourceId: UniqueIdentifier,
  targetId: UniqueIdentifier,
  offset: number,
  indentationWidth: number,
  mode: TreeMode,
  rootId: UniqueIdentifier,
  canHaveChildren: (item: FlattenedItem<T>) => boolean,
): ProjectedType | null {
  const source = visible.find((item) => item.id === sourceId);
  const target = visible.find((item) => item.id === targetId);
  if (!source) return null;
  if (mode === 'tree') return getProjection(visible, sourceId, targetId, offset, indentationWidth, canHaveChildren);
  if (mode === 'reorder') {
    if (!target || source.parentId !== target.parentId || source.id === target.id) return null;
    return { depth: source.depth, minDepth: source.depth, maxDepth: source.depth, parentId: source.parentId };
  }
  if (sourceId === targetId || (!target && targetId !== rootId)) return null;
  const parentId = targetId === rootId ? null : target && canHaveChildren(target) ? target.id : target!.parentId;
  if (parentId === source.parentId || parentId === source.id) return null;
  const parent = parentId === null ? null : visible.find((item) => item.id === parentId);
  if (parentId !== null && (!parent || !canHaveChildren(parent))) return null;
  const depth = parent ? parent.depth + 1 : 0;
  return { depth, minDepth: depth, maxDepth: depth, parentId };
}

/** Reorder keeps the parent; Explorer appends to a new parent without changing existing sibling order. */
export function moveTreeNode<T extends object>(
  items: TreeItem<T>[],
  sourceId: UniqueIdentifier,
  targetId: UniqueIdentifier,
  offset: number,
  indentationWidth: number,
  mode: TreeMode,
  rootId: UniqueIdentifier,
  canHaveChildren: (item: FlattenedItem<T>) => boolean,
) {
  if (mode === 'tree') return moveTreeItem(items, sourceId, targetId, offset, indentationWidth, canHaveChildren);
  const all = flattenTree(items);
  const collapsed = all.filter((item) => item.collapsed).map((item) => item.id);
  const visible = removeChildrenOf(all, [sourceId, ...collapsed]);
  const projection = getTreeProjection(
    visible,
    sourceId,
    targetId,
    offset,
    indentationWidth,
    mode,
    rootId,
    canHaveChildren,
  );
  if (!projection) return null;
  const sourceIndex = all.findIndex((item) => item.id === sourceId);
  const before = all[sourceIndex];
  const moved =
    mode === 'reorder'
      ? arrayMove(
          all,
          sourceIndex,
          all.findIndex((item) => item.id === targetId),
        )
      : [...all.filter((item) => item.id !== sourceId), { ...before, parentId: projection.parentId }];
  let nextItems = buildTree(moved);
  if (mode === 'explorer' && projection.parentId !== null) {
    nextItems = setProperty(nextItems, projection.parentId, 'collapsed', () => false as TreeItem<T>['collapsed']);
  }
  const after = flattenTree(nextItems).find((item) => item.id === sourceId)!;
  if (before.parentId === after.parentId && before.index === after.index) return null;
  return { items: nextItems, before, after };
}
