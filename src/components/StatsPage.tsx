import { useMemo, useState } from 'react';
import { ArrowRight, Check, Clock3 } from 'lucide-react';
import { useGame } from '../store/game-store';
import { DIFFICULTIES, summarizeResults, type DifficultyFilter } from '../domain/statistics';
import { formatTime } from '../domain/format';
import type { GameResult } from '../domain/types';
import { isDaily } from '../domain/daily';

const timeOrDash = (seconds: number | null) => seconds === null ? '—' : formatTime(seconds);
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function ResultJournal({ results }: { results: GameResult[] }) {
  const [visibleCount, setVisibleCount] = useState(10);
  if (!results.length) return <div className="journal-empty"><p>No games yet.</p></div>;
  return <>
    <div className="stats-table-scroll"><table className="results-table">
      <caption className="sr-only">Game history, most recently finished first</caption>
      <thead><tr><th scope="col">Puzzle / finished</th><th scope="col">Difficulty</th><th scope="col">Outcome</th><th scope="col">Time</th><th scope="col">Mistakes</th><th scope="col">Hints used</th></tr></thead>
      <tbody>{results.slice(0, visibleCount).map(result => <tr key={result.id}>
        <th scope="row"><span className="result-puzzle">{isDaily(result.puzzleId) ? `Daily · ${result.puzzleId.slice(6)}` : `Classic · ${result.puzzleId}`}</span><span className="result-date">{result.endedAt === null ? 'Earlier game · date unavailable' : <time dateTime={new Date(result.endedAt).toISOString()}>{dateFormatter.format(result.endedAt)}</time>}</span></th>
        <td className="capitalize">{result.difficulty}</td>
        <td><span className={`result-outcome ${result.outcome}`}>{result.outcome === 'completed' && <Check size={12} />}{result.outcome === 'completed' ? 'Completed' : 'Abandoned'}</span></td>
        <td className="stats-numeric">{formatTime(result.elapsedSeconds)}</td><td className="stats-numeric">{result.mistakes}</td><td className="stats-numeric">{result.hintsUsed}</td>
      </tr>)}</tbody>
    </table></div>
    <div className="journal-pagination"><span>Showing {Math.min(visibleCount, results.length)} of {results.length} attempts</span>{visibleCount < results.length && <button className="secondary-button" onClick={() => setVisibleCount(n => n + 10)}>Show 10 more</button>}</div>
  </>;
}

export function StatsPage() {
  const results = useGame(s => s.results);
  const session = useGame(s => s.session);
  const savedGames = useGame(s => s.savedGames);
  const parked = useMemo(() => Object.values(savedGames).map(game => game.session), [savedGames]);
  const [practice, setPractice] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const stats = useMemo(() => summarizeResults(results, session, practice, difficulty, parked), [results, session, practice, difficulty, parked]);
  const byDifficulty = useMemo(() => DIFFICULTIES.map(d => ({ difficulty: d, ...summarizeResults(results, session, practice, d, parked) })), [results, session, practice, parked]);
  const rows = difficulty === 'all' ? byDifficulty : byDifficulty.filter(row => row.difficulty === difficulty);
  return <main id="main-content" tabIndex={-1} className="stats-page">
    <header className="stats-heading"><h1>Stats</h1></header>
    <div className="stats-toolbar">
      <div className="stats-mode-switch" role="group" aria-label="Results mode"><button aria-pressed={!practice} onClick={() => setPractice(false)}>Normal games</button><button aria-pressed={practice} onClick={() => setPractice(true)}>Practice games</button></div>
      <label className="stats-difficulty">Difficulty<select aria-label="Filter statistics by difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value as DifficultyFilter)}><option value="all">All difficulties</option>{DIFFICULTIES.map(d => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></label>
    </div>
    <p className="stats-mode-note">{practice ? 'Practice games only.' : 'Excludes practice games.'}</p>
    <section className="stats-summary" aria-label="Statistics summary" aria-live="polite" aria-atomic="true">
      <div className="stat-card"><span className="eyebrow">Completed puzzles</span><strong data-testid="stats-completed">{stats.completed}</strong><span>of {stats.attempts} started {stats.attempts === 1 ? 'attempt' : 'attempts'}</span></div>
      <div className="stat-card"><span className="eyebrow">Completion rate</span><strong data-testid="stats-rate">{stats.completionRate === null ? '—' : `${stats.completionRate}%`}</strong><span>{stats.active ? 'Includes your current puzzle' : 'Completed ÷ started attempts'}</span></div>
      <div className="stat-card"><span className="eyebrow">Personal best</span><strong data-testid="stats-best">{timeOrDash(stats.bestSeconds)}</strong><span>Fastest completed puzzle</span></div>
      <div className="stat-card"><span className="eyebrow">Average time</span><strong data-testid="stats-average">{timeOrDash(stats.averageSeconds)}</strong><span>Completed puzzles only</span></div>
    </section>
    <div className="stats-totals"><span><strong>{stats.abandoned}</strong> abandoned</span><span><strong>{stats.active}</strong> in progress</span><span><strong>{stats.mistakes}</strong> mistakes</span><span><strong>{stats.hintsUsed}</strong> hints used</span></div>
    {stats.active > 0 && <div className="stats-active"><Clock3 size={18} /><span>{stats.active === 1 ? 'A puzzle is in progress.' : `${stats.active} puzzles are saved in progress.`}</span><a href={isDaily(session.puzzleId) ? '#daily' : '#classic'}>Return to puzzle <ArrowRight size={15} /></a></div>}
    <section className="stats-section" aria-labelledby="difficulty-stats-title"><div className="stats-section-heading"><h2 id="difficulty-stats-title">By difficulty</h2><span className="eyebrow">{practice ? 'Practice' : 'Normal'} · {difficulty === 'all' ? 'All difficulties' : difficulty}</span></div>
      <div className="stats-table-scroll"><table className="difficulty-stats-table"><caption className="sr-only">Statistics by difficulty</caption><thead><tr><th scope="col">Difficulty</th><th scope="col">Started</th><th scope="col">Completed</th><th scope="col">Completion</th><th scope="col">Best time</th><th scope="col">Average time</th></tr></thead><tbody>{rows.map(row => <tr key={row.difficulty}><th scope="row" className="capitalize"><i className={`difficulty-dot ${row.difficulty}`} />{row.difficulty}</th><td>{row.attempts}</td><td>{row.completed}</td><td>{row.completionRate === null ? '—' : `${row.completionRate}%`}</td><td>{timeOrDash(row.bestSeconds)}</td><td>{timeOrDash(row.averageSeconds)}</td></tr>)}</tbody></table></div>
    </section>
    <section className="stats-section" aria-labelledby="journal-title"><div className="stats-section-heading"><h2 id="journal-title">History</h2><span className="eyebrow">Most recent first</span></div><ResultJournal key={`${practice}-${difficulty}`} results={stats.results} /></section>
    <details className="stats-footnote"><summary>How statistics are calculated</summary><p>An attempt starts with the first board change. Restarting or replacing it records an abandoned attempt. Saved unfinished boards count toward completion rate. Times include completed games with hints.</p></details>
  </main>;
}
