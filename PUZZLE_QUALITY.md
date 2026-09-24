# Puzzle quality audit

Generated with `node scripts/audit-puzzle-quality.mjs`. This audit uses naked/hidden singles, locked candidates, and naked pairs. It does not guess. Stalled puzzles remain ungraded, not automatically Hard.

All 36 bundled puzzles separately pass unique-solution verification. Current display difficulty labels remain clue-density labels for compatibility; this report is not a professional certification or a comparison with Sudoku.com.

| Label | Singles | Locked candidates | Naked pairs | Beyond supported |
| --- | ---: | ---: | ---: | ---: |
| easy | 12 | 0 | 0 | 0 |
| medium | 11 | 0 | 0 | 1 |
| hard | 9 | 0 | 0 | 3 |

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

## Production quality requirements

- Admit generated puzzles only after exact uniqueness verification and a complete logical solve within the intended technique tier.
- Reject duplicates and puzzles requiring unsupported techniques; use a validated fallback if a runtime generation budget is exhausted.
- Calibrate tiers with human solve data and independent review. Technique complexity and dependencies matter, not just clue count.
- Preserve existing Daily mappings and saved puzzle IDs. A future generator needs its own version and stored givens/solution, plus migration coverage.

The current Daily mode safely produces uniquely solvable transformations of the original nine fixtures. It does not provide independently generated, professionally calibrated daily challenges. No parity with Sudoku.com is claimed.

Reference: [Difficulty Rating of Sudoku Puzzles: An Overview and Evaluation](https://arxiv.org/abs/1403.7373).
