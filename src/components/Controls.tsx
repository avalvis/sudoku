import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Check, ChevronDown, CircleHelp, Delete, Lightbulb, Pause, Pencil, RotateCcw, Undo2 } from 'lucide-react';
import { useGame } from '../store/game-store';
import { remainingCounts } from '../domain/rules';
import { DIGITS } from '../domain/types';
import { formatTime } from '../domain/format';

function Timer() {
  const status = useGame(s => s.session.status);
  const elapsed = useGame(s => s.session.elapsedSeconds);
  const display = useGame(s => s.displayedSeconds);
  const [, rerender] = useState(0);
  useEffect(() => {
    if (status !== 'playing') return;
    const id = window.setInterval(() => rerender(n => n + 1), 250);
    return () => clearInterval(id);
  }, [status]);
  return <span className="timer" aria-label="Elapsed time" data-testid="timer">{formatTime(status === 'playing' ? display() : elapsed)}</span>;
}

function UtilityActions() {
  const notesMode = useGame(s => s.notesMode);
  const hints = useGame(s => s.session.hintsRemaining);
  const playing = useGame(s => s.session.status === 'playing');
  const undoable = useGame(s => s.history.length > 0);
  const erasable = useGame(s => { const c = s.board[s.selected.row][s.selected.col]; return !c.given && (c.value !== null || c.notes.length > 0); });
  const { undo, erase, toggleNotes, hint } = useGame.getState();
  return <div className="utility-actions" aria-label="Puzzle tools">
    <button className="utility" onClick={undo} disabled={!playing || !undoable} title="Undo (Ctrl+Z)"><Undo2 size={20} /><span>Undo</span><kbd>↶</kbd></button>
    <button className="utility" onClick={erase} disabled={!playing || !erasable} title="Erase (Delete)"><Delete size={20} /><span>Erase</span><kbd>⌫</kbd></button>
    <button className={`utility notes-action ${notesMode ? 'on' : ''}`} onClick={toggleNotes} disabled={!playing} aria-pressed={notesMode} aria-label={`Notes ${notesMode ? 'ON' : 'OFF'}`} title="Notes mode (N)"><Pencil size={19} /><span>Notes</span><span className="state-pill">{notesMode ? 'ON' : 'OFF'}</span></button>
    <button className="utility hint-action" onClick={hint} disabled={!playing || !hints} title={`${hints} hints remaining`}><Lightbulb size={20} /><span>Hint</span><span className="hint-badge">{hints}</span></button>
  </div>;
}

function NumberKeypad() {
  const board = useGame(s => s.board);
  const activeValue = useGame(s => s.board[s.selected.row][s.selected.col].value);
  const playing = useGame(s => s.session.status === 'playing');
  const notesMode = useGame(s => s.notesMode);
  const input = useGame(s => s.input);
  const counts = remainingCounts(board);
  return <div className={`number-keypad ${notesMode ? 'pencil-mode' : ''}`} role="group" aria-label="Number keypad">
    {DIGITS.map(d => <motion.button key={d} className={`number-key ${activeValue === d ? 'matching' : ''} ${counts[d] === 0 ? 'exhausted' : ''}`}
      disabled={!playing || counts[d] === 0} onClick={() => input(d)} aria-label={`Enter ${d}, ${counts[d]} remaining`}
      whileTap={{ scale: 0.94, y: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
      <span className="key-digit">{d}</span>
      <span className="key-count">{counts[d] === 0 ? <Check size={12} aria-label="All placed" /> : <>{counts[d]}<span className="remaining-word"> left</span></>}</span>
    </motion.button>)}
  </div>;
}

export function GameControlPanel({ onNewGame, onRestart, onDifficulty }: { onNewGame: () => void; onRestart: () => void; onDifficulty: () => void }) {
  const difficulty = useGame(s => s.session.difficulty);
  const mistakes = useGame(s => s.session.mistakes);
  const practice = useGame(s => s.session.practice);
  const playing = useGame(s => s.session.status === 'playing');
  const filled = useGame(s => s.board.flat().filter(c => c.value !== null).length);
  const pause = useGame(s => s.pause);
  return <aside className="control-panel" aria-label="Game controls">
    <div className="session-heading"><span className="eyebrow">Your session</span><span className="edition-mark">№ 01</span></div>
    <button className="difficulty-selector" onClick={onDifficulty} aria-label={`Change difficulty, currently ${difficulty}`}><span><i className={`difficulty-dot ${difficulty}`} />{difficulty}</span><ChevronDown size={17} /></button>
    <div className="session-meta">
      <div><span className="micro-label">Time elapsed</span><div className="timer-row"><Timer /><button className="pause-button" aria-label="Pause game" title="Pause game" onClick={pause} disabled={!playing}><Pause size={15} /></button></div></div>
      <div className="mistake-meta"><span className="micro-label">{practice ? 'Practice' : 'Mistakes'}</span><span className={`mistakes ${mistakes ? 'has-mistakes' : ''}`} data-testid="mistakes">{mistakes}<span>{practice ? ' total' : ' / 3'}</span></span></div>
    </div>
    <div className="panel-rule" />
    <UtilityActions />
    <div className="keypad-heading"><span className="micro-label">A number at a time</span><span title="Small numbers show remaining occurrences"><CircleHelp size={13} aria-label="Counters show remaining occurrences" /></span></div>
    <NumberKeypad />
    <div className="progress-detail"><div><span>{filled} of 81 filled</span><span>{Math.round(filled / 81 * 100)}%</span></div><progress value={filled} max={81} aria-label="Filled cells" /></div>
    <button className="new-game-button" onClick={onNewGame}>A new puzzle <ArrowUpRight size={17} /></button>
    <button className="restart-button" onClick={onRestart}><RotateCcw size={12} /> Start this one again</button>
    <div className="keyboard-help"><span className="micro-label">At your fingertips</span><p><kbd>1–9</kbd> to enter <span>·</span> <kbd>N</kbd> for notes</p><p><kbd>↑ ↓ ← →</kbd> to move <span>·</span> <kbd>Ctrl Z</kbd> to undo</p></div>
  </aside>;
}
