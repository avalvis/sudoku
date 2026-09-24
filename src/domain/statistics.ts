import type { Difficulty, GameResult, Session } from './types';

export type DifficultyFilter = Difficulty | 'all';
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** Results and board are persisted in the same snapshot; IDs make finalization idempotent. */
export function recordResult(results: GameResult[], session: Session, outcome: GameResult['outcome'], endedAt: number | null): GameResult[] {
  if (!session.started || results.some(result => result.id === session.id)) return results;
  return [...results, {
    id: session.id, puzzleId: session.puzzleId, difficulty: session.difficulty,
    elapsedSeconds: session.elapsedSeconds, mistakes: session.mistakes,
    hintsUsed: 2 - session.hintsRemaining, practice: session.practice,
    outcome, startedAt: session.startedAt, endedAt,
  }];
}

export function summarizeResults(results: GameResult[], session: Session, practice: boolean, difficulty: DifficultyFilter = 'all', parked: Session[] = []) {
  const matches = (game: { practice: boolean; difficulty: Difficulty }) => game.practice === practice && (difficulty === 'all' || game.difficulty === difficulty);
  const filtered = results.filter(matches);
  const completed = filtered.filter(result => result.outcome === 'completed');
  const activeSessions = [session, ...parked].filter(s => s.started && s.status !== 'completed' && matches(s) && !results.some(result => result.id === s.id));
  const active = activeSessions.length;
  const attempts = filtered.length + active;
  const times = completed.map(result => result.elapsedSeconds);
  return {
    attempts, completed: completed.length, abandoned: filtered.length - completed.length, active,
    completionRate: attempts ? Math.round(completed.length / attempts * 100) : null,
    bestSeconds: times.length ? times.reduce((a, b) => Math.min(a, b)) : null,
    averageSeconds: times.length ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length) : null,
    mistakes: filtered.reduce((sum, result) => sum + result.mistakes, 0) + activeSessions.reduce((sum, s) => sum + s.mistakes, 0),
    hintsUsed: filtered.reduce((sum, result) => sum + result.hintsUsed, 0) + activeSessions.reduce((sum, s) => sum + 2 - s.hintsRemaining, 0),
    results: [...filtered].reverse(),
  };
}
