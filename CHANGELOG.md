# Changelog

Changes follow [Semantic Versioning](https://semver.org/). Dates below describe published versions; the next release stays unreleased until publication.

## 2.0.0 — Unreleased

### Breaking changes

- Replace the classic `@dnd-kit/core`, `sortable`, and `utilities` architecture with the new dnd-kit React/DOM API. Custom drag handles now receive `elementRef`; custom rows must forward source, wrapper, and handle refs. See [migration notes](README.md#migrating-from-1x).
- Replace Virtuoso and rc-scrollbars with shadcn ScrollArea and TanStack Virtual. Styling now uses Tailwind utilities and shadcn theme tokens; CSS Modules and the classic drop animation are removed.
- Externalize and correctly declare runtime dependencies in the ESM library. React 18.3.1 and React 19 are supported. Development requires a supported Node.js release and pnpm 12.10.1.
- Rename source files to kebab-case. Import npm's public entry point or the installed registry entry point instead of internal paths.

### Added

- Installable shadcn registry generated from the canonical library source.
- Live documentation with Reorder, Hierarchy, Folders, 1,000-file, and Dynamic loading examples.
- Separate `reorder`, `tree`, and `explorer` movement modes.
- Folder/file icons, single selection, arrow navigation, typeahead, file activation, hover expansion, and keyboard folder moves.
- Automatic virtualization at 200 visible rows, configurable thresholds and measured row heights.
- Async `loadChildren` with request deduplication, cached results, abort handling, loading indicators, and explicit retry.
- Controlled `items`/`onItemsChange` state and accessible custom controls.
- Oxlint, Oxfmt, Vitest, commitlint, pnpm lockfile, contributor guide, and MIT license notices.
- Release checks that install and build the packed npm package in isolated consumers.

### Fixed

- Preserve nested subtrees, custom payloads, and numeric IDs during moves.
- Reject invalid, stale, self-descendant, and unchanged drop targets.
- Keep focused and dragged virtual rows mounted and reveal keyboard targets.
- Preserve concurrent tree edits when lazy children resolve; ignore removed or aborted requests.
- Restore visible borders in reorder/hierarchy rows and use a consistent borderless folder explorer.
- Resolve published ESM declarations in both bundler and NodeNext consumers.
- Avoid the lazy-loading hook's layout-effect warning during React 18 server rendering.

## 1.x

The npm registry records 1.0.0, 1.0.1, 1.0.2, and 1.0.3 on September 21, 2024. Earlier releases did not maintain a changelog; no detailed historical release notes are reconstructed here. See the [Git tags](https://github.com/ductinhkzz/dnd-tree-sortable/tags) for source history.
