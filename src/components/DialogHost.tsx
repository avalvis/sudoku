import { useState } from 'react';
import { Check, Coffee, Feather } from 'lucide-react';
import { Dialog } from './Dialog';
import { formatTime } from '../domain/format';
import { useGame } from '../store/game-store';
import type { Difficulty, Move } from '../domain/types';

export type RequestedDialog = 'new' | 'restart' | 'difficulty' | null;

export function DialogHost({ requested, close, classic }: { requested: RequestedDialog; close: () => void; classic: boolean }) {
  const session = useGame(s => s.session);
  const recovery = useGame(s => s.recoveryNeeded);
  const history = useGame(s => s.history);
  const [reviewed, setReviewed] = useState<Move[] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(session.difficulty);
  const { recover, resume, continuePractice, newGame } = useGame.getState();
  const start = (d: Difficulty, restart = false) => { newGame(d, restart); close(); };
  if (recovery) return <Dialog title="A fresh page?" eyebrow="Saved game needs attention">
    <p>Your saved game could not be read safely. Start a fresh Medium puzzle to replace it. Your original save will stay untouched until you choose to continue.</p>
    <button className="primary-button" onClick={() => { recover(); location.hash = 'classic'; }}>Start fresh</button>
  </Dialog>;
  if (requested) return <Dialog title={requested === 'restart' ? 'Begin again.' : requested === 'difficulty' ? 'Find your pace.' : 'Turn a fresh page.'} eyebrow="The classic collection" onClose={close}>
    <p>{requested === 'restart' ? 'Reset this puzzle, its timer, mistakes, and hints. Your current progress will be replaced.' : 'Choose a little challenge for your day. Starting a new puzzle replaces your current progress.'}</p>
    {requested !== 'restart' && <fieldset className="difficulty-options"><legend>Difficulty</legend>{(['easy', 'medium', 'hard'] as const).map(d => <label key={d} className={difficulty === d ? 'chosen' : ''}>
      <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} />
      <span>{d}</span><small>{d === 'easy' ? 'A gentle start' : d === 'medium' ? 'A thoughtful pause' : 'A deeper focus'}</small>{difficulty === d && <Check size={15} />}
    </label>)}</fieldset>}
    <div className="dialog-actions"><button className="secondary-button" onClick={close}>Keep playing</button><button className="primary-button" onClick={() => start(requested === 'restart' ? session.difficulty : difficulty, requested === 'restart')}>{requested === 'restart' ? 'Restart puzzle' : 'Start puzzle'}</button></div>
  </Dialog>;
  if (!classic) return null;
  if (session.status === 'paused') return <Dialog title="Take your time." eyebrow="On a small intermission" onClose={resume}>
    <Coffee className="dialog-illustration" size={38} strokeWidth={1.2} />
    <p>Your puzzle is right where you left it. The clock is paused, and there’s no hurry.</p>
    <button className="primary-button" onClick={resume}>Back to the puzzle</button>
  </Dialog>;
  if (session.status === 'mistake-limit') return <Dialog title="A chance to rethink." eyebrow="Three mistakes">
    <p>Every good puzzle takes a little patience. Keep exploring in practice mode, or give this page a fresh start.</p>
    <div className="dialog-actions"><button className="secondary-button" onClick={() => start(session.difficulty, true)}>Restart puzzle</button><button className="primary-button" onClick={continuePractice}>Continue practice</button></div>
  </Dialog>;
  if (session.status === 'completed' && reviewed !== history) return <Dialog title="Beautifully done." eyebrow="A puzzle well spent" onClose={() => setReviewed(history)}>
    <Feather className="dialog-illustration" size={38} strokeWidth={1.2} />
    <p>One square at a time, the whole picture comes together.</p>
    <div className="completion-details"><div><span>Time</span><strong>{formatTime(session.elapsedSeconds)}</strong></div><div><span>Mistakes</span><strong>{session.mistakes}</strong></div><div><span>Hints used</span><strong>{2 - session.hintsRemaining}</strong></div></div>
    <div className="dialog-actions"><button className="secondary-button" onClick={() => setReviewed(history)}>Review board</button><button className="primary-button" onClick={() => start(session.difficulty)}>Next puzzle</button></div>
  </Dialog>;
  return null;
}
