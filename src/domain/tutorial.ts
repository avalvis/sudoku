import type { Digit } from './types';

// Small practice examples, not full puzzles. All clues come from one valid grid.
const valueAt = (i: number) => ((Math.floor(i / 9) * 3 + Math.floor(i / 27) + i % 9) % 9 + 1) as Digit;
const row = (r: number) => Array.from({ length: 9 }, (_, c) => r * 9 + c);
const column = (c: number) => Array.from({ length: 9 }, (_, r) => r * 9 + c);
const box = (r: number, c: number) => Array.from({ length: 9 }, (_, i) => (r + Math.floor(i / 3)) * 9 + c + i % 3);
const clues = (indices: number[]) => Array.from({ length: 81 }, (_, i) => indices.includes(i) ? valueAt(i) : null);

export const tutorialSteps = [
  { title: 'One of each in every row', instruction: 'Fill the grid with 1–9. Each row must contain every number once. Which number is missing from this row?', target: 8, givens: clues(row(0).filter(i => i !== 8)), guide: row(0), answer: 9, success: '9 completes the row. No number repeats.', notes: false },
  { title: 'Columns follow the same rule', instruction: 'Read this column from top to bottom. It also needs each number from 1–9 exactly once. Fill the missing number.', target: 36, givens: clues(column(0).filter(i => i !== 36)), guide: column(0), answer: 5, success: '5 completes the column.', notes: false },
  { title: 'And every 3×3 box', instruction: 'The thick lines divide the grid into nine boxes. Each box needs 1–9 once, too. Find the missing number in this box.', target: 19, givens: clues(box(0, 0).filter(i => i !== 19)), guide: box(0, 0), answer: 8, success: '8 completes the box. These three rules apply to every cell.', notes: false },
  { title: 'Use the clues together', instruction: 'This row is missing 3, 4 and 9. Check the column and box to find the only number that fits the outlined cell.', target: 40, givens: clues([...row(4).filter(i => ![40, 43, 44].includes(i)), 49, 50]), guide: [...new Set([...row(4), ...column(4), ...box(3, 3)])], answer: 9, success: 'The column already has 3 and the box already has 4. Only 9 fits. No guessing needed.', notes: false },
  { title: 'Keep possibilities as notes', instruction: 'Both 2 and 9 fit here for now. Turn Notes on, then enter 2 and 9 to remember the possibilities. Notes are not final answers.', target: 1, givens: clues(row(0).filter(i => ![1, 8].includes(i))), guide: row(0), answer: 2, success: 'Good. Keep both possibilities until another clue rules one out. Turn Notes off when you know the answer.', notes: true },
] as const;

export function tutorialConflict(givens: readonly (Digit | null)[], target: number, digit: Digit): { message: string; cells: number[] } {
  const r = Math.floor(target / 9), c = target % 9;
  for (const [name, indices] of [['row', row(r)], ['column', column(c)], ['box', box(Math.floor(r / 3) * 3, Math.floor(c / 3) * 3)]] as const) {
    const cells = indices.filter(i => givens[i] === digit);
    if (cells.length) return { message: `${digit} is already in this ${name}. Try another number.`, cells };
  }
  return { message: 'Check the highlighted clues and try again.', cells: [] };
}
