import { describe, expect, it } from 'vitest';
import { recordResult, summarizeResults } from './statistics';
import type { GameResult, Session } from './types';

const session = (patch: Partial<Session> = {}): Session => ({ id: 'current', puzzleId: 'medium-1', difficulty: 'medium', started: false, startedAt: null, completedAt: null, elapsedSeconds: 0, mistakes: 0, hintsRemaining: 2, practice: false, status: 'paused', ...patch });
const result = (id: string, patch: Partial<GameResult> = {}): GameResult => ({ id, puzzleId: 'medium-1', difficulty: 'medium', startedAt: 1000, endedAt: 101_000, elapsedSeconds: 100, mistakes: 0, hintsUsed: 0, practice: false, outcome: 'completed', ...patch });

describe('statistics', () => {
  it('leaves empty rates and times undefined instead of claiming 0% or a zero-second record', () => {
    expect(summarizeResults([], session(), false)).toMatchObject({ attempts: 0, completed: 0, completionRate: null, bestSeconds: null, averageSeconds: null });
  });
  it('calculates completion across started attempts, including the current puzzle', () => {
    const stats = summarizeResults([result('win'), result('left', { outcome: 'abandoned', elapsedSeconds: 8 })], session({ started: true, mistakes: 1, hintsRemaining: 1 }), false);
    expect(stats).toMatchObject({ attempts: 3, completed: 1, abandoned: 1, active: 1, completionRate: 33, bestSeconds: 100, averageSeconds: 100, mistakes: 1, hintsUsed: 1 });
  });
  it('uses only completed games for time records and separates practice and difficulties', () => {
    const games = [result('a', { elapsedSeconds: 101 }), result('b', { elapsedSeconds: 200 }), result('c', { elapsedSeconds: 1, outcome: 'abandoned' }), result('d', { elapsedSeconds: 5, practice: true }), result('e', { elapsedSeconds: 20, difficulty: 'hard' })];
    expect(summarizeResults(games, session(), false, 'medium')).toMatchObject({ attempts: 3, completed: 2, completionRate: 67, bestSeconds: 101, averageSeconds: 151 });
    expect(summarizeResults(games, session(), true)).toMatchObject({ attempts: 1, completed: 1, bestSeconds: 5 });
    expect(summarizeResults(games, session(), false, 'hard')).toMatchObject({ attempts: 1, completed: 1, averageSeconds: 20 });
  });
  it('does not double-count the current completed game or manufacture a minimum time', () => {
    const games = [result('current', { elapsedSeconds: 0 })];
    expect(summarizeResults(games, session({ started: true, status: 'completed' }), false)).toMatchObject({ attempts: 1, completed: 1, active: 0, bestSeconds: 0, averageSeconds: 0 });
  });
  it('lists results in recorded order, even when the wall clock goes backwards', () => {
    expect(summarizeResults([result('first'), result('second', { endedAt: 5000 })], session(), false).results.map(r => r.id)).toEqual(['second', 'first']);
  });
  it('finalizes a started session only once and ignores untouched puzzles', () => {
    expect(recordResult([], session(), 'abandoned', 5000)).toEqual([]);
    const s = session({ started: true, startedAt: 1000, elapsedSeconds: 8, hintsRemaining: 1 });
    const games = recordResult([], s, 'completed', 9000);
    expect(games[0]).toMatchObject({ id: s.id, hintsUsed: 1, elapsedSeconds: 8, outcome: 'completed' });
    expect(recordResult(games, s, 'abandoned', 10_000)).toBe(games);
  });
});
