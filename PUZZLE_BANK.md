# Rated puzzle bank — version 1

Sudoku 0.8.0 bundles **9,000 Classic puzzles** (3,000 per tier) plus **4,002 separate Daily puzzles**. All content works offline. The older 45 fixtures remain addressable for saves/replays; New Game selects only the rated bank. Archive lists rated puzzles first and supports exact puzzle-number search.

## Source and rating policy

- Dataset: [Sudoku Exchange Puzzle Bank](https://github.com/grantm/sudoku-exchange-puzzle-bank).
- Pinned revision: `d8c8ebaee0c08c412cfba96af1923dfa61c83317`.
- Dataset license: public-domain dedication / Unlicense, bundled in `public/licenses/sudoku-exchange.txt`. Only puzzle data is imported, not the separately licensed web application or generator code.
- Ratings: numerical **Sukaku Explainer** scores supplied by the dataset. We independently verify puzzle validity/uniqueness; we do not claim to have rerun Sukaku Explainer or independently certified its ratings.
- Easy: SE below 1.5; Medium: 1.5–below 2.5; Hard: 2.5–below 5.0. These retain the dataset's tier boundaries. Records are selected across available numerical scores, rather than only one score per tier. No Diabolical puzzles are imported.

These established ratings provide a stronger baseline than our original clue counts or three-technique solver. Difficulty still varies with player experience; the scores are not a claim of identical Sudoku.com grading. Human playtesting can refine our tier boundaries later without altering published boards.

## Validation and reproducibility

```powershell
node scripts/fetch-puzzle-bank.mjs     # network required, pinned revision
node scripts/import-puzzle-bank.mjs    # offline source-hash checks + validation
npm run verify:puzzles                # offline full verification; also runs in CI
```

The importer validates all 13,002 selected records with a separate bit-mask solver that enumerates up to two solutions. Every accepted puzzle must have exactly one solution. Stored solutions, record dimensions, numerical rating ranges, source hashes, and final file hashes are checked. Exact duplicates and equivalents under digit relabeling, rotation, and reflection are excluded across Classic and Daily. Full equivalence under arbitrary band/stack/row/column permutations is not claimed.

The importer writes its outputs only after all selected records pass. `src/domain/bank/manifest.json` records upstream revision, source/output SHA-256 hashes, counts, and rating distribution. The independent gameplay solver cross-checks a stratified sample in unit tests; the full-bank command verifies every record on each CI run. The original small logical grader remains available for its legacy fixture audit, not as the authority for imported bank ratings.

## Permanent identities and Daily schedule

Classic IDs are `bank-v1-1` through `bank-v1-9000`. They are appended after the existing 45 entries, preserving their edition numbers. New Game cycles through the selected tier's 3,000 bank entries; an older current puzzle transitions into that tier's bank on New Game. Restart always uses the same puzzle ID.

Daily mappings through 24 September 2026 remain v1; the previously released 25 September graded edition remains v2. The bank schedule starts **26 September 2026** and cycles Easy/Medium/Hard from a separate, fixed 4,002-record collection. There are no repeated boards or Classic overlaps during that interval. After the complete interval, the current implementation repeats the collection; append a new dated schedule before that boundary for continued non-repetition.

Do not replace/reorder bank v1 records, change its tier thresholds, or repurpose its IDs. A future content update must use a new bank version and a new schedule start date while retaining old lookup tables for saved boards and results. Existing dates must never depend on catalog size or the latest generator seed.

## Runtime design

Compact records contain givens, solution, and rating. Matrix decoding is lazy for Classic, so browsing the catalog allocates board matrices only for visible/played puzzles. Archive aggregates results once instead of scanning the entire journal for each of 9,045 entries. Daily uses direct date indexing; neither solving nor generation runs during gameplay.
