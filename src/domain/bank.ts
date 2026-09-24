import classic from './bank/classic.json' with { type: 'json' };
import daily from './bank/daily.json' with { type: 'json' };
import manifest from './bank/manifest.json' with { type: 'json' };
import type { Digit, Puzzle } from './types';

type Record = [string, string, number];
const decode = (text: string) => Array.from({ length: 9 }, (_, r) => [...text.slice(r * 9, r * 9 + 9)].map(v => v === '0' ? null : Number(v) as Digit));
const createPuzzle = (id: string, row: Record): Puzzle => {
  let givens: Puzzle['givens'] | undefined, solution: Puzzle['solution'] | undefined;
  return {
    id, difficulty: row[2] < 1.5 ? 'easy' : row[2] < 2.5 ? 'medium' : 'hard', rating: row[2],
    // Only visible/played boards allocate matrices; Archive can browse compact metadata.
    get givens() { return givens ??= decode(row[0]); },
    get solution() { return solution ??= decode(row[1]) as Digit[][]; },
  };
};
export const bankPuzzles = (classic as Record[]).map((row, i) => createPuzzle(`bank-v1-${i + 1}`, row));
export const bankDailyStart = manifest.dailyStart;
export const bankDailyCount = daily.length;
const dailyEpoch = Date.parse(`${bankDailyStart}T00:00:00Z`);
export function bankDaily(date: string): Puzzle {
  const offset = Math.floor((Date.parse(`${date}T00:00:00Z`) - dailyEpoch) / 86_400_000);
  if (!Number.isInteger(offset) || offset < 0) throw new Error('Invalid bank date');
  // The immutable v1 schedule repeats only after all 4,002 reserved boards.
  // A later release may append a new schedule at that boundary, never alter past dates.
  return createPuzzle(`daily-${date}`, daily[offset % daily.length] as Record);
}
