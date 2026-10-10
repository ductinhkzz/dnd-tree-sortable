# Sortable Tree Registry

A shadcn-compatible registry for a virtualized React drag-and-drop tree. Install the source into your project, customize the rows, and own the component.

- Nested sorting with pointer and keyboard controls
- Virtualized rendering powered by React Virtuoso
- Collapsible and removable nodes
- Controlled state for saving changes
- Custom row content and controls
- CSS Modules with shadcn theme variable fallbacks; no Sass required

## Install from the registry

Use a React 18.3 or React 19 project initialized with [shadcn/ui](https://ui.shadcn.com/docs/installation), with CSS Modules support (Next.js and Vite support this). Once this rework is deployed to GitHub Pages:

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

The styles use `--background`, `--foreground`, `--border`, `--primary`, and `--ring` with standalone fallbacks. The installed source supports client components and guards browser APIs during server rendering. The development site and interaction tests run on React 19.3. React 18.3 remains in the supported peer range and is checked in an installed-source consumer build.

## Develop and build

Use Node.js 24 LTS (see `.nvmrc`) and npm. Node.js 22.12+ is also supported. From the repository root:

```sh
npm ci
npm run registry:build
npm run dev
```

Visit `http://localhost:5173/dnd-tree-sortable/`. The live homepage includes preview/code tabs, theme switching, collapse/removal controls, and a copyable install command that uses the current origin.

```sh
npm run format:check
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

CI checks formatting, lint, file naming, types, the latest commit message, website/registry build, Vitest tests, the library build, and production dependency advisories. The existing GitHub Pages workflow deploys `docs/dist` after merging to `master`, using the repository's existing `ACCESS_TOKEN` secret. The registry is available publicly only after that deployment succeeds.

## Existing npm package

The npm library build remains available for existing consumers:

```tsx
import { SortableTree } from 'dnd-tree-sortable';
import 'dnd-tree-sortable/dist/assets/style.css';
```

The new registry flow copies the source and includes CSS Module imports automatically. The existing npm release workflow is retained; this rework does not publish a new npm version.

## Credits

Built on the [dnd-kit sortable tree example](https://github.com/clauderic/dnd-kit/tree/master/stories/3%20-%20Examples/Tree) with [React Virtuoso](https://virtuoso.dev/) and native scrolling. Registry format follows the [shadcn registry guide](https://ui.shadcn.com/docs/registry/getting-started).

## Tooling and naming

- **Oxlint** checks TypeScript, React hooks, accessibility, and Vitest code. Vite 8 uses the Oxc transform pipeline.
- **Oxfmt** replaces Prettier. Run `npm run format` to write changes, or `npm run format:check` to verify them.
- **Vitest** replaces the Node/tsx test runner. `npm test` rebuilds the registry and runs utility, registry, SSR, and React interaction tests; `npm run test:watch` watches tests.
- **commitlint** enforces Conventional Commits through Husky's `commit-msg` hook. Use messages such as `feat: add custom tree rows` or `fix: preserve numeric item ids`. CI checks the newest commit; existing repository history is not rewritten.
- The pre-commit hook checks formatting, lint, and types. `npm run check` runs all project checks.
- File and folder names use **kebab-case**, enforced by `scripts/check-file-names.mjs`. Standard dotfiles/config extensions and GitHub's conventional `README.md` name are allowed. Component/export names remain PascalCase.

## Dependency review — October 10, 2026

Direct versions were checked against npm's stable `latest` tags. The lockfile records the tested versions.

| Area                                       | Version         | Review                                                                      |
| ------------------------------------------ | --------------- | --------------------------------------------------------------------------- |
| React / React DOM                          | 19.3.0          | Site and interaction tests migrated from React 18                           |
| Vite / React plugin                        | 8.3.4 / 6.1.2   | Oxc/Rolldown build; removed old Rollup plugin configuration                 |
| TypeScript                                 | 7.0.2           | Removed `baseUrl`; direct declaration generation replaces `vite-plugin-dts` |
| Vitest                                     | 5.0.3           | Node utility/SSR tests and jsdom interaction tests                          |
| Oxlint / Oxfmt                             | 1.87.0 / 0.72.0 | Replaces ESLint and Prettier                                                |
| commitlint / Husky                         | 21.2.3 / 9.1.7  | Conventional Commit validation and local hooks                              |
| React Virtuoso                             | 4.18.16         | Native scroll viewport replaces `rc-scrollbars`                             |
| dnd-kit React / DOM / abstract / collision | 0.5.0           | New architecture; removed core, sortable, and utilities packages            |
| shadcn                                     | 4.21.4          | Latest stable registry CLI                                                  |

Removed `rc-scrollbars` (its peer range stops at React 18), ESLint and its plugins, Prettier, tsx, glob, the Rollup visualizer, and `vite-plugin-dts`. The unused React Pages/MDX docs tree, old docs lockfile, template pages, and redundant TypeScript configs were removed. Runtime dependencies now live in `dependencies`, and the npm build externalizes them rather than copying them into the bundle.

Migrated to the [new dnd-kit React API](https://dndkit.com/react/guides/migration/): `DragDropProvider`, `@dnd-kit/react/sortable`, ref-based handles, and the new DOM sensors/accessibility plugin. Virtualized rows explicitly disable optimistic DOM sorting so React Virtuoso owns row order. Up/down keys follow visible tree order; left/right keys change nesting; Escape cancels. Pointer collision detection uses pointer distance to visible rows. Subtrees and custom payloads are preserved on drop.

Custom `components.Handle` implementations receive `elementRef` in `ActionProps`; attach it to the handle button (`<button ref={elementRef}>`) or pass all props through the built-in `Action` component. Custom `renderItemContent` implementations must forward `ref`, `wrapperRef`, and `handleProps.elementRef` to their source, target wrapper, and handle. The obsolete classic drop animation was removed; the overlay ends immediately on drop. Registry installs now include only the new dnd-kit packages.

`npm audit --omit=dev` reports **zero production vulnerabilities**. The full audit reports **seven high-severity development-only entries** associated with shadcn's transitive `braces` → `micromatch` → `fast-glob` dependency chain (including ts-morph and @shadcn/registry). These are package-level audit entries, not seven independently validated application vulnerabilities. The installed latest shadcn version still carries them; no forced downgrade or unverified override was applied. Track [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and update the CLI when a safe upstream fix is available.
