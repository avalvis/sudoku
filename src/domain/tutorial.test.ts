import { expect, it } from 'vitest';
import { tutorialSteps, tutorialConflict } from './tutorial';
import { createBoard, findConflicts } from './rules';
import type { Digit } from './types';

it('teaches valid row, column, box and combined deductions', () => {
  for (const step of tutorialSteps) {
    const givens = Array.from({ length: 9 }, (_, r) => step.givens.slice(r * 9, r * 9 + 9));
    const board = createBoard({ id: 'tutorial', difficulty: 'easy', givens, solution: [] });
    expect(findConflicts(board).size).toBe(0);
    expect(step.givens[step.target]).toBeNull();
    const allowed = [];
    for (let digit = 1; digit <= 9; digit++) {
      board[Math.floor(step.target / 9)][step.target % 9].value = digit as Digit;
      if (!findConflicts(board).size) allowed.push(digit);
    }
    expect(allowed).toEqual(step.notes ? [2, 9] : [step.answer]);
  }
});
it('explains which constraint rules out a wrong answer', () => {
  const step = tutorialSteps[3];
  expect(tutorialConflict(step.givens, step.target, 3).message).toContain('column');
  expect(tutorialConflict(step.givens, step.target, 4).message).toContain('box');
  expect(tutorialConflict(step.givens, step.target, 5).message).toContain('row');
});
