import { useEffect, useState, useSyncExternalStore } from 'react';
import { MotionConfig } from 'motion/react';
import { ArrowRight, BookOpen, Grid3X3, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useGame } from './store/game-store';
import { SudokuBoard } from './components/Board';
import { GameControlPanel } from './components/Controls';
import { DialogHost, type RequestedDialog } from './components/DialogHost';
import { useGameLifecycle } from './hooks/use-game-lifecycle';
import { puzzles } from './domain/puzzles';
import { StatsPage } from './components/StatsPage';
import { ArchivePage } from './components/ArchivePage';

const tabs = ['Daily', 'Classic', 'Stats', 'Archive'] as const;
const readRoute = () => { const route = location.hash.slice(1).toLowerCase(); return tabs.find(t => t.toLowerCase() === route) ?? 'Classic'; };
const subscribeRoute = (callback: () => void) => { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback); };

function AppHeader({ route }: { route: string }) {
  const theme = useGame(s => s.theme);
  const sound = useGame(s => s.soundEnabled);
  const { toggleTheme, toggleSound } = useGame.getState();
  return <header className="app-header"><div className="header-inner">
    <a className="masthead" href="#classic" aria-label="Editorial Sudoku home"><span className="brand-mark"><Grid3X3 size={24} strokeWidth={1.2} /></span><span><span className="brand-name">Editorial<span>.</span></span><span className="brand-tagline">The puzzle edition</span></span></a>
    <nav aria-label="Main navigation">{tabs.map(tab => <a key={tab} href={`#${tab.toLowerCase()}`} aria-current={route === tab ? 'page' : undefined}>{tab}</a>)}</nav>
    <div className="header-actions"><button className="icon-button" onClick={toggleSound} aria-label={sound ? 'Mute sound' : 'Enable sound'} title={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button><span className="header-divider" /><button className="icon-button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} title="Switch theme">{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button></div>
  </div></header>;
}

function ClassicWorkspace({ open }: { open: (dialog: RequestedDialog) => void }) {
  const puzzleId = useGame(s => s.session.puzzleId);
  const edition = String(puzzles.findIndex(p => p.id === puzzleId) + 1).padStart(3, '0');
  return <main id="main-content" tabIndex={-1} className="main-content">
    <div className="page-heading"><div><span className="eyebrow">The classic collection <span className="heading-dot">/</span> No. {edition}</span><h1>Sudoku<span className="title-period">.</span></h1></div><p>A quiet moment.<br /><em>A sharper mind.</em></p></div>
    <div className="game-workspace"><SudokuBoard /><GameControlPanel onNewGame={() => open('new')} onRestart={() => open('restart')} onDifficulty={() => open('difficulty')} /></div>
    <div className="edition-footer"><span>Made for a little uninterrupted thought.</span><span>One square. One possibility. One more.</span></div>
  </main>;
}

function FutureFeaturePage() {
  return <main id="main-content" tabIndex={-1} className="future-page"><BookOpen size={38} strokeWidth={1.2} /><span className="eyebrow">Coming in a future edition</span><h1>Tomorrow’s ritual.</h1><p>A fresh puzzle for every morning. Our daily edition is still on the drawing board.</p><a className="primary-button" href="#classic">Return to Classic <ArrowRight size={16} /></a></main>;
}

export default function App() {
  const route = useSyncExternalStore(subscribeRoute, readRoute);
  const theme = useGame(s => s.theme);
  const hydrated = useGame(s => s.hydrated);
  const storageError = useGame(s => s.storageError);
  const announcement = useGame(s => s.announcement);
  const [dialog, setDialog] = useState<RequestedDialog>(null);
  useGameLifecycle(route === 'Classic');
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  return <MotionConfig reducedMotion="user"><a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <AppHeader route={route} />
    {storageError && <div className="storage-notice" role="alert">{storageError}</div>}
    {!hydrated ? <main className="loading-page"><span className="eyebrow">Opening your edition…</span></main> : route === 'Classic' ? <ClassicWorkspace open={setDialog} /> : route === 'Stats' ? <StatsPage /> : route === 'Archive' ? <ArchivePage /> : <FutureFeaturePage />}
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    {hydrated && <DialogHost key={dialog ?? 'session'} requested={dialog} close={() => setDialog(null)} classic={route === 'Classic'} />}
  </MotionConfig>;
}
