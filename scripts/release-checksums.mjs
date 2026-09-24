import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import metadata from '../package.json' with { type: 'json' };

const root = new URL('../src-tauri/target/release/bundle/', import.meta.url);
const files = [`nsis/Sudoku_${metadata.version}_x64-setup.exe`, `msi/Sudoku_${metadata.version}_x64_en-US.msi`];
const lines = [];
for (const file of files) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(new URL(file, root))) hash.update(chunk);
  lines.push(`${hash.digest('hex')}  ${file}`);
}
await writeFile(new URL('SHA256SUMS.txt', root), `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
