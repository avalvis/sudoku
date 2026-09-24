import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { createBoard, cellId, findConflicts, isComplete, remainingCounts } from '../domain/rules';
import { getPuzzle, nextPuzzle } from '../domain/puzzles';
import { validateSave } from '../domain/validate-save';
import type { Cell, CellPosition, Difficulty, Digit, Puzzle, SavedGame } from '../domain/types';
import { audio } from '../services/audio';
import { indexedDbStorage, onStorageNotice } from '../services/storage';

export interface GameStore extends SavedGame {
  hydrated: boolean;
  storageError: string | null;
  recoveryNeeded: boolean;
  announcement: string;
  conflictEvent: number;
  select: (position: CellPosition) => void;
  input: (digit: Digit) => void;
  erase: () => void;
  undo: () => void;
  hint: () => void;
  toggleNotes: () => void;
  pause: () => void;
  resume: () => void;
  continuePractice: () => void;
  newGame: (difficulty: Difficulty, restart?: boolean) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  checkpoint: () => void;
  displayedSeconds: () => number;
  recover: () => void;
}

const fresh = (p: Puzzle): Pick<SavedGame, 'board' | 'selected' | 'notesMode' | 'history' | 'session'> => {
  const board = createBoard(p);
  const first = board.flat().findIndex(c => !c.given);
  return {
    board, selected: { row: Math.floor(first / 9), col: first % 9 }, notesMode: false, history: [],
    session: { puzzleId: p.id, difficulty: p.difficulty, elapsedSeconds: 0, mistakes: 0, hintsRemaining: 2, practice: false, status: 'playing' },
  };
};

