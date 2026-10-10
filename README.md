# Sortable Tree Registry

A shadcn registry for a React drag-and-drop tree using ScrollArea and Tailwind CSS. Install the source into your project, customize the rows, and own the component.

- Nested sorting with pointer and keyboard controls
- Native scrolling through shadcn ScrollArea
- Collapsible and removable nodes
- Controlled state for saving changes
- Custom row content and controls
- Tailwind styling with shadcn theme tokens, Button variants, and Badge

## Install from the registry

Use a React 18.3 or React 19 project initialized with [shadcn/ui](https://ui.shadcn.com/docs/installation), with Tailwind CSS 4 and shadcn theme tokens configured. Once this rework is deployed to GitHub Pages:

```sh
npx shadcn@latest add https://ductinhkzz.github.io/dnd-tree-sortable/r/sortable-tree.json
```

The CLI installs dependencies, adds shadcn `scroll-area`, `button`, and `badge` as registry dependencies, and copies the tree into your configured components directory under `dnd-tree-sortable`. The manifest uses `@components/` targets, so both project-root and `src/components` layouts work. Imports use your configured aliases; the example below assumes `@/components`. Existing shadcn primitives are reused; review any CLI overwrite prompt if you have customized those files.

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
| `className`         | Override the ScrollArea container with Tailwind classes       | —                 |
| `aria-label`        | Accessible name for the sortable list                         | `Sortable items`  |
| `emptyMessage`      | Content shown when no items remain                            | `No items yet.`   |
| `indentationWidth`  | Pixels per nesting level                                      | `24`              |
| `collapsible`       | Show collapse controls                                        | `false`           |
| `removable`         | Show removal controls                                         | `false`           |
| `indicator`         | Show a stable drop marker on the target row                   | `false`           |
| `components`        | Replace Handle, Collapse, Remove, ItemContent, or Badge       | Built-in controls |
| `renderItemContent` | Replace the whole row; forward supplied refs and handle props | Built-in row      |
| `onChange`          | Legacy callback with the moved item's before/after position   | —                 |
| `onRemove`          | Receives the removed ID                                       | —                 |

Focus a drag handle and press Space to pick up an item. Use Up/Down to reorder, Left/Right to change nesting, Space to drop, and Escape to cancel. All expanded rows are rendered. Keyboard movement follows the visible list and scrolls the target into view.

The component uses semantic utilities such as `bg-background`, `text-foreground`, `bg-accent`, and `ring-ring`. It inherits the consumer's light/dark theme, border radius, and color tokens. Controls have visible keyboard focus, item-specific labels, expanded state, and decorative icons hidden from assistive technology. The container uses a labeled list rather than claiming an ARIA tree widget with unsupported navigation semantics. `Action` uses the native button with shadcn `buttonVariants` so handle refs work on both React 18 and React 19.

Virtuoso and CSS Modules have been removed. This version renders all expanded nodes; it does not virtualize large trees. The npm stylesheet compiles the same Tailwind classes without adding a global preflight reset. Registry consumers use their existing Tailwind pipeline and do not import that stylesheet.

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

`registry.json` is the catalog and source manifest. It reads the canonical implementation in `lib/`; there is no second copy to maintain. Add every new source file to its `files` array with an `@components/dnd-tree-sortable/` target. Registry coverage tests catch omitted files. The local shadcn primitive files in `lib/components/ui` and npm-only `package.ts`, `styles.css`, and `theme.css` are excluded from the registry; `registryDependencies` installs the primitives in consumer projects.

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

The registry flow copies Tailwind-styled source and installs shadcn primitives. The npm flow bundles the local primitive source and provides precompiled CSS; existing consumers keep the stylesheet import above. The existing npm release workflow is retained; this rework does not publish a new npm version.

## Credits

Built on the [dnd-kit sortable tree example](https://github.com/clauderic/dnd-kit/tree/master/stories/3%20-%20Examples/Tree) with [shadcn ScrollArea](https://ui.shadcn.com/docs/components/radix/scroll-area). Registry format follows the [shadcn registry guide](https://ui.shadcn.com/docs/registry/getting-started).

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
| Tailwind CSS / Vite plugin                 | 4.3.3           | Replaces CSS Modules with semantic theme utilities                          |
| Radix UI                                   | 1.7.0           | Official shadcn ScrollArea, Button, and Badge foundations                   |
| Lucide / cn                                | 1.54.0 / 0.4.0  | Theme-aware icons and the class merge helper used by current shadcn source  |
| dnd-kit React / DOM / abstract / collision | 0.5.0           | New architecture; removed core, sortable, and utilities packages            |
| shadcn                                     | 4.21.4          | Latest stable registry CLI                                                  |

Removed `react-virtuoso`, `rc-scrollbars` (its peer range stops at React 18), ESLint and its plugins, Prettier, tsx, glob, the Rollup visualizer, and `vite-plugin-dts`. The unused React Pages/MDX docs tree, old docs lockfile, template pages, and redundant TypeScript configs were removed. Runtime dependencies now live in `dependencies`, and the npm build externalizes them rather than copying them into the bundle.

Migrated to the [new dnd-kit React API](https://dndkit.com/react/guides/migration/): `DragDropProvider`, `@dnd-kit/react/sortable`, ref-based handles, and the new DOM sensors/accessibility plugin. Rows explicitly disable optimistic DOM sorting so React owns row order. Up/down keys follow visible tree order; left/right keys change nesting; Escape cancels. Pointer collision detection uses pointer distance to visible rows. Subtrees and custom payloads are preserved on drop.

Custom `components.Handle` implementations receive `elementRef` in `ActionProps`; attach it to the handle button (`<button ref={elementRef}>`) or pass all props through the exported `Action` component. Custom `renderItemContent` implementations must forward `ref`, `wrapperRef`, and `handleProps.elementRef` to their source, target wrapper, and handle. The obsolete classic drop animation was removed; the overlay ends immediately on drop. Registry installs use only the new dnd-kit architecture.

## Logic and UX review

- Moves run through a pure `moveTreeItem` helper. Stale IDs, hidden descendant targets, invalid offsets/indentation, and unchanged drops are ignored safely.
- The legacy positional callback now receives recomputed depth and sibling index for the moved node.
- Nesting into a collapsed parent expands it after a successful drop so the result stays visible.
- Flattening uses one accumulator and descendant exclusion uses a Set, avoiding repeated array copies and linear membership scans.
- Drag placeholders retain their row height. Optional before/after markers show the projected nesting level without shrinking the list.
- Collapse/removal controls are disabled during a drag; keyboard Escape cancels without reporting data changes.
- Tests cover tree invariants across reorder/nesting combinations, real ScrollArea and sensor interactions, numeric IDs, custom payloads/handles, controlled updates, cancellation, empty states, and SSR.

`npm audit --omit=dev` reports **zero production vulnerabilities**. The full audit reports **seven high-severity development-only entries** associated with shadcn's transitive `braces` → `micromatch` → `fast-glob` dependency chain (including ts-morph and @shadcn/registry). These are package-level audit entries, not seven independently validated application vulnerabilities. The installed latest shadcn version still carries them; no forced downgrade or unverified override was applied. Track [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and update the CLI when a safe upstream fix is available.
