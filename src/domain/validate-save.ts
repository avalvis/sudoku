import { getPuzzle } from './puzzles';
import { DIGITS, type Cell, type SavedGame, type LegacySavedGame, type GameResult } from './types';
import { isComplete } from './rules';
import { recordResult } from './statistics';

const integer = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const cellValid = (v: unknown): v is Cell => {
  if (!v || typeof v !== 'object') return false;
  const c = v as Cell;
  return (c.value === null || DIGITS.includes(c.value)) && typeof c.given === 'boolean' &&
    Array.isArray(c.notes) && c.notes.length <= 9 && c.notes.every((n, i) => DIGITS.includes(n) && (i === 0 || n > c.notes[i - 1])) &&
    (c.value === null || c.notes.length === 0) && (!c.given || c.value !== null);
};
const equal = (a: Cell, b: Cell) => a.value === b.value && a.given === b.given && a.notes.join() === b.notes.join();

export function validateLegacySave(value: unknown): LegacySavedGame {
  if (!value || typeof value !== 'object') throw new Error('Invalid save');
  const s = value as LegacySavedGame;
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

const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const timestamp = (value: unknown): value is number | null => value === null || integer(value, 0, 8_640_000_000_000_000);

export function validateSave(value: unknown): SavedGame {
  validateLegacySave(value);
  const s = value as SavedGame;
  const session = s.session;
  if (!identifier(session.id) || typeof session.started !== 'boolean' || !timestamp(session.startedAt) || !timestamp(session.completedAt) ||
    (!session.started && (session.startedAt !== null || s.history.length > 0 || session.mistakes > 0 || session.hintsRemaining < 2 || session.practice || session.status === 'completed')) ||
    (session.status !== 'completed' && session.completedAt !== null) ||
    (session.startedAt !== null && session.completedAt !== null && session.completedAt < session.startedAt)) throw new Error('Invalid session tracking');
  if (!Array.isArray(s.results)) throw new Error('Invalid results');
  const ids = new Set<string>();
  for (const result of s.results as GameResult[]) {
    if (!result || !identifier(result.id) || ids.has(result.id) || !identifier(result.puzzleId) ||
      !['easy', 'medium', 'hard'].includes(result.difficulty) || !integer(result.elapsedSeconds) || !integer(result.mistakes) ||
      !integer(result.hintsUsed, 0, 2) || typeof result.practice !== 'boolean' || !['completed', 'abandoned'].includes(result.outcome) ||
      !timestamp(result.startedAt) || !timestamp(result.endedAt) ||
      (result.startedAt !== null && result.endedAt !== null && result.endedAt < result.startedAt)) throw new Error('Invalid game result');
    ids.add(result.id);
  }
  const current = s.results.find(result => result.id === session.id);
  if (session.status === 'completed') {
    if (!current || current.outcome !== 'completed' || current.puzzleId !== session.puzzleId || current.difficulty !== session.difficulty ||
      current.elapsedSeconds !== session.elapsedSeconds || current.mistakes !== session.mistakes || current.hintsUsed !== 2 - session.hintsRemaining ||
      current.practice !== session.practice || current.startedAt !== session.startedAt || current.endedAt !== session.completedAt) throw new Error('Missing or inconsistent completion');
  } else if (current) throw new Error('Active session already finalized');
  return s;
}

export function migrateSave(value: unknown, version: number): SavedGame {
  if (version !== 1) throw new Error('This save uses an unsupported format.');
  const legacy = validateLegacySave(value);
  const session = { ...legacy.session, id: crypto.randomUUID(), started: legacy.history.length > 0 || legacy.session.mistakes > 0 || legacy.session.hintsRemaining < 2 || legacy.session.practice || legacy.session.status === 'completed', startedAt: null, completedAt: null };
  // Version 1 did not retain dates. Preserve that uncertainty rather than inventing a date.
  const results = session.status === 'completed' ? recordResult([], session, 'completed', null) : [];
  return validateSave({ ...legacy, session, results });
}
