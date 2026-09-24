import data from './puzzle-pack.json' with { type: 'json' };
import expanded from './expanded-pack.json' with { type: 'json' };
import graded from './graded-pack.json' with { type: 'json' };
import type { Difficulty, Puzzle } from './types';
import { dailyPuzzle, isDaily } from './daily';
import { bankPuzzles } from './bank';

// Append only: existing edition numbers and puzzle IDs are permanent.
export const legacyPuzzles = [...data, ...expanded, ...graded] as Puzzle[];
export const puzzles = [...legacyPuzzles, ...bankPuzzles];
export const isTechniqueGraded = (id: string) => id.startsWith('graded-v1-') || id.startsWith('bank-v1-');
const byId = new Map(puzzles.map(p => [p.id, p]));
const packs = { easy: bankPuzzles.filter(p => p.difficulty === 'easy'), medium: bankPuzzles.filter(p => p.difficulty === 'medium'), hard: bankPuzzles.filter(p => p.difficulty === 'hard') };
export const getPuzzle = (id: string): Puzzle => {
  if (typeof id === 'string' && isDaily(id)) return dailyPuzzle(id.slice(6));
  const puzzle = byId.get(id);
  if (!puzzle) throw new Error('Unknown puzzle');
  return puzzle;
};
export function nextPuzzle(difficulty: Difficulty, currentId?: string): Puzzle {
  const pack = packs[difficulty];
  const current = pack.findIndex(p => p.id === currentId);
  return pack[(current + 1) % pack.length];
}
