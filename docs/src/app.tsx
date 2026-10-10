import { Button, buttonVariants } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { SortableTree, type TreeItem } from 'dnd-tree-sortable';

const initialItems: TreeItem[] = [
  {
    id: 'Getting started',
    children: [
      { id: 'Introduction', children: [] },
      { id: 'Installation', children: [] },
    ],
  },
  {
    id: 'Components',
    children: [
      { id: 'Sortable tree', children: [] },
      { id: 'Custom rows', children: [] },
      { id: 'Theming', children: [] },
    ],
  },
  {
    id: 'Resources',
    collapsed: true,
    children: [
      { id: 'API reference', children: [] },
      { id: 'Changelog', children: [] },
    ],
  },
];

const explorerItems: TreeItem[] = [
  {
    id: 'src',
    kind: 'folder',
    children: [
      {
        id: 'app',
        kind: 'folder',
        children: [
          { id: 'page', label: 'page.tsx', kind: 'file', children: [] },
          { id: 'layout', label: 'layout.tsx', kind: 'file', children: [] },
          { id: 'loading', label: 'loading.tsx', kind: 'file', children: [] },
        ],
      },
      {
        id: 'components',
        kind: 'folder',
        children: [
          { id: 'button', label: 'button.tsx', kind: 'file', children: [] },
          { id: 'card', label: 'card.tsx', kind: 'file', children: [] },
          { id: 'dialog', label: 'dialog.tsx', kind: 'file', children: [] },
        ],
      },
      {
        id: 'lib',
        kind: 'folder',
        collapsed: true,
        children: [{ id: 'utils', label: 'utils.ts', kind: 'file', children: [] }],
      },
      { id: 'globals', label: 'globals.css', kind: 'file', children: [] },
    ],
  },
  {
    id: 'public',
    kind: 'folder',
    collapsed: true,
    children: [{ id: 'favicon', label: 'favicon.svg', kind: 'file', children: [] }],
  },
  { id: 'package', label: 'package.json', kind: 'file', children: [] },
  { id: 'readme', label: 'README.md', kind: 'file', children: [] },
  { id: 'tsconfig', label: 'tsconfig.json', kind: 'file', children: [] },
];
const reorderItems: TreeItem[] = [
  { id: 'Research requirements', children: [] },
  { id: 'Design the interface', children: [] },
  { id: 'Build components', children: [] },
  { id: 'Review accessibility', children: [] },
  { id: 'Run tests', children: [] },
  { id: 'Publish documentation', children: [] },
];
const largeItems: TreeItem[] = [
  {
    id: 'Documents',
    kind: 'folder',
    children: Array.from({ length: 1000 }, (_, index) => ({
      id: `file-${index}`,
      label: `document-${String(index + 1).padStart(4, '0')}.tsx`,
      kind: 'file',
      children: [],
    })),
  },
  { id: 'Archive', kind: 'folder', collapsed: true, children: [] },
];
const examples = [
  { value: 'reorder', label: 'Reorder', description: 'Change sibling order. Items keep their parent.' },
  {
    value: 'hierarchy',
    label: 'Hierarchy',
    description: 'Reorder items, nest descendants, or move them to an ancestor.',
  },
  {
    value: 'explorer',
    label: 'Folders',
    description: 'Move into a folder or Workspace root. Existing siblings keep their order.',
  },
  { value: 'large', label: '1,000 files', description: 'The same folder behavior with a virtualized list.' },
] as const;

const registryUrl = new URL(`${import.meta.env.BASE_URL}r/sortable-tree.json`, window.location.origin).href;
const command = `pnpm dlx shadcn@latest add ${registryUrl}`;
const usage = `"use client";

import { useState } from "react";
import { SortableTree, type TreeItem } from "@/components/dnd-tree-sortable";

export function TreeDemo() {
  const [items, setItems] = useState<TreeItem[]>([
    { id: "Pages", children: [
      { id: "Introduction", children: [] },
      { id: "Installation", children: [] },
    ] },
    { id: "Components", children: [] },
  ]);

  return (
    <SortableTree
      items={items}
      onItemsChange={setItems}
      height={400}
      indentationWidth={24}
      collapsible
      removable
    />
  );
}`;

const explorerUsage = `"use client";

import { SortableTree, type TreeItem } from "@/components/dnd-tree-sortable";

const items: TreeItem[] = [
  { id: "src", kind: "folder", children: [
    { id: "main", label: "main.tsx", kind: "file", children: [] },
  ] },
  { id: "public", kind: "folder", children: [] },
];

export function ExplorerDemo() {
  return (
    <SortableTree
      mode="explorer"
      defaultItems={items}
      virtualize={{ threshold: 200, overscan: 8 }}
      onOpen={(file) => console.log("Open", file.id)}
      height={400}
    />
  );
}`;

