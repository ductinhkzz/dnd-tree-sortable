import { SortableTree, TreeItem as BaseTreeItem } from 'dnd-tree-sortable';

import { getRandomInRange } from '../utils';

type CustomItemType = {
  text: string;
};

type TreeItem = BaseTreeItem<CustomItemType>;

const generateTree = (childPerNode: number, deep: number, parentId: TreeItem['id'], totalRoot?: number) => {
  const nodes: TreeItem[] = [];
  const currDeep = parentId.toString().split('-').length;
  if (currDeep === deep) {
    return [];
  }
  for (let i = 1; i <= (totalRoot ?? childPerNode); i++) {
    const node: TreeItem = {
      id: `${parentId}-${i}`,
      children: generateTree(getRandomInRange(0, childPerNode), deep, `${parentId}-${i}`),
      text: `${parentId}-${i}`,
    };
    nodes.push(node);
  }

  return nodes;
};

const tree = generateTree(10, 6, 'Node', 20);

const ItemContent = (props: TreeItem) => {
  return (
    <div>
      {props.text} <span style={{ color: '#1976d2' }}>({props.children.length})</span>
    </div>
  );
};

const CustomItemData = () => {
  return (
    <SortableTree<CustomItemType>
      defaultItems={tree}
      height={600}
      collapsible
      indicator
      components={{
        ItemContent,
      }}
    />
  );
};

export default CustomItemData;
