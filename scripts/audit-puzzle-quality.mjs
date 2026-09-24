import { writeFileSync } from 'node:fs';
import original from '../src/domain/puzzle-pack.json' with { type: 'json' };
import expanded from '../src/domain/expanded-pack.json' with { type: 'json' };
import { gradePuzzle } from '../src/domain/grading.ts';

const puzzles = [...original, ...expanded];
const rows = puzzles.map(p => ({ puzzle: p, grade: gradePuzzle(p.givens) }));
const lines = ['# Puzzle quality audit', '', 'Generated with `node scripts/audit-puzzle-quality.mjs`. This audit uses naked/hidden singles, locked candidates, and naked pairs. It does not guess. Stalled puzzles remain ungraded, not automatically Hard.', '', 'All 36 bundled puzzles separately pass unique-solution verification. Current display difficulty labels remain clue-density labels for compatibility; this report is not a professional certification or a comparison with Sudoku.com.', '', '| Label | Singles | Locked candidates | Naked pairs | Beyond supported |', '| --- | ---: | ---: | ---: | ---: |'];
for (const difficulty of ['easy', 'medium', 'hard']) {
  const subset = rows.filter(row => row.puzzle.difficulty === difficulty);
  lines.push(`| ${difficulty} | ${['Singles', 'Locked candidates', 'Naked pairs', 'Beyond supported techniques'].map(t => subset.filter(r => r.grade.technique === t).length).join(' | ')} |`);
}
lines.push('', '## Per-puzzle results', '', '| Puzzle | Highest technique used | Unfilled cells |', '| --- | --- | ---: |');
for (const { puzzle, grade } of rows) lines.push(`| ${puzzle.id} | ${grade.technique} | ${grade.remaining} |`);
lines.push('', '## Production quality requirements', '', '- Admit generated puzzles only after exact uniqueness verification and a complete logical solve within the intended technique tier.', '- Reject duplicates and puzzles requiring unsupported techniques; use a validated fallback if a runtime generation budget is exhausted.', '- Calibrate tiers with human solve data and independent review. Technique complexity and dependencies matter, not just clue count.', '- Preserve existing Daily mappings and saved puzzle IDs. A future generator needs its own version and stored givens/solution, plus migration coverage.', '', 'The current Daily mode safely produces uniquely solvable transformations of the original nine fixtures. It does not provide independently generated, professionally calibrated daily challenges. No parity with Sudoku.com is claimed.', '', 'Reference: [Difficulty Rating of Sudoku Puzzles: An Overview and Evaluation](https://arxiv.org/abs/1403.7373).');
writeFileSync(new URL('../PUZZLE_QUALITY.md', import.meta.url), `${lines.join('\n')}\n`);
console.log(lines.slice(0, 11).join('\n'));