function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState('Copy');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('Copied');
    } catch {
      setStatus('Select and copy');
    }
    window.setTimeout(() => setStatus('Copy'), 2000);
  }
  return (
    <Button variant='outline' size='sm' className='copy' onClick={copy} aria-live='polite'>
      {status}
    </Button>
  );
}

export function App() {
  const [items, setItems] = useState(reorderItems);
  const [example, setExample] = useState<(typeof examples)[number]['value']>('reorder');
  const [openedFile, setOpenedFile] = useState<string | null>(null);
  function loadExample(next: typeof example) {
    setExample(next);
    setOpenedFile(null);
    setItems(
      structuredClone(
        next === 'reorder'
          ? reorderItems
          : next === 'hierarchy'
            ? initialItems
            : next === 'explorer'
              ? explorerItems
              : largeItems,
      ),
    );
  }
  const folderExample = example === 'explorer' || example === 'large';
  const exampleCode = folderExample
    ? explorerUsage
    : usage.replace(
        '      items={items}',
        `      mode="${example === 'reorder' ? 'reorder' : 'tree'}"\n      items={items}`,
      );
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [removable, setRemovable] = useState(false);
  const [indicator, setIndicator] = useState(true);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  return (
    <div className='app' data-theme={dark ? 'dark' : 'light'}>
      <header>
        <a className='brand' href={import.meta.env.BASE_URL}>
          <span className='brand-mark'>↳</span> sortable tree <span className='badge'>registry</span>
        </a>
        <nav aria-label='Main navigation'>
          <a href='#installation'>Installation</a>
          <a href='https://github.com/ductinhkzz/dnd-tree-sortable'>GitHub ↗</a>
          <Button
            variant='ghost'
            size='icon'
            className='theme'
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Use light theme' : 'Use dark theme'}
          >
            {dark ? '☀' : '◐'}
          </Button>
        </nav>
      </header>
      <main>
        <section className='hero'>
          <div className='eyebrow'>
            <span /> A SHADCN-COMPATIBLE REGISTRY
          </div>
          <h1>
            A little structure.
            <br />
            <span>A lot of possibility.</span>
          </h1>
          <p>
            Drag, nest, and rearrange. A sortable React tree with shadcn ScrollArea and Tailwind styling. Add the source
            to your project and make it yours.
          </p>
          <div className='hero-actions'>
            <a className='primary' href='#installation'>
              Get the component <span>↗</span>
            </a>
            <a className='secondary' href='#playground'>
              Try it below ↓
            </a>
          </div>
          <div className='features'>
            <span>React + TypeScript</span>
            <span>Powered by dnd-kit</span>
            <span>Keyboard accessible</span>
          </div>
        </section>
        <section id='playground' className='playground'>
          <div className='section-heading'>
            <div>
              <div className='eyebrow'>01 / PLAYGROUND</div>
              <h2>Everything in its place.</h2>
            </div>
            <p>Choose a use case. Make a move.</p>
          </div>
          <div className='demo-panel'>
            <div className='panel-toolbar'>
              <div
                className='tabs'
                role='tablist'
                tabIndex={-1}
                aria-label='Component example'
                onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  const next =
                    event.key === 'Home'
                      ? 'preview'
                      : event.key === 'End'
                        ? 'code'
                        : tab === 'preview'
                          ? 'code'
                          : 'preview';
                  setTab(next);
                  document.getElementById(`${next}-tab`)?.focus();
                }}
              >
                <button
                  role='tab'
                  id='preview-tab'
                  tabIndex={tab === 'preview' ? 0 : -1}
                  aria-selected={tab === 'preview'}
                  aria-controls='demo-content'
                  onClick={() => setTab('preview')}
                >
                  Preview
                </button>
                <button
                  role='tab'
                  id='code-tab'
                  tabIndex={tab === 'code' ? 0 : -1}
                  aria-selected={tab === 'code'}
                  aria-controls='demo-content'
                  onClick={() => setTab('code')}
                >
                  Code
                </button>
              </div>
              <span className='component-label'>sortable-tree.tsx</span>
            </div>
            <div className='example-toolbar'>
              <fieldset className='flex flex-wrap gap-2'>
                <legend className='sr-only'>Tree use case</legend>
                {examples.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`${buttonVariants({ variant: example === value ? 'secondary' : 'outline', size: 'sm' })} cursor-pointer focus-within:ring-2 focus-within:ring-ring`}
                  >
                    <input
                      className='sr-only'
                      type='radio'
                      name='tree-use-case'
                      value={value}
                      checked={example === value}
                      onChange={() => loadExample(value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <p>{examples.find((entry) => entry.value === example)?.description}</p>
            </div>
            <div id='demo-content' role='tabpanel' aria-labelledby={`${tab}-tab`}>
              {tab === 'preview' ? (
                <div className='demo-layout'>
                  <div className='tree-preview'>
                    <div className='tree-heading'>
                      <span>YOUR WORKSPACE</span>
                      <span>↳</span>
                    </div>
                    <SortableTree
                      key={example}
                      mode={folderExample ? 'explorer' : example === 'reorder' ? 'reorder' : 'tree'}
                      onOpen={(item) => setOpenedFile(`Opened ${item.label ?? item.id}`)}
                      items={items}
                      onItemsChange={setItems}
                      onChange={(before, after) =>
                        setOpenedFile(
                          before.parentId === after.parentId
                            ? `Reordered ${after.label ?? after.id}`
                            : `Moved ${after.label ?? after.id} into ${after.parentId ?? 'workspace root'}`,
                        )
                      }
                      height={example === 'explorer' ? 630 : 390}
                      indentationWidth={24}
                      collapsible
                      removable={removable}
                      indicator={indicator}
                    />
                    <div className='tree-footer'>
                      {folderExample
                        ? 'Click folders to expand. Arrow keys navigate. Alt+M focuses the move handle; Space picks up, Up/Down choose a folder, Left chooses root, Space drops, Escape cancels.'
                        : example === 'reorder'
                          ? 'Drag a handle to reorder siblings. Space + Up/Down moves; Escape cancels.'
                          : 'Drag horizontally to change nesting. Space + Up/Down reorders; Left/Right changes nesting; Escape cancels.'}
                    </div>
                    <output className='tree-status' aria-live='polite'>
                      {openedFile ?? 'Ready'}
                    </output>
                  </div>
                  <aside>
                    <div className='eyebrow'>MAKE IT YOURS</div>
                    <h3>
                      Small component.
                      <br />
                      Full control.
                    </h3>
                    <p>Your data, your rows, your design. The source lives in your project.</p>
                    <label hidden={folderExample}>
                      <input type='checkbox' checked={indicator} onChange={(e) => setIndicator(e.target.checked)} />{' '}
                      Drop indicator
                    </label>
                    <label>
                      <input type='checkbox' checked={removable} onChange={(e) => setRemovable(e.target.checked)} />{' '}
                      Removable items
                    </label>
                    <Button variant='outline' size='sm' className='reset' onClick={() => loadExample(example)}>
                      ↺ Reset tree
                    </Button>
                  </aside>
                </div>
              ) : (
                <div className='code-panel'>
                  <CopyButton value={exampleCode} />
                  <pre>
                    <code>{exampleCode}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
        <section id='installation' className='installation'>
          <div>
            <div className='eyebrow'>02 / INSTALLATION</div>
            <h2>
              One command.
              <br />
              All yours.
            </h2>
            <p>
              Run this in a project initialized with shadcn/ui. The CLI copies the component, styles, and utilities and
              installs its dependencies.
            </p>
            <a href='https://ui.shadcn.com/docs/installation'>Set up shadcn/ui ↗</a>
          </div>
          <div>
            <div className='command'>
              <div className='code-title'>
                Terminal <CopyButton value={command} />
              </div>
              <pre>
                <code>{command}</code>
              </pre>
            </div>
            <p className='install-note'>
              Installs into your configured components directory and reuses shadcn ScrollArea, Button, and Badge. Styled
              with Tailwind and your shadcn theme.
            </p>
            <div className='catalog'>
              <span>Registry catalog</span>
              <a href={`${import.meta.env.BASE_URL}r/registry.json`}>View JSON ↗</a>
            </div>
          </div>
        </section>
        <section className='api'>
          <div className='eyebrow'>03 / API</div>
          <h2>Built to fit your project.</h2>
          <div className='api-grid'>
            <article>
              <span>↕</span>
              <h3>Controlled or standalone</h3>
              <p>
                Use <code>items</code> and <code>onItemsChange</code> to persist state, or start with{' '}
                <code>defaultItems</code>.
              </p>
            </article>
            <article>
              <span>⊞</span>
              <h3>Render your own rows</h3>
              <p>
                Bring your own content with <code>components.ItemContent</code>, or replace the row using{' '}
                <code>renderItemContent</code>.
              </p>
            </article>
            <article>
              <span>⌘</span>
              <h3>Room to grow</h3>
              <p>Uses your shadcn theme and ScrollArea. Configure height, indentation, collapse, and removal.</p>
            </article>
          </div>
        </section>
      </main>
      <footer>
        <span>Sortable Tree · Built by ductinhkzz</span>
        <a href='https://github.com/ductinhkzz/dnd-tree-sortable'>View source ↗</a>
      </footer>
    </div>
  );
}
