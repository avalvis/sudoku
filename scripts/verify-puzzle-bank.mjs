import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { solutionsFor, duplicateKey } from './lib/bank-validation.mjs';
const root = new URL('../src/domain/bank/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root)));
const seen = new Set();
let count = 0;
for (const name of ['classic', 'daily']) {
  const bytes = readFileSync(new URL(`${name}.json`, root));
  if (createHash('sha256').update(bytes).digest('hex') !== manifest.sha256[name]) throw new Error(`${name}: checksum mismatch`);
  const rows = JSON.parse(bytes);
  if (rows.length !== manifest[`${name}Count`]) throw new Error('Count mismatch');
  for (const [givens, solution, rating] of rows) {
    if (!/^[0-9]{81}$/.test(givens) || !/^[1-9]{81}$/.test(solution) || !Number.isFinite(rating) || rating < 1 || rating >= 5) throw new Error('Invalid record');
    const answers = solutionsFor(givens);
    if (answers.length !== 1 || answers[0] !== solution) throw new Error('Invalid or nonunique solution');
    const key = duplicateKey(givens);
    if (seen.has(key)) throw new Error('Duplicate puzzle across Classic/Daily');
    seen.add(key); count++;
  }
}
// Exercise rejection paths independently of valid fixture data.
if (solutionsFor('0'.repeat(81)).length !== 2 || solutionsFor('11' + '0'.repeat(79)).length !== 0) throw new Error('Enumerator regression');
console.log(`Verified all ${count} puzzles: checksums, dimensions, uniqueness, stored solutions, and cross-collection duplicate screening.`);
