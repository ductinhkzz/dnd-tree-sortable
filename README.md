# Sortable Tree Registry

A shadcn-compatible registry for a virtualized React drag-and-drop tree. Install the source into your project, customize the rows, and own the component.

- Nested sorting with pointer and keyboard controls
- Virtualized rendering powered by React Virtuoso
- Collapsible and removable nodes
- Controlled state for saving changes
- Custom row content and controls
- CSS Modules with shadcn theme variable fallbacks; no Sass required

## Install from the registry

Use a React 18 project initialized with [shadcn/ui](https://ui.shadcn.com/docs/installation), with CSS Modules support (Next.js and Vite support this). Once this rework is deployed to GitHub Pages:

```sh
npx shadcn@latest add https://ductinhkzz.github.io/dnd-tree-sortable/r/sortable-tree.json
```

The CLI installs dependencies and copies files into `components/dnd-tree-sortable` **at the project root**. Relative imports keep the tree self-contained. For a project with `@/*` mapped to `src/*`, import from the root directory using a relative path or add a matching alias; the example below assumes `@/*` maps to the project root.

You can also configure a namespace in your consumer project's `components.json`:

```json
{
  "registries": {
    "@dnd-tree": "https://ductinhkzz.github.io/dnd-tree-sortable/r/{name}.json"
  }
}
```

Then run `npx shadcn@latest add @dnd-tree/sortable-tree`. This is a user-configured namespace; it is not registered in shadcn's public registry index.

## Usage

```tsx
'use client';

import { useState } from 'react';
import { SortableTree, type TreeItem } from '@/components/dnd-tree-sortable';

export function TreeDemo() {
  const [items, setItems] = useState<TreeItem[]>([
    {
      id: 'Pages',
      children: [
        { id: 'Introduction', children: [] },
        { id: 'Installation', children: [] },
      ],
    },
    { id: 'Components', children: [] },
  ]);

  return (
    <SortableTree items={items} onItemsChange={setItems} height={400} indentationWidth={24} collapsible removable />
  );
}
```

Every item must have a unique string or numeric `id` and a `children` array. Extra fields are retained when items move. Use `TreeItem<YourData>` and `components.ItemContent` to render custom data. Keep IDs and structure stable during a drag.

For uncontrolled use, pass `defaultItems` instead of `items`. `defaultItems` is only read on mount. `onItemsChange` reports the entire tree after sorting, collapsing, or removing. When using `items`, update it in `onItemsChange`.

### Props

| Prop                | Purpose                                                       | Default           |
| ------------------- | ------------------------------------------------------------- | ----------------- |
| `items`             | Controlled tree data                                          | —                 |
| `defaultItems`      | Initial uncontrolled tree                                     | `[]`              |
| `onItemsChange`     | Receives the updated full tree                                | —                 |
| `height`            | Scroll viewport height                                        | `400`             |
| `indentationWidth`  | Pixels per nesting level                                      | `50`              |
| `collapsible`       | Show collapse controls                                        | `false`           |
| `removable`         | Show removal controls                                         | `false`           |
| `indicator`         | Show the drop position indicator                              | `false`           |
| `components`        | Replace Handle, Collapse, Remove, ItemContent, or Badge       | Built-in controls |
| `renderItemContent` | Replace the whole row; forward supplied refs and handle props | Built-in row      |
| `onChange`          | Legacy callback with the moved item's before/after position   | —                 |
| `onRemove`          | Receives the removed ID                                       | —                 |

Focus a drag handle and press Space to pick up an item. Use Up/Down to reorder, Left/Right to change nesting, Space to drop, and Escape to cancel. Keyboard movement is limited to currently rendered rows in the virtualized viewport.

The styles use `--background`, `--foreground`, `--border`, `--primary`, and `--ring` with standalone fallbacks. The installed source supports client components and guards browser APIs during server rendering. It has been checked with React 18; React 19 support has not been validated.

## Develop and build

Use Node.js 22 or newer and npm. From the repository root:

```sh
npm ci
npm run registry:build
npm run dev
```

Visit `http://localhost:5173/dnd-tree-sortable/`. The live homepage includes preview/code tabs, theme switching, collapse/removal controls, and a copyable install command that uses the current origin.

```sh
npm run lint
npm run typecheck
npm run build-docs
npm test
npm run build
```

`registry.json` is the catalog and source manifest. It reads the canonical implementation in `lib/`; there is no second copy to maintain. Add every new source file to its `files` array with a project-relative `target`. Registry coverage tests catch omitted files.

`shadcn build` generates `docs/public/r/registry.json` and `docs/public/r/sortable-tree.json`; these are generated artifacts and are not committed. `build-docs` rebuilds the registry before compiling the website so `docs/dist` includes both the website and registry JSON.

Test from a disposable, initialized consumer project:

```sh
npx shadcn@latest add http://localhost:5173/dnd-tree-sortable/r/sortable-tree.json
```

Pull requests run lint, website/registry build, regression tests, and library build. The existing GitHub Pages workflow deploys `docs/dist` after merging to `master`, using the repository's existing `ACCESS_TOKEN` secret. The registry is available publicly only after that deployment succeeds.

## Existing npm package

The npm library build remains available for existing consumers:

```tsx
import { SortableTree } from 'dnd-tree-sortable';
import 'dnd-tree-sortable/dist/assets/style.css';
```

The new registry flow copies the source and includes CSS Module imports automatically. The existing npm release workflow is retained; this rework does not publish a new npm version.

## Credits

Built on the [dnd-kit sortable tree example](https://github.com/clauderic/dnd-kit/tree/master/stories/3%20-%20Examples/Tree) with [React Virtuoso](https://virtuoso.dev/) and [rc-scrollbars](https://github.com/sakhnyuk/rc-scrollbars). Registry format follows the [shadcn registry guide](https://ui.shadcn.com/docs/registry/getting-started).
