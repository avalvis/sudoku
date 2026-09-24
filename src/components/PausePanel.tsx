import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { useGame } from '../store/game-store';
import { isDaily } from '../domain/daily';
import { formatTime } from '../domain/format';

/** A non-modal pause surface: navigation remains available and the clock stays stopped. */
export function PausePanel({ onNewGame }: { onNewGame: () => void }) {
  const session = useGame(s => s.session);
  const restored = useGame(s => s.restoredSessionId === s.session.id);
  const filled = useGame(s => s.board.flat().filter(cell => cell.value !== null).length);
  const resumeButton = useRef<HTMLButtonElement>(null);
  const daily = isDaily(session.puzzleId);
  useEffect(() => { if (document.hasFocus()) resumeButton.current?.focus({ preventScroll: true }); }, []);
  const resume = () => {
    useGame.getState().resume();
    const { row, col } = useGame.getState().selected;
    requestAnimationFrame(() => document.getElementById(`cell-${row}-${col}`)?.focus({ preventScroll: true }));
  };
  return <section className="pause-panel" aria-labelledby="pause-title" data-testid="pause-panel">
    <div className="pause-card">
      <p className="eyebrow">{daily ? `Daily · ${session.puzzleId.slice(6)}` : 'Classic'} <span aria-hidden="true">·</span> <span className="capitalize">{session.difficulty}</span></p>
      <h2 id="pause-title">{restored ? 'Continue your puzzle?' : 'Paused'}</h2>
      <dl className="pause-summary"><div><dt>Time</dt><dd>{formatTime(session.elapsedSeconds)}</dd></div><div><dt>Filled</dt><dd>{filled}<small> / 81</small></dd></div></dl>
      <div className="pause-actions">
        <button ref={resumeButton} className="primary-button" onClick={resume}><Play size={16} aria-hidden="true" />Resume puzzle</button>
        {daily ? <a className="secondary-button" href="#classic">Play Classic</a> : <button className="secondary-button" onClick={onNewGame}>Start new puzzle</button>}
      </div>
    </div>
  </section>;
}
