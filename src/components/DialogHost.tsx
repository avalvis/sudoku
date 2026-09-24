import { useState } from 'react';
import { Check } from 'lucide-react';
import { Dialog } from './Dialog';
import { formatTime } from '../domain/format';
import { useGame } from '../store/game-store';
import type { Difficulty, Move } from '../domain/types';
import { isDaily } from '../domain/daily';

export type RequestedDialog = 'new' | 'restart' | 'difficulty' | null;

export function DialogHost({ requested, close, classic }: { requested: RequestedDialog; close: () => void; classic: boolean }) {
  const session = useGame(s => s.session);
  const recovery = useGame(s => s.recoveryNeeded);
  const history = useGame(s => s.history);
  const [reviewed, setReviewed] = useState<Move[] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(session.difficulty);
  const { recover, resume, continuePractice, newGame } = useGame.getState();
  const start = (d: Difficulty, restart = false) => { newGame(d, restart); close(); };
  if (recovery) return <Dialog title="Reset saved game?" eyebrow="Saved game needs attention">
    <p>The saved game could not be loaded. Reset it to start a new Medium puzzle. This replaces the unreadable save.</p>
    <button className="primary-button" onClick={() => { recover(); location.hash = 'classic'; }}>Reset game</button>
  </Dialog>;
  if (requested) return <Dialog title={requested === 'restart' ? 'Restart puzzle?' : requested === 'difficulty' ? 'Difficulty' : 'New puzzle'} eyebrow={isDaily(session.puzzleId) ? 'The daily edition' : 'The classic collection'} onClose={close}>
    <p>{requested === 'restart' ? 'Reset this puzzle, its timer, mistakes, and hints. Your current progress will be replaced.' : 'Starting a new puzzle replaces your current progress.'}{session.started && session.status !== 'completed' ? ' This attempt will be saved as abandoned in your journal.' : ''}</p>
    {requested !== 'restart' && <fieldset className="difficulty-options"><legend>Difficulty</legend>{(['easy', 'medium', 'hard'] as const).map(d => <label key={d} className={difficulty === d ? 'chosen' : ''}>
      <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} />
      <span>{d}</span>{difficulty === d && <Check size={15} />}
    </label>)}</fieldset>}
    <div className="dialog-actions"><button className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" onClick={() => start(requested === 'restart' ? session.difficulty : difficulty, requested === 'restart')}>{requested === 'restart' ? 'Restart puzzle' : 'Start puzzle'}</button></div>
  </Dialog>;
  if (!classic) return null;
  if (session.status === 'paused') return <Dialog title="Paused" eyebrow="" onClose={resume}>
    <button className="primary-button" onClick={resume}>Resume</button>
  </Dialog>;
  if (session.status === 'mistake-limit') return <Dialog title="Mistake limit reached" eyebrow="Three mistakes">
    <p>Continue without a mistake limit, or restart.</p>
    <div className="dialog-actions"><button className="secondary-button" onClick={() => start(session.difficulty, true)}>Restart puzzle</button><button className="primary-button" onClick={continuePractice}>Continue practice</button></div>
  </Dialog>;
  if (session.status === 'completed' && reviewed !== history) return <Dialog title="Puzzle complete" eyebrow="" onClose={() => setReviewed(history)}>
    <div className="completion-details"><div><span>Time</span><strong>{formatTime(session.elapsedSeconds)}</strong></div><div><span>Mistakes</span><strong>{session.mistakes}</strong></div><div><span>Hints used</span><strong>{2 - session.hintsRemaining}</strong></div></div>
    <div className="dialog-actions"><button className="secondary-button" onClick={() => setReviewed(history)}>Review board</button>{isDaily(session.puzzleId) ? <a className="primary-button" href="#classic">Return to Classic</a> : <button className="primary-button" onClick={() => start(session.difficulty)}>Next puzzle</button>}</div>
  </Dialog>;
  return null;
}
