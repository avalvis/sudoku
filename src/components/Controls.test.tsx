import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { GameControlPanel } from './Controls';
import { formatTime } from '../domain/format';
import { SudokuBoard } from './Board';
import { useGame } from '../store/game-store';

vi.mock('../services/audio', () => ({ audio: { setMuted: vi.fn(), unlock: vi.fn(async () => {}), play: vi.fn() } }));
beforeEach(() => {
  useGame.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
  useGame.setState({ hydrated: true }); useGame.getState().newGame('medium', true);
});
it('exposes roving grid focus, givens, and a persistent notes switch', () => {
  render(<><SudokuBoard /><GameControlPanel onNewGame={() => {}} onRestart={() => {}} onDifficulty={() => {}} /></>);
  expect(screen.getAllByRole('gridcell')).toHaveLength(81);
  expect(screen.getAllByRole('gridcell').filter(c => c.tabIndex === 0)).toHaveLength(1);
  const notes = screen.getByRole('button', { name: /Notes OFF/ });
  fireEvent.click(notes); expect(screen.getByRole('button', { name: /Notes ON/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /^Undo/ })).toBeDisabled();
});
it('formats long sessions without wrapping minutes at one hour', () => {
  expect(formatTime(9)).toBe('00:09'); expect(formatTime(3605)).toBe('1:00:05');
});
