import { SortableTree } from 'dnd-tree-sortable';

import { tree } from '../utils';

const Indicator = () => {
  return <SortableTree defaultItems={tree} height={600} collapsible indicator />;
};

export default Indicator;
