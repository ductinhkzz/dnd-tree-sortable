import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const ignored = new Set(['.git', 'node_modules', 'dist']);
const conventional = new Set(['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE']);
const invalid = [];

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (ignored.has(entry.name) || path === 'docs/public/r' || path === '.husky/_') continue;
    if (!conventional.has(entry.name) && !/^\.?[a-z0-9]+(?:[-.][a-z0-9]+)*$/.test(entry.name)) invalid.push(path);
    if (entry.isDirectory()) visit(path);
  }
}

visit('.');
if (invalid.length) {
  console.error(`Use kebab-case file and directory names:\n${invalid.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('File and directory names follow kebab-case.');
}
