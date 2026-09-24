import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MotionConfig } from 'motion/react';
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useGame } from './store/game-store';
import { SudokuBoard } from './components/Board';
import { GameControlPanel } from './components/Controls';
import { DialogHost, type RequestedDialog } from './components/DialogHost';
import { useGameLifecycle } from './hooks/use-game-lifecycle';
import { puzzles } from './domain/puzzles';
import { StatsPage } from './components/StatsPage';
import { ArchivePage } from './components/ArchivePage';
import { isDaily, localDate } from './domain/daily';
import { DailyEditionBar } from './components/DailyEditionBar';
import { Opening } from './components/Opening';
import { TutorialPage } from './components/TutorialPage';

const tabs = ['Daily', 'Classic', 'Stats', 'Archive', 'How to play'] as const;
const tabRoute = (tab: string) => tab.toLowerCase().replaceAll(' ', '-');
const readRoute = () => { const route = location.hash.slice(1).toLowerCase(); return tabs.find(t => tabRoute(t) === route) ?? 'Classic'; };
const subscribeRoute = (callback: () => void) => { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback); };

function AppHeader({ route }: { route: string }) {
  const theme = useGame(s => s.theme);
  const sound = useGame(s => s.soundEnabled);
  const { toggleTheme, toggleSound } = useGame.getState();
  return <header className="app-header"><div className="header-inner">
    <a className="masthead" href="#classic" aria-label="Sudoku home"><img src="/favicon.svg" width="40" height="40" alt="" /><span className="brand-name">Sudoku</span></a>
    <nav aria-label="Main navigation">{tabs.map(tab => <a key={tab} href={`#${tabRoute(tab)}`} aria-current={route === tab ? 'page' : undefined}>{tab}</a>)}</nav>
    <div className="header-actions"><button className="icon-button" onClick={toggleSound} aria-label={sound ? 'Mute sound' : 'Enable sound'} title={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button><span className="header-divider" /><button className="icon-button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} title="Switch theme">{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button></div>
  </div></header>;
}

function ClassicWorkspace({ open }: { open: (dialog: RequestedDialog) => void }) {
  const puzzleId = useGame(s => s.session.puzzleId);
  const edition = String(puzzles.findIndex(p => p.id === puzzleId) + 1).padStart(3, '0');
  const daily = isDaily(puzzleId);
  const openNewGame = useCallback(() => open('new'), [open]);
  return <main id="main-content" tabIndex={-1} className={`main-content ${daily ? 'daily-game' : ''}`}>
    <div className="page-heading"><h1>{daily ? 'Daily' : 'Classic'}</h1>{!daily && <span className="eyebrow">No. {edition}</span>}</div>
    {daily && <DailyEditionBar />}
    <div className="game-workspace"><SudokuBoard onNewGame={openNewGame} /><GameControlPanel onNewGame={openNewGame} onRestart={() => open('restart')} onDifficulty={() => open('difficulty')} /></div>
  </main>;
}

export default function App() {
  const route = useSyncExternalStore(subscribeRoute, readRoute);
  const theme = useGame(s => s.theme);
  const hydrated = useGame(s => s.hydrated);
  const storageError = useGame(s => s.storageError);
  const announcement = useGame(s => s.announcement);
  const [dialog, setDialog] = useState<RequestedDialog>(null);
  const [opening, setOpening] = useState(true);
  const resumeAfterOpening = useRef(false);
  const finishOpening = useCallback(() => {
    setOpening(false);
    if (resumeAfterOpening.current && (readRoute() === 'Classic' || readRoute() === 'Daily')) useGame.getState().resume();
    resumeAfterOpening.current = false;
  }, []);
  useLayoutEffect(() => {
    if (!hydrated) return;
    if (route === 'Classic' || route === 'Archive') useGame.getState().switchGame('classic');
    else if (route === 'Daily' && !isDaily(useGame.getState().session.puzzleId)) useGame.getState().switchGame(`daily-${localDate()}`);
  }, [route, hydrated]);
  useLayoutEffect(() => {
    if (hydrated && opening && useGame.getState().session.status === 'playing') { resumeAfterOpening.current = true; useGame.getState().pause(); }
  }, [hydrated, opening]);
  useGameLifecycle(!opening && (route === 'Classic' || route === 'Daily'));
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  if (opening) return <Opening finish={finishOpening} />;
  return <MotionConfig reducedMotion="user"><a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <AppHeader route={route} />
    {storageError && <div className="storage-notice" role="alert">{storageError}</div>}
    {!hydrated ? <main className="loading-page"><span className="eyebrow">Loading…</span></main> : route === 'Classic' || route === 'Daily' ? <ClassicWorkspace open={setDialog} /> : route === 'Stats' ? <StatsPage /> : route === 'Archive' ? <ArchivePage /> : <TutorialPage />}
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    {hydrated && <DialogHost key={`${route}-${dialog ?? 'session'}`} requested={dialog} close={() => setDialog(null)} classic={route === 'Classic' || route === 'Daily'} />}
  </MotionConfig>;
}
