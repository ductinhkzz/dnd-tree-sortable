// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { SortableTree, type TreeItem } from '../lib';
import type { FlattenedItem } from '../lib/types';

// Isolate tree interactions from viewport measurement; the real dnd-kit controls remain active.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: FlattenedItem[];
    itemContent: (index: number, item: FlattenedItem) => ReactNode;
  }) => (
    <ul>
      {data.map((item, index) => (
        <li key={item.id}>{itemContent(index, item)}</li>
      ))}
    </ul>
  ),
}));

afterEach(cleanup);

test('controlled collapse updates state, hides descendants, and leaves incoming data untouched', async () => {
  const initial: TreeItem[] = [{ id: 0, children: [{ id: 'child', children: [] }] }];
  const changed = vi.fn<(items: TreeItem[]) => void>();
  function ControlledTree() {
    const [items, setItems] = useState(initial);
    return (
      <SortableTree
        items={items}
        collapsible
        onItemsChange={(next) => {
          changed(next);
          setItems(next);
        }}
      />
    );
  }
  render(<ControlledTree />);
  const user = userEvent.setup();
  expect(screen.queryByText('child')).not.toBeNull();
  await user.click(screen.getByRole('button', { name: 'Collapse item' }));
  expect(screen.queryByText('child')).toBeNull();
  expect(changed.mock.calls[0][0][0].collapsed).toBe(true);
  expect(initial[0].collapsed).toBeUndefined();
  await user.click(screen.getByRole('button', { name: 'Expand item' }));
  expect(screen.queryByText('child')).not.toBeNull();
});

test('uncontrolled removal reports the full next tree and supports numeric ID zero', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  const removed = vi.fn<(id: string | number) => void>();
  render(
    <SortableTree
      defaultItems={[
        { id: 0, children: [] },
        { id: 'remaining', children: [] },
      ]}
      removable
      onItemsChange={changed}
      onRemove={removed}
    />,
  );
  await userEvent.setup().click(screen.getAllByRole('button', { name: 'Remove item' })[0]);
  expect(removed).toHaveBeenCalledWith(0);
  expect(changed).toHaveBeenCalledWith([{ id: 'remaining', children: [] }]);
  expect(screen.queryByText('0')).toBeNull();
});

test('controlled data follows parent updates and custom row content renders on React 19', () => {
  const content = ({ id }: TreeItem) => <span>Custom {id}</span>;
  const { rerender } = render(
    <SortableTree items={[{ id: 'first', children: [] }]} components={{ ItemContent: content }} />,
  );
  expect(screen.queryByText('Custom first')).not.toBeNull();
  rerender(<SortableTree items={[{ id: 'second', children: [] }]} components={{ ItemContent: content }} />);
  expect(screen.queryByText('Custom first')).toBeNull();
  expect(screen.queryByText('Custom second')).not.toBeNull();
});

test('tree action buttons do not submit an enclosing form', async () => {
  const submitted = vi.fn<(event: { preventDefault(): void }) => void>((event) => event.preventDefault());
  render(
    <form onSubmit={submitted}>
      <SortableTree defaultItems={[{ id: 'folder', children: [{ id: 'file', children: [] }] }]} collapsible removable />
    </form>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Collapse item' }));
  await user.click(screen.getByRole('button', { name: 'Remove item' }));
  expect(submitted).not.toHaveBeenCalled();
});
