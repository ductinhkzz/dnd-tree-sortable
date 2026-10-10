import type { Modifier, UniqueIdentifier } from '@dnd-kit/core';
import { AnimateLayoutChanges, arrayMove } from '@dnd-kit/sortable';

import type { FlattenedItem, ProjectedType, TreeItem } from './types';

export const iOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document));

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

export function getProjection<T extends object>(
  items: FlattenedItem<T>[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number,
): ProjectedType {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = getMaxDepth({
    previousItem,
  });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth<T extends object>({ previousItem }: { previousItem: FlattenedItem<T> }) {
  if (previousItem) {
    return previousItem.depth + 1;
  }

  return 0;
}

function getMinDepth<T extends object>({ nextItem }: { nextItem: FlattenedItem<T> }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

function flatten<T extends object>(
  items: TreeItem<T>[],
  parentId: UniqueIdentifier | null = null,
  depth = 0,
): FlattenedItem<T>[] {
  return items.reduce<FlattenedItem<T>[]>((acc, item, index) => {
    return [...acc, { ...item, parentId, depth, index }, ...flatten(item.children, item.id, depth + 1)];
  }, []);
}

export function flattenTree<T extends object>(items: TreeItem<T>[]): FlattenedItem<T>[] {
  return flatten(items);
}

export function buildTree<T extends object>(flattenedItems: FlattenedItem<T>[]): TreeItem<T>[] {
  const roots: TreeItem<T>[] = [];
  const nodes = new Map<UniqueIdentifier, TreeItem<T>>();
  for (const { parentId: _parentId, depth: _depth, index: _index, ...item } of flattenedItems) {
    nodes.set(item.id, { ...item, children: [] } as TreeItem<T>);
  }
  for (const item of flattenedItems) {
    const node = nodes.get(item.id)!;
    if (item.parentId === null) roots.push(node);
    else nodes.get(item.parentId)?.children.push(node);
  }
  return roots;
}

export function findItem(items: TreeItem[], itemId: UniqueIdentifier) {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep(items: TreeItem[], itemId: UniqueIdentifier): TreeItem | undefined {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children.length) {
      const child = findItemDeep(children, itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

export function removeItem<T extends object>(items: TreeItem<T>[], id: UniqueIdentifier): TreeItem<T>[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children.length ? removeItem(item.children, id) : item.children,
    }));
}

export function setProperty<T extends object, K extends keyof TreeItem>(
  items: TreeItem<T>[],
  id: UniqueIdentifier,
  property: K,
  setter: (value: TreeItem<T>[K]) => TreeItem<T>[K],
): TreeItem<T>[] {
  return items.map((item) => {
    if (item.id === id) return { ...item, [property]: setter(item[property]) };
    return item.children.length ? { ...item, children: setProperty(item.children, id, property, setter) } : item;
  });
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount<T extends TreeItem>(items: T[], id: UniqueIdentifier) {
  const item = findItemDeep(items, id);

  return item ? countChildren(item.children) : 0;
}

export function removeChildrenOf<T extends FlattenedItem>(items: T[], ids: UniqueIdentifier[]) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.parentId !== null && excludeParentIds.includes(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}

export const animateLayoutChanges: AnimateLayoutChanges = ({ isSorting, wasDragging }) => !(isSorting || wasDragging);

export const adjustTranslate: Modifier = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 25,
  };
};

export const getAnnouncement = (
  eventName: string,
  overId: FlattenedItem['id'],
  activeId: FlattenedItem['id'],
  items: TreeItem[],
  projected: ProjectedType,
) => {
  const clonedItems: FlattenedItem[] = flattenTree(items);
  const overIndex = clonedItems.findIndex(({ id }) => id === overId);
  const activeIndex = clonedItems.findIndex(({ id }) => id === activeId);
  const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);

  const previousItem = sortedItems[overIndex - 1];

  let announcement;
  const movedVerb = eventName === 'onDragEnd' ? 'dropped' : 'moved';
  const nestedVerb = eventName === 'onDragEnd' ? 'dropped' : 'nested';

  if (!previousItem) {
    const nextItem = sortedItems[overIndex + 1];
    announcement = nextItem ? `${activeId} was ${movedVerb} before ${nextItem.id}.` : `${activeId} was ${movedVerb}.`;
  } else if (projected.depth > previousItem.depth) {
    announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`;
  } else {
    let previousSibling: FlattenedItem | undefined = previousItem;
    while (previousSibling && projected.depth < previousSibling.depth) {
      const parentId: UniqueIdentifier | null = previousSibling.parentId;
      previousSibling = sortedItems.find(({ id }) => id === parentId);
    }

    if (previousSibling) {
      announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`;
    }
  }

  return announcement;
};
