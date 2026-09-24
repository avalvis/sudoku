import { expect, it } from 'vitest';
import { bankPuzzles, bankDaily, bankDailyCount, bankDailyStart } from './bank';
import { getPuzzle, legacyPuzzles, nextPuzzle } from './puzzles';
import { dailyPuzzle } from './daily';
import { solve } from './rules';
import manifest from './bank/manifest.json';

it('pins the published bank files against accidental replacement', () => {
  expect(manifest.sha256).toEqual({ classic: '14eaf9beedce34d03de96b8c741ba1c8136793681339c0398fb58beaca740b1a', daily: '8db15360f581edd0aac08e5aa7b28842fb29396fe8605ce5b85397cbbf9e7d60' });
});

it('cycles only the rated bank and keeps old IDs available for saves', () => {
  expect(bankPuzzles).toHaveLength(9000);
  for (const [difficulty, first, last] of [['easy', 1, 3000], ['medium', 3001, 6000], ['hard', 6001, 9000]] as const) {
    expect(bankPuzzles.filter(p => p.difficulty === difficulty)).toHaveLength(3000);
    expect(nextPuzzle(difficulty).id).toBe(`bank-v1-${first}`);
    expect(nextPuzzle(difficulty, `bank-v1-${last}`).id).toBe(`bank-v1-${first}`);
    expect(nextPuzzle(difficulty, `${difficulty}-1`).id).toBe(`bank-v1-${first}`);
  }
  for (const old of legacyPuzzles) expect(getPuzzle(old.id)).toEqual(old);
});

it('cross-checks imported solutions with the independent gameplay validator', () => {
  for (const start of [0, 3000, 6000]) for (let i = 0; i < 10; i++) {
    const puzzle = bankPuzzles[start + i * 299];
    expect(solve(puzzle.givens)).toEqual([puzzle.solution]);
  }
}, 30_000);

it('has a fixed disjoint 4,002-day schedule with stable date IDs', () => {
  expect(bankDailyStart).toBe('2026-09-26'); expect(bankDailyCount).toBe(4002);
  expect(dailyPuzzle(bankDailyStart)).toMatchSnapshot();
  const seen = new Set(bankPuzzles.map(p => p.givens.flat().join(',')));
  for (let offset = 0; offset < bankDailyCount; offset++) {
    const date = new Date(Date.UTC(2026, 8, 26 + offset)).toISOString().slice(0, 10);
    const puzzle = dailyPuzzle(date);
    const key = puzzle.givens.flat().join(',');
    expect(seen.has(key)).toBe(false); seen.add(key);
    expect(puzzle.id).toBe(`daily-${date}`);
  }
  expect(bankDaily(bankDailyStart)).toEqual(dailyPuzzle(bankDailyStart));
});
