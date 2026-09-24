import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Feather, LockKeyhole, Check } from 'lucide-react';
import { useGame } from '../store/game-store';
import { cellId, findConflicts, isPeer, noteConflicts } from '../domain/rules';
import { DIGITS, type CellPosition } from '../domain/types';

export const SudokuBoard = memo(function SudokuBoard() {
  const board = useGame(s => s.board);
  const selected = useGame(s => s.selected);
  const select = useGame(s => s.select);
  const status = useGame(s => s.session.status);
  const conflictEvent = useGame(s => s.conflictEvent);
  const reduceMotion = useReducedMotion();
  const conflicts = useMemo(() => findConflicts(board), [board]);
  const selectedValue = board[selected.row][selected.col].value;
  const obscured = status === 'paused' || status === 'mistake-limit';
  return <div className="board-region">
    <div className="board-frame" data-testid="board-frame">
      <div role="grid" aria-label="Sudoku puzzle" aria-rowcount={9} aria-colcount={9} className={`sudoku-board ${obscured ? 'obscured' : ''}`} inert={obscured}>
        {board.map((row, r) => <div role="row" key={r} className="board-row">
          {row.map((cell, c) => {
            const at: CellPosition = { row: r, col: c };
            const active = selected.row === r && selected.col === c;
            const conflict = conflicts.has(cellId(r, c));
            const state = conflict ? 'conflict' : active ? 'selected' : selectedValue && cell.value === selectedValue ? 'match' : isPeer(selected, at) ? 'guide' : 'rest';
            const label = `Row ${r + 1}, column ${c + 1}, ${cell.value ? `${cell.value}${cell.given ? ', given' : ''}` : cell.notes.length ? `notes ${cell.notes.join(', ')}` : 'empty'}${conflict ? ', conflict' : ''}`;
            return <motion.button
              role="gridcell" key={c} id={`cell-${r}-${c}`} data-testid={`cell-${r}-${c}`}
              aria-label={label} aria-selected={active} aria-readonly={cell.given} aria-invalid={conflict || undefined}
              aria-rowindex={r + 1} aria-colindex={c + 1}
              tabIndex={active ? 0 : -1} onClick={() => select(at)} onFocus={() => { if (!active) select(at); }}
              className={`cell ${cell.given ? 'given' : 'entered'} ${active ? 'active' : ''} ${c === 2 || c === 5 ? 'block-right' : ''} ${r === 2 || r === 5 ? 'block-bottom' : ''}`}
              data-state={state}
              animate={{ backgroundColor: `var(--cell-${state})` }} transition={{ duration: reduceMotion ? 0 : 0.12 }}
            >
              {cell.value !== null ? <motion.span key={conflict && active ? conflictEvent : 'digit'}
                initial={false} animate={{ x: conflict && active && !reduceMotion ? [0, -3, 3, -2, 2, 0] : 0 }} transition={{ duration: 0.25 }}>
                {cell.value}
              </motion.span> : <span className="pencil-grid" aria-hidden="true">
                {DIGITS.map(d => <span key={d} className={cell.notes.includes(d) && noteConflicts(board, at, d) ? 'invalid-note' : ''}>{cell.notes.includes(d) ? d : ''}</span>)}
              </span>}
            </motion.button>;
          })}
        </div>)}
      </div>
      {obscured && <div className="board-cover" aria-hidden="true"><Feather size={36} /><span>Paused</span></div>}
    </div>
    <div className="board-caption">
      <span><Feather size={14} className="ochre" /> Row {selected.row + 1}<span className="caption-dot">·</span>Column {selected.col + 1}</span>
      <span>{status === 'completed' ? <><Check size={13} /> Complete</> : board[selected.row][selected.col].given ? <><LockKeyhole size={12} /> Printed number</> : ''}</span>
    </div>
  </div>;
});
