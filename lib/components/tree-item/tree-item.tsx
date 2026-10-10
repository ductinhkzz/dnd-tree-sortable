import { forwardRef, memo, type HTMLAttributes, type ForwardedRef, type JSX } from 'react';
import { cn } from 'cn';
import { Action, type ActionProps } from '../action';
import type { RenderComponentType, TreeItem as TreeItemType } from '../../types';
import { Handle as DefaultHandle } from '../handle';
import { DefaultContent } from './default-content';
import { Remove as DefaultRemove } from '../remove';
import { Badge as DefaultBadge } from './badge';
import { CollapseIcon } from '../icons';

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
  dropPosition?: 'before' | 'after';
  dropDepth?: number;
  indentationWidth: number;
  value: T;
  components?: RenderComponentType<T>;
  onCollapse?(): void;
  onRemove?(): void;
  wrapperRef?(node: HTMLLIElement | null): void;
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
    dropPosition,
    dropDepth = depth,
    collapsed,
    onCollapse,
    onRemove,
    style,
    className,
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
  const label = String(value.id);
  return (
    <li
      {...rest}
      data-tree-row={clone ? undefined : ''}
      data-depth={depth}
      aria-label={clone ? undefined : `${label}, level ${depth + 1}`}
      aria-hidden={clone || undefined}
      ref={wrapperRef}
      className={cn(
        'relative list-none',
        (disableSelection || clone) && 'select-none',
        disableInteraction && 'pointer-events-none',
        className,
      )}
      style={{ paddingInlineStart: clone ? 0 : indentationWidth * depth }}
    >
      <div
        ref={ref}
        style={style}
        className={cn(
          'relative flex min-h-11 min-w-0 items-center gap-1 rounded-md border border-transparent px-1 py-1 text-sm text-foreground transition-colors motion-reduce:transition-none',
          !ghost && !clone && 'hover:bg-accent/60 focus-within:bg-accent/60',
          ghost && 'opacity-35',
          clone && 'border-border bg-background shadow-lg',
        )}
      >
        <Handle
          {...handleProps}
          aria-label={`Drag ${label}`}
          title={`Move ${label}. Space to pick up, arrows to move, Escape to cancel.`}
          tabIndex={clone ? -1 : handleProps?.tabIndex}
        />
        {onCollapse ? (
          <Collapse
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
            aria-expanded={!collapsed}
            disabled={disableInteraction}
            onClick={onCollapse}
          >
            <CollapseIcon
              aria-hidden='true'
              className={cn('size-4 transition-transform motion-reduce:transition-none', collapsed && '-rotate-90')}
            />
          </Collapse>
        ) : (
          <span className='size-8 shrink-0' aria-hidden='true' />
        )}
        <ItemContent {...value} />
        {!clone && onRemove && (
          <Remove aria-label={`Remove ${label}`} disabled={disableInteraction} onClick={onRemove} />
        )}
        {clone && childCount !== undefined && childCount > 1 && <Badge count={childCount} />}
      </div>
      {indicator && dropPosition && (
        <span
          aria-hidden='true'
          data-drop-indicator={dropPosition}
          className={cn(
            'pointer-events-none absolute right-0 z-10 h-0.5 rounded-full bg-primary',
            dropPosition === 'before' ? 'top-0' : 'bottom-0',
          )}
          style={{ insetInlineStart: indentationWidth * dropDepth }}
        />
      )}
    </li>
  );
};

export const TreeItem = memo(forwardRef(TreeItemComponent)) as <T extends TreeItemType>(
  props: TreeItemProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => JSX.Element;
