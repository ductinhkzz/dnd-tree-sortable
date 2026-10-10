'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DragDropProvider, DragOverlay, type DragDropEventHandlers } from '@dnd-kit/react';
import { Accessibility, PointerSensor, type DragDropManager } from '@dnd-kit/dom';
import type { UniqueIdentifier, Plugins } from '@dnd-kit/abstract';
import { cn } from 'cn';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import {
  buildTree,
  flattenTree,
  getProjection,
  getChildCount,
  removeItem,
  removeChildrenOf,
  setProperty,
  moveTreeItem,
  getAnnouncement,
} from './utilities';
import type { FlattenedItem, SensorContext, TreeItem } from './types';
import { createTreeKeyboardSensor } from './keyboard-coordinates';
import { SortableTreeItem, SortableTreeItemProps } from './components';

export interface SortableTreeProps<T extends object> {
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree.reduce<UniqueIdentifier[]>(
      (acc, { children, collapsed, id }) => (collapsed && children.length ? [...acc, id] : acc),
      [],
    );

    return removeChildrenOf(flattenedTree, activeId !== null ? [activeId, ...collapsedItems] : collapsedItems);
  }, [activeId, items]);

  const projected = useMemo(() => {
    if (activeId !== null && overId !== null) {
      return getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth);
    }
    return null;
  }, [activeId, flattenedItems, indentationWidth, offsetLeft, overId]);

  const sensorContext: SensorContext<FlattenedItem<T>> = useRef({
    items: flattenedItems,
  });
  const sensors = useMemo(
    // oxlint-disable-next-line react/refs -- This factory reads the ref only from sensor event handlers.
    () => [PointerSensor, createTreeKeyboardSensor(sensorContext, indentationWidth)],
    [sensorContext, indentationWidth],
  );

  const activeItem = useMemo(
    () => (activeId !== null ? flattenedItems.find(({ id }) => id === activeId) : null),
    [activeId, flattenedItems],
  );

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
    };
  }, [flattenedItems]);

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
  }, []);

  const handleDragEnd = useCallback(
    ({ operation: { source, target, position }, canceled }: Parameters<DragDropEventHandlers['onDragEnd']>[0]) => {
      resetState();

      if (canceled || !source || !target) return;
      const result = moveTreeItem(
        items,
        source.id,
        target.id,
        position.current.x - position.initial.x,
        indentationWidth,
      );
      if (!result) return;
      onChange?.(result.before, result.after);
      updateItems(result.items);
    },
    [items, indentationWidth, onChange, resetState, updateItems],
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

  const getMovementAnnouncement = useCallback(
    (eventName: string, event: Pick<Parameters<DragDropEventHandlers['onDragMove']>[0], 'operation' | 'to' | 'by'>) => {
      const { source, target, position } = event.operation;
      if (!source || !target) return;
      const offset = (event.to?.x ?? position.current.x + (event.by?.x ?? 0)) - position.initial.x;
      const visibleItems = sensorContext.current.items;
      const projection = getProjection(visibleItems, source.id, target.id, offset, indentationWidth);
      return projection
        ? getAnnouncement(eventName, target.id, source.id, buildTree(visibleItems), projection)
        : undefined;
    },
    [sensorContext, indentationWidth],
  );
  const plugins = useMemo(
    () => (defaults: Plugins<DragDropManager>) =>
      defaults.map((plugin) =>
        plugin === Accessibility
          ? {
              plugin: Accessibility,
              options: {
                screenReaderInstructions: {
                  draggable:
                    'Press Space or Enter to pick up. Use up and down arrows to move, left and right arrows to change nesting. Press Space or Enter to drop, Escape to cancel.',
                },
                announcements: {
                  dragstart: ({ operation: { source } }: Parameters<DragDropEventHandlers['onDragStart']>[0]) =>
                    source ? `Picked up ${source.id}.` : undefined,
                  dragmove: (
                    event: Pick<Parameters<DragDropEventHandlers['onDragMove']>[0], 'operation' | 'to' | 'by'>,
                  ) => getMovementAnnouncement('onDragMove', event),
                  dragover: (event: Parameters<DragDropEventHandlers['onDragOver']>[0]) =>
                    getMovementAnnouncement('onDragOver', event),
                  dragend: (event: Parameters<DragDropEventHandlers['onDragEnd']>[0]) =>
                    event.canceled
                      ? `Moving was cancelled. ${event.operation.source?.id} was dropped in its original position.`
                      : getMovementAnnouncement('onDragEnd', event),
                },
              },
            }
          : plugin,
      ),
    [getMovementAnnouncement],
  );

  const renderItem = useCallback(
    (index: number, item: FlattenedItem<T>) => {
      const { id, children, collapsed, depth } = item;
      return (
        <SortableTreeItem<TreeItem<T>>
          key={id}
          id={id}
          index={index}
          value={item}
          depth={id === activeId && projected ? projected.depth : depth}
          indentationWidth={indentationWidth}
          indicator={indicator}
          dropPosition={
            indicator && activeId !== null && id === overId && projected
              ? index <= flattenedItems.findIndex((item) => item.id === activeId)
                ? 'before'
                : 'after'
              : undefined
          }
          dropDepth={projected?.depth}
          collapsed={Boolean(collapsed && children.length)}
          onCollapse={collapsible && children.length ? () => handleCollapse(id) : undefined}
          onRemove={removable ? () => handleRemove(id) : undefined}
          components={components}
          renderItem={renderItemContent}
        />
      );
    },
    [
      activeId,
      collapsible,
      components,
      handleCollapse,
      handleRemove,
      indentationWidth,
      indicator,
      projected,
      flattenedItems,
      overId,
      removable,
      renderItemContent,
    ],
  );

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
      <ScrollArea
        className={cn('box-border rounded-lg border border-border bg-background text-foreground', className)}
        style={{ height }}
      >
        {flattenedItems.length ? (
          <ul aria-label={ariaLabel} className='m-0 min-w-max list-none space-y-0.5 p-2'>
            {flattenedItems.map((item, index) => renderItem(index, item))}
          </ul>
        ) : (
          <output className='block p-6 text-center text-sm text-muted-foreground'>{emptyMessage}</output>
        )}
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
      {typeof document !== 'undefined' &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            <ul className='m-0 list-none p-0' aria-hidden='true'>
              {activeId !== null && activeItem ? (
                <SortableTreeItem<TreeItem<T>>
                  id={activeId}
                  depth={activeItem.depth}
                  clone
                  childCount={getChildCount(items, activeId) + 1}
                  value={activeItem}
                  indentationWidth={indentationWidth}
                  components={components}
                  renderItem={renderItemContent}
                />
              ) : null}
            </ul>
          </DragOverlay>,
          document.body,
        )}
    </DragDropProvider>
  );
};
