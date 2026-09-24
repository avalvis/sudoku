import { describe, expect, it, vi } from 'vitest';
import { createGameStore } from './game-store';
import { getPuzzle } from '../domain/puzzles';
import { migrateSave, validateSave } from '../domain/validate-save';
import { summarizeResults } from '../domain/statistics';
import type { StateStorage } from 'zustand/middleware';
import type { SavedGame } from '../domain/types';

vi.mock('../services/audio', () => ({ audio: { setMuted: vi.fn(), unlock: vi.fn(async () => {}), play: vi.fn() } }));
const KEY = 'editorial-sudoku-session';
function setup() {
  const data = new Map<string, string>();
  const storage: StateStorage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: k => { data.delete(k); } };
  let time = 0;
  const store = createGameStore(storage, () => time, () => 1_700_000_000_000 + time);
  store.setState({ hydrated: true }); store.getState().checkpoint();
  return { store, storage, data, advance: (ms: number) => { time += ms; }, snapshot: () => JSON.parse(data.get(KEY)!).state as SavedGame };
}
function finish(store: ReturnType<typeof createGameStore>) {
  const p = getPuzzle(store.getState().session.puzzleId);
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
    if (p.givens[row][col] !== null) continue;
    store.getState().select({ row, col }); store.getState().input(p.solution[row][col]);
  }
}
function legacyEnvelope(s: SavedGame) {
  return { version: 1, state: {
    board: s.board, selected: s.selected, notesMode: s.notesMode, history: s.history, theme: s.theme, soundEnabled: s.soundEnabled,
    session: { puzzleId: s.session.puzzleId, difficulty: s.session.difficulty, elapsedSeconds: s.session.elapsedSeconds, mistakes: s.session.mistakes, hintsRemaining: s.session.hintsRemaining, practice: s.session.practice, status: s.session.status },
  } };
}

describe('session accounting', () => {
  it('ignores opening, selecting, toggling notes, and replacing untouched puzzles', () => {
    const { store } = setup(); const s = store.getState(); const id = s.session.id;
    s.toggleNotes(); s.pause(); s.resume(); s.select({ row: 0, col: 1 }); s.newGame('easy');
    expect(store.getState().session.id).not.toBe(id);
    expect(store.getState().results).toEqual([]); expect(store.getState().session.started).toBe(false);
  });
  it('starts on the first effective move, and undoing every move does not erase the attempt', () => {
    const { store, advance, snapshot } = setup(); advance(3500);
    store.getState().toggleNotes(); store.getState().input(2); store.getState().undo();
    expect(store.getState().session).toMatchObject({ started: true, startedAt: 1_700_000_003_500 });
    advance(2000); store.getState().newGame('medium', true);
    expect(store.getState().results[0]).toMatchObject({ outcome: 'abandoned', elapsedSeconds: 5, startedAt: 1_700_000_003_500, endedAt: 1_700_000_005_500 });
    expect(() => validateSave(snapshot())).not.toThrow();
  });
  it('records completion atomically, preserves it on review/reload, and gives replays new IDs', async () => {
    const { store, storage, snapshot, advance } = setup(); const firstId = store.getState().session.id;
    advance(120_000); finish(store);
    expect(snapshot().results).toHaveLength(1);
    expect(snapshot().results[0]).toMatchObject({ id: firstId, outcome: 'completed', elapsedSeconds: 120 });
    expect(() => validateSave(snapshot())).not.toThrow();
    const restored = createGameStore(storage); await restored.persist.rehydrate(); restored.setState({ hydrated: true });
    restored.getState().select({ row: 0, col: 0 }); restored.getState().pause();
    expect(restored.getState().results).toHaveLength(1);
    restored.getState().newGame('medium', true); const secondId = restored.getState().session.id; finish(restored);
    expect(secondId).not.toBe(firstId); expect(restored.getState().results.map(r => r.id)).toEqual([firstId, secondId]);
  });
  it('records abandonment on difficulty change, but not pause or app restoration', async () => {
    const { store, storage } = setup(); store.getState().hint(); store.getState().pause();
    expect(store.getState().results).toHaveLength(0);
    const restored = createGameStore(storage); await restored.persist.rehydrate(); restored.setState({ hydrated: true });
    expect(restored.getState().session.id).toBe(store.getState().session.id);
    expect(restored.getState().results).toHaveLength(0);
    restored.getState().newGame('hard');
    expect(restored.getState().results[0]).toMatchObject({ difficulty: 'medium', hintsUsed: 1, outcome: 'abandoned' });
  });
  it('moves the whole attempt into practice and keeps its mistakes and hints', () => {
    const { store } = setup(); store.getState().hint(); store.getState().select({ row: 0, col: 0 });
    for (const digit of [6, 8, 1] as const) store.getState().input(digit);
    expect(store.getState().session.status).toBe('mistake-limit');
    store.getState().continuePractice(); store.getState().newGame('medium', true);
    expect(store.getState().results[0]).toMatchObject({ practice: true, mistakes: 3, hintsUsed: 1, outcome: 'abandoned' });
    expect(summarizeResults(store.getState().results, store.getState().session, false).attempts).toBe(0);
    expect(summarizeResults(store.getState().results, store.getState().session, true).attempts).toBe(1);
  });
});

