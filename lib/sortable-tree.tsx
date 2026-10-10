'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useId, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { DragDropProvider, DragOverlay, type DragDropEventHandlers } from '@dnd-kit/react';
import { Accessibility, PointerSensor, type DragDropManager } from '@dnd-kit/dom';
import type { UniqueIdentifier, Plugins } from '@dnd-kit/abstract';
import { cn } from 'cn';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import {
  buildTree,
  flattenTree,
  getChildCount,
  removeItem,
  removeChildrenOf,
  setProperty,
  getAnnouncement,
} from './utilities';
import { getTreeProjection, moveTreeNode } from './tree-moves';
import { useLazyChildren } from './use-lazy-children';
import { TreeRootDropZone } from './tree-root-drop-zone';
import type { FlattenedItem, SensorContext, LoadChildren, TreeItem, TreeMode } from './types';
import { createTreeKeyboardSensor } from './keyboard-coordinates';
import { SortableTreeItem, SortableTreeItemProps, TreeItem as TreeItemRow } from './components';

export interface SortableTreeProps<T extends object> {
  /** Reorder: siblings only. Tree: reorder and nesting. Explorer: folder moves only. */
  mode?: TreeMode;
  /** Automatically virtualize at 200 visible rows; false opts out. */
  virtualize?: boolean | { threshold?: number; estimateSize?: number; overscan?: number };
  selectedId?: UniqueIdentifier | null;
  onSelect?: (item: TreeItem<T>) => void;
  onOpen?: (item: TreeItem<T>) => void;
  /** Fetch children of nodes marked childrenLoaded: false when expanded. */
  loadChildren?: LoadChildren<T>;
  collapsible?: boolean;
  defaultItems?: TreeItem<T>[];
  items?: TreeItem<T>[];
  onItemsChange?: (items: TreeItem<T>[]) => void;
  indentationWidth?: number;
  indicator?: boolean;
  removable?: boolean;
  components?: SortableTreeItemProps<TreeItem<T>>['components'];
  height?: string | number;
  className?: string;
  'aria-label'?: string;
  emptyMessage?: string;
  renderItemContent?: SortableTreeItemProps<TreeItem<T>>['renderItem'];
  onChange?: (currentItem: FlattenedItem<T>, changeItem: FlattenedItem<T>) => void;
  onRemove?: (id: UniqueIdentifier) => void;
}

