import { useEffect, useState } from 'react';
import { useGame } from '../store/game-store';
import { localDate, validDate } from '../domain/daily';

export function DailyEditionBar() {
  const date = useGame(s => s.session.puzzleId.slice(6));
  const saved = useGame(s => s.savedGames);
  const [today, setToday] = useState(localDate);
  useEffect(() => {
    const update = () => setToday(localDate());
    const timer = window.setInterval(update, 15000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const dates = Object.keys(saved).filter(id => id.startsWith('daily-')).map(id => id.slice(6)).sort().reverse();
  return <section className="daily-edition-bar" aria-label="Daily editions">
    <div className="daily-date-controls"><label>Edition date<input aria-label="Edition date" type="date" min="2026-01-01" max={today} value={date} onChange={event => { const value = event.target.value; if (validDate(value) && value <= today) useGame.getState().switchGame(`daily-${value}`); }} /></label>
      {date !== today && <button className="secondary-button" onClick={() => useGame.getState().switchGame(`daily-${today}`)}>Open today’s edition</button>}
      {dates.length > 0 && <label>Saved editions<select aria-label="Saved daily editions" value="" onChange={event => useGame.getState().switchGame(`daily-${event.target.value}`)}><option value="" disabled>Choose an edition</option>{dates.map(day => <option key={day} value={day}>{day} · {saved[`daily-${day}`].session.status === 'completed' ? 'complete' : 'saved'}</option>)}</select></label>}
    </div>
  </section>;
}
