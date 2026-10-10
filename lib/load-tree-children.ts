import type { UniqueIdentifier } from '@dnd-kit/abstract';
import type { TreeItem } from './types';
import { flattenTree } from './utilities';

/** Preserve children moved in while a request was in flight, and reject duplicate IDs. */
export function loadTreeChildren<T extends object>(
  items: TreeItem<T>[],
  id: UniqueIdentifier,
  children: TreeItem<T>[],
) {
  const parent = flattenTree(items).find((item) => item.id === id);
  if (!parent || parent.childrenLoaded !== false) return items;
  const local = new Map(parent.children.map((item) => [item.id, item]));
  const merged = children.map((item) => local.get(item.id) ?? item);
  const remoteIds = new Set(children.map((item) => item.id));
  merged.push(...parent.children.filter((item) => !remoteIds.has(item.id)));
  function replace(nodes: TreeItem<T>[]): TreeItem<T>[] {
    return nodes.map((item) => {
      if (item.id === id) return { ...item, children: merged, childrenLoaded: true };
      if (!item.children.length) return item;
      return { ...item, children: replace(item.children) };
    });
  }
  const next = replace(items);
  const seen = new Set<UniqueIdentifier>();
  for (const item of flattenTree(next)) {
    if (seen.has(item.id)) throw new Error('Loaded children must have unique tree IDs.');
    seen.add(item.id);
  }
  return next;
}
