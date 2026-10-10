// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { SortableTree, type TreeItem, type ActionProps } from '../lib';

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
  // Virtualization needs viewport and row measurements; jsdom returns zero without layout.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() {
      return this.hasAttribute('data-tree-row') ? 40 : 240;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return 300;
    },
  });
  HTMLElement.prototype.scrollTo = function (options?: ScrollToOptions | number, _y?: number) {
    if (options && typeof options !== 'number') this.scrollTop = options.top ?? this.scrollTop;
    this.dispatchEvent(new Event('scroll'));
  };
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
    const viewport = row?.closest('[data-slot="scroll-area-viewport"]');
    const top =
      row instanceof HTMLElement && row.style.position === 'absolute'
        ? parseFloat(row.style.top) - (viewport?.scrollTop ?? 0)
        : Math.max(0, rows.indexOf(row!)) * 40;
    const height = row ? 40 : 1000;
    return { x: 0, y: top, left: 0, top, right: 300, bottom: top + height, width: 300, height, toJSON() {} };
  });
});

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
  await user.click(screen.getByRole('button', { name: /^Collapse / }));
  expect(screen.queryByText('child')).toBeNull();
  expect(changed.mock.calls[0][0][0].collapsed).toBe(true);
  expect(initial[0].collapsed).toBeUndefined();
  await user.click(screen.getByRole('button', { name: 'Expand 0' }));
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
  await userEvent.setup().click(screen.getAllByRole('button', { name: /^Remove / })[0]);
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
  await user.click(screen.getByRole('button', { name: /^Collapse / }));
  await user.click(screen.getByRole('button', { name: /^Remove / }));
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
  screen.getAllByRole('button', { name: /^Drag / })[0].focus();
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
  screen.getAllByRole('button', { name: /^Drag / })[1].focus();
  await user.keyboard('[Space]');
  await user.keyboard('[ArrowRight]');
  await user.keyboard('[Escape]');
  expect(changed).not.toHaveBeenCalled();
  screen.getAllByRole('button', { name: /^Drag / })[1].focus();
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
  const handle = screen.getAllByRole('button', { name: /^Drag / })[0];
  await act(async () => {
    fireEvent.pointerDown(handle, { clientX: 150, clientY: 20, button: 0 });
    fireEvent.pointerMove(document, { clientX: 150, clientY: 30 });
  });
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

test('renders a real ScrollArea and accessible empty state with consumer styling', () => {
  const { container } = render(<SortableTree className='custom-tree' height={240} emptyMessage='Nothing to sort' />);
  expect(screen.getByRole('status').textContent).toBe('Nothing to sort');
  expect(container.querySelector('[data-slot="scroll-area"]')?.className).toContain('custom-tree');
  expect(container.querySelector('[data-slot="scroll-area"]')?.getAttribute('style')).toContain('240px');
  expect(container.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull();
});

test('a drop in the original position does not report a change', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  const legacy = vi.fn<(before: TreeItem, after: TreeItem) => void>();
  render(<SortableTree defaultItems={[{ id: 0, children: [] }]} onItemsChange={changed} onChange={legacy} />);
  const user = userEvent.setup();
  screen.getByRole('button', { name: 'Drag 0' }).focus();
  await user.keyboard('[Space]');
  await user.keyboard('[Space]');
  expect(changed).not.toHaveBeenCalled();
  expect(legacy).not.toHaveBeenCalled();
});

test('a controlled source removed during a drag is ignored safely on drop', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  const { rerender } = render(
    <SortableTree
      items={[
        { id: 'source', children: [] },
        { id: 'target', children: [] },
      ]}
      onItemsChange={changed}
    />,
  );
  const user = userEvent.setup();
  screen.getByRole('button', { name: 'Drag source' }).focus();
  await user.keyboard('[Space]');
  await user.keyboard('[ArrowDown]');
  rerender(<SortableTree items={[{ id: 'target', children: [] }]} onItemsChange={changed} />);
  await user.keyboard('[Space]');
  expect(changed).not.toHaveBeenCalled();
});

test('Explorer provides folder semantics, single selection, navigation and file activation', async () => {
  const opened = vi.fn<(item: TreeItem) => void>();
  const selected = vi.fn<(item: TreeItem) => void>();
  render(
    <SortableTree
      mode='explorer'
      onOpen={opened}
      onSelect={selected}
      defaultItems={[
        {
          id: 'src',
          kind: 'folder',
          collapsed: true,
          children: [{ id: 'main', label: 'main.tsx', kind: 'file', children: [] }],
        },
        { id: 'empty', kind: 'folder', children: [] },
      ]}
    />,
  );
  const user = userEvent.setup();
  expect(screen.getByRole('tree')).toBeDefined();
  const folder = screen.getByRole('treeitem', { name: 'src' });
  expect(folder.getAttribute('aria-expanded')).toBe('false');
  folder.focus();
  await user.keyboard('[ArrowRight][ArrowRight]');
  const file = screen.getByRole('treeitem', { name: 'main.tsx' });
  expect(document.activeElement).toBe(file);
  expect(file.getAttribute('aria-selected')).toBe('true');
  expect(file.hasAttribute('aria-expanded')).toBe(false);
  expect(file.getAttribute('aria-level')).toBe('2');
  await user.keyboard('[Enter]');
  expect(opened.mock.calls[0][0].id).toBe('main');
  await user.keyboard('[ArrowLeft][ArrowLeft]');
  expect(document.activeElement).toBe(folder);
  expect(screen.queryByRole('treeitem', { name: 'main.tsx' })).toBeNull();
  await user.keyboard('[End]');
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'empty' }));
  expect(selected).toHaveBeenCalled();
});

