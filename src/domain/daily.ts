import data from './puzzle-pack.json' with { type: 'json' };
import graded from './graded-pack.json' with { type: 'json' };
import { gradePuzzle } from './grading';
import type { Digit, Puzzle } from './types';
import { bankDaily, bankDailyStart } from './bank';

const gradedCache = new Map<string, Puzzle>();

export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function validDate(date: string): boolean {
  const parsed = new Date(`${date}T12:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= '2026-01-01' && date <= '9999-12-31' && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
export const isDaily = (id: string) => id.startsWith('daily-');
export const gameSlot = (id: string) => isDaily(id) ? id : 'classic';

/** Version-stable transformations preserve the base fixture's unique solution. */
export function dailyPuzzle(date: string): Puzzle {
  if (!validDate(date)) throw new Error('Invalid daily date');
  if (date >= bankDailyStart) return bankDaily(date);
  if (date >= '2026-09-25') {
    let puzzle = gradedCache.get(date);
    if (!puzzle) {
      puzzle = gradedDaily(date);
      if (gradedCache.size >= 32) gradedCache.delete(gradedCache.keys().next().value!);
      gradedCache.set(date, puzzle);
    }
    return puzzle;
  }
  let seed = Number(date.replaceAll('-', ''));
  const random = () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let value = Math.imul(seed ^ seed >>> 15, seed | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const shuffle = <T,>(values: T[]): T[] => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  };
  const base = data[Math.floor(random() * data.length)] as Puzzle;
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]);
  const axis = () => shuffle([0, 1, 2]).flatMap(band => shuffle([0, 1, 2]).map(i => band * 3 + i));
  const rows = axis(), cols = axis(), transpose = random() > 0.5;
  const map = (matrix: (Digit | null)[][]) => rows.map(r => cols.map(c => {
    const value = transpose ? matrix[c][r] : matrix[r][c];
    return value === null ? null : digits[value - 1];
  }));
  return { id: `daily-${date}`, difficulty: base.difficulty, givens: map(base.givens), solution: map(base.solution) as Digit[][] };
}

/** Version 2 begins after the last published v1 date. Never change this seed or pack. */
function gradedDaily(date: string): Puzzle {
  let seed = Number(date.replaceAll('-', ''));
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const shuffle = <T,>(input: T[]) => {
    const copy = [...input];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  };
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const base = graded[day % graded.length] as Puzzle;
  const expected = { easy: 'Singles', medium: 'Locked candidates', hard: 'Naked pairs' }[base.difficulty];
  for (let attempt = 0; attempt < 32; attempt++) {
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]);
    const axis = () => shuffle([0, 1, 2]).flatMap(b => shuffle([0, 1, 2]).map(i => b * 3 + i));
    const rows = axis(), cols = axis(), transpose = random() > 0.5;
    const map = (matrix: (Digit | null)[][]) => rows.map(r => cols.map(c => {
      const value = transpose ? matrix[c][r] : matrix[r][c];
      return value === null ? null : digits[value - 1];
    }));
    const givens = map(base.givens);
    const grade = gradePuzzle(givens);
    if (grade.solved && grade.technique === expected) return { id: `daily-${date}`, difficulty: base.difficulty, givens, solution: map(base.solution) as Digit[][] };
  }
  // Bounded work on the UI thread. A verified fixture is safer than an ungraded board.
  return { ...base, id: `daily-${date}`, givens: base.givens.map(row => [...row]), solution: base.solution.map(row => [...row]) };
}
