import { mkdirSync, writeFileSync } from 'node:fs';
const revision = 'd8c8ebaee0c08c412cfba96af1923dfa61c83317';
const target = new URL('../.cache/puzzle-bank/', import.meta.url);
mkdirSync(target, { recursive: true });
for (const file of ['easy.txt', 'medium.txt', 'hard.txt', 'LICENSE.txt', 'README.md']) {
  const response = await fetch(`https://raw.githubusercontent.com/grantm/sudoku-exchange-puzzle-bank/${revision}/${file}`);
  if (!response.ok) throw new Error(`Download failed: ${file} ${response.status}`);
  writeFileSync(new URL(file, target), Buffer.from(await response.arrayBuffer()));
}
writeFileSync(new URL('source-commit.txt', target), revision + '\n');
console.log(`Downloaded puzzle data at ${revision}; run import-puzzle-bank.mjs to validate and import.`);
