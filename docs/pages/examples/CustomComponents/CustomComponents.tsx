import { SortableTree, ActionProps, TreeItem } from 'dnd-tree-sortable';

import { classNames, tree } from '../utils';
import styles from '../styles.module.css';

const Handle = (props: ActionProps) => {
  return (
    <button {...props} className={classNames(styles['btn'], styles['border-none'], styles['grab'])}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth='1.5'
        stroke='#333'
        width={24}
        height={24}
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002'
        />
      </svg>
    </button>
  );
};

const ItemContent = (props: TreeItem) => {
  return (
    <div>
      {props.id} <span style={{ color: '#1976d2' }}>({props.children.length})</span>
    </div>
  );
};

const CustomComponents = () => {
  return (
    <SortableTree
      defaultItems={tree}
      height={600}
      collapsible
      indicator
      components={{
        Handle,
        ItemContent,
      }}
    />
  );
};

export default CustomComponents;
