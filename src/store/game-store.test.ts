import { describe, it, expect, vi } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { createGameStore } from './game-store';
import { getPuzzle } from '../domain/puzzles';
import { validateSave } from '../domain/validate-save';
import { DIGITS, type Digit, type SavedGame } from '../domain/types';
import { findConflicts, isPeer, remainingCounts } from '../domain/rules';

vi.mock('../services/audio', () => ({ audio: { setMuted: vi.fn(), unlock: vi.fn(async () => {}), play: vi.fn() } }));
function memoryStorage() {
  const data = new Map<string, string>();
  const storage: StateStorage = { getItem: n => data.get(n) ?? null, setItem: (n, v) => { data.set(n, v); }, removeItem: n => { data.delete(n); } };
  return { storage, data };
}
function setup() {
  const { storage, data } = memoryStorage();
  let now = 0;
  const store = createGameStore(storage, () => now);
  store.setState({ hydrated: true }); store.getState().checkpoint();
  return { store, data, storage, advance: (ms: number) => { now += ms; } };
}
function emptyPositions(s: ReturnType<typeof createGameStore>) {
  return s.getState().board.flatMap((row, r) => row.flatMap((cell, c) => !cell.given ? [{ row: r, col: c }] : []));
}
function makeMistake(store: ReturnType<typeof createGameStore>) {
  const s = store.getState();
  for (const pos of emptyPositions(store)) {
    for (const d of DIGITS) {
      if (s.board[pos.row][pos.col].value === d || !remainingCounts(s.board)[d]) continue;
      if (s.board.some((row, r) => row.some((cell, c) => cell.value === d && (r !== pos.row || c !== pos.col) && isPeer(pos, { row: r, col: c })))) {
        s.select(pos); s.input(d); return;
      }
    }
  }
  throw new Error('No conflicting move available');
}

