import { forwardRef, memo, type HTMLAttributes, type ForwardedRef, type JSX } from 'react';
import { cn } from 'cn';
import {
  BracesIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  PaletteIcon,
} from 'lucide-react';
import { Action, type ActionProps } from '../action';
import type { RenderComponentType, TreeItem as TreeItemType } from '../../types';
import { Handle as DefaultHandle } from '../handle';
import { DefaultContent } from './default-content';
import { Remove as DefaultRemove } from '../remove';
import { Badge as DefaultBadge } from './badge';
import { CollapseIcon } from '../icons';

export interface TreeItemProps<T extends TreeItemType> extends Omit<HTMLAttributes<HTMLLIElement>, 'id'> {
  childCount?: number;
  explorer?: boolean;
  selected?: boolean;
  dropDestination?: boolean;
  dragInstructions?: string;
  folder?: boolean;
  wrapperStyle?: HTMLAttributes<HTMLLIElement>['style'];
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
    explorer,
    selected,
    dropDestination,
    dragInstructions,
    folder,
    wrapperStyle,
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
  const label = value.label ?? String(value.id);
  const extension = label.split('.').pop()?.toLowerCase();
  const codeFile = ['tsx', 'ts', 'jsx', 'js', 'html', 'vue', 'svelte'].includes(extension ?? '');
  const Icon = folder
    ? collapsed
      ? FolderIcon
      : FolderOpenIcon
    : extension === 'json'
      ? BracesIcon
      : extension === 'css'
        ? PaletteIcon
        : codeFile
          ? FileCodeIcon
          : extension === 'md'
            ? FileTextIcon
            : FileIcon;
  const iconColor = folder
    ? 'text-amber-500 dark:text-amber-400'
    : extension === 'json'
      ? 'text-yellow-500 dark:text-yellow-400'
      : extension === 'css'
        ? 'text-purple-500 dark:text-purple-400'
        : codeFile
          ? 'text-blue-500'
          : 'text-muted-foreground';
  return (
    <li
      data-tree-row={clone ? undefined : ''}
      data-depth={depth}
      aria-label={clone ? undefined : `${label}, level ${depth + 1}`}
      aria-hidden={clone || undefined}
      {...rest}
      ref={wrapperRef}
      className={cn(
        'relative list-none outline-none focus-visible:[&>div]:ring-2 focus-visible:[&>div]:ring-inset focus-visible:[&>div]:ring-ring',
        (disableSelection || clone) && 'select-none',
        disableInteraction && 'pointer-events-none',
        className,
      )}
      style={{ paddingInlineStart: clone ? 0 : indentationWidth * depth, ...wrapperStyle }}
    >
      <div
        ref={ref}
        style={style}
        data-drop-destination={dropDestination ? 'inside' : undefined}
        className={cn(
          'relative flex min-w-0 items-center gap-1 rounded-md text-sm text-foreground transition-colors motion-reduce:transition-none',
          explorer ? 'min-h-9 cursor-default border-0 px-1 py-0.5' : 'min-h-11 border border-border px-1 py-1',
          !ghost && !clone && !selected && 'hover:bg-accent/60 focus-within:bg-accent/60',
          ghost && 'opacity-35',
          selected && 'bg-accent text-accent-foreground',
          dropDestination && 'bg-accent ring-2 ring-inset ring-ring',
          clone && 'bg-background shadow-lg',
        )}
      >
        <Handle
          {...handleProps}
          className={explorer ? 'sr-only focus:not-sr-only focus:absolute focus:right-1 focus:z-10' : undefined}
          data-tree-handle=''
          aria-label={`Drag ${label}`}
          title={`Move ${label}. ${dragInstructions ?? 'Space to pick up, arrows to move, Escape to cancel.'}`}
          tabIndex={clone || explorer ? -1 : handleProps?.tabIndex}
        />
        {onCollapse ? (
          <Collapse
            className={explorer ? 'size-6' : undefined}
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
            aria-expanded={!collapsed}
            tabIndex={explorer ? -1 : undefined}
            disabled={disableInteraction}
            onClick={onCollapse}
          >
            <CollapseIcon
              aria-hidden='true'
              className={cn('size-4 transition-transform motion-reduce:transition-none', collapsed && '-rotate-90')}
            />
          </Collapse>
        ) : (
          <span className={explorer ? 'size-6 shrink-0' : 'size-8 shrink-0'} aria-hidden='true' />
        )}
        {explorer && <Icon aria-hidden='true' className={cn('size-4 shrink-0', iconColor)} />}
        <ItemContent {...value} />
        {!clone && onRemove && (
          <Remove
            tabIndex={explorer ? -1 : undefined}
            aria-label={`Remove ${label}`}
            disabled={disableInteraction}
            onClick={onRemove}
          />
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
