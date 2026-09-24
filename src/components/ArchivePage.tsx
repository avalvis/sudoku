import { useState } from 'react';
import { ArrowRight, Library } from 'lucide-react';
import { puzzles } from '../domain/puzzles';
import { DIFFICULTIES, type DifficultyFilter } from '../domain/statistics';
import { formatTime } from '../domain/format';
import type { Puzzle } from '../domain/types';
import { useGame } from '../store/game-store';
import { Dialog } from './Dialog';

export function ArchivePage() {
  const session = useGame(s => s.session);
  const results = useGame(s => s.results);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [uncompleted, setUncompleted] = useState(false);
  const [selected, setSelected] = useState<Puzzle | null>(null);
  const entries = puzzles.map((puzzle, index) => {
    const completed = results.filter(result => result.puzzleId === puzzle.id && result.outcome === 'completed');
    const normal = completed.filter(result => !result.practice);
    return { puzzle, edition: String(index + 1).padStart(3, '0'), completed, normal,
      current: puzzle.id === session.puzzleId,
      best: normal.length ? normal.reduce((best, result) => Math.min(best, result.elapsedSeconds), Infinity) : null };
  });
  const visible = entries.filter(({ puzzle, completed }) => (difficulty === 'all' || puzzle.difficulty === difficulty) && (!uncompleted || !completed.length));
  const start = () => {
    if (!selected) return;
    useGame.getState().startPuzzle(selected.id);
    location.hash = 'classic';
  };
  return <main id="main-content" tabIndex={-1} className="stats-page archive-page">
    <header className="stats-heading"><div><span className="eyebrow">The classic collection / nine original puzzles</span><h1>Pages worth keeping<span className="title-period">.</span></h1><p>Choose a fresh challenge, or return to an old favourite.</p></div><Library size={36} strokeWidth={1.1} aria-hidden="true" /></header>
    <div className="stats-toolbar"><label className="archive-uncompleted"><input type="checkbox" checked={uncompleted} onChange={event => setUncompleted(event.target.checked)} />Not yet completed</label><label className="stats-difficulty">Difficulty<select aria-label="Filter archive by difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value as DifficultyFilter)}><option value="all">All difficulties</option>{DIFFICULTIES.map(d => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></label></div>
    <p className="archive-count" role="status">{visible.length} {visible.length === 1 ? 'puzzle' : 'puzzles'} · {entries.filter(e => e.completed.length).length} of 9 completed</p>
    <div className="archive-grid">{visible.map(({ puzzle, edition, current, completed, normal, best }) => <article className="archive-card" key={puzzle.id} aria-labelledby={`title-${puzzle.id}`}>
      <div className="archive-card-heading"><span className="eyebrow">No. {edition}</span><span className="capitalize"><i className={`difficulty-dot ${puzzle.difficulty}`} />{puzzle.difficulty}</span></div>
      <div className="archive-preview" aria-hidden="true">{puzzle.givens.flat().map((value, index) => <span key={index} className={`${index % 9 === 2 || index % 9 === 5 ? 'block-right' : ''} ${Math.floor(index / 9) === 2 || Math.floor(index / 9) === 5 ? 'block-bottom' : ''}`}>{value}</span>)}</div>
      <h2 id={`title-${puzzle.id}`}>Puzzle {edition}</h2>
      <p className="archive-card-status">{current ? session.status === 'completed' ? 'Current board · complete' : session.started ? 'Your puzzle in progress' : 'Current puzzle · ready to begin' : completed.length ? normal.length ? 'Completed' : 'Completed in practice' : 'Not yet completed'}</p>
      <dl className="archive-record"><div><dt>Completions</dt><dd>{completed.length}</dd></div><div><dt>Best normal time</dt><dd>{best === null ? '—' : formatTime(best)}</dd></div></dl>
      {current && <a className="primary-button" href="#classic">{session.status === 'completed' ? 'Review board' : 'Return to puzzle'}<ArrowRight size={15} /></a>}
      {(!current || session.status === 'completed') && <button className={current ? 'secondary-button' : 'primary-button'} onClick={() => setSelected(puzzle)}>{completed.length ? 'Replay puzzle' : 'Start puzzle'}<ArrowRight size={15} /></button>}
    </article>)}</div>
    {!visible.length && <div className="journal-empty"><p>No puzzles match these filters.</p><button className="secondary-button" onClick={() => { setDifficulty('all'); setUncompleted(false); }}>Show all puzzles</button></div>}
    <footer className="stats-footnote"><p>Every replay begins a new attempt. Only one puzzle can be in progress at a time. Completions include practice games; best times use normal games only. Your full attempt history is in <a href="#stats">Stats</a>.</p><span>Nine puzzles, available offline. More editions will follow.</span></footer>
    {selected && <Dialog title="Open a new page." eyebrow={`Classic / ${selected.difficulty} / ${selected.id}`} onClose={() => setSelected(null)}>
      <p>{session.started && session.status !== 'completed' ? 'Opening this puzzle replaces your unfinished board. The current attempt will be saved as abandoned in your journal.' : 'Begin a fresh attempt with a clear board, a reset timer, and two hints. Previous results stay in your journal.'}</p>
      <div className="dialog-actions"><button className="secondary-button" onClick={() => setSelected(null)}>Keep current puzzle</button><button className="primary-button" onClick={start}>Open puzzle</button></div>
    </Dialog>}
  </main>;
}
