import { CSSProperties, memo } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TreeItem, TreeItemProps } from './TreeItem';
import { animateLayoutChanges, iOS } from '../../utilities';
import { TreeItem as TreeItemType } from '../../types';

export interface SortableTreeItemProps<T extends TreeItemType> extends TreeItemProps<T> {
  id: UniqueIdentifier;
  renderItem?: (props: Omit<SortableTreeItemProps<T>, 'id'>) => JSX.Element;
}

const SortableTreeItemComponent = <T extends TreeItemType>({
  id,
  depth,
  renderItem,
  ...props
}: SortableTreeItemProps<T>) => {
  const {
    attributes,
    isDragging,
    isSorting,
    listeners,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges,
  });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const itemProps = {
    ref: setDraggableNodeRef,
    wrapperRef: setDroppableNodeRef,
    style: style,
    depth: depth,
    ghost: isDragging,
    disableSelection: iOS,
    disableInteraction: isSorting,
    handleProps: {
      ...attributes,
      ...listeners,
    },
    ...props,
  };

  if (typeof renderItem === 'function') {
    return renderItem(itemProps);
  }

  return <TreeItem<T> {...itemProps} />;
};

export const SortableTreeItem = memo(SortableTreeItemComponent) as unknown as typeof SortableTreeItemComponent;