test('Explorer click toggles folders and controlled selection follows its owner', async () => {
  const select = vi.fn<(item: TreeItem) => void>();
  const items: TreeItem[] = [{ id: 'folder', kind: 'folder', children: [{ id: 0, kind: 'file', children: [] }] }];
  const { rerender } = render(<SortableTree mode='explorer' items={items} selectedId={0} onSelect={select} />);
  await userEvent.setup().click(screen.getByText('folder'));
  expect(select.mock.calls[0][0].id).toBe('folder');
  // Controlled selection changes only after the owner supplies the next value.
  expect(screen.getByRole('treeitem', { name: 'folder' }).getAttribute('aria-selected')).toBe('false');
  rerender(<SortableTree mode='explorer' items={items} selectedId='folder' onSelect={select} />);
  expect(screen.getByRole('treeitem', { name: 'folder' }).getAttribute('aria-selected')).toBe('true');
});

test('large trees render a bounded window and keyboard navigation reaches unmounted rows', async () => {
  const items: TreeItem[] = Array.from({ length: 1000 }, (_, id) => ({ id, kind: 'file', children: [] }));
  const { container } = render(<SortableTree mode='explorer' defaultItems={items} height={240} />);
  expect(container.querySelectorAll('[data-tree-row]').length).toBeLessThan(40);
  expect(screen.queryByRole('treeitem', { name: '999' })).toBeNull();
  const first = screen.getByRole('treeitem', { name: '0' });
  expect(first.getAttribute('aria-setsize')).toBe('1000');
  first.focus();
  await userEvent.setup().keyboard('[End]');
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: '999' })));
  expect(container.querySelectorAll('[data-tree-row]').length).toBeLessThan(40);
});

test('virtualization can be disabled and activates using visible rather than collapsed node counts', () => {
  const children: TreeItem[] = Array.from({ length: 250 }, (_, id) => ({ id, children: [] }));
  const { container, rerender } = render(<SortableTree items={children} virtualize={false} />);
  expect(container.querySelectorAll('[data-tree-row]').length).toBe(250);
  rerender(<SortableTree items={[{ id: 'folder', collapsed: true, children }]} collapsible />);
  expect(container.querySelectorAll('[data-tree-row]').length).toBe(1);
});

test('keyboard drag mounts an offscreen target and preserves source registration in a virtual tree', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  render(
    <SortableTree
      mode='explorer'
      height={240}
      onItemsChange={changed}
      defaultItems={Array.from({ length: 1000 }, (_, id) => ({ id, kind: 'folder', children: [] }))}
    />,
  );
  const user = userEvent.setup();
  screen.getByRole('treeitem', { name: '0' }).focus();
  await user.keyboard('[End]');
  screen.getByRole('button', { name: 'Drag 999' }).focus();
  await user.keyboard('[Space][ArrowUp]');
  await waitFor(() => expect(screen.queryByText('999 will move into 998.')).not.toBeNull());
  await user.keyboard('[Space]');
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(changed.mock.calls[0][0].at(-1)?.id).toBe(998);
  expect(changed.mock.calls[0][0].at(-1)?.children[0].id).toBe(999);
});

test('Explorer expands a collapsed drop target after hovering and cancels safely', async () => {
  render(
    <SortableTree
      mode='explorer'
      defaultItems={[
        { id: 'file', kind: 'file', children: [] },
        { id: 'folder', kind: 'folder', collapsed: true, children: [{ id: 'child', kind: 'file', children: [] }] },
      ]}
    />,
  );
  const user = userEvent.setup();
  screen.getByRole('button', { name: 'Drag file' }).focus();
  await user.keyboard('[Space][ArrowDown]');
  await waitFor(() => expect(screen.queryByRole('treeitem', { name: 'child' })).not.toBeNull(), { timeout: 1500 });
  await user.keyboard('[Escape]');
  expect(screen.getByRole('treeitem', { name: 'file' })).toBeDefined();
});

test('Explorer typeahead selects a file outside the rendered window', async () => {
  render(
    <SortableTree
      mode='explorer'
      defaultItems={Array.from({ length: 1000 }, (_, id) => ({
        id,
        label: `file-${id}`,
        kind: 'file',
        children: [],
      }))}
    />,
  );
  screen.getByRole('treeitem', { name: 'file-0' }).focus();
  await userEvent.setup().keyboard('file-999');
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'file-999' })));
});

