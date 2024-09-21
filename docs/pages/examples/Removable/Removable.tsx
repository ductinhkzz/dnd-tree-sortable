import { SortableTree } from 'dnd-tree-sortable';

import { tree } from '../utils';

const Removable = () => {
  return (
    <SortableTree
      defaultItems={tree}
      height={600}
      collapsible
      indicator
      removable
      onRemove={(id) => alert(`Remove id: ${id}`)}
    />
  );
};

export default Removable;
