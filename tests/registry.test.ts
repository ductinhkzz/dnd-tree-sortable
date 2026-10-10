import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'vitest';

test('registry includes every source file and stylesheet with unique, safe installation paths', () => {
  const registry = JSON.parse(readFileSync('registry.json', 'utf8'));
  const item = registry.items[0];
  const files = item.files as { path: string; target: string }[];
  const sources = readdirSync('lib', { recursive: true })
    .filter((path) => /\.(tsx?|css)$/.test(String(path)) && path !== 'vite-env.d.ts')
    .map((path) => `lib/${path}`)
    .sort();
  assert.deepEqual(files.map((file) => file.path).sort(), sources);
  assert.equal(new Set(files.map((file) => file.target)).size, files.length);
  for (const file of files) {
    assert.match(file.target, /^~\/components\/dnd-tree-sortable\//);
    assert.ok(readFileSync(file.path, 'utf8').length > 0);
  }
});

test('built registry payload embeds the current source and dependency metadata', () => {
  const source = JSON.parse(readFileSync('registry.json', 'utf8')).items[0];
  const built = JSON.parse(readFileSync('docs/public/r/sortable-tree.json', 'utf8'));
  assert.deepEqual(built.dependencies, source.dependencies);
  for (const file of built.files) assert.equal(file.content, readFileSync(file.path, 'utf8'));
  const catalog = JSON.parse(readFileSync('docs/public/r/registry.json', 'utf8'));
  assert.equal(catalog.items[0].name, 'sortable-tree');
});
