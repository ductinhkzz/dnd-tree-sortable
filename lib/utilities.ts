import type { UniqueIdentifier } from '@dnd-kit/abstract';
import type { FlattenedItem, ProjectedType, TreeItem } from './types';

export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

export function getProjection<T extends object>(
  items: FlattenedItem<T>[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number,
  canHaveChildren: (item: FlattenedItem<T>) => boolean = () => true,
): ProjectedType | null {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  if (
    activeItemIndex < 0 ||
    overItemIndex < 0 ||
    !Number.isFinite(dragOffset) ||
    !Number.isFinite(indentationWidth) ||
    indentationWidth <= 0
  )
    return null;
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = previousItem ? previousItem.depth + (canHaveChildren(previousItem) ? 1 : 0) : 0;
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

function getMinDepth<T extends object>({ nextItem }: { nextItem: FlattenedItem<T> }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

export function flattenTree<T extends object>(items: TreeItem<T>[]): FlattenedItem<T>[] {
  const result: FlattenedItem<T>[] = [];
  function visit(nodes: TreeItem<T>[], parentId: UniqueIdentifier | null, depth: number) {
    nodes.forEach((item, index) => {
      result.push({ ...item, parentId, depth, index });
      visit(item.children, item.id, depth + 1);
    });
  }
  visit(items, null, 0);
  return result;
}

/** Apply a move against current data; ignore stale targets and descendants of the dragged subtree. */
export function moveTreeItem<T extends object>(
  items: TreeItem<T>[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  offset: number,
  indentationWidth: number,
  canHaveChildren?: (item: FlattenedItem<T>) => boolean,
) {
  const all = flattenTree(items);
  const collapsed = all.filter((item) => item.collapsed && item.children.length).map((item) => item.id);
  const visible = removeChildrenOf(all, [activeId, ...collapsed]);
  const projection = getProjection(visible, activeId, overId, offset, indentationWidth, canHaveChildren);
  if (!projection) return null;
  const activeIndex = all.findIndex((item) => item.id === activeId);
  const overIndex = all.findIndex((item) => item.id === overId);
  const before = all[activeIndex];
  const moved = [...all];
  moved[activeIndex] = { ...before, depth: projection.depth, parentId: projection.parentId };
  const nextItems = buildTree(arrayMove(moved, activeIndex, overIndex));
  const after = flattenTree(nextItems).find((item) => item.id === activeId)!;
  if (before.parentId === after.parentId && before.index === after.index) return null;
  const parent = all.find((item) => item.id === projection.parentId);
  // A successful nested drop should stay visible, including into a previously collapsed folder.
  return {
    items: parent?.collapsed
      ? setProperty(nextItems, parent.id, 'collapsed', () => false as TreeItem<T>['collapsed'])
      : nextItems,
    before,
    after,
  };
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
  const excludeParentIds = new Set(ids);

  return items.filter((item) => {
    if (item.parentId !== null && excludeParentIds.has(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.add(item.id);
      }
      return false;
    }

    return true;
  });
}

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
