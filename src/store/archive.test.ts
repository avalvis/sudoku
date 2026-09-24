import { expect, it, vi } from 'vitest';
import { createGameStore } from './game-store';
import { getPuzzle } from '../domain/puzzles';
import { createBoard } from '../domain/rules';

vi.mock('../services/audio', () => ({ audio: { setMuted: vi.fn(), unlock: vi.fn(async () => {}), play: vi.fn() } }));
const setup = () => {
  const store = createGameStore({ getItem: () => null, setItem: () => {}, removeItem: () => {} });
  store.setState({ hydrated: true }); return store;
};
it('opens an exact puzzle and archives the previous attempt once with a fresh session ID', () => {
  const store = setup(); store.getState().hint(); const old = store.getState().session;
  store.getState().startPuzzle('hard-2');
  expect(store.getState().board).toEqual(createBoard(getPuzzle('hard-2')));
  expect(store.getState().session).toMatchObject({ puzzleId: 'hard-2', difficulty: 'hard', started: false, hintsRemaining: 2, mistakes: 0 });
  expect(store.getState().session.id).not.toBe(old.id);
  expect(store.getState().results).toHaveLength(1);
  expect(store.getState().results[0]).toMatchObject({ id: old.id, outcome: 'abandoned', hintsUsed: 1 });
  store.getState().startPuzzle('easy-3'); expect(store.getState().results).toHaveLength(1);
});
it('rejects unknown puzzle IDs before changing the current board or journal', () => {
  const store = setup(); store.getState().hint(); const before = store.getState();
  expect(() => store.getState().startPuzzle('missing')).toThrow('Unknown puzzle');
  expect(store.getState()).toBe(before);
});
it('prevents archive starts during hydration or recovery', () => {
  const store = setup(); store.setState({ hydrated: false }); const initial = store.getState().session.id;
  store.getState().startPuzzle('easy-1'); expect(store.getState().session.id).toBe(initial);
  store.setState({ hydrated: true, recoveryNeeded: true }); store.getState().startPuzzle('hard-1');
  expect(store.getState().session.id).toBe(initial);
});
