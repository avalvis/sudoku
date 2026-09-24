# Puzzle quality audit

Current release: 9,000 SE-rated Classic puzzles and 4,002 separate Daily puzzles. Full independent uniqueness/hash verification runs with npm run verify:puzzles. See [PUZZLE_BANK.md](PUZZLE_BANK.md) for source, rating bands, guarantees, and limitations. The tables below audit only the 45 legacy fixtures; they do not describe the new default library.

Generated with `node scripts/audit-puzzle-quality.mjs`. This audit uses naked/hidden singles, locked candidates, and naked pairs. It does not guess. Stalled puzzles remain ungraded, not automatically Hard.

All 45 legacy puzzles separately pass unique-solution verification. The original 36 retain clue-density labels for compatibility. The nine graded-v1 puzzles must solve completely with singles (Easy), locked candidates (Medium), or naked pairs (Hard), using this deterministic solver. These are technique tiers, not human-calibrated difficulty scores or a comparison with Sudoku.com.

| Label | Singles | Locked candidates | Naked pairs | Beyond supported |
| --- | ---: | ---: | ---: | ---: |
| easy | 15 | 0 | 0 | 0 |
| medium | 11 | 3 | 0 | 1 |
| hard | 9 | 0 | 3 | 3 |

## Per-puzzle results

| Puzzle | Highest technique used | Unfilled cells |
| --- | --- | ---: |
| easy-1 | Singles | 0 |
| easy-2 | Singles | 0 |
| easy-3 | Singles | 0 |
| medium-1 | Singles | 0 |
| medium-2 | Singles | 0 |
| medium-3 | Singles | 0 |
| hard-1 | Singles | 0 |
| hard-2 | Singles | 0 |
| hard-3 | Singles | 0 |
| easy-4 | Singles | 0 |
| easy-5 | Singles | 0 |
| easy-6 | Singles | 0 |
| easy-7 | Singles | 0 |
| easy-8 | Singles | 0 |
| easy-9 | Singles | 0 |
| easy-10 | Singles | 0 |
| easy-11 | Singles | 0 |
| easy-12 | Singles | 0 |
| medium-4 | Singles | 0 |
| medium-5 | Singles | 0 |
| medium-6 | Singles | 0 |
| medium-7 | Singles | 0 |
| medium-8 | Singles | 0 |
| medium-9 | Singles | 0 |
| medium-10 | Singles | 0 |
| medium-11 | Singles | 0 |
| medium-12 | Beyond supported techniques | 33 |
| hard-4 | Singles | 0 |
| hard-5 | Singles | 0 |
| hard-6 | Singles | 0 |
| hard-7 | Beyond supported techniques | 52 |
| hard-8 | Beyond supported techniques | 41 |
| hard-9 | Singles | 0 |
| hard-10 | Beyond supported techniques | 24 |
| hard-11 | Singles | 0 |
| hard-12 | Singles | 0 |
| graded-v1-easy-1 | Singles | 0 |
| graded-v1-easy-2 | Singles | 0 |
| graded-v1-easy-3 | Singles | 0 |
| graded-v1-medium-1 | Locked candidates | 0 |
| graded-v1-medium-2 | Locked candidates | 0 |
| graded-v1-medium-3 | Locked candidates | 0 |
| graded-v1-hard-1 | Naked pairs | 0 |
| graded-v1-hard-2 | Naked pairs | 0 |
| graded-v1-hard-3 | Naked pairs | 0 |

## Production quality requirements

- Admit generated puzzles only after exact uniqueness verification and a complete logical solve within the intended technique tier.
- Reject duplicates and puzzles requiring unsupported techniques; use a validated fallback if a runtime generation budget is exhausted.
- Calibrate tiers with human solve data and independent review. Technique complexity and dependencies matter, not just clue count.
- Preserve existing Daily mappings and saved puzzle IDs. A future generator needs its own version and stored givens/solution, plus migration coverage.

Daily dates through 2026-09-24 retain their original mappings. The 2026-09-25 edition retains the released graded transformation. From 2026-09-26, Daily uses the separate SE-rated bank of 4,002 distinct puzzles, independently verified for uniqueness. The new bank replaces the transformed-fixture approach for that interval.

Reference: [Difficulty Rating of Sudoku Puzzles: An Overview and Evaluation](https://arxiv.org/abs/1403.7373).
