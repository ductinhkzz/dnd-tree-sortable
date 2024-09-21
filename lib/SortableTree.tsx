import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Announcements,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Virtuoso } from 'react-virtuoso';

import {
  buildTree,
  flattenTree,
  getProjection,
  getChildCount,
  removeItem,
  removeChildrenOf,
  setProperty,
  adjustTranslate,
  getAnnouncement,
} from './utilities';
import type { FlattenedItem, PositionType, SensorContext, TreeItem } from './types';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';
import { SortableTreeItem, SortableTreeItemProps, VirtuosoScrollbars } from './components';
import { dropAnimationConfig, measuring } from './constants';

export interface SortableTreeProps<T extends object> {
  collapsible?: boolean;
  defaultItems?: TreeItem<T>[];
  indentationWidth?: number;
  indicator?: boolean;
  removable?: boolean;
  components?: SortableTreeItemProps<TreeItem<T>>['components'];
  height?: string | number;
  renderItemContent?: SortableTreeItemProps<TreeItem<T>>['renderItem'];
  onChange?: (currentItem: FlattenedItem<T>, changeItem: FlattenedItem<T>) => void;
  onRemove?: (id: UniqueIdentifier) => void;
}

export const SortableTree = <T extends object = {}>({
  collapsible,
  defaultItems = [],
  indicator = false,
  indentationWidth = 50,
  removable,
  components,
  height,
  renderItemContent,
  onChange,
  onRemove,
}: SortableTreeProps<T>) => {
  const [items, setItems] = useState(() => defaultItems);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<PositionType | null>(null);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree.reduce<UniqueIdentifier[]>(
      (acc, { children, collapsed, id }) => (collapsed && children.length ? [...acc, id] : acc),
      [],
    );

    return removeChildrenOf(flattenedTree, activeId ? [activeId, ...collapsedItems] : collapsedItems);
  }, [activeId, items]);

  const projected = useMemo(() => {
    if (activeId && overId) {
      return getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth);
    }
    return null;
  }, [activeId, flattenedItems, indentationWidth, offsetLeft, overId]);

  const sensorContext: SensorContext<FlattenedItem<T>> = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });
  const [coordinateGetter] = useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, indicator, indentationWidth),
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    }),
  );

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);
  const activeItem = useMemo(
    () => (activeId ? flattenedItems.find(({ id }) => id === activeId) : null),
    [activeId, flattenedItems],
  );

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${active.id}.`;
    },
    onDragMove({ active, over }) {
      return getMovementAnnouncement('onDragMove', active.id, over?.id);
    },
    onDragOver({ active, over }) {
      return getMovementAnnouncement('onDragOver', active.id, over?.id);
    },
    onDragEnd({ active, over }) {
      return getMovementAnnouncement('onDragEnd', active.id, over?.id);
    },
    onDragCancel({ active }) {
      return `Moving was cancelled. ${active.id} was dropped in its original position.`;
    },
  };

  const handleDragStart = useCallback(
    ({ active: { id: activeId } }: DragStartEvent) => {
      setActiveId(activeId);
      setOverId(activeId);

      const activeItem = flattenedItems.find(({ id }) => id === activeId);

      if (activeItem) {
        setCurrentPosition({
          parentId: activeItem.parentId,
          overId: activeId,
        });
      }

      document.body.style.setProperty('cursor', 'grabbing');
    },
    [flattenedItems],
  );

  const handleDragMove = useCallback(({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x);
  }, []);

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    setOverId(over?.id ?? null);
  }, []);

  const resetState = useCallback(() => {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setCurrentPosition(null);

    document.body.style.setProperty('cursor', '');
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      resetState();

      if (projected && over) {
        const { depth, parentId } = projected;
        const clonedItems: FlattenedItem<T>[] = JSON.parse(JSON.stringify(flattenTree(items)));
        const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
        const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
        const activeTreeItem = clonedItems[activeIndex];

        clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

        const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
        const newItems = buildTree<T>(sortedItems);
        onChange?.(activeTreeItem, sortedItems[overIndex]);
        setItems(newItems);
      }
    },
    [items, onChange, projected, resetState],
  );

  const handleDragCancel = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleRemove = useCallback(
    (id: UniqueIdentifier) => {
      setItems((items) => removeItem(items, id));
      onRemove?.(id);
    },
    [onRemove],
  );

  const handleCollapse = useCallback((id: UniqueIdentifier) => {
    setItems((items) =>
      setProperty(items, id, 'collapsed', (value) => {
        return !value as TreeItem<T>['collapsed'];
      }),
    );
  }, []);

  const getMovementAnnouncement = useCallback(
    (eventName: string, activeId: UniqueIdentifier, overId?: UniqueIdentifier) => {
      if (overId && projected) {
        const canNotSetPosition =
          currentPosition && projected.parentId === currentPosition.parentId && overId === currentPosition.overId;
        if (eventName !== 'onDragEnd' && !canNotSetPosition) {
          setCurrentPosition({
            parentId: projected.parentId,
            overId,
          });
        }

        return getAnnouncement(eventName, overId, activeId, items, projected);
      }
    },
    [currentPosition, items, projected],
  );

  const renderItem = useCallback(
    (_: number, item: FlattenedItem<T>) => {
      const { id, children, collapsed, depth } = item;
      return (
        <SortableTreeItem<TreeItem<T>>
          key={id}
          id={id}
          value={item}
          depth={id === activeId && projected ? projected.depth : depth}
          indentationWidth={indentationWidth}
          indicator={indicator}
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
      removable,
      renderItemContent,
    ],
  );

  return (
    <DndContext
      accessibility={{ announcements }}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        <Virtuoso
          style={{ height }}
          data={flattenedItems}
          itemContent={renderItem}
          increaseViewportBy={50}
          components={{
            Scroller: VirtuosoScrollbars,
          }}
        />
        {createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig} modifiers={indicator ? [adjustTranslate] : undefined}>
            {activeId && activeItem ? (
              <SortableTreeItem
                id={activeId}
                depth={activeItem.depth}
                clone
                childCount={getChildCount(items, activeId) + 1}
                value={activeItem}
                indentationWidth={indentationWidth}
              />
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </SortableContext>
    </DndContext>
  );
};
