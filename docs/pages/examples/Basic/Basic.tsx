import { SortableTree } from 'dnd-tree-sortable';

import { tree } from '../utils';

const Basic = () => {
  return <SortableTree defaultItems={tree} height={600} collapsible />;
};

export default Basic;
