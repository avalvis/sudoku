import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Check, Pencil } from 'lucide-react';
import { DIGITS, type Digit } from '../domain/types';
import { tutorialConflict, tutorialSteps } from '../domain/tutorial';
import { useGame } from '../store/game-store';
import { isDaily } from '../domain/daily';

export function TutorialPage() {
  const daily = useGame(s => isDaily(s.session.puzzleId));
  const returnRoute = daily ? '#daily' : '#classic';
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<Digit | null>(null);
  const [notes, setNotes] = useState<Digit[]>([]);
  const [notesOn, setNotesOn] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [conflicts, setConflicts] = useState<number[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const complete = step === tutorialSteps.length;
  const lesson = tutorialSteps[Math.min(step, tutorialSteps.length - 1)];
  const done = lesson.notes ? notes.length === 2 && notes.includes(2) && notes.includes(9) : answer === lesson.answer;
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  const go = (next: number) => { setStep(next); setAnswer(null); setNotes([]); setNotesOn(false); setFeedback(''); setConflicts([]); };
  const enter = (digit: Digit) => {
    if (complete || done) return;
    if (lesson.notes) {
      if (!notesOn) { setFeedback('Turn Notes on first.'); return; }
      if (digit !== 2 && digit !== 9) { const conflict = tutorialConflict(lesson.givens, lesson.target, digit); setFeedback(conflict.message); setConflicts(conflict.cells); return; }
      setNotes(previous => previous.includes(digit) ? previous.filter(n => n !== digit) : [...previous, digit].sort());
      setFeedback(''); setConflicts([]); return;
    }
    setAnswer(digit);
    if (digit === lesson.answer) { setFeedback(''); setConflicts([]); }
    else { const conflict = tutorialConflict(lesson.givens, lesson.target, digit); setFeedback(conflict.message); setConflicts(conflict.cells); }
  };
  const toggleNotes = () => { if (lesson.notes && !done) { setNotesOn(value => !value); setFeedback(''); } };
  const key = (event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || complete) return;
    if (/^Numpad[1-9]$/.test(event.code)) { event.preventDefault(); enter(Number(event.code.slice(-1)) as Digit); }
    else if (/^[1-9]$/.test(event.key)) { event.preventDefault(); enter(Number(event.key) as Digit); }
    else if (event.key.toLowerCase() === 'n') { event.preventDefault(); toggleNotes(); }
    else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); setAnswer(null); setNotes([]); setFeedback(''); setConflicts([]); }
  };
  return <main id="main-content" tabIndex={-1} className="tutorial-page" onKeyDown={key}>
    <header className="tutorial-heading"><h1>How to play</h1><a href={returnRoute}><ArrowLeft size={15} aria-hidden="true" />Back to game</a></header>
    {complete ? <section className="tutorial-complete">
      <Check size={32} aria-hidden="true" /><h2 ref={heading} tabIndex={-1}>Ready to play</h2>
      <p>Fill every row, column and 3×3 box with 1–9, without repeating a number. Printed numbers stay fixed. Use notes when more than one number could fit.</p>
      <div className="dialog-actions"><button className="secondary-button" onClick={() => go(0)}>Try again</button><a className="primary-button" href={returnRoute}>Return to puzzle</a></div>
    </section> : <div className="tutorial-workspace">
      <div className="tutorial-board-region">
        <div className="board-frame"><div role="grid" aria-label="Practice example" aria-rowcount={9} aria-colcount={9} className="sudoku-board">
          {Array.from({ length: 9 }, (_, r) => <div role="row" className="board-row" key={r}>{Array.from({ length: 9 }, (_, c) => {
            const i = r * 9 + c, active = i === lesson.target, given = lesson.givens[i];
            const value = active ? answer : given;
            const invalid = conflicts.includes(i) || (active && answer !== null && !done);
            const state = invalid ? 'conflict' : active ? 'selected' : lesson.guide.includes(i) ? 'guide' : 'rest';
            return <button key={i} role="gridcell" disabled={!active} tabIndex={active ? 0 : -1} aria-selected={active} aria-readonly={!active} aria-invalid={invalid || undefined}
              aria-label={`Row ${r + 1}, column ${c + 1}, ${value ? `${value}${given ? ', given' : ''}` : active && notes.length ? `notes ${notes.join(', ')}` : 'empty'}${active ? ', your turn' : ''}`}
              className={`cell ${active ? 'active entered' : 'given'} ${c === 2 || c === 5 ? 'block-right' : ''} ${r === 2 || r === 5 ? 'block-bottom' : ''}`}
              style={{ backgroundColor: `var(--cell-${state})` }} data-state={state} data-testid={active ? 'tutorial-target' : undefined}>
              {value ?? (active && notes.length > 0 ? <span className="pencil-grid" aria-hidden="true">{DIGITS.map(d => <span key={d}>{notes.includes(d) ? d : ''}</span>)}</span> : active ? <span className="tutorial-question" aria-hidden="true">?</span> : '')}
            </button>;
          })}</div>)}
        </div></div>
        <p className="tutorial-caption">Practice example · Fill only the outlined cell.</p>
      </div>
      <section className="tutorial-instructions" aria-labelledby="lesson-heading">
        <p className="eyebrow">Step {step + 1} of {tutorialSteps.length}</p>
        <progress aria-label="Tutorial progress" value={step} max={tutorialSteps.length} />
        <h2 id="lesson-heading" ref={heading} tabIndex={-1}>{lesson.title}</h2>
        <p>{lesson.instruction}</p>
        {step === 0 && <p className="tutorial-tip">Printed numbers stay fixed. No maths needed.</p>}
        {lesson.notes && <button className={`tutorial-notes ${notesOn ? 'on' : ''}`} aria-pressed={notesOn} onClick={toggleNotes} disabled={done}><Pencil size={16} aria-hidden="true" />Notes <span className="state-pill">{notesOn ? 'ON' : 'OFF'}</span></button>}
        <div className="tutorial-keypad" role="group" aria-label="Practice numbers">{DIGITS.map(d => <button key={d} disabled={done} onClick={() => enter(d)} aria-label={`Enter ${d}`} aria-pressed={lesson.notes ? notes.includes(d) : undefined}>{d}</button>)}</div>
        <p className={`tutorial-feedback ${done ? 'success' : feedback ? 'error' : ''}`} role="status" aria-live="polite">{done ? lesson.success : feedback || (lesson.notes ? 'Use Notes or press N, then choose numbers.' : 'Choose a number, or type it on your keyboard.')}</p>
        <div className="tutorial-actions"><button className="secondary-button" disabled={step === 0} onClick={() => go(step - 1)}>Back</button><button className="primary-button" disabled={!done} onClick={() => go(step + 1)}>{step === tutorialSteps.length - 1 ? 'Finish' : 'Next'}</button></div>
        <p className="tutorial-safe">Your game is paused. Practice does not change it.</p>
      </section>
    </div>}
  </main>;
}
