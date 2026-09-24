import { getPuzzle } from './puzzles';
import { DIGITS, type Cell, type SavedGame } from './types';
import { isComplete } from './rules';

const integer = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const cellValid = (v: unknown): v is Cell => {
  if (!v || typeof v !== 'object') return false;
  const c = v as Cell;
  return (c.value === null || DIGITS.includes(c.value)) && typeof c.given === 'boolean' &&
    Array.isArray(c.notes) && c.notes.length <= 9 && c.notes.every((n, i) => DIGITS.includes(n) && (i === 0 || n > c.notes[i - 1])) &&
    (c.value === null || c.notes.length === 0) && (!c.given || c.value !== null);
};
const equal = (a: Cell, b: Cell) => a.value === b.value && a.given === b.given && a.notes.join() === b.notes.join();

export function validateSave(value: unknown): SavedGame {
  if (!value || typeof value !== 'object') throw new Error('Invalid save');
  const s = value as SavedGame;
  const p = getPuzzle(s.session?.puzzleId);
  if (s.session.difficulty !== p.difficulty || !integer(s.session.elapsedSeconds) || !integer(s.session.mistakes) ||
    !integer(s.session.hintsRemaining, 0, 2) || typeof s.session.practice !== 'boolean' ||
    !['playing', 'paused', 'mistake-limit', 'completed'].includes(s.session.status) ||
    !['light', 'dark'].includes(s.theme) || typeof s.soundEnabled !== 'boolean' || typeof s.notesMode !== 'boolean' ||
    !integer(s.selected?.row, 0, 8) || !integer(s.selected?.col, 0, 8)) throw new Error('Invalid session');
  if (!Array.isArray(s.board) || s.board.length !== 9 || s.board.some((row, r) => !Array.isArray(row) || row.length !== 9 || row.some((c, col) =>
    !cellValid(c) || c.given !== (p.givens[r][col] !== null) || (c.given && c.value !== p.givens[r][col])))) throw new Error('Invalid board');
  if (!Array.isArray(s.history)) throw new Error('Invalid history');
  const replay = s.board.map(row => row.map(c => ({ ...c, notes: [...c.notes] })));
  for (const move of [...s.history].reverse()) {
    if (!move || !Array.isArray(move.patches) || !move.patches.length || move.patches.length > 81) throw new Error('Invalid move');
    const seen = new Set<number>();
    for (const patch of move.patches) {
      const pos = patch?.position;
      if (!pos || !integer(pos.row, 0, 8) || !integer(pos.col, 0, 8) || !cellValid(patch.before) || !cellValid(patch.after) ||
        patch.before.given || patch.after.given || p.givens[pos.row][pos.col] !== null || seen.has(pos.row * 9 + pos.col) ||
        !equal(replay[pos.row][pos.col], patch.after)) throw new Error('Invalid move history');
      seen.add(pos.row * 9 + pos.col);
      replay[pos.row][pos.col] = patch.before;
    }
  }
  if (replay.some((row, r) => row.some((cell, c) => cell.value !== p.givens[r][c] || cell.notes.length))) throw new Error('Incomplete history');
  if ((s.session.status === 'completed') !== isComplete(s.board)) throw new Error('Invalid completion');
  if (s.session.status === 'mistake-limit' && (s.session.practice || s.session.mistakes < 3)) throw new Error('Invalid mistake limit');
  if (!s.session.practice && s.session.mistakes >= 3 && !['mistake-limit', 'completed'].includes(s.session.status)) throw new Error('Invalid mistakes');
  return s;
}
