import { forwardRef, HTMLAttributes, memo, ForwardedRef, CSSProperties, JSX } from 'react';
import classNames from 'clsx';

import styles from './TreeItem.module.css';
import { Action, ActionProps } from '../Action';
import { RenderComponentType, TreeItem as TreeItemType } from '../../types';
import { Handle as DefaultHandle } from '../Handle';
import { DefaultContent } from './DefaultContent';
import { Remove as DefaultRemove } from '../Remove';
import { Badge as DefaultBadge } from './Badge';
import { CollapseIcon } from '../Icons';

export interface TreeItemProps<T extends TreeItemType> extends Omit<HTMLAttributes<HTMLLIElement>, 'id'> {
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  ghost?: boolean;
  handleProps?: ActionProps;
  indicator?: boolean;
  indentationWidth: number;
  value: T;
  components?: RenderComponentType<T>;
  onCollapse?(): void;
  onRemove?(): void;
  wrapperRef?(node: HTMLLIElement): void;
}

const TreeItemComponent = <T extends TreeItemType>(props: TreeItemProps<T>, ref: ForwardedRef<HTMLDivElement>) => {
  const {
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
  } = props;
  const { Handle, Collapse, ItemContent, Remove, Badge } = {
    Handle: DefaultHandle,
    Collapse: Action,
    ItemContent: DefaultContent,
    Remove: DefaultRemove,
    Badge: DefaultBadge,
    ...components,
  };
  return (
    <li
      className={classNames(
        styles.Wrapper,
        clone && styles.clone,
        ghost && styles.ghost,
        indicator && styles.indicator,
        disableSelection && styles.disableSelection,
        disableInteraction && styles.disableInteraction,
      )}
      ref={wrapperRef}
      style={
        {
          '--spacing': `${indentationWidth * depth}px`,
        } as CSSProperties
      }
      {...rest}
    >
      <div className={styles.TreeItem} ref={ref} style={style}>
        <Handle {...handleProps} />
        {onCollapse && (
          <Collapse onClick={onCollapse} className={classNames(styles.Collapse, collapsed && styles.collapsed)}>
            <CollapseIcon />
          </Collapse>
        )}
        <ItemContent {...value} />
        {!clone && onRemove && <Remove onClick={onRemove} />}
        {clone && childCount && childCount > 1 ? <Badge count={childCount} /> : null}
      </div>
    </li>
  );
};

export const TreeItem = memo(forwardRef(TreeItemComponent)) as <T extends TreeItemType>(
  props: TreeItemProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => JSX.Element;
