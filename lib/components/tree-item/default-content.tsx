import type { TreeItem } from '../../types';

export const DefaultContent = <T extends TreeItem>({ id, label }: T) => (
  <span className='min-w-0 flex-1 truncate px-1'>{label ?? id}</span>
);
