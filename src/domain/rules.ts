import { DIGITS, type Board, type CellPosition, type Digit, type Puzzle } from './types';

export const cellId = (row: number, col: number) => row * 9 + col;
export const isPeer = (a: CellPosition, b: CellPosition) => a.row === b.row || a.col === b.col ||
  (Math.floor(a.row / 3) === Math.floor(b.row / 3) && Math.floor(a.col / 3) === Math.floor(b.col / 3));

export function createBoard(puzzle: Puzzle): Board {
  return puzzle.givens.map(row => row.map(value => ({ value, given: value !== null, notes: [] })));
}

export const units: number[][] = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => cellId(r, c))),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => cellId(r, c))),
  ...Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (_, n) => cellId(Math.floor(b / 3) * 3 + Math.floor(n / 3), b % 3 * 3 + n % 3))),
];

export function findConflicts(board: Board): Set<number> {
  const result = new Set<number>();
  const flat = board.flat();
  for (const unit of units) {
    const seen = new Map<Digit, number>();
    for (const id of unit) {
      const value = flat[id].value;
      if (value === null) continue;
      const previous = seen.get(value);
      if (previous !== undefined) { result.add(previous); result.add(id); }
      else seen.set(value, id);
    }
  }
  return result;
}

export function remainingCounts(board: Board): Record<Digit, number> {
  const counts = Object.fromEntries(DIGITS.map(d => [d, 9])) as Record<Digit, number>;
  for (const cell of board.flat()) if (cell.value !== null) counts[cell.value] = Math.max(0, counts[cell.value] - 1);
  return counts;
}

export const isComplete = (board: Board) => board.every(row => row.every(cell => cell.value !== null)) && findConflicts(board).size === 0;
export const noteConflicts = (board: Board, at: CellPosition, digit: Digit) => board.some((row, r) => row.some((cell, c) =>
  (r !== at.row || c !== at.col) && isPeer(at, { row: r, col: c }) && cell.value === digit));

/** Bounded solution enumeration for fixture validation, never used on the UI input path. */
export function solve(values: (Digit | null)[][], limit = 2): Digit[][][] {
  const grid = values.map(row => [...row]);
  const solutions: Digit[][][] = [];
  if (grid.length !== 9 || grid.some(r => r.length !== 9 || r.some(v => v !== null && !DIGITS.includes(v)))) return [];
  if (findConflicts(grid.map(row => row.map(value => ({ value, given: value !== null, notes: [] })))).size) return [];
  function search() {
    if (solutions.length >= limit) return;
    let spot: CellPosition | null = null;
    let candidates: Digit[] = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== null) continue;
      const possible = DIGITS.filter(d => !grid.some((row, rr) => row.some((v, cc) => v === d && isPeer({ row: r, col: c }, { row: rr, col: cc }))));
      if (!possible.length) return;
      if (!spot || possible.length < candidates.length) { spot = { row: r, col: c }; candidates = possible; }
    }
    if (!spot) { solutions.push(grid.map(row => [...row]) as Digit[][]); return; }
    for (const digit of candidates) {
      grid[spot.row][spot.col] = digit;
      search();
      grid[spot.row][spot.col] = null;
      if (solutions.length >= limit) break;
    }
  }
  search();
  return solutions;
}
