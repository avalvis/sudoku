import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';

export function Opening({ finish }: { finish: () => void }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const timer = window.setTimeout(finish, reduced ? 650 : 1500);
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); finish(); } };
    window.addEventListener('keydown', key);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', key); };
  }, [finish, reduced]);
  return <div className="opening" data-testid="opening"><div className="opening-content"><img src="/favicon.svg" width="88" height="88" alt="" /><h1>Sudoku</h1><p>Developed by <strong>Antonis Valvis</strong></p></div><button className="opening-skip" onClick={finish}>Skip</button></div>;
}
