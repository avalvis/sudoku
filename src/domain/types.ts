export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = typeof DIGITS[number];
export type Difficulty = 'easy' | 'medium' | 'hard';
export interface CellPosition { row: number; col: number }
export interface Cell { value: Digit | null; given: boolean; notes: Digit[] }
export type Board = Cell[][];
export interface Puzzle { id: string; difficulty: Difficulty; givens: (Digit | null)[][]; solution: Digit[][] }
export interface Move { patches: { position: CellPosition; before: Cell; after: Cell }[] }
export type SessionStatus = 'playing' | 'paused' | 'mistake-limit' | 'completed';
export interface Session {
  puzzleId: string;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  hintsRemaining: number;
  practice: boolean;
  status: SessionStatus;
}
export interface SavedGame {
  board: Board;
  selected: CellPosition;
  notesMode: boolean;
  history: Move[];
  session: Session;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
}
