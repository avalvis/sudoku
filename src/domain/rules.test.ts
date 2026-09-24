import { describe, it, expect } from 'vitest';
import { puzzles } from './puzzles';
import { createBoard, findConflicts, isComplete, noteConflicts, remainingCounts, solve } from './rules';
import { DIGITS, type Board, type Digit } from './types';

const blank = (): Board => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ value: null, given: false, notes: [] })));

describe('puzzle pack', () => {
  it('contains fifteen distinct, valid, uniquely solvable puzzles per difficulty', () => {
    expect(new Set(puzzles.map(p => JSON.stringify(p.givens))).size).toBe(45);
    expect(new Set(puzzles.map(p => p.id)).size).toBe(45);
    for (const d of ['easy', 'medium', 'hard']) expect(puzzles.filter(p => p.difficulty === d)).toHaveLength(15);
    for (const p of puzzles) {
      expect(p.solution.flat()).toHaveLength(81);
      const solutions = solve(p.givens);
      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual(p.solution);
      expect(isComplete(p.solution.map(row => row.map(value => ({ value, given: true, notes: [] }))))).toBe(true);
    }
  });
});

describe('Sudoku rules', () => {
  it.each([[0, 5], [6, 0], [1, 1]])('highlights both participants at 0,0 and %i,%i', (r, c) => {
    const board = blank(); board[0][0].value = 4; board[r][c].value = 4;
    expect([...findConflicts(board)].sort((a, b) => a - b)).toEqual([0, r * 9 + c]);
  });
  it('ignores empty cells and non-peer values', () => {
    const board = blank(); board[0][0].value = 2; board[4][4].value = 2;
    expect(findConflicts(board).size).toBe(0);
    expect(isComplete(board)).toBe(false);
  });
  it('identifies invalid candidate notes without treating them as board conflicts', () => {
    const board = blank(); board[0][0].value = 5; board[1][1].notes = [5];
    expect(noteConflicts(board, { row: 1, col: 1 }, 5)).toBe(true);
    expect(findConflicts(board).size).toBe(0);
  });
  it('counts givens and entries, ignores notes, and never returns a negative count', () => {
    const board = blank();
    for (let i = 0; i < 10; i++) board[Math.floor(i / 9)][i % 9].value = 3;
    board[8][8].notes = [4];
    expect(remainingCounts(board)[3]).toBe(0); expect(remainingCounts(board)[4]).toBe(9);
  });
  it('validates dimensions and duplicate givens before solving', () => {
    expect(solve([[1]])).toEqual([]);
    const grid = blank().map(row => row.map(c => c.value)); grid[0][0] = 1; grid[0][1] = 1;
    expect(solve(grid)).toEqual([]);
  });
  it('starts from pristine givens', () => {
    const board = createBoard(puzzles[0]);
    for (const cell of board.flat()) { expect(cell.notes).toEqual([]); expect(cell.given).toBe(cell.value !== null); }
    expect(DIGITS.every(d => remainingCounts(board)[d as Digit] >= 0)).toBe(true);
  });
});
