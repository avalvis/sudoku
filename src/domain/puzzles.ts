import data from './puzzle-pack.json';
import expanded from './expanded-pack.json';
import graded from './graded-pack.json';
import type { Difficulty, Puzzle } from './types';
import { dailyPuzzle, isDaily } from './daily';

// Append only: existing edition numbers and puzzle IDs are permanent.
export const puzzles = [...data, ...expanded, ...graded] as Puzzle[];
export const isTechniqueGraded = (id: string) => id.startsWith('graded-v1-');
export const getPuzzle = (id: string): Puzzle => {
  if (typeof id === 'string' && isDaily(id)) return dailyPuzzle(id.slice(6));
  const puzzle = puzzles.find(p => p.id === id);
  if (!puzzle) throw new Error('Unknown puzzle');
  return puzzle;
};
export function nextPuzzle(difficulty: Difficulty, currentId?: string): Puzzle {
  const pack = puzzles.filter(p => p.difficulty === difficulty);
  const current = pack.findIndex(p => p.id === currentId);
  return pack[(current + 1) % pack.length];
}
