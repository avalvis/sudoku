import { expect, it } from 'vitest';
import { gradePuzzle } from './grading';
import { puzzles } from './puzzles';

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
