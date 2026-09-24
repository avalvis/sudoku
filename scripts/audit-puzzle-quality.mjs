import { writeFileSync } from 'node:fs';
import original from '../src/domain/puzzle-pack.json' with { type: 'json' };
import expanded from '../src/domain/expanded-pack.json' with { type: 'json' };
import graded from '../src/domain/graded-pack.json' with { type: 'json' };
import { gradePuzzle } from '../src/domain/grading.ts';

const puzzles = [...original, ...expanded, ...graded];
const rows = puzzles.map(p => ({ puzzle: p, grade: gradePuzzle(p.givens) }));
const lines = ['# Puzzle quality audit', '', 'Current release: 9,000 SE-rated Classic puzzles and 4,002 separate Daily puzzles. Full independent uniqueness/hash verification runs with npm run verify:puzzles. See [PUZZLE_BANK.md](PUZZLE_BANK.md) for source, rating bands, guarantees, and limitations. The tables below audit only the 45 legacy fixtures; they do not describe the new default library.', '', 'Generated with `node scripts/audit-puzzle-quality.mjs`. This audit uses naked/hidden singles, locked candidates, and naked pairs. It does not guess. Stalled puzzles remain ungraded, not automatically Hard.', '', 'All 45 legacy puzzles separately pass unique-solution verification. The original 36 retain clue-density labels for compatibility. The nine graded-v1 puzzles must solve completely with singles (Easy), locked candidates (Medium), or naked pairs (Hard), using this deterministic solver. These are technique tiers, not human-calibrated difficulty scores or a comparison with Sudoku.com.', '', '| Label | Singles | Locked candidates | Naked pairs | Beyond supported |', '| --- | ---: | ---: | ---: | ---: |'];
for (const difficulty of ['easy', 'medium', 'hard']) {
  const subset = rows.filter(row => row.puzzle.difficulty === difficulty);
  lines.push(`| ${difficulty} | ${['Singles', 'Locked candidates', 'Naked pairs', 'Beyond supported techniques'].map(t => subset.filter(r => r.grade.technique === t).length).join(' | ')} |`);
}
lines.push('', '## Per-puzzle results', '', '| Puzzle | Highest technique used | Unfilled cells |', '| --- | --- | ---: |');
for (const { puzzle, grade } of rows) lines.push(`| ${puzzle.id} | ${grade.technique} | ${grade.remaining} |`);
lines.push('', '## Production quality requirements', '', '- Admit generated puzzles only after exact uniqueness verification and a complete logical solve within the intended technique tier.', '- Reject duplicates and puzzles requiring unsupported techniques; use a validated fallback if a runtime generation budget is exhausted.', '- Calibrate tiers with human solve data and independent review. Technique complexity and dependencies matter, not just clue count.', '- Preserve existing Daily mappings and saved puzzle IDs. A future generator needs its own version and stored givens/solution, plus migration coverage.', '', 'Daily dates through 2026-09-24 retain their original mappings. The 2026-09-25 edition retains the released graded transformation. From 2026-09-26, Daily uses the separate SE-rated bank of 4,002 distinct puzzles, independently verified for uniqueness. The new bank replaces the transformed-fixture approach for that interval.', '', 'Reference: [Difficulty Rating of Sudoku Puzzles: An Overview and Evaluation](https://arxiv.org/abs/1403.7373).');
writeFileSync(new URL('../PUZZLE_QUALITY.md', import.meta.url), `${lines.join('\n')}\n`);
console.log(lines.slice(0, 11).join('\n'));
