import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { solutionsFor, duplicateKey } from './lib/bank-validation.mjs';

const revision = 'd8c8ebaee0c08c412cfba96af1923dfa61c83317';
const sourceHashes = {
  easy: '789aab6f52cc4588e0c3aa4269ad3282cfda7e1cc79ea693d16507decde3fc50',
  medium: 'c2a5f8fac99dcf215b25d46ece47f346375e51730b182de70a6f8f2107b2b38d',
  hard: 'abcff1512411e601abd5e861c60add5be5d877739b6faa249ee86960f5ad85e9',
};
const input = new URL('../.cache/puzzle-bank/', import.meta.url);
const output = new URL('../src/domain/bank/', import.meta.url);
const sha256 = value => createHash('sha256').update(value).digest('hex');
if (readFileSync(new URL('source-commit.txt', input), 'utf8').trim() !== revision) throw new Error('Wrong source revision');
const seen = new Set(), classic = [], dailyTiers = [], sources = {}, distribution = {};
for (const [tier, name] of ['easy', 'medium', 'hard'].entries()) {
  const bytes = readFileSync(new URL(`${name}.txt`, input));
  if (sha256(bytes) !== sourceHashes[name]) throw new Error(`Source checksum mismatch: ${name}`);
  sources[name] = { file: `${name}.txt`, sha256: sha256(bytes) };
  const buckets = new Map();
  for (const line of bytes.toString('utf8').trim().split(/\r?\n/)) {
    const [hash, givens, rawRating] = line.trim().split(/\s+/), rating = Number(rawRating);
    if (!/^[a-f0-9]{12}$/.test(hash) || !/^[0-9]{81}$/.test(givens) || !Number.isFinite(rating) || rating < [1, 1.5, 2.5][tier] || rating >= [1.5, 2.5, 5][tier]) throw new Error('Malformed source row');
    if (!buckets.has(rating)) buckets.set(rating, []);
    buckets.get(rating).push(givens);
  }
  const ratings = [...buckets.keys()].sort((a, b) => a - b);
  const offsets = new Map(ratings.map(r => [r, 0]));
  const accepted = [];
  // Round-robin numerical ratings for variety, rather than taking only one score.
  while (accepted.length < 4334) {
    let progress = false;
    for (const rating of ratings) {
      const bucket = buckets.get(rating), offset = offsets.get(rating);
      if (offset >= bucket.length) continue;
      progress = true; offsets.set(rating, offset + 1);
      const givens = bucket[offset], key = duplicateKey(givens);
      if (seen.has(key)) continue;
      const solutions = solutionsFor(givens);
      if (solutions.length !== 1) throw new Error('Source puzzle is not uniquely solvable');
      seen.add(key); accepted.push([givens, solutions[0], rating]);
      distribution[rating] = (distribution[rating] ?? 0) + 1;
      if (accepted.length === 4334) break;
    }
    if (!progress) throw new Error(`Insufficient distinct ${name} puzzles`);
  }
  // Keep the initial default cell editable without modifying a rated puzzle.
  if (tier === 1 && accepted[0][0][0] !== '0') {
    const firstEmpty = accepted.findIndex(row => row[0][0] === '0');
    [accepted[0], accepted[firstEmpty]] = [accepted[firstEmpty], accepted[0]];
  }
  classic.push(...accepted.slice(0, 3000)); dailyTiers.push(accepted.slice(3000));
  console.log(`${name}: verified 3,000 Classic + 1,334 Daily puzzles`);
}
const daily = Array.from({ length: 1334 }, (_, i) => dailyTiers.map(tier => tier[i])).flat();
const classicText = JSON.stringify(classic) + '\n', dailyText = JSON.stringify(daily) + '\n';
const manifest = { version: 1, source: 'https://github.com/grantm/sudoku-exchange-puzzle-bank', revision, license: 'Unlicense', ratingAuthority: 'Sukaku Explainer (upstream supplied ratings)', classicCount: classic.length, dailyCount: daily.length, dailyStart: '2026-09-26', sources, distribution, sha256: { classic: sha256(classicText), daily: sha256(dailyText) } };
// Write only after the complete candidate set passes validation.
mkdirSync(output, { recursive: true });
writeFileSync(new URL('classic.json', output), classicText);
writeFileSync(new URL('daily.json', output), dailyText);
writeFileSync(new URL('manifest.json', output), JSON.stringify(manifest, null, 2) + '\n');
mkdirSync(new URL('../public/licenses/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/licenses/sudoku-exchange.txt', import.meta.url), readFileSync(new URL('LICENSE.txt', input)));
console.log('Published 13,002 verified, disjoint puzzle records.');