test('pointer drag keeps its virtual source mounted while scrolling to distant rows', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  const { container } = render(
    <SortableTree
      height={240}
      onItemsChange={changed}
      defaultItems={Array.from({ length: 1000 }, (_, id) => ({ id, children: [] }))}
    />,
  );
  const handle = screen.getByRole('button', { name: 'Drag 0' });
  await act(async () => {
    fireEvent.pointerDown(handle, { clientX: 150, clientY: 20, button: 0 });
    fireEvent.pointerMove(document, { clientX: 150, clientY: 30 });
  });
  await waitFor(() => expect(handle.getAttribute('aria-pressed')).toBe('true'));
  const viewport = container.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
  await act(async () => viewport.scrollTo({ top: 2400 }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Drag 55' })).not.toBeNull());
  expect(handle.isConnected).toBe(true);
  const target = screen.getByRole('button', { name: 'Drag 55' }).closest('[data-tree-row]')!;
  const y = target.getBoundingClientRect().top + 20;
  await act(async () => fireEvent.pointerMove(document, { clientX: 150, clientY: y }));
  await waitFor(() => expect(screen.queryByText('0 was moved after 55.')).not.toBeNull());
  fireEvent.pointerUp(document, { clientX: 150, clientY: y });
  await waitFor(() => expect(changed).toHaveBeenCalled());
  const order = changed.mock.calls[0][0].map((item) => item.id);
  expect(order.indexOf(0)).toBe(order.indexOf(55) + 1);
});

test('Reorder mode skips descendants and never changes the dragged node parent', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  render(
    <SortableTree
      mode='reorder'
      onItemsChange={changed}
      defaultItems={[
        { id: 'first', children: [{ id: 'nested', children: [] }] },
        { id: 'second', children: [] },
      ]}
    />,
  );
  const user = userEvent.setup();
  screen.getByRole('button', { name: 'Drag second' }).focus();
  await user.keyboard('[Space][ArrowLeft][ArrowRight][ArrowUp]');
  await waitFor(() => expect(screen.queryByText('second was moved before first.')).not.toBeNull());
  await user.keyboard('[Space]');
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(changed.mock.calls[0][0].map((item) => item.id)).toEqual(['second', 'first']);
  expect(changed.mock.calls[0][0][1].children[0].id).toBe('nested');
});

test('Folder mode ignores sibling drops and moves into an empty folder without horizontal dragging', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  render(
    <SortableTree
      mode='explorer'
      onItemsChange={changed}
      defaultItems={[
        { id: 'first', kind: 'file', children: [] },
        { id: 'second', kind: 'file', children: [] },
        { id: 'folder', kind: 'folder', children: [] },
      ]}
    />,
  );
  const user = userEvent.setup();
  const row = screen.getByRole('treeitem', { name: 'first' });
  row.focus();
  await user.keyboard('{Alt>}m{/Alt}[Space][ArrowDown]');
  await waitFor(() => expect(screen.queryByText('first will move into folder.')).not.toBeNull());
  expect(
    screen.getByRole('treeitem', { name: 'folder' }).querySelector('[data-drop-destination="inside"]'),
  ).not.toBeNull();
  expect(document.querySelector('[data-drop-indicator]')).toBeNull();
  await user.keyboard('[Space]');
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(changed.mock.calls[0][0]).toEqual([
    { id: 'second', kind: 'file', children: [] },
    { id: 'folder', kind: 'folder', collapsed: false, children: [{ id: 'first', kind: 'file', children: [] }] },
  ]);
});

test('Folder mode Left moves a file to workspace root, preserving existing sibling order', async () => {
  const changed = vi.fn<(items: TreeItem[]) => void>();
  render(
    <SortableTree
      mode='explorer'
      onItemsChange={changed}
      defaultItems={[
        { id: 'folder', kind: 'folder', children: [{ id: 0, kind: 'file', children: [] }] },
        { id: 'last', kind: 'file', children: [] },
      ]}
    />,
  );
  const user = userEvent.setup();
  screen.getByRole('button', { name: 'Drag 0' }).focus();
  await user.keyboard('[Space][ArrowLeft]');
  await waitFor(() => expect(screen.queryByText('0 will move into workspace root.')).not.toBeNull());
  await user.keyboard('[Space]');
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(changed.mock.calls[0][0].map((item) => item.id)).toEqual(['folder', 'last', 0]);
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: '0' }));
});

test('Folder trees enter at the selected row and exclude action buttons from the tab sequence', () => {
  const { container } = render(
    <SortableTree
      mode='explorer'
      selectedId='second'
      removable
      defaultItems={[
        { id: 'first', kind: 'file', children: [] },
        { id: 'second', kind: 'file', children: [] },
      ]}
    />,
  );
  expect(screen.getByRole('treeitem', { name: 'second' }).tabIndex).toBe(0);
  expect(screen.getByRole('treeitem', { name: 'first' }).tabIndex).toBe(-1);
  expect([...container.querySelectorAll('button')].every((button) => button.tabIndex === -1)).toBe(true);
});
