import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const directory = mkdtempSync(join(tmpdir(), 'dnd-tree-package-'));
const tarball = join(directory, `${pkg.name}-${pkg.version}.tgz`);
const run = (command, args, cwd = process.cwd()) => execFileSync(command, args, { cwd, stdio: 'inherit' });
run('pnpm', ['pack', '--out', tarball, '--silent']);
const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
for (const file of [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'dist/index.js',
  'dist/types/index.d.ts',
  'dist/assets/style.css',
]) {
  assert.ok(entries.includes(`package/${file}`), `Missing packed file: ${file}`);
}
assert.ok(
  entries.every((file) =>
    /^package\/(?:dist\/|package\.json$|README\.md$|CHANGELOG\.md$|CONTRIBUTING\.md$|LICENSE$)/.test(file),
  ),
  'Unexpected source, config, or private files in tarball',
);

for (const reactVersion of ['18.3.1', pkg.devDependencies.react.replace(/^\^/, '')]) {
  const consumer = join(directory, `react-${reactVersion}`);
  mkdirSync(consumer);
  const save = (name, content) => writeFileSync(join(consumer, name), content);
  save(
    'package.json',
    JSON.stringify(
      {
        private: true,
        type: 'module',
        dependencies: { [pkg.name]: `file:${tarball}`, react: reactVersion, 'react-dom': reactVersion },
        devDependencies: {
          '@types/react': reactVersion.startsWith('18.') ? '^18.3.0' : pkg.devDependencies['@types/react'],
          '@types/react-dom': reactVersion.startsWith('18.') ? '^18.3.0' : pkg.devDependencies['@types/react-dom'],
          typescript: pkg.devDependencies.typescript,
          vite: pkg.devDependencies.vite,
        },
      },
      null,
      2,
    ),
  );
  run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], consumer);
  save(
    'main.tsx',
    `import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { SortableTree, Action, type TreeItem, type LoadChildren, type SortableTreeProps } from '${pkg.name}';
import '${pkg.name}/dist/assets/style.css';
const items: TreeItem<{ label: string }>[] = [{ id: 'src', label: 'src', kind: 'folder', childrenLoaded: false, children: [] }];
const loadChildren: LoadChildren<{ label: string }> = async (_folder, { signal }) => { signal.throwIfAborted(); return []; };
// @ts-expect-error invalid modes must be rejected by the published declarations
const invalidMode: SortableTreeProps['mode'] = 'invalid';
void invalidMode;
const props: SortableTreeProps<{ label: string }> = { defaultItems: items, loadChildren, mode: 'explorer', virtualize: true };
createRoot(document.getElementById('root')!).render(createElement('main', null, createElement(SortableTree<{ label: string }>, props), createElement(Action, { 'aria-label': 'Move' })));
`,
  );
  save('css.d.ts', "declare module '*.css';\n");
  for (const resolution of ['bundler', 'NodeNext']) {
    save(
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          target: 'ES2022',
          jsx: 'react-jsx',
          module: resolution === 'bundler' ? 'ESNext' : 'NodeNext',
          moduleResolution: resolution,
        },
        include: ['main.tsx', 'css.d.ts'],
      }),
    );
    run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], consumer);
  }
  save('index.html', '<div id="root"></div><script type="module" src="/main.tsx"></script>');
  save(
    'vite.config.mjs',
    `export default { build: { rolldownOptions: {
    // This fixture is a client-only SPA; React Server Component directives do not apply.
    onwarn(warning, warn) { if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning); },
  } } };`,
  );
  run('pnpm', ['exec', 'vite', 'build'], consumer);
  const assets = join(consumer, 'dist/assets');
  const css = readdirSync(assets)
    .filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(join(assets, name), 'utf8'))
    .join('');
  assert.ok(css.includes('border') && css.includes('bg-accent'), 'Compiled tree styling must reach the consumer build');
  save(
    'ssr.mjs',
    `import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { SortableTree, Action } from '${pkg.name}';
assert.equal(typeof SortableTree, 'function');
assert.equal(typeof Action, 'function');
const warnings = [];
console.error = (...args) => warnings.push(args.join(' '));
assert.match(renderToString(createElement(SortableTree, { defaultItems: [{ id: 'root', children: [] }] })), /400px/);
assert.deepEqual(warnings, [], 'SSR must not produce React warnings');
`,
  );
  run(process.execPath, ['ssr.mjs'], consumer);
  console.log(`Packed consumer passed: React ${reactVersion} (types, Vite, SSR).`);
}
console.log(`Verified tarball: ${tarball}`);
