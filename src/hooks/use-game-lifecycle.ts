import { useEffect } from 'react';
import { useGame } from '../store/game-store';
import type { Digit } from '../domain/types';

export function useGameLifecycle(classic: boolean) {
  const hydrated = useGame(s => s.hydrated);
  useEffect(() => {
    const pause = () => useGame.getState().pause();
    const visibility = () => { if (document.hidden) pause(); };
    const interval = window.setInterval(() => useGame.getState().checkpoint(), 5000);
    window.addEventListener('blur', pause);
    window.addEventListener('pagehide', pause);
    document.addEventListener('visibilitychange', visibility);
    let unlisten: (() => void) | undefined;
    let disposed = false;
    if ('__TAURI_INTERNALS__' in window) {
      void import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
        const stop = await getCurrentWindow().onFocusChanged(({ payload }) => { if (!payload) pause(); });
        if (disposed) stop(); else unlisten = stop;
      }).catch(() => { /* DOM focus lifecycle remains available. */ });
    }
    return () => {
      disposed = true; unlisten?.(); clearInterval(interval);
      window.removeEventListener('blur', pause); window.removeEventListener('pagehide', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (hydrated && (!classic || document.hidden)) useGame.getState().pause();
    const onKey = (event: KeyboardEvent) => {
      if (!classic || event.repeat || document.querySelector('dialog[open]')) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const s = useGame.getState();
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) { event.preventDefault(); s.undo(); return; }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^Numpad[1-9]$/.test(event.code)) { event.preventDefault(); s.input(Number(event.code.slice(-1)) as Digit); return; }
      const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (arrows[event.key]) {
        if (!['playing', 'completed'].includes(s.session.status)) return;
        event.preventDefault();
        const [dr, dc] = arrows[event.key];
        const row = Math.max(0, Math.min(8, s.selected.row + dr)), col = Math.max(0, Math.min(8, s.selected.col + dc));
        s.select({ row, col }); document.getElementById(`cell-${row}-${col}`)?.focus();
      } else if (/^[1-9]$/.test(event.key)) { event.preventDefault(); s.input(Number(event.key) as Digit); }
      else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); s.erase(); }
      else if (event.key.toLowerCase() === 'n') { event.preventDefault(); s.toggleNotes(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [classic, hydrated]);
}
