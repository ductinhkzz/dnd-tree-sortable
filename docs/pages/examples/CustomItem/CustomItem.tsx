import { CSSProperties } from 'react';
import { SortableTree, SortableTreeProps } from 'dnd-tree-sortable';

import { tree } from '../utils';

const ItemContent: SortableTreeProps<{}>['renderItemContent'] = ({
  childCount,
  clone,
  depth,
  disableSelection,
  disableInteraction,
  ghost,
  handleProps,
  indentationWidth,
  indicator,
  collapsed,
  onCollapse,
  onRemove,
  style,
  value,
  components,
  wrapperRef,
  ...rest
}) => {
  return (
    <li
      ref={wrapperRef}
      style={
        {
          '--spacing': `${indentationWidth * depth}px`,
          paddingLeft: 'var(--spacing)',
        } as CSSProperties
      }
      {...rest}
    >
      {value.id} <span style={{ color: '#1976d2' }}>({value.children.length})</span>
    </li>
  );
};

const CustomItem = () => {
  return <SortableTree defaultItems={tree} height={600} collapsible indicator renderItemContent={ItemContent} />;
};

export default CustomItem;
