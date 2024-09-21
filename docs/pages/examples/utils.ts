import { TreeItem } from 'dnd-tree-sortable';

/**
 * Generates a random number between the specified min and max values, inclusive.
 * @param min - The minimum number (inclusive).
 * @param max - The maximum number (inclusive).
 * @returns A random number between min and max.
 */
export const getRandomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateNode = (childPerNode: number, deep: number, parentId: TreeItem['id']): TreeItem[] => {
  const currDeep = parentId.toString().split('-');
  if (currDeep.length - 1 >= deep) {
    return [];
  }
  const nodes: TreeItem[] = [];
  for (let i = 1; i < childPerNode + 1; i++) {
    const node: TreeItem = {
      id: `${parentId}-${i}`,
      children: generateNode(getRandomInRange(0, childPerNode), deep, `${parentId}-${i}`),
    };
    nodes.push(node);
  }

  return nodes;
};

/**
 * Genrate tree
 */
export const generateTree = (rootTotal: number, deep: number, childPerNode: number) => {
  const root: TreeItem[] = [];
  for (let i = 1; i < rootTotal + 1; i++) {
    const node: TreeItem = {
      id: `Node-${i}`,
      children: generateNode(getRandomInRange(0, childPerNode), deep, `Node-${i}`),
    };
    root.push(node);
  }
  return root;
};

export const tree = generateTree(20, 6, 10);

export const classNames = (...classes: Array<string | number | boolean | undefined | null>) => {
  return classes
    .filter((c) => c !== undefined && c !== null)
    .map((c) => (typeof c === 'string' ? c : c.toString()))
    .join(' ');
};