export const SortableTree = <T extends object = {}>({
  mode = 'tree',
  virtualize,
  selectedId: controlledSelectedId,
  onSelect,
  onOpen,
  loadChildren,
  collapsible,
  defaultItems = [],
  items: controlledItems,
  onItemsChange,
  indicator = false,
  indentationWidth = 24,
  removable,
  components,
  height = 400,
  className,
  'aria-label': ariaLabel = 'Sortable items',
  emptyMessage = 'No items yet.',
  renderItemContent,
  onChange,
  onRemove,
}: SortableTreeProps<T>) => {
  const [internalItems, setInternalItems] = useState(() => defaultItems);
  const items = controlledItems ?? internalItems;
  const updateItems = useCallback(
    (next: TreeItem<T>[]) => {
      if (controlledItems === undefined) setInternalItems(next);
      onItemsChange?.(next);
    },
    [controlledItems, onItemsChange],
  );
  const explorer = mode === 'explorer';
  const containerRef = useRef<HTMLDivElement>(null);
  const treeId = useId();
  const rootDropId = `${treeId}-root`;
  const [selectedId, setSelectedId] = useState<UniqueIdentifier | null>(null);
  const [focusedId, setFocusedId] = useState<UniqueIdentifier | null>(null);
  const [keyboardIndex, setKeyboardIndex] = useState<number | null>(null);
  const focusPending = useRef(false);
  const typeahead = useRef({ text: '', time: 0 });
  const canHaveChildren = useCallback(
    (item: FlattenedItem<T>) =>
      !explorer ||
      item.kind === 'folder' ||
      (item.kind !== 'file' && (item.children.length > 0 || item.childrenLoaded !== undefined)),
    [explorer],
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree
      .filter((item) => item.collapsed && item.children.length)
      .map((item) => item.id);

    return removeChildrenOf(flattenedTree, activeId !== null ? [activeId, ...collapsedItems] : collapsedItems);
  }, [activeId, items]);

  const { loadStates, requestLoad } = useLazyChildren(items, flattenedItems, loadChildren, updateItems);

  const activeIndex = flattenedItems.findIndex((item) => item.id === activeId);
  const focusedIndex = Math.max(
    0,
    flattenedItems.findIndex((item) => item.id === (focusedId ?? controlledSelectedId ?? selectedId)),
  );
  const virtualOptions = typeof virtualize === 'object' ? virtualize : {};
  const virtualEnabled =
    virtualize !== false && flattenedItems.length >= (virtualize === true ? 0 : (virtualOptions.threshold ?? 200));
  // oxlint-disable-next-line react/incompatible-library -- TanStack Virtual is imperative; this component is not React-Compiler memoized.
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLLIElement>({
    count: flattenedItems.length,
    enabled: virtualEnabled,
    getScrollElement: () =>
      containerRef.current?.querySelector<HTMLDivElement>('[data-slot="scroll-area-viewport"]') ?? null,
    estimateSize: () => virtualOptions.estimateSize ?? (explorer ? 36 : 46),
    getItemKey: (index) => `${typeof flattenedItems[index].id}:${flattenedItems[index].id}`,
    overscan: virtualOptions.overscan ?? 8,
    paddingStart: 8,
    scrollMargin: explorer ? 40 : 0,
    paddingEnd: 8,
    gap: 2,
    initialRect: { width: 300, height: typeof height === 'number' ? height : 400 },
    useFlushSync: false,
    rangeExtractor: (range) =>
      [
        ...new Set([
          ...defaultRangeExtractor(range),
          ...(activeIndex >= 0 ? [activeIndex] : []),
          ...(explorer && flattenedItems.length ? [focusedIndex] : []),
          ...(keyboardIndex !== null && keyboardIndex < flattenedItems.length ? [keyboardIndex] : []),
        ]),
      ].sort((a, b) => a - b),
  });
  const reveal = useCallback(
    async (index: number) => {
      if (virtualEnabled) {
        setKeyboardIndex(index);
        virtualizer.scrollToIndex(index, { align: 'auto' });
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    },
    [virtualEnabled, virtualizer],
  );
  useEffect(() => {
    if (!focusPending.current) return;
    const row = containerRef.current?.querySelector<HTMLLIElement>(`[data-index="${focusedIndex}"]`);
    if (row) {
      row.focus({ preventScroll: true });
      row.scrollIntoView?.({ block: 'nearest' });
      focusPending.current = false;
    }
  }, [focusedIndex, focusedId, activeId, loadStates]);
  // Explicit hierarchy metadata is required when virtualized siblings are absent from the DOM.
  const siblingCounts = useMemo(() => {
    const counts = new Map<UniqueIdentifier | null, number>();
    for (const item of flattenedItems) counts.set(item.parentId, (counts.get(item.parentId) ?? 0) + 1);
    return counts;
  }, [flattenedItems]);

  const projected = useMemo(() => {
    if (activeId !== null && overId !== null) {
      return getTreeProjection(
        flattenedItems,
        activeId,
        overId,
        offsetLeft,
        indentationWidth,
        mode,
        rootDropId,
        canHaveChildren,
      );
    }
    return null;
  }, [activeId, flattenedItems, indentationWidth, offsetLeft, overId, canHaveChildren, mode, rootDropId]);

  const sensorContext: SensorContext<FlattenedItem<T>> = useRef({
    items: flattenedItems,
  });
  const sensors = useMemo(
    // oxlint-disable-next-line react/refs -- This factory reads the ref only from sensor event handlers.
    () => [
      PointerSensor.configure({
        activatorElements: (source) => [
          (sensorContext.current.mode === 'explorer' ? source.element : source.handle) ?? undefined,
        ],
      }),
      createTreeKeyboardSensor(sensorContext, indentationWidth),
    ],
    [sensorContext, indentationWidth],
  );

  const activeItem = useMemo(
    () => (activeId !== null ? flattenedItems.find(({ id }) => id === activeId) : null),
    [activeId, flattenedItems],
  );

  useEffect(() => {
    sensorContext.current = {
      mode,
      rootId: rootDropId,
      items: flattenedItems,
      canHaveChildren,
      reveal,
    };
  }, [flattenedItems, canHaveChildren, reveal, mode, rootDropId]);

  const handleDragStart = useCallback(
    ({ operation: { source } }: Parameters<DragDropEventHandlers['onDragStart']>[0]) => {
      if (!source) return;
      const activeId = source.id;
      setActiveId(activeId);
      setOverId(activeId);
    },
    [],
  );

  const handleDragMove = useCallback(
    ({ operation: { position }, to, by }: Parameters<DragDropEventHandlers['onDragMove']>[0]) => {
      setOffsetLeft((to?.x ?? position.current.x + (by?.x ?? 0)) - position.initial.x);
    },
    [],
  );

  const handleDragOver = useCallback(
    ({ operation: { target } }: Parameters<DragDropEventHandlers['onDragOver']>[0]) => {
      setOverId(target?.id ?? null);
    },
    [],
  );

  const resetState = useCallback(() => {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setKeyboardIndex(null);
  }, []);

  const handleDragEnd = useCallback(
    ({ operation: { source, target, position }, canceled }: Parameters<DragDropEventHandlers['onDragEnd']>[0]) => {
      if (explorer && source) {
        focusPending.current = true;
        setFocusedId(source.id);
      }
      resetState();

      if (canceled || !source || !target) return;
      const result = moveTreeNode(
        items,
        source.id,
        target.id,
        position.current.x - position.initial.x,
        indentationWidth,
        mode,
        rootDropId,
        canHaveChildren,
      );
      if (!result) return;
      onChange?.(result.before, result.after);
      updateItems(result.items);
    },
    [items, indentationWidth, onChange, resetState, updateItems, canHaveChildren, mode, rootDropId, explorer],
  );

  const handleRemove = useCallback(
    (id: UniqueIdentifier) => {
      updateItems(removeItem(items, id));
      onRemove?.(id);
    },
    [items, onRemove, updateItems],
  );

  const handleCollapse = useCallback(
    (id: UniqueIdentifier) => {
      updateItems(setProperty(items, id, 'collapsed', (value) => !value as TreeItem<T>['collapsed']));
    },
    [items, updateItems],
  );

  const destinationId = projected?.parentId;
  useEffect(() => {
    if (!explorer || activeId === null || overId === null || activeId === overId) return;
    const folder = flattenedItems.find((item) => item.id === destinationId);
    if (!folder?.collapsed || !canHaveChildren(folder)) return;
    const timer = setTimeout(() => {
      updateItems(setProperty(items, folder.id, 'collapsed', () => false as TreeItem<T>['collapsed']));
    }, 700);
    return () => clearTimeout(timer);
  }, [explorer, activeId, overId, destinationId, flattenedItems, canHaveChildren, items, updateItems]);

  function selectItem(item: FlattenedItem<T>) {
    setFocusedId(item.id);
    if (controlledSelectedId === undefined) setSelectedId(item.id);
    onSelect?.(item);
  }
  function navigateTo(index: number) {
    const item = flattenedItems[index];
    if (!item) return;
    focusPending.current = true;
    selectItem(item);
    void reveal(index);
  }
  function handleExplorerKey(event: KeyboardEvent<HTMLLIElement>, item: FlattenedItem<T>, index: number) {
    if (event.target !== event.currentTarget || activeId !== null) return;
    if (event.altKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLButtonElement>('[data-tree-handle]')?.focus();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        navigateTo(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        navigateTo(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        navigateTo(0);
        break;
      case 'End':
        event.preventDefault();
        navigateTo(flattenedItems.length - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (canHaveChildren(item)) {
          if (item.collapsed) handleCollapse(item.id);
          else if (item.children.length) navigateTo(index + 1);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (canHaveChildren(item) && !item.collapsed) handleCollapse(item.id);
        else if (item.parentId !== null) navigateTo(flattenedItems.findIndex((node) => node.id === item.parentId));
        break;
      case 'Delete':
        if (removable) {
          event.preventDefault();
          handleRemove(item.id);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (canHaveChildren(item)) handleCollapse(item.id);
        else onOpen?.(item);
        break;
      case ' ':
        event.preventDefault();
        selectItem(item);
        break;
      default:
        if (event.key.length === 1) {
          event.preventDefault();
          const now = Date.now();
          const text =
            (now - typeahead.current.time < 700 ? typeahead.current.text : '') + event.key.toLocaleLowerCase();
          typeahead.current = { text, time: now };
          for (let step = text.length > 1 ? 0 : 1; step <= flattenedItems.length; step++) {
            const nextIndex = (index + step) % flattenedItems.length;
            const node = flattenedItems[nextIndex];
            if ((node.label ?? String(node.id)).toLocaleLowerCase().startsWith(text)) {
              navigateTo(nextIndex);
              break;
            }
          }
        }
    }
  }

  const getMovementAnnouncement = useCallback(
    (eventName: string, event: Pick<Parameters<DragDropEventHandlers['onDragMove']>[0], 'operation' | 'to' | 'by'>) => {
      const { source, target, position } = event.operation;
      if (!source || !target) return;
      const offset = (event.to?.x ?? position.current.x + (event.by?.x ?? 0)) - position.initial.x;
      const visibleItems = sensorContext.current.items;
      const projection = getTreeProjection(
        visibleItems,
        source.id,
        target.id,
        offset,
        indentationWidth,
        mode,
        rootDropId,
        canHaveChildren,
      );
      if (explorer) {
        if (!projection) return `Choose a different folder for ${source.id}.`;
        const destination =
          projection.parentId === null
            ? 'workspace root'
            : (visibleItems.find((item) => item.id === projection.parentId)?.label ?? projection.parentId);
        return `${source.id} ${eventName === 'onDragEnd' ? 'was moved' : 'will move'} into ${destination}.`;
      }
      return projection
        ? getAnnouncement(eventName, target.id, source.id, buildTree(visibleItems), projection)
        : undefined;
    },
    [sensorContext, indentationWidth, canHaveChildren, mode, rootDropId, explorer],
  );
  const dragInstructions = explorer
    ? 'Press Space or Enter to pick up. Up and down arrows choose a folder; Left chooses workspace root. Space or Enter drops, Escape cancels.'
    : mode === 'reorder'
      ? 'Press Space or Enter to pick up. Up and down arrows reorder siblings. Space or Enter drops, Escape cancels.'
      : 'Press Space or Enter to pick up. Up and down arrows move, left and right arrows change nesting. Space or Enter drops, Escape cancels.';
  const plugins = useMemo(
    () => (defaults: Plugins<DragDropManager>) =>
      defaults.map((plugin) =>
        plugin === Accessibility
          ? {
              plugin: Accessibility,
              options: {
                debounce: 100,
                screenReaderInstructions: {
                  draggable: dragInstructions,
                },
                announcements: {
                  dragstart: ({ operation: { source } }: Parameters<DragDropEventHandlers['onDragStart']>[0]) =>
                    source ? `Picked up ${source.id}.` : undefined,
                  dragmove: (
                    event: Pick<Parameters<DragDropEventHandlers['onDragMove']>[0], 'operation' | 'to' | 'by'>,
                  ) => (explorer ? undefined : getMovementAnnouncement('onDragMove', event)),
                  dragover: (event: Parameters<DragDropEventHandlers['onDragOver']>[0]) =>
                    explorer ? undefined : getMovementAnnouncement('onDragOver', event),
                  dragend: (event: Parameters<DragDropEventHandlers['onDragEnd']>[0]) =>
                    event.canceled
                      ? `Moving was cancelled. ${event.operation.source?.id} was dropped in its original position.`
                      : getMovementAnnouncement('onDragEnd', event),
                },
              },
            }
          : plugin,
      ),
    [getMovementAnnouncement, dragInstructions, explorer],
  );

  const renderItem = (index: number, item: FlattenedItem<T>, start?: number) => {
    const { id, children, collapsed, depth } = item;
    return (
      <SortableTreeItem<TreeItem<T>>
        key={id}
        id={id}
        explorer={explorer}
        folder={canHaveChildren(item)}
        dropDestination={explorer && activeId !== null && id === projected?.parentId}
        dragInstructions={dragInstructions}
        loading={loadStates.get(id) === 'loading'}
        loadError={loadStates.get(id) === 'error'}
        onRetryLoad={() => {
          if (explorer) {
            focusPending.current = true;
            setFocusedId(id);
          } else {
            containerRef.current
              ?.querySelector<HTMLButtonElement>(`[data-index="${index}"] [data-tree-handle]`)
              ?.focus();
          }
          requestLoad(id, true);
        }}
        aria-busy={loadStates.get(id) === 'loading' || undefined}
        selected={explorer && id === (controlledSelectedId === undefined ? selectedId : controlledSelectedId)}
        data-index={index}
        wrapperRef={virtualEnabled ? virtualizer.measureElement : undefined}
        wrapperStyle={start === undefined ? undefined : { position: 'absolute', top: start, left: 8, right: 8 }}
        {...(explorer
          ? {
              role: 'treeitem',
              'aria-keyshortcuts': 'Alt+M',
              'aria-label': item.label ?? String(id),
              'aria-level': depth + 1,
              'aria-posinset': item.index + 1,
              'aria-setsize': siblingCounts.get(item.parentId),
              'aria-expanded': canHaveChildren(item) ? !collapsed : undefined,
              'aria-selected': id === (controlledSelectedId === undefined ? selectedId : controlledSelectedId),
              tabIndex: index === focusedIndex ? 0 : -1,
              onFocus: (event: React.FocusEvent<HTMLLIElement>) => {
                if (event.target === event.currentTarget) setFocusedId(id);
              },
              onClick: (event: React.MouseEvent<HTMLLIElement>) => {
                if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return;
                selectItem(item);
                event.currentTarget.focus();
                if (canHaveChildren(item)) handleCollapse(id);
              },
              onDoubleClick: (event: React.MouseEvent<HTMLLIElement>) => {
                if (!(event.target as HTMLElement).closest('button') && !canHaveChildren(item)) onOpen?.(item);
              },
              onKeyDown: (event: KeyboardEvent<HTMLLIElement>) => handleExplorerKey(event, item, index),
            }
          : {})}
        index={index}
        value={item}
        depth={!explorer && id === activeId && projected ? projected.depth : depth}
        indentationWidth={indentationWidth}
        indicator={indicator && !explorer}
        dropPosition={
          !explorer && indicator && activeId !== null && id === overId && projected
            ? index <= flattenedItems.findIndex((item) => item.id === activeId)
              ? 'before'
              : 'after'
            : undefined
        }
        dropDepth={projected?.depth}
        collapsed={Boolean(collapsed)}
        onCollapse={
          (explorer ? canHaveChildren(item) : collapsible && (children.length || item.childrenLoaded !== undefined))
            ? () => {
                setFocusedId(id);
                handleCollapse(id);
              }
            : undefined
        }
        onRemove={removable ? () => handleRemove(id) : undefined}
        components={components}
        renderItem={renderItemContent}
      />
    );
  };

  function renderOverlay(item: FlattenedItem<T>) {
    const props = {
      depth: item.depth,
      clone: true,
      explorer,
      folder: canHaveChildren(item),
      collapsed: item.collapsed,
      childCount: getChildCount(items, item.id) + 1,
      value: item,
      indentationWidth,
      components,
    };
    // The overlay is a visual copy; registering a second sortable with the source ID breaks virtualization.
    return renderItemContent ? renderItemContent(props) : <TreeItemRow<TreeItem<T>> {...props} />;
  }

  return (
    <DragDropProvider
      plugins={plugins}
      onCollision={(event, manager) => {
        // Keyboard targets follow visible tree order, independent of geometric pointer collisions.
        if (manager.dragOperation.activatorEvent instanceof KeyboardEvent) event.preventDefault();
      }}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {explorer && (
        <output aria-live='polite' aria-atomic='true' className='sr-only'>
          {activeId !== null && overId !== null && activeId !== overId
            ? projected
              ? `${activeId} will move into ${projected.parentId === null ? 'workspace root' : (flattenedItems.find((item) => item.id === projected.parentId)?.label ?? projected.parentId)}.`
              : `Choose a different folder for ${activeId}.`
            : ''}
        </output>
      )}
      <div ref={containerRef}>
        <ScrollArea
          className={cn('box-border rounded-lg border border-border bg-background text-foreground', className)}
          style={{ height }}
        >
          {explorer && (
            <TreeRootDropZone
              id={rootDropId}
              active={activeId !== null && projected?.parentId === null}
              dragging={activeId !== null}
            />
          )}
          {flattenedItems.length ? (
            <ul
              aria-label={ariaLabel}
              role={explorer ? 'tree' : undefined}
              id={treeId}
              className={cn('relative m-0 min-w-full list-none p-2', !virtualEnabled && 'space-y-0.5')}
              style={virtualEnabled ? { height: virtualizer.getTotalSize() } : undefined}
            >
              {virtualEnabled
                ? virtualizer
                    .getVirtualItems()
                    .map((row) => renderItem(row.index, flattenedItems[row.index], row.start - (explorer ? 40 : 0)))
                : flattenedItems.map((item, index) => renderItem(index, item))}
            </ul>
          ) : (
            <output className='block p-6 text-center text-sm text-muted-foreground'>{emptyMessage}</output>
          )}
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      </div>
      {typeof document !== 'undefined' &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            <ul className='m-0 list-none p-0' aria-hidden='true'>
              {activeId !== null && activeItem ? renderOverlay(activeItem) : null}
            </ul>
          </DragOverlay>,
          document.body,
        )}
    </DragDropProvider>
  );
};
