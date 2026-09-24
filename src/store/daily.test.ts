import { expect, it, vi } from 'vitest';
import { createGameStore } from './game-store';
import { getPuzzle } from '../domain/puzzles';
import { validateSave, migrateSave } from '../domain/validate-save';
import { summarizeResults } from '../domain/statistics';

vi.mock('../services/audio', () => ({ audio: { setMuted: vi.fn(), unlock: vi.fn(async () => {}), play: vi.fn() } }));
function setup() {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
  let time = 0;
  const store = createGameStore(storage, () => time, () => new Date(2026, 8, 24).getTime());
  store.setState({ hydrated: true }); store.getState().checkpoint();
  return { store, storage, advance: (ms: number) => { time += ms; } };
}
it('keeps Classic and multiple Daily boards, timers and undo independently through restoration', async () => {
  const { store, storage, advance } = setup();
  store.getState().toggleNotes(); store.getState().input(2); advance(6000);
  const classicId = store.getState().session.id;
  store.getState().switchGame('daily-2026-09-24'); store.getState().hint(); advance(4000);
  const dailyBoard = store.getState().board;
  store.getState().switchGame('daily-2026-09-23'); store.getState().hint();
  const s = store.getState();
  expect(s.results).toEqual([]); expect(() => validateSave(s)).not.toThrow();
  expect(summarizeResults([], s.session, false, 'all', Object.values(s.savedGames).map(g => g.session)).active).toBe(3);
  const restored = createGameStore(storage); await restored.persist.rehydrate(); restored.setState({ hydrated: true });
  restored.getState().switchGame('classic');
  expect(restored.getState().session).toMatchObject({ id: classicId, elapsedSeconds: 6, status: 'paused' });
  restored.getState().resume(); restored.getState().undo(); expect(restored.getState().board[0][0].notes).toEqual([]);
  restored.getState().switchGame('daily-2026-09-24');
  expect(restored.getState().board).toEqual(dailyBoard); expect(restored.getState().session.elapsedSeconds).toBe(4);
});
it('records Daily completion only once and restart creates another attempt', () => {
  const { store } = setup(); store.getState().switchGame('daily-2026-09-24');
  const puzzle = getPuzzle(store.getState().session.puzzleId);
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (!store.getState().board[row][col].given) {
    store.getState().select({ row, col }); store.getState().input(puzzle.solution[row][col]);
  }
  const id = store.getState().session.id;
  store.getState().switchGame('classic'); store.getState().switchGame(puzzle.id);
  expect(store.getState().results).toHaveLength(1); expect(store.getState().session.status).toBe('completed');
  store.getState().newGame('easy', true);
  expect(store.getState().session.id).not.toBe(id); expect(store.getState().session.puzzleId).toBe(puzzle.id);
  expect(store.getState().results).toHaveLength(1); expect(() => validateSave(store.getState())).not.toThrow();
});
it('rejects future dates and corrupt parked histories without replacing progress', () => {
  const { store } = setup(); const before = store.getState();
  expect(() => store.getState().switchGame('daily-2026-09-25')).toThrow('not available'); expect(store.getState()).toBe(before);
  store.getState().hint(); store.getState().switchGame('daily-2026-09-24');
  const saved = JSON.parse(JSON.stringify(store.getState())); saved.savedGames.classic.history = [];
  expect(() => validateSave(saved)).toThrow('history');
});
it('migrates v2 Classic progress and results into v3 without loss', async () => {
  const { store, storage } = setup(); store.getState().hint();
  const old = JSON.parse(JSON.stringify(store.getState())); delete old.savedGames;
  const migrated = migrateSave(old, 2);
  expect(migrated.savedGames).toEqual({}); expect(migrated.board).toEqual(old.board); expect(migrated.history).toEqual(old.history); expect(migrated.session).toEqual(old.session);
  storage.setItem('editorial-sudoku-session', JSON.stringify({ version: 2, state: old }));
  const restored = createGameStore(storage); await restored.persist.rehydrate();
  expect(restored.getState().board).toEqual(old.board); expect(restored.getState().savedGames).toEqual({});
  expect(JSON.parse(storage.getItem('editorial-sudoku-session')!).version).toBe(3);
});
