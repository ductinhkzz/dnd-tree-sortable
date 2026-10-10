# Contributing

Thank you for helping improve Sortable Tree. Open an issue with a small reproduction for bugs, or describe the use case and expected keyboard/pointer behavior for a feature.

## Local development

Use Node.js 24 (see `.nvmrc`) and pnpm 12.10.1 (see `packageManager`). Install that pnpm version using the [official instructions](https://pnpm.io/installation).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173/dnd-tree-sortable/`. Keep dependency changes and `pnpm-lock.yaml` together. Do not add npm or Yarn lockfiles.

## Source and conventions

- Edit `lib/`, the canonical source shared by npm and the registry. The docs live in `docs/src/`; interaction and invariant tests live in `tests/`.
- Use kebab-case files and directories. `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, and `LICENSE` are conventional exceptions; exports and React component names can use PascalCase.
- Use shadcn theme tokens and Tailwind utilities. Preserve light/dark contrast, visible focus, accessible labels, and Explorer keyboard navigation.
- Keep movement rules in `tree-moves.ts` and lazy response merging in `load-tree-children.ts`. Preserve subtree data, globally unique IDs, and controlled state contracts.
- Add tree source files to `registry.json` with `@components/dnd-tree-sortable/` targets. UI primitives are registry dependencies; npm-only CSS and the package entry point are excluded. Include the license in both distributions.
- Generated `dist/`, `docs/dist/`, and `docs/public/r/` are ignored; do not edit or commit them.

## Validate a change

```sh
pnpm format
pnpm check
pnpm check:package
pnpm audit:production
```

`check` verifies formatting, lint, names, types, registry/docs builds, Vitest tests, and the npm build. `check:package` packs the package and checks exports, CSS, declarations, server rendering, and a Vite build in isolated React 18/19 consumers. It needs network access to install consumer dependencies. Add regression tests for changes to movement, loading, focus, or virtualization behavior. Inspect the affected example in light and dark mode and exercise pointer and keyboard interactions.

For registry changes, initialize a disposable React/Tailwind 4 project with shadcn and install the local endpoint:

```sh
pnpm dlx shadcn@latest add http://localhost:5173/dnd-tree-sortable/r/sortable-tree.json
```

Build that consumer and check that installation works with its configured component aliases. The generated JSON contains the current source; deploying the website publishes it.

Use Conventional Commits, for example `feat: add tree search` or `fix: preserve loaded folder selection`. Husky checks formatting, lint, and types before commits and commitlint checks the message. In a pull request, explain the behavior change and relevant validation. Add user-facing changes to the unreleased changelog.

## Releases (maintainers)

1. Choose a new SemVer version. The 2.0.0 rework is a major release; 1.0.3 already exists on npm and cannot be reused. Update `package.json` and finalize its changelog date before tagging.
2. Run the validation commands above, review the tarball, and confirm the production audit passes. The known shadcn CLI development advisory is documented in the README; review upstream status before release.
3. Merge the reviewed changes to `master`. Verify the GitHub Pages workflow deploys both registry JSON files and smoke-test the public install command from the README. Configure Pages to use GitHub Actions as its publishing source.
4. Configure the repository's `NPM_TOKEN` secret with a valid npm token allowed to publish this package under the account's current 2FA policy. Credentials and permissions must be confirmed by a package maintainer; local checks cannot verify them. The workflow requests OIDC permission for provenance; this does not configure npm trusted publishing.
5. Create the matching `v<version>` tag and publish its GitHub release. The npm workflow checks the tag/version match, runs all checks, audits runtime dependencies, verifies the packed package, and publishes with provenance. Manual runs require an explicit matching tag.
6. Verify the npm version and install it in a clean consumer. Check the hosted registry separately: shadcn installation distributes source JSON and does not require publishing an npm package or registering a public namespace.

`pnpm pack` rebuilds the library through `prepack`. Local checks and packing do not publish. Never put tokens in files, examples, or release notes.
