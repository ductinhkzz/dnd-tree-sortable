// @vitest-environment jsdom
import { useState, type ReactNode } from 'react';
import { cleanup, render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { SortableTree, type TreeItem, type ActionProps } from '../lib';
import type { FlattenedItem } from '../lib/types';

// jsdom has no layout observer; this is a browser API shim, not a dnd-kit mock.
vi.hoisted(() => {
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerId: number;
      pointerType: string;
      isPrimary: boolean;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'mouse';
        this.isPrimary = init.isPrimary ?? true;
      }
    },
  );
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  document.elementFromPoint = () => document.body;
  document.getAnimations = () => [];
  Element.prototype.getAnimations = () => [];
  HTMLElement.prototype.scrollIntoView = () => {};
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      private disconnected = false;
      constructor(
        private callback: IntersectionObserverCallback,
        private options: IntersectionObserverInit = {},
      ) {}
      observe(target: Element) {
        if (this.options.rootMargin) return;
        queueMicrotask(() => {
          if (this.disconnected) return;
          const rect = target.getBoundingClientRect();
          this.callback(
            [
              {
                target,
                boundingClientRect: rect,
                intersectionRect: rect,
                isIntersecting: true,
                intersectionRatio: 1,
              } as IntersectionObserverEntry,
            ],
            this as unknown as IntersectionObserver,
          );
        });
      }
      unobserve() {}
      disconnect() {
        this.disconnected = true;
      }
    },
  );
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    // Emulate the feedback CSS translation that a browser includes in its layout rectangle.
    if (this.hasAttribute('data-dnd-dragging')) {
      const [x = 0, y = 0] = this.style.getPropertyValue('--dnd-translate').split(' ').map(parseFloat);
      const left = (parseFloat(this.style.getPropertyValue('--dnd-left')) || 0) + x;
      const top = (parseFloat(this.style.getPropertyValue('--dnd-top')) || 0) + y;
      return { x: left, y: top, left, top, right: left + 300, bottom: top + 40, width: 300, height: 40, toJSON() {} };
    }
    const row = this.closest('[data-tree-row]');
    const rows = [...document.querySelectorAll('[data-tree-row]')];
    const top = Math.max(0, rows.indexOf(row!)) * 40;
    const height = row ? 40 : 1000;
    return { x: 0, y: top, left: 0, top, right: 300, bottom: top + height, width: 300, height, toJSON() {} };
  });
});

// Isolate tree interactions from viewport measurement; the real dnd-kit controls remain active.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    itemContent,
  }: {
    data: FlattenedItem[];
    itemContent: (index: number, item: FlattenedItem) => ReactNode;
  }) => (
    <div>
      {data.map((item, index) => (
        <div key={item.id} data-tree-row>
          {itemContent(index, item)}
        </div>
      ))}
    </div>
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

test('keyboard drag reorders a subtree and preserves payloads', async () => {
  const changed = vi.fn<(items: TreeItem<{ payload?: () => string }>[]) => void>();
  const payload = () => 'retained';
  render(
    <SortableTree
      defaultItems={[
        { id: 0, payload, children: [{ id: 'child', children: [] }] },
        { id: 'next', children: [] },
      ]}
      onItemsChange={changed}
    />,
  );
  const user = userEvent.setup();
  screen.getAllByRole('button', { name: 'Drag item' })[0].focus();
  await user.keyboard('[Space]');
  await user.keyboard('[ArrowDown]');
  await user.keyboard('[Space]');
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(changed.mock.calls[0][0].map(({ id }) => id)).toEqual(['next', 0]);
  expect(changed.mock.calls[0][0][1].payload).toBe(payload);
  expect(changed.mock.calls[0][0][1].children[0].id).toBe('child');
});

test('keyboard right arrow nests and Escape cancels without updating data', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  render(
    <SortableTree
      defaultItems={[
        { id: 'parent', children: [] },
        { id: 'child', children: [] },
      ]}
      onItemsChange={changed}
    />,
  );
  const user = userEvent.setup();
  screen.getAllByRole('button', { name: 'Drag item' })[1].focus();
  await user.keyboard('[Space]');
  await user.keyboard('[ArrowRight]');
  await user.keyboard('[Escape]');
  expect(changed).not.toHaveBeenCalled();
  screen.getAllByRole('button', { name: 'Drag item' })[1].focus();
  await user.keyboard('[Space]');
  await user.keyboard('[ArrowRight]');
  await user.keyboard('[Space]');
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(changed.mock.calls[0][0]).toEqual([{ id: 'parent', children: [{ id: 'child', children: [] }] }]);
});

test('pointer drag moves a root row using the new sensor and collision detector', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  render(
    <SortableTree
      defaultItems={[
        { id: 'first', children: [] },
        { id: 'second', children: [] },
      ]}
      onItemsChange={changed}
    />,
  );
  const handle = screen.getAllByRole('button', { name: 'Drag item' })[0];
  await act(async () => {
    fireEvent.pointerDown(handle, { clientX: 150, clientY: 20, button: 0 });
    fireEvent.pointerMove(document, { clientX: 150, clientY: 30 });
  });
  await waitFor(() => expect(document.body.style.cursor).toBe('grabbing'));
  await waitFor(() => expect(handle.getAttribute('aria-pressed')).toBe('true'));
  await act(async () => {
    fireEvent.pointerMove(document, { clientX: 150, clientY: 55 });
  });
  await waitFor(() => expect(screen.queryByText('first was moved after second.')).not.toBeNull());
  await act(async () => {
    fireEvent.pointerMove(document, { clientX: 150, clientY: 60 });
  });
  fireEvent.pointerUp(document, { clientX: 150, clientY: 60 });
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(changed.mock.calls[0][0].map(({ id }) => id)).toEqual(['second', 'first']);
});

test('custom handle refs support controlled keyboard outdent and restore focus after dropping', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  const Handle = ({ elementRef, ...props }: ActionProps) => (
    <button {...props} ref={elementRef} type='button' aria-label='Custom handle'>
      Move
    </button>
  );
  function ControlledTree() {
    const [items, setItems] = useState<TreeItem[]>([{ id: 'parent', children: [{ id: 0, children: [] }] }]);
    return (
      <SortableTree
        items={items}
        components={{ Handle }}
        onItemsChange={(next) => {
          changed(next);
          setItems(next);
        }}
      />
    );
  }
  render(<ControlledTree />);
  const user = userEvent.setup();
  screen.getAllByRole('button', { name: 'Custom handle' })[1].focus();
  await user.keyboard('[Space]');
  await user.keyboard('[ArrowLeft]');
  await user.keyboard('[Space]');
  await waitFor(() =>
    expect(changed).toHaveBeenCalledWith([
      { id: 'parent', children: [] },
      { id: 0, children: [] },
    ]),
  );
  await waitFor(() => expect(document.activeElement).toBe(screen.getAllByRole('button', { name: 'Custom handle' })[1]));
});
