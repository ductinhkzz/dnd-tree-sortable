import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SortableTree, type TreeItem } from 'dnd-tree-sortable';
import './styles.css';

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
      { id: 'Virtualized lists', children: [] },
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

const registryUrl = new URL(`${import.meta.env.BASE_URL}r/sortable-tree.json`, window.location.origin).href;
const command = `npx shadcn@latest add ${registryUrl}`;
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
    <button className='copy' onClick={copy} aria-live='polite'>
      {status}
    </button>
  );
}

export function App() {
  const [items, setItems] = useState(initialItems);
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
        <a className='brand' href='#'>
          <span className='brand-mark'>↳</span> sortable tree <span className='badge'>registry</span>
        </a>
        <nav aria-label='Main navigation'>
          <a href='#installation'>Installation</a>
          <a href='https://github.com/ductinhkzz/dnd-tree-sortable'>GitHub ↗</a>
          <button
            className='theme'
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Use light theme' : 'Use dark theme'}
          >
            {dark ? '☀' : '◐'}
          </button>
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
            Drag, nest, and rearrange. A sortable React tree with virtualization built in. Add the source to your
            project and make it yours.
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
            <p>Grab a handle. Make a move.</p>
          </div>
          <div className='demo-panel'>
            <div className='panel-toolbar'>
              <div className='tabs' role='tablist' aria-label='Component example'>
                <button
                  role='tab'
                  id='preview-tab'
                  aria-selected={tab === 'preview'}
                  aria-controls='demo-content'
                  onClick={() => setTab('preview')}
                >
                  Preview
                </button>
                <button
                  role='tab'
                  id='code-tab'
                  aria-selected={tab === 'code'}
                  aria-controls='demo-content'
                  onClick={() => setTab('code')}
                >
                  Code
                </button>
              </div>
              <span className='component-label'>sortable-tree.tsx</span>
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
                      items={items}
                      onItemsChange={setItems}
                      height={390}
                      indentationWidth={24}
                      collapsible
                      removable={removable}
                      indicator={indicator}
                    />
                    <div className='tree-footer'>Drag horizontally to nest · Space + arrow keys to move</div>
                  </div>
                  <aside>
                    <div className='eyebrow'>MAKE IT YOURS</div>
                    <h3>
                      Small component.
                      <br />
                      Full control.
                    </h3>
                    <p>Your data, your rows, your design. The source lives in your project.</p>
                    <label>
                      <input type='checkbox' checked={indicator} onChange={(e) => setIndicator(e.target.checked)} />{' '}
                      Drop indicator
                    </label>
                    <label>
                      <input type='checkbox' checked={removable} onChange={(e) => setRemovable(e.target.checked)} />{' '}
                      Removable items
                    </label>
                    <button className='reset' onClick={() => setItems(structuredClone(initialItems))}>
                      ↺ Reset tree
                    </button>
                  </aside>
                </div>
              ) : (
                <div className='code-panel'>
                  <CopyButton value={usage} />
                  <pre>
                    <code>{usage}</code>
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
              Installs to <code>components/dnd-tree-sortable</code> at the project root. Uses CSS Modules and your
              shadcn theme variables. No Sass setup required.
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
              <p>
                Virtualized rendering keeps long lists manageable. Configure height, indentation, collapse, and removal.
              </p>
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
