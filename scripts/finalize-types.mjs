import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// TypeScript's bundler resolution preserves extensionless imports. Published ESM
// declarations also need to resolve in consumers using NodeNext resolution.
const directory = 'dist/types';
for (const entry of readdirSync(directory, { recursive: true })) {
  if (!entry.endsWith('.d.ts')) continue;
  const file = join(directory, entry);
  const content = readFileSync(file, 'utf8').replace(
    /(from\s*|import\s*\()(['"])(\.[^'"]+)\2/g,
    (match, prefix, quote, specifier) => {
      const target = resolve(dirname(file), specifier);
      if (existsSync(`${target}.d.ts`)) return `${prefix}${quote}${specifier}.js${quote}`;
      if (existsSync(join(target, 'index.d.ts'))) return `${prefix}${quote}${specifier}/index.js${quote}`;
      if (specifier.endsWith('.js') || specifier.endsWith('.css')) return match;
      throw new Error(`Unresolved declaration import in ${file}: ${specifier}`);
    },
  );
  writeFileSync(file, content);
}
