import { expect, it } from 'vitest';
import { dailyPuzzle, localDate, validDate } from './daily';
import { solve } from './rules';
import { gradePuzzle } from './grading';

it('grades new editions consistently without changing the published legacy mapping', () => {
  expect(dailyPuzzle('2026-09-25')).toMatchSnapshot();
  for (const date of ['2026-09-25']) {
    const puzzle = dailyPuzzle(date);
    expect(dailyPuzzle(date)).toEqual(puzzle);
    expect(solve(puzzle.givens)).toEqual([puzzle.solution]);
    const result = gradePuzzle(puzzle.givens);
    expect(result.solved).toBe(true);
    expect(result.technique).toBe({ easy: 'Singles', medium: 'Locked candidates', hard: 'Naked pairs' }[puzzle.difficulty]);
  }
}, 30_000);

it('keeps the published date-to-board mapping stable for persisted editions', () => {
  expect(dailyPuzzle('2026-09-24')).toMatchSnapshot();
});

it('validates calendar dates including leap days without UTC day conversion', () => {
  expect(validDate('2028-02-29')).toBe(true);
  for (const date of ['2026-02-29', '2026-13-01', '2026-04-31', '2025-12-31', 'garbage']) expect(validDate(date)).toBe(false);
  expect(localDate(new Date(2026, 8, 24, 0, 1))).toBe('2026-09-24');
});
it('produces repeatable, varied, uniquely solvable daily editions', () => {
  const layouts = new Set<string>(), difficulties = new Set<string>();
  for (let day = 1; day <= 31; day++) {
    const date = `2026-01-${String(day).padStart(2, '0')}`;
    const puzzle = dailyPuzzle(date);
    expect(puzzle).toEqual(dailyPuzzle(date));
    expect(solve(puzzle.givens)).toEqual([puzzle.solution]);
    layouts.add(JSON.stringify(puzzle.givens)); difficulties.add(puzzle.difficulty);
  }
  expect(layouts.size).toBe(31); expect(difficulties.size).toBe(3);
});
