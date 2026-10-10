import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/abstract';
import type { FlattenedItem, LoadChildren, TreeItem } from './types';
import { flattenTree } from './utilities';
import { loadTreeChildren } from './load-tree-children';

export type ChildLoadState = 'loading' | 'error' | 'loaded';

export function useLazyChildren<T extends object>(
  items: TreeItem<T>[],
  visible: FlattenedItem<T>[],
  loadChildren: LoadChildren<T> | undefined,
  updateItems: (items: TreeItem<T>[]) => void,
) {
  const latest = useRef({ items, loadChildren, updateItems });
  const requests = useRef(new Map<UniqueIdentifier, AbortController>());
  const [states, setStates] = useState(new Map<UniqueIdentifier, ChildLoadState>());
  const stateRef = useRef(states);
  useLayoutEffect(() => {
    latest.current = { items, loadChildren, updateItems };
    stateRef.current = states;
  }, [items, loadChildren, updateItems, states]);

  useEffect(() => {
    const pending = requests.current;
    return () => {
      for (const controller of pending.values()) controller.abort();
      pending.clear();
      stateRef.current = new Map();
    };
  }, []);

  const request = useCallback((id: UniqueIdentifier, retry = false) => {
    const context = latest.current;
    const item = flattenTree(context.items).find((node) => node.id === id);
    if (!context.loadChildren || !item || item.kind === 'file' || item.childrenLoaded !== false) return;
    if (requests.current.has(id) || (!retry && stateRef.current.has(id))) return;
    const controller = new AbortController();
    requests.current.set(id, controller);
    stateRef.current = new Map(stateRef.current).set(id, 'loading');
    setStates(stateRef.current);
    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return undefined;
        return context.loadChildren!(item, { signal: controller.signal });
      })
      .then((children) => {
        if (controller.signal.aborted || requests.current.get(id) !== controller) return;
        if (!Array.isArray(children)) throw new Error('loadChildren must return an array.');
        const current = latest.current;
        const next = loadTreeChildren(current.items, id, children);
        if (next !== current.items) {
          // A second simultaneous response must merge against this result, not an older render.
          latest.current = { ...current, items: next };
          current.updateItems(next);
        }
        stateRef.current = new Map(stateRef.current).set(id, 'loaded');
        setStates(stateRef.current);
      })
      .catch(() => {
        if (controller.signal.aborted || requests.current.get(id) !== controller) return;
        stateRef.current = new Map(stateRef.current).set(id, 'error');
        setStates(stateRef.current);
      })
      .finally(() => {
        if (requests.current.get(id) === controller) requests.current.delete(id);
      });
  }, []);

  useEffect(() => {
    if (!loadChildren) {
      for (const controller of requests.current.values()) controller.abort();
      requests.current.clear();
      if (stateRef.current.size) {
        stateRef.current = new Map();
        setStates(stateRef.current);
      }
      return;
    }
    const byId = new Map(flattenTree(items).map((item) => [item.id, item]));
    for (const [id, controller] of requests.current) {
      if (byId.get(id)?.childrenLoaded !== false) {
        controller.abort();
        requests.current.delete(id);
      }
    }
    const next = new Map(stateRef.current);
    for (const id of next.keys()) if (byId.get(id)?.childrenLoaded !== false) next.delete(id);
    if (next.size !== stateRef.current.size) {
      stateRef.current = next;
      setStates(next);
    }
    for (const item of visible) {
      if (!item.collapsed && item.childrenLoaded === false) request(item.id);
    }
  }, [items, visible, loadChildren, request]);

  return { loadStates: states, requestLoad: request };
}
