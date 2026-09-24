import { expect, it } from 'vitest';
import { gradePuzzle } from './grading';
import { puzzles } from './puzzles';

it('certifies the new pack by solving within its declared technique tier', () => {
  const expected = { easy: 'Singles', medium: 'Locked candidates', hard: 'Naked pairs' };
  const graded = puzzles.filter(p => p.id.startsWith('graded-v1-'));
  expect(graded).toHaveLength(9);
  for (const puzzle of graded) {
    const result = gradePuzzle(puzzle.givens);
    expect(result.solved).toBe(true);
    expect(result.technique).toBe(expected[puzzle.difficulty]);
    expect(result.grid).toEqual(puzzle.solution);
  }
});

it('only derives digits consistent with the independently validated solution', () => {
  for (const puzzle of puzzles) {
    const result = gradePuzzle(puzzle.givens);
    result.grid.forEach((row, r) => row.forEach((v, c) => { if (v !== null) expect(v).toBe(puzzle.solution[r][c]); }));
    if (result.solved) expect(result.grid).toEqual(puzzle.solution);
    else expect(result.technique).toBe('Beyond supported techniques');
  }
});
it('does not guess or manufacture a difficulty grade for an unsolved board', () => {
  const result = gradePuzzle(Array.from({ length: 9 }, () => Array(9).fill(null)));
  expect(result.remaining).toBe(81); expect(result.solved).toBe(false);
  expect(() => gradePuzzle([[1]])).toThrow('Invalid');
  const bad = puzzles[0].solution.map(row => [...row]); bad[0][0] = bad[0][1];
  expect(() => gradePuzzle(bad)).toThrow('Conflicting');
});