describe('save migration and result validation', () => {
  it('migrates a v1 active save without losing board, undo, elapsed time, or preferences', async () => {
    const { store, storage, data, snapshot, advance } = setup();
    store.getState().toggleNotes(); store.getState().input(2); store.getState().input(4); store.getState().toggleTheme();
    advance(9000); store.getState().checkpoint(); const before = snapshot(); data.set(KEY, JSON.stringify(legacyEnvelope(before)));
    const restored = createGameStore(storage); await restored.persist.rehydrate();
    expect(restored.getState()).toMatchObject({ board: before.board, history: before.history, theme: 'dark', results: [] });
    expect(restored.getState().session).toMatchObject({ started: true, startedAt: null, status: 'paused', elapsedSeconds: 9 });
    const migrated = JSON.parse(data.get(KEY)!); expect(migrated.version).toBe(3);
    const again = createGameStore(storage); await again.persist.rehydrate(); expect(again.getState().session.id).toBe(restored.getState().session.id);
  });
  it('imports a legacy completed puzzle exactly once, without fabricating historical dates', async () => {
    const { store, storage, data, snapshot } = setup(); finish(store); data.set(KEY, JSON.stringify(legacyEnvelope(snapshot())));
    const restored = createGameStore(storage); await restored.persist.rehydrate();
    expect(restored.getState().results).toHaveLength(1);
    expect(restored.getState().results[0]).toMatchObject({ outcome: 'completed', startedAt: null, endedAt: null });
    const again = createGameStore(storage); await again.persist.rehydrate(); expect(again.getState().results).toEqual(restored.getState().results);
  });
  it('does not count an untouched legacy game as an attempt', () => {
    const { snapshot } = setup(); const migrated = migrateSave(legacyEnvelope(snapshot()).state, 1);
    expect(migrated.session.started).toBe(false); expect(migrated.results).toEqual([]);
  });
  it('rejects unsupported and corrupt saves without modifying the stored original', async () => {
    const { storage, data, snapshot } = setup(); const old = legacyEnvelope(snapshot()); old.state.board[0][2].value = null;
    const original = JSON.stringify(old); data.set(KEY, original);
    const restored = createGameStore(storage); const onError = vi.fn(); restored.persist.setOptions({ onRehydrateStorage: () => (_s, error) => onError(error) });
    await restored.persist.rehydrate(); expect(onError).toHaveBeenCalledWith(expect.any(Error)); expect(data.get(KEY)).toBe(original);
    expect(() => migrateSave({}, 0)).toThrow('unsupported'); expect(() => migrateSave({}, 3)).toThrow('unsupported');
  });
  it('rejects duplicate IDs, invalid counters, inconsistent completions, and finalized active IDs', () => {
    const { store, snapshot } = setup(); finish(store); const s = snapshot();
    const duplicate = structuredClone(s); duplicate.results.push(duplicate.results[0]); expect(() => validateSave(duplicate)).toThrow('result');
    const counter = structuredClone(s); counter.results[0].hintsUsed = 3; expect(() => validateSave(counter)).toThrow('result');
    const mismatch = structuredClone(s); mismatch.results[0].elapsedSeconds++; expect(() => validateSave(mismatch)).toThrow('completion');
    const missing = structuredClone(s); missing.results = []; expect(() => validateSave(missing)).toThrow('completion');
    store.getState().newGame('medium'); const active = snapshot(); active.session.id = active.results[0].id; expect(() => validateSave(active)).toThrow('finalized');
  });
});