describe('game store', () => {
  it('protects givens and ignores no-op entries', () => {
    const { store } = setup(); const s = store.getState();
    const id = s.board.flat().findIndex(c => c.given); s.select({ row: Math.floor(id / 9), col: id % 9 });
    s.input(1); s.erase(); s.toggleNotes(); s.input(2);
    expect(store.getState().history).toHaveLength(0);
    s.toggleNotes(); const pos = emptyPositions(store)[0]; s.select(pos);
    const value = getPuzzle(s.session.puzzleId).solution[pos.row][pos.col];
    s.input(value); s.input(value); expect(store.getState().history).toHaveLength(1);
  });
  it('supports sorted notes, erase, and exact multi-step Undo', () => {
    const { store } = setup(); const initial = structuredClone(store.getState().board); const s = store.getState();
    s.toggleNotes(); s.input(7); s.input(2); s.input(7);
    const { row, col } = store.getState().selected;
    expect(store.getState().board[row][col].notes).toEqual([2]);
    s.erase(); s.undo(); expect(store.getState().board[row][col].notes).toEqual([2]);
    s.undo(); s.undo(); s.undo(); expect(store.getState().board).toEqual(initial);
  });
  it('does not convert filled cells to notes', () => {
    const { store } = setup(); const s = store.getState(); s.hint(); s.toggleNotes(); s.input(2);
    expect(store.getState().history).toHaveLength(1);
  });
  it('pauses at three mistakes and resumes as unlimited practice', () => {
    const { store } = setup();
    makeMistake(store); makeMistake(store); makeMistake(store);
    expect(store.getState().session).toMatchObject({ mistakes: 3, status: 'mistake-limit' });
    const board = store.getState().board; store.getState().input(1); expect(store.getState().board).toBe(board);
    store.getState().continuePractice(); makeMistake(store);
    expect(store.getState().session).toMatchObject({ mistakes: 4, practice: true, status: 'playing' });
    store.getState().undo(); expect(store.getState().session.mistakes).toBe(4);
  });
  it('uses real hints, falls back from givens, and never refunds the budget', () => {
    const { store } = setup(); const s = store.getState();
    const id = s.board.flat().findIndex(c => c.given); s.select({ row: Math.floor(id / 9), col: id % 9 }); s.hint();
    const state = store.getState(); const p = getPuzzle(state.session.puzzleId);
    expect(state.board[state.selected.row][state.selected.col].value).toBe(p.solution[state.selected.row][state.selected.col]);
    s.undo(); expect(store.getState().session.hintsRemaining).toBe(1);
    s.hint(); s.hint(); expect(store.getState().session.hintsRemaining).toBe(0);
    expect(store.getState().history).toHaveLength(1);
  });
  it('suspends the monotonic clock while paused and retains fractional checkpoint time', () => {
    const { store, advance } = setup(); advance(5500); store.getState().checkpoint();
    expect(store.getState().session.elapsedSeconds).toBe(5);
    advance(500); expect(store.getState().displayedSeconds()).toBe(6);
    store.getState().pause(); advance(90_000); expect(store.getState().displayedSeconds()).toBe(6);
    store.getState().resume(); advance(2000); store.getState().checkpoint(); expect(store.getState().session.elapsedSeconds).toBe(8);
  });
  it('disables exhausted digits and re-enables after undo', () => {
    const { store } = setup(); const p = getPuzzle(store.getState().session.puzzleId);
    const positions = emptyPositions(store).filter(at => p.solution[at.row][at.col] === 1);
    for (const at of positions) { store.getState().select(at); store.getState().input(1); }
    expect(remainingCounts(store.getState().board)[1]).toBe(0);
    store.getState().select(emptyPositions(store).find(at => store.getState().board[at.row][at.col].value === null)!);
    const history = store.getState().history; store.getState().input(1); expect(store.getState().history).toBe(history);
    store.getState().undo(); expect(remainingCounts(store.getState().board)[1]).toBe(1);
  });
  it('finishes only a valid full board and stops edits', () => {
    const { store } = setup(); const p = getPuzzle(store.getState().session.puzzleId);
    for (const at of emptyPositions(store)) { store.getState().select(at); store.getState().input(p.solution[at.row][at.col]); }
    expect(store.getState().session.status).toBe('completed'); expect(findConflicts(store.getState().board).size).toBe(0);
    const history = store.getState().history; store.getState().erase(); expect(store.getState().history).toBe(history);
  });
  it('restarts the same puzzle and cycles the requested difficulty pack', () => {
    const { store } = setup(); store.getState().hint(); store.getState().newGame('medium', true);
    expect(store.getState().session).toMatchObject({ puzzleId: 'medium-1', hintsRemaining: 2, mistakes: 0 });
    expect(store.getState().history).toHaveLength(0);
    for (const id of ['medium-2', 'medium-3', 'medium-1']) { store.getState().newGame('medium'); expect(store.getState().session.puzzleId).toBe(id); }
    store.getState().newGame('hard'); expect(store.getState().session.puzzleId).toBe('hard-1');
  });
  it('persists and restores complete undo history with the timer paused', async () => {
    const { store, storage, data } = setup(); store.getState().toggleNotes(); store.getState().input(2); store.getState().input(4);
    const saved = JSON.parse(data.get('editorial-sudoku-session')!).state as SavedGame;
    expect(validateSave(saved).history).toHaveLength(2);
    const restored = createGameStore(storage); await restored.persist.rehydrate(); restored.setState({ hydrated: true });
    expect(restored.getState().session.status).toBe('paused'); expect(restored.getState().board).toEqual(store.getState().board);
    restored.getState().resume(); restored.getState().undo(); expect(restored.getState().history).toHaveLength(1);
  });
  it('rejects corrupt cells, changed givens, and malicious history patches', () => {
    const { store, data } = setup(); store.getState().input(2 as Digit);
    const saved = JSON.parse(data.get('editorial-sudoku-session')!).state as SavedGame;
    const invalid = structuredClone(saved); invalid.board[0][0].value = 10 as Digit;
    expect(() => validateSave(invalid)).toThrow();
    const badHistory = structuredClone(saved); badHistory.history[0].patches[0].position.row = 20;
    expect(() => validateSave(badHistory)).toThrow();
    const changed = structuredClone(saved); const id = changed.board.flat().findIndex(c => c.given); changed.board[Math.floor(id / 9)][id % 9].value = null;
    expect(() => validateSave(changed)).toThrow();
  });
});
