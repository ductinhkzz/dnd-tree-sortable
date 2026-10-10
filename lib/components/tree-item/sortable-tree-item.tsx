import { memo, JSX } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/abstract';
import { useSortable } from '@dnd-kit/react/sortable';
import { pointerDistance } from '@dnd-kit/collision';
import { useDragOperation } from '@dnd-kit/react';

import { TreeItem, TreeItemProps } from './tree-item';
import { iOS } from '../../utilities';
import { TreeItem as TreeItemType } from '../../types';

export interface SortableTreeItemProps<T extends TreeItemType> extends TreeItemProps<T> {
  id: UniqueIdentifier;
  index?: number;
  renderItem?: (props: Omit<SortableTreeItemProps<T>, 'id'>) => JSX.Element;
}

const SortableTreeItemComponent = <T extends TreeItemType>({
  id,
  index = 0,
  depth,
  renderItem,
  ...props
}: SortableTreeItemProps<T>) => {
  const { sourceRef, targetRef, handleRef, isDragSource } = useSortable({
    id,
    index,
    collisionDetector: pointerDistance,
    // React/Virtuoso own row order. OptimisticSortingPlugin would reorder their DOM behind React.
    plugins: [],
  });
  const { source } = useDragOperation();

  const itemProps = {
    ref: sourceRef,
    wrapperRef: targetRef,
    depth: depth,
    ghost: isDragSource,
    disableSelection: iOS,
    disableInteraction: source !== null,
    handleProps: {
      elementRef: handleRef,
    },
    ...props,
  };

  if (typeof renderItem === 'function') {
    return renderItem(itemProps);
  }

  return <TreeItem<T> {...itemProps} />;
};

export const SortableTreeItem = memo(SortableTreeItemComponent) as unknown as typeof SortableTreeItemComponent;
