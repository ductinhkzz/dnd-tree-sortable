import { MutableRefObject, JSX } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { ActionProps, BadgeProps } from './components';

export type BaseTreeItem = {
  id: UniqueIdentifier;
  collapsed?: boolean;
};

export type TreeItem<T extends object = {}> = T & {
  id: UniqueIdentifier;
  collapsed?: boolean;
  children: TreeItem<T>[];
};

export type TreeItems = TreeItem[];

export type FlattenedItem<T extends object = {}> = TreeItem<T> & {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
};

export type SensorContext<T extends FlattenedItem> = MutableRefObject<{
  items: T[];
  offset: number;
}>;

export type NonNullablePick<T, K extends keyof T> = {
  [P in K]: NonNullable<T[P]>;
};

export type ProjectedType = {
  depth: number;
  maxDepth: number;
  minDepth: number;
  parentId: UniqueIdentifier | null;
};

export type PositionType = {
  parentId: UniqueIdentifier | null;
  overId: UniqueIdentifier;
};

export type RenderComponentType<T extends TreeItem> = {
  Handle?: (props: ActionProps) => JSX.Element;
  Collapse?: (props: ActionProps) => JSX.Element;
  Remove?: (props: ActionProps) => JSX.Element;
  ItemContent?: (props: T) => JSX.Element;
  Badge?: (props: BadgeProps) => JSX.Element;
};
