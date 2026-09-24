import type { Digit } from './types.ts';

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[];
const units = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (_, i) => (Math.floor(b / 3) * 3 + Math.floor(i / 3)) * 9 + b % 3 * 3 + i % 3)),
];
const peers = Array.from({ length: 81 }, (_, i) => new Set(units.filter(u => u.includes(i)).flat().filter(j => j !== i)));

/** Conservative logical audit. Never guesses and never calls a stalled puzzle "hard". */
export function gradePuzzle(input: (Digit | null)[][]) {
  if (input.length !== 9 || input.some(row => row.length !== 9 || row.some(v => v !== null && !digits.includes(v)))) throw new Error('Invalid grid');
  const cells = input.flat();
  for (const unit of units) {
    const values = unit.map(i => cells[i]).filter(v => v !== null);
    if (new Set(values).size !== values.length) throw new Error('Conflicting givens');
  }
  const candidates = cells.map((v, i) => new Set(v === null ? digits.filter(d => ![...peers[i]].some(j => cells[j] === d)) : []));
  const steps = { singles: 0, lockedCandidates: 0, nakedPairs: 0 };
  const place = (i: number, d: Digit) => { cells[i] = d; candidates[i].clear(); for (const j of peers[i]) candidates[j].delete(d); steps.singles++; };
  while (cells.includes(null)) {
    if (cells.some((v, i) => v === null && candidates[i].size === 0)) throw new Error('Contradiction during grading');
    const single = cells.findIndex((v, i) => v === null && candidates[i].size === 1);
    if (single >= 0) { place(single, [...candidates[single]][0]); continue; }
    let changed = false;
    for (const unit of units) {
      for (const d of digits) {
        const spots = unit.filter(i => cells[i] === null && candidates[i].has(d));
        if (spots.length === 1) { place(spots[0], d); changed = true; break; }
      }
      if (changed) break;
    }
    if (changed) continue;
    for (const unit of units) {
      for (const d of digits) {
        const spots = unit.filter(i => cells[i] === null && candidates[i].has(d));
        if (spots.length < 2) continue;
        for (const other of units) {
          if (other === unit || !spots.every(i => other.includes(i))) continue;
          const eliminate = other.filter(i => !unit.includes(i) && candidates[i].has(d));
          if (eliminate.length) { eliminate.forEach(i => candidates[i].delete(d)); steps.lockedCandidates++; changed = true; break; }
        }
        if (changed) break;
      }
      if (changed) break;
    }
    if (changed) continue;
    for (const unit of units) {
      const pairs = unit.filter(i => candidates[i].size === 2);
      for (const first of pairs) {
        const values = [...candidates[first]];
        const matches = pairs.filter(i => values.every(d => candidates[i].has(d)));
        if (matches.length !== 2) continue;
        for (const i of unit.filter(i => !matches.includes(i))) for (const d of values) if (candidates[i].delete(d)) changed = true;
        if (changed) { steps.nakedPairs++; break; }
      }
      if (changed) break;
    }
    if (!changed) break;
  }
  const remaining = cells.filter(v => v === null).length;
  const technique = remaining ? 'Beyond supported techniques' : steps.nakedPairs ? 'Naked pairs' : steps.lockedCandidates ? 'Locked candidates' : 'Singles';
  return { solved: remaining === 0, technique, remaining, steps, grid: Array.from({ length: 9 }, (_, r) => cells.slice(r * 9, r * 9 + 9)) };
}
