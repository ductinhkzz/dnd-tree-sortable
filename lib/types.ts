import { JSX } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/abstract';
import { ActionProps, BadgeProps } from './components';

export type TreeMode = 'reorder' | 'tree' | 'explorer';

export type BaseTreeItem = {
  id: UniqueIdentifier;
  collapsed?: boolean;
  kind?: 'file' | 'folder';
  label?: string;
  /** false marks children that should be fetched on expansion; true caches a completed load. */
  childrenLoaded?: boolean;
};

export type TreeItem<T extends object = {}> = T & {
  id: UniqueIdentifier;
  collapsed?: boolean;
  kind?: 'file' | 'folder';
  label?: string;
  /** false marks children that should be fetched on expansion; true caches a completed load. */
  childrenLoaded?: boolean;
  children: TreeItem<T>[];
};

export type LoadChildren<T extends object = {}> = (
  item: TreeItem<T>,
  options: { signal: AbortSignal },
) => Promise<TreeItem<T>[]>;

export type TreeItems = TreeItem[];

export type FlattenedItem<T extends object = {}> = TreeItem<T> & {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
};

export type SensorContext<T extends FlattenedItem> = {
  current: {
    mode?: TreeMode;
    rootId?: UniqueIdentifier;
    items: T[];
    canHaveChildren?: (item: T) => boolean;
    reveal?: (index: number) => Promise<void>;
  };
};

export type ProjectedType = {
  depth: number;
  maxDepth: number;
  minDepth: number;
  parentId: UniqueIdentifier | null;
};

export type RenderComponentType<T extends TreeItem> = {
  Handle?: (props: ActionProps) => JSX.Element;
  Collapse?: (props: ActionProps) => JSX.Element;
  Remove?: (props: ActionProps) => JSX.Element;
  ItemContent?: (props: T) => JSX.Element;
  Badge?: (props: BadgeProps) => JSX.Element;
};
