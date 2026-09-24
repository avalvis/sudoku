import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { puzzles, isTechniqueGraded } from '../domain/puzzles';
import { DIFFICULTIES, type DifficultyFilter } from '../domain/statistics';
import { formatTime } from '../domain/format';
import type { GameResult, Puzzle } from '../domain/types';
import { useGame } from '../store/game-store';
import { Dialog } from './Dialog';

export function ArchivePage() {
  const session = useGame(s => s.session);
  const results = useGame(s => s.results);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [uncompleted, setUncompleted] = useState(false);
  const [gradedOnly, setGradedOnly] = useState(false);
  const [selected, setSelected] = useState<Puzzle | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const entries = useMemo(() => {
    const grouped = new Map<string, GameResult[]>();
    for (const result of results) {
      if (result.outcome !== 'completed') continue;
      const group = grouped.get(result.puzzleId) ?? [];
      group.push(result); grouped.set(result.puzzleId, group);
    }
    return puzzles.map((puzzle, index) => {
      const completed = grouped.get(puzzle.id) ?? [];
      const normal = completed.filter(result => !result.practice);
      return { puzzle, edition: String(index + 1).padStart(3, '0'), completed, normal,
        current: puzzle.id === session.puzzleId,
        best: normal.length ? normal.reduce((best, result) => Math.min(best, result.elapsedSeconds), Infinity) : null };
    }).sort((a, b) => Number(b.puzzle.rating !== undefined) - Number(a.puzzle.rating !== undefined));
  }, [results, session.puzzleId]);
  const visible = entries.filter(({ puzzle, edition, completed }) => (difficulty === 'all' || puzzle.difficulty === difficulty) && (!uncompleted || !completed.length) && (!gradedOnly || isTechniqueGraded(puzzle.id)) && (!search.trim() || Number(edition) === Number(search)));
  const pageCount = Math.max(1, Math.ceil(visible.length / 9));
  const currentPage = Math.min(page, pageCount - 1);
  const changePage = (next: number) => { setPage(next); document.getElementById('archive-results')?.focus(); };
  const start = () => {
    if (!selected) return;
    useGame.getState().startPuzzle(selected.id);
    location.hash = 'classic';
  };
  return <main id="main-content" tabIndex={-1} className="stats-page archive-page">
    <header className="stats-heading"><h1>Archive</h1></header>
    <label className="archive-search">Puzzle number <input type="search" inputMode="numeric" aria-label="Find puzzle number" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="e.g. 3046" /></label>
    <div className="stats-toolbar"><label className="archive-uncompleted rated-filter"><input type="checkbox" aria-label="Rated puzzles only" aria-describedby="rated-filter-help" checked={gradedOnly} onChange={event => { setGradedOnly(event.target.checked); setPage(0); }} />Rated puzzles only<span id="rated-filter-help" role="tooltip" className="rated-tooltip">Difficulty assessed by the solving techniques needed, not just the number of empty cells.</span></label><label className="archive-uncompleted"><input type="checkbox" checked={uncompleted} onChange={event => { setUncompleted(event.target.checked); setPage(0); }} />Not yet completed</label><label className="stats-difficulty">Difficulty<select aria-label="Filter archive by difficulty" value={difficulty} onChange={event => { setDifficulty(event.target.value as DifficultyFilter); setPage(0); }}><option value="all">All difficulties</option>{DIFFICULTIES.map(d => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></label></div>
    <p id="archive-results" tabIndex={-1} className="archive-count" role="status">{visible.length} {visible.length === 1 ? 'puzzle' : 'puzzles'} · {entries.filter(e => e.completed.length).length} of {puzzles.length} completed · Page {currentPage + 1} of {pageCount}</p>
    {!visible.slice(currentPage * 9, currentPage * 9 + 9).some(entry => entry.current) && <a className="secondary-button archive-return" href="#classic">Return to puzzle</a>}
    <div className="archive-grid">{visible.slice(currentPage * 9, currentPage * 9 + 9).map(({ puzzle, edition, current, completed, normal, best }) => <article className="archive-card" key={puzzle.id} aria-labelledby={`title-${puzzle.id}`}>
      <div className="archive-card-heading"><span className="eyebrow">No. {edition}</span><span className="capitalize"><i className={`difficulty-dot ${puzzle.difficulty}`} />{puzzle.difficulty}</span></div>
      <div className="archive-preview" aria-hidden="true">{puzzle.givens.flat().map((value, index) => <span key={index} className={`${index % 9 === 2 || index % 9 === 5 ? 'block-right' : ''} ${Math.floor(index / 9) === 2 || Math.floor(index / 9) === 5 ? 'block-bottom' : ''}`}>{value}</span>)}</div>
      <h2 id={`title-${puzzle.id}`}>Puzzle {edition}</h2>
      {puzzle.rating !== undefined && <span className="eyebrow" title="Sukaku Explainer difficulty rating, supplied by Sudoku Exchange">SE {puzzle.rating.toFixed(1)}</span>}
      <p className="archive-card-status">{current ? session.status === 'completed' ? 'Current board · complete' : session.started ? 'Your puzzle in progress' : 'Current puzzle · ready to begin' : completed.length ? normal.length ? 'Completed' : 'Completed in practice' : 'Not yet completed'}</p>
      <dl className="archive-record"><div><dt>Completions</dt><dd>{completed.length}</dd></div><div><dt>Best normal time</dt><dd>{best === null ? '—' : formatTime(best)}</dd></div></dl>
      {current && <a className="primary-button" href="#classic">{session.status === 'completed' ? 'Review board' : 'Return to puzzle'}<ArrowRight size={15} /></a>}
      {(!current || session.status === 'completed') && <button className={current ? 'secondary-button' : 'primary-button'} onClick={() => setSelected(puzzle)}>{completed.length ? 'Replay puzzle' : 'Start puzzle'}<ArrowRight size={15} /></button>}
    </article>)}</div>
    {pageCount > 1 && <nav className="journal-pagination" aria-label="Archive pages"><button className="secondary-button" disabled={currentPage === 0} onClick={() => changePage(currentPage - 1)}>Previous page</button><span>Page {currentPage + 1} of {pageCount}</span><button className="secondary-button" disabled={currentPage === pageCount - 1} onClick={() => changePage(currentPage + 1)}>Next page</button></nav>}
    {!visible.length && <div className="journal-empty"><p>No puzzles match these filters.</p><button className="secondary-button" onClick={() => { setDifficulty('all'); setUncompleted(false); setGradedOnly(false); setSearch(''); }}>Show all puzzles</button></div>}
    {selected && <Dialog title="Open puzzle?" eyebrow={`Classic / ${selected.difficulty} / ${selected.id}`} onClose={() => setSelected(null)}>
      <p>{session.started && session.status !== 'completed' ? 'This replaces your unfinished board. The current attempt will be saved as abandoned.' : 'Start a new attempt. Previous results are kept.'}</p>
      <div className="dialog-actions"><button className="secondary-button" onClick={() => setSelected(null)}>Cancel</button><button className="primary-button" onClick={start}>Open puzzle</button></div>
    </Dialog>}
  </main>;
}