export function createGameStore(storage: StateStorage = indexedDbStorage, now = () => performance.now()) {
  let anchor: number | null = null;
  return create<GameStore>()(persist((set, get) => {
    const seconds = () => get().session.elapsedSeconds + (anchor === null ? 0 : Math.max(0, Math.floor((now() - anchor) / 1000)));
    const checkpointTime = () => {
      const elapsedSeconds = seconds();
      if (anchor !== null) anchor += (elapsedSeconds - get().session.elapsedSeconds) * 1000;
      return elapsedSeconds;
    };
    const allowed = () => get().hydrated && !get().recoveryNeeded && get().session.status === 'playing';
    const play = (effect: Parameters<typeof audio.play>[0]) => { audio.setMuted(!get().soundEnabled); void audio.unlock().then(() => audio.play(effect)); };
    function commit(position: CellPosition, after: Cell, hint = false) {
      const state = get();
      const before = state.board[position.row][position.col];
      if (before.given || (before.value === after.value && before.notes.join() === after.notes.join())) return;
      const board = state.board.map((row, r) => r === position.row ? row.map((cell, c) => c === position.col ? after : cell) : row);
      const conflict = after.value !== null && findConflicts(board).has(cellId(position.row, position.col));
      const mistakes = state.session.mistakes + (conflict && !hint ? 1 : 0);
      const status = isComplete(board) ? 'completed' : mistakes >= 3 && !state.session.practice ? 'mistake-limit' : 'playing';
      const elapsedSeconds = checkpointTime();
      if (status !== 'playing') anchor = null;
      set({
        board, selected: position,
        history: [...state.history, { patches: [{ position, before, after }] }],
        session: { ...state.session, elapsedSeconds, mistakes, status, hintsRemaining: state.session.hintsRemaining - (hint ? 1 : 0) },
        conflictEvent: state.conflictEvent + (conflict ? 1 : 0),
        announcement: status === 'completed' ? 'Puzzle complete. Beautifully done.' : conflict ? `Duplicate ${after.value}. ${mistakes} mistakes.` :
          hint ? `Hint: ${after.value} placed in row ${position.row + 1}, column ${position.col + 1}.` : after.value ? `${after.value} placed.` : after.notes.length ? 'Pencil notes updated.' : 'Cell cleared.',
      });
      play(status === 'completed' ? 'success' : conflict ? 'alert' : after.notes.length ? 'pencil' : 'tap');
    }
    return {
      ...fresh(nextPuzzle('medium')),
      theme: 'light', soundEnabled: true,
      hydrated: false, storageError: null, recoveryNeeded: false, announcement: '', conflictEvent: 0,
      select: position => {
        if (!get().hydrated || get().recoveryNeeded || (get().session.status !== 'playing' && get().session.status !== 'completed')) return;
        if (position.row < 0 || position.row > 8 || position.col < 0 || position.col > 8) return;
        set({ selected: position }); play('tap');
      },
      input: digit => {
        if (!allowed() || remainingCounts(get().board)[digit] === 0) return;
        const { board, selected, notesMode } = get();
        const cell = board[selected.row][selected.col];
        if (cell.given) return;
        if (notesMode) {
          if (cell.value !== null) return;
          const notes = cell.notes.includes(digit) ? cell.notes.filter(n => n !== digit) : [...cell.notes, digit].sort((a, b) => a - b);
          commit(selected, { ...cell, notes });
        } else commit(selected, { ...cell, value: digit, notes: [] });
      },
      erase: () => {
        if (!allowed()) return;
        const { board, selected } = get();
        commit(selected, { ...board[selected.row][selected.col], value: null, notes: [] });
      },
      undo: () => {
        if (!allowed()) return;
        const state = get();
        const move = state.history.at(-1);
        if (!move) return;
        const board = state.board.map(row => [...row]);
        for (const patch of move.patches) board[patch.position.row][patch.position.col] = patch.before;
        set({ board, history: state.history.slice(0, -1), selected: move.patches[0].position,
          session: { ...state.session, elapsedSeconds: checkpointTime() }, announcement: 'Last move undone.' });
        play('tap');
      },
      hint: () => {
        if (!allowed() || get().session.hintsRemaining === 0) return;
        const { board, selected, session } = get();
        const puzzle = getPuzzle(session.puzzleId);
        let at = selected;
        if (board[at.row][at.col].value === puzzle.solution[at.row][at.col]) {
          const id = board.flat().findIndex((cell, i) => !cell.given && cell.value !== puzzle.solution[Math.floor(i / 9)][i % 9]);
          if (id < 0) return;
          at = { row: Math.floor(id / 9), col: id % 9 };
        }
        commit(at, { value: puzzle.solution[at.row][at.col], given: false, notes: [] }, true);
      },
      toggleNotes: () => { if (allowed()) { set({ notesMode: !get().notesMode }); play('pencil'); } },
      pause: () => {
        if (!get().hydrated || get().session.status !== 'playing') return;
        const elapsedSeconds = checkpointTime(); anchor = null;
        set({ session: { ...get().session, status: 'paused', elapsedSeconds } });
      },
      resume: () => {
        if (!get().hydrated || get().recoveryNeeded || get().session.status !== 'paused') return;
        anchor = now(); set({ session: { ...get().session, status: 'playing' } });
      },
      continuePractice: () => {
        if (get().session.status !== 'mistake-limit') return;
        anchor = now(); set({ session: { ...get().session, practice: true, status: 'playing' }, announcement: 'Practice mode. Take your time.' });
      },
      newGame: (difficulty, restart = false) => {
        if (!get().hydrated || get().recoveryNeeded) return;
        const p = restart ? getPuzzle(get().session.puzzleId) : nextPuzzle(difficulty, get().session.puzzleId);
        anchor = now(); set({ ...fresh(p), announcement: 'A fresh page. Enjoy your puzzle.', conflictEvent: 0 });
      },
      toggleTheme: () => { if (get().hydrated && !get().recoveryNeeded) set({ theme: get().theme === 'light' ? 'dark' : 'light' }); },
      toggleSound: () => { if (!get().hydrated || get().recoveryNeeded) return; const enabled = !get().soundEnabled; audio.setMuted(!enabled); set({ soundEnabled: enabled }); if (enabled) play('tap'); },
      checkpoint: () => {
        if (!allowed()) return;
        if (anchor === null) anchor = now();
        const elapsedSeconds = checkpointTime();
        if (elapsedSeconds !== get().session.elapsedSeconds) set({ session: { ...get().session, elapsedSeconds } });
      },
      displayedSeconds: seconds,
      recover: () => {
        anchor = now(); set({ ...fresh(nextPuzzle('medium')), recoveryNeeded: false, storageError: null, announcement: 'A fresh puzzle is ready.' });
      },
    };
  }, {
    name: 'editorial-sudoku-session', version: 1, skipHydration: true,
    storage: createJSONStorage(() => storage),
    partialize: s => ({ board: s.board, selected: s.selected, notesMode: s.notesMode, history: s.history, session: s.session, theme: s.theme, soundEnabled: s.soundEnabled }),
    migrate: () => { throw new Error('This save uses an unsupported format.'); },
    merge: (persisted, current) => {
      if (!persisted) return current;
      const saved = validateSave(persisted);
      return { ...current, ...saved, session: { ...saved.session, status: saved.session.status === 'playing' ? 'paused' : saved.session.status } };
    },
    onRehydrateStorage: () => (state, error) => {
      if (state && !error) { audio.setMuted(!state.soundEnabled); }
    },
  }));
}

export const useGame = createGameStore();
let initialization: Promise<void> | null = null;
export function initializeGame() {
  if (initialization) return initialization;
  initialization = (async () => {
    let hydrateError = false;
    useGame.persist.setOptions({ onRehydrateStorage: () => (_state, error) => { hydrateError = !!error; } });
    let storageMessage: string | null = null;
    onStorageNotice(message => { storageMessage = message; });
    await useGame.persist.rehydrate();
    // Do not overwrite a corrupt save until the player explicitly chooses recovery.
    if (hydrateError) useGame.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
    useGame.setState({ hydrated: true, recoveryNeeded: hydrateError, storageError: storageMessage });
    if (hydrateError) {
      const recover = useGame.getState().recover;
      useGame.setState({ recover: () => {
        useGame.persist.setOptions({ storage: createJSONStorage(() => indexedDbStorage) });
        recover();
      } });
    }
    onStorageNotice(message => {
      if (useGame.getState().storageError !== message) useGame.setState({ storageError: message });
    });
    audio.setMuted(!useGame.getState().soundEnabled);
    if (!hydrateError) useGame.getState().checkpoint();
  })();
  return initialization;
}
