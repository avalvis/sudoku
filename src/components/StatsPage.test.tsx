import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { StatsPage } from './StatsPage';
import { useGame } from '../store/game-store';
import type { GameResult } from '../domain/types';

const result = (id: string, patch: Partial<GameResult> = {}): GameResult => ({ id, puzzleId: 'medium-1', difficulty: 'medium', outcome: 'completed', elapsedSeconds: 90, mistakes: 1, hintsUsed: 0, practice: false, startedAt: 1000, endedAt: 100_000, ...patch });
beforeEach(() => {
  useGame.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
  useGame.setState({ hydrated: true }); useGame.getState().newGame('medium', true); useGame.setState({ results: [] });
});
it('renders a calm empty state and undefined rate/time records', () => {
  render(<StatsPage />);
  expect(screen.getByTestId('stats-completed')).toHaveTextContent('0');
  expect(screen.getByTestId('stats-rate')).toHaveTextContent('—');
  expect(screen.getByTestId('stats-best')).toHaveTextContent('—');
  expect(screen.getByText('No games yet.')).toBeVisible();
});
it('filters summary, difficulty rows, and history together without mixing practice', () => {
  useGame.setState({ results: [result('one'), result('two', { difficulty: 'hard', elapsedSeconds: 240 }), result('three', { practice: true, elapsedSeconds: 15 })] });
  render(<StatsPage />);
  expect(screen.getByTestId('stats-completed')).toHaveTextContent('2'); expect(screen.getByTestId('stats-average')).toHaveTextContent('02:45');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'hard' } });
  expect(screen.getByTestId('stats-completed')).toHaveTextContent('1'); expect(screen.getByTestId('stats-best')).toHaveTextContent('04:00');
  const difficultyTable = screen.getByRole('table', { name: 'Statistics by difficulty' });
  expect(within(difficultyTable).getAllByRole('row')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Practice games' }));
  expect(screen.getByTestId('stats-completed')).toHaveTextContent('0');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } });
  expect(screen.getByTestId('stats-completed')).toHaveTextContent('1'); expect(screen.getByTestId('stats-best')).toHaveTextContent('00:15');
});
it('pages the journal and labels imported results without invented dates', () => {
  useGame.setState({ results: Array.from({ length: 13 }, (_, i) => result(`game-${i}`, { endedAt: null, startedAt: null })) });
  render(<StatsPage />);
  expect(screen.getAllByText('Earlier game · date unavailable')).toHaveLength(10);
  fireEvent.click(screen.getByRole('button', { name: 'Show 10 more' }));
  expect(screen.getAllByText('Earlier game · date unavailable')).toHaveLength(13);
  expect(screen.queryByRole('button', { name: 'Show 10 more' })).not.toBeInTheDocument();
});
