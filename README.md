# Sudoku

A desktop-first, offline Sudoku application inspired by newspaper puzzle pages. Built with React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Motion, and Tauri v2 for Windows/WebView2.

## Run locally

Use Node.js 24 or newer and npm. For native development, also install the stable Rust MSVC toolchain, Visual Studio C++ Build Tools with a Windows SDK, and WebView2. Building MSI packages requires the Windows VBSCRIPT optional feature. See [Tauri's prerequisites](https://v2.tauri.app/start/prerequisites/).

```powershell
npm ci
npm run dev            # http://127.0.0.1:1420
npm run desktop:dev    # native Windows app, starts Vite automatically
```

Do not run both development commands at the same time; both use port 1420.

## Build and verify

```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run desktop:build
```

The web build is in `dist/`. Windows installers are generated under:

- `src-tauri/target/release/bundle/nsis/` — per-user `.exe` installer.
- `src-tauri/target/release/bundle/msi/` — per-machine WiX `.msi` installer.

Both installers include the WebView2 offline installer, which makes them substantially larger than the application executable. The application, fonts, and puzzle pack require no network connection at runtime. Building the installers requires access to npm, crates.io, and the Windows installer downloads. Installers are unsigned development artifacts; code signing and public distribution are not configured.

The Windows CI workflow runs lint, TypeScript, unit/component tests, browser tests, native packaging, and an administrator MSI installation/uninstallation check, then uploads installers and checksums. It does not publish releases. The MSI check can also run from an administrator PowerShell with `./scripts/verify-msi.ps1` on an isolated Windows machine.

Version 0.6.0 uses the name **Sudoku**, publisher **Antonis Valvis**, and website **https://www.avalvis.gr**. Windows 10/11 x64 is the desktop target. Both installers include offline WebView2 provisioning. The internal identifier `dev.editorial.sudoku`, storage key, and MSI upgrade code remain unchanged to preserve existing saves and upgrade identity. The NSIS installer migrates previous Editorial Sudoku installations before installing the renamed application.

## Gameplay

- Click a cell, then use the keypad, number row, or numpad. Numpad digit keys enter numbers even with Num Lock off.
- Arrow keys move selection. `N` toggles notes. Delete/Backspace erases. Ctrl/Cmd+Z undoes.
- Printed numbers are immutable. Re-entering the same number does nothing. Notes can be edited only in empty cells.
- Duplicate row, column, or block entries highlight every involved cell. One invalid entry adds one mistake, even if it conflicts in several units.
- At three mistakes, restart or continue without a limit in Practice. Undo restores the board, not consumed hints, mistakes, or elapsed time.
- Two hints per puzzle fill the selected empty/incorrect editable cell; otherwise the first eligible cell is used.
- The clock pauses when the app loses focus, becomes hidden, leaves Classic, or restores a saved game. Resume is explicit.
- A full, valid board completes the puzzle. Review it or start the next puzzle. New games cycle through 3,000 SE-rated puzzles at the selected difficulty. The 45 older fixtures remain available for saved games and replays.

## Architecture

| Area | Responsibility |
| --- | --- |
| `src/domain/` | Platform-independent types, puzzle fixtures, rules, bounded solution enumeration, and saved-state validation |
| `src/store/` | Zustand actions, move transactions, session transitions, preferences, and persistence orchestration |
| `src/services/` | IndexedDB storage adapter and optional Web Audio synthesizer |
| `src/components/` | Board, control panel, and accessible native dialogs |
| `src/hooks/` | Keyboard and browser/native focus lifecycle |
| `src-tauri/` | Minimal Windows shell, capabilities, CSP, and installer configuration |

State changes go through guarded store actions. Each effective move records the before/after cells as one transaction. Conflicts and counts are derived from the current board; they are not persisted. The store supports multiple-cell transactions for future rule extensions. Timer rendering is isolated from board subscriptions.

The runtime clock uses `performance.now()`. Whole seconds are checkpointed on moves, pause, and every five seconds, retaining fractional time between checkpoints. A forced process termination can lose the most recent uncheckpointed seconds or an in-flight IndexedDB transaction.

The version-3 IndexedDB save contains the board, selection, notes mode, full undo history, session, preferences, result journal, and separately saved editions. Results and board state are committed in one snapshot; stable attempt IDs prevent duplicate completion records. Restore validates cell invariants, immutable givens, session values, the history chain, and result consistency. Corrupt or unsupported saves are preserved until the player explicitly chooses Start Fresh. If storage is unavailable or full, play continues with a visible warning and later writes retry. There is no artificial Undo or journal limit; practical capacity is bounded by available memory/storage.

Version-1 saves migrate automatically with board, notes, Undo, time, and preferences intact. A saved completed puzzle is imported once. Earlier versions did not retain dates or older results, so imported dates are labeled unavailable and previously discarded games cannot be reconstructed.

## Stats and personal journal

Stats shows completion rate, completed puzzles, best and average completion times, mistakes, hints, difficulty breakdowns, and paginated history. Normal and Practice games have separate views, with an optional difficulty filter. All data stays on this device.

An attempt starts on the first effective board change, including a note or hint. Replacing or restarting a started unfinished puzzle records an abandoned attempt; pausing, closing, or navigating away does not. Completion rate includes all started unfinished boards in its denominator, including saved daily editions. Undoing every move does not erase the attempt. Continue Practice classifies the whole attempt as Practice. Times include completed games with hints; mistakes and hints remain cumulative. Results are ordered by finalization, even if the system clock changes.

Web Audio creates its context only after a user gesture. Sounds use short oscillator/gain envelopes, disconnect finished nodes, and fail harmlessly if audio is unavailable. Audio objects never enter persisted state.

## Archive

The Archive browses 9,045 Classic puzzles (9,000 rated plus 45 legacy) in pages of nine. Rated puzzles appear first. It supports exact puzzle-number search, board previews, difficulty filters, and a not-yet-completed filter. Filters return to the first page. Cards show completion counts (including Practice) and the best normal-game time. Returning to the current board preserves its progress; starting another puzzle or replay requires confirmation. Replays have new attempt IDs and retain all prior journal entries. The Archive shares the Classic engine and version-3 save format.

## Daily editions

Daily opens the device's current local date and works entirely offline. The date picker supports editions from 1 January 2026 through today; a saved-editions selector returns to earlier boards. Each date has a fixed difficulty. At midnight, the open board stays in place and an explicit button offers today's edition. There is no server clock or online leaderboard.

Daily dates through 24 September 2026 use deterministic digit, row, column, band, stack, and transpose transformations of the nine original validated base fixtures. These preserve unique solvability; they are variations of the existing pack, not independently authored daily puzzles. The released 25 September 2026 edition retains its technique-graded mapping. From 26 September 2026, Daily uses a separate fixed collection of 4,002 SE-rated puzzles with no repeats during that interval or overlap with the rated Classic bank. No runtime transformation or grading is needed for these editions. The date-to-puzzle algorithms and base fixtures must stay stable for existing saves. A snapshot test pins a published edition; solution tests exercise a month of dates.

The active board uses the existing gameplay components and actions. Switching modes or dates checkpoints and pauses it into `savedGames`, keyed by `classic` or `daily-YYYY-MM-DD`, then restores the selected edition atomically. Each edition retains its session ID, board, notes, full Undo history, timer, and counters. Switching never records abandonment. Restart affects only the open edition and retains previous results. Daily results are labeled by date in Stats; completed-day counts include Practice, with no streak system yet.

Version-2 saves migrate to version 3 without changing their board or journal. Version-1 migration remains supported. All parked boards and their history chains are validated on restoration. Practical retention is bounded by device storage; there is no automatic deletion of old daily progress.

## Desktop design

Version 0.9.0 replaces the automatic resume modal with an in-board pause panel. A restored unfinished puzzle shows “Continue your puzzle?” with mode/difficulty, elapsed time, and filled-cell count. Resume returns keyboard focus to the selected cell. Start new puzzle opens the existing difficulty/replace confirmation; Cancel preserves the paused board and returns focus to that button. Ordinary pauses show “Paused”, with navigation and theme/sound controls still available. Daily offers “Play Classic” while preserving its separately saved progress. Time and game input remain suspended until explicit Resume. The restored-session UI marker is transient and does not alter the save format.

The source references in `assets/stitch/` are preserved. Their visual language is adapted to desktop: top navigation, a centered square board, a 280px control panel, and a 3×3 keypad. Below 1100 CSS pixels, controls stack beneath the board with a horizontal keypad. The native window starts at 1280×900 with a 900×700 minimum. Board size accounts for available viewport height and the additional Daily controls. Wide gameplay fits without scrolling at tested sizes down to 1280×680 CSS pixels; smaller stacked windows can scroll rather than clipping controls.

The numbered app icon is generated from `public/favicon.svg`. A skippable 1.5-second opening displays “Developed by Antonis Valvis”; reduced motion shortens it and removes movement. The game clock remains stopped during this opening. Headings, controls, and dialogs use concise functional text.

The exact reference color palette is preserved in `src/reference-tokens.css`. Semantic aliases in `src/styles.css` implement the explicit cream/cobalt/ochre requirements and dark-mode contrast. Domine is used for editorial headings; Space Grotesk is used for digits and controls. Fonts and their OFL licenses are bundled locally in the build.

Reference conflicts were resolved in favor of the approved plan: four utility actions, Space Grotesk givens, a 1.5px inset selected outline, no floating shadows, and desktop navigation instead of the Android status/bottom bars. Board digits scale from 28–36px; notes scale from 10–12px. Reduced motion disables positional feedback.

## Puzzle fixtures and future work

Version 0.8.0 adds 9,000 rated Classic puzzles and 4,002 separate Daily puzzles from the public-domain Sudoku Exchange dataset, pinned to an immutable revision. All 13,002 records pass independent unique-solution and duplicate checks. Run `npm run verify:puzzles` to verify the entire bank offline. Ratings are upstream Sukaku Explainer scores: Easy below 1.5, Medium below 2.5, and Hard below 5.0. See [PUZZLE_BANK.md](PUZZLE_BANK.md) for provenance, reproducible import, guarantees, and stable-ID rules. No claim of Sudoku.com-equivalent calibration is made.

The included nine original fixtures are reproducibly authored by `scripts/create-puzzle-pack.mjs`, with 43/33/26 givens for Easy/Medium/Hard. Each is tested for a unique solution matching its stored solution. These initial difficulty labels use clue density; they are not a formal human-technique difficulty rating. The authoring script is not included in the app bundle.

Version 0.5.0 adds 27 fixtures in `expanded-pack.json`, reproducibly authored by `node scripts/create-expanded-pack.mjs`. It generates randomized complete grids by backtracking, then removes clues while retaining exactly one solution. That release contained 12 puzzles per difficulty. The original nine stay first in the catalog; new entries are appended so edition numbers, IDs, saves, and Daily mappings remain compatible. At that version, Daily continued to use the original pack. Do not reorder or change published fixtures.

Runtime puzzle generation, cloud synchronization, daily streaks, automatic updates, signing, and Android are deferred. The game engine and persisted model do not depend on the desktop layout.

Run `node scripts/audit-puzzle-quality.mjs` to regenerate [PUZZLE_QUALITY.md](PUZZLE_QUALITY.md). The bounded logical solver checks singles, locked candidates, and naked pairs without guessing. The original Medium and Hard packs are mostly solvable with singles, so their clue-based labels must not be advertised as professional difficulty ratings. Version 0.7.0 appends nine technique-graded puzzles: Singles for Easy, Locked candidates for Medium, and Naked pairs for Hard. Generate them reproducibly with `node scripts/create-graded-pack.mjs`; bounded authoring rejects unsupported grades and nonunique solutions before writing the pack. Those transformed fixtures are retained for earlier dates; the current default Classic library and future Daily schedule use the imported SE-rated bank. The report documents the gates required before introducing a new generator; published date mappings remain stable.

## Test coverage

### How to play

The main menu opens a five-step interactive tutorial at `#how-to-play`: rows, columns, 3×3 boxes, combining clues, and pencil notes. Each practice example asks for one action, explains conflicting choices, and waits for the correct answer before enabling Next. Keyboard numbers, numpad, N, and Delete/Backspace work in the practice area. Users can leave at any point or replay the tutorial.

`src/domain/tutorial.ts` contains the independent examples and conflict explanations; `TutorialPage` keeps practice state local to the component. The active Classic or Daily game pauses through the existing route lifecycle. Tutorial actions never enter the game store, history, statistics, or persistence. Returning to the same mode requires explicit Resume. The save schema is unchanged. Browser tests cover the complete walkthrough, both game modes, and light/dark layouts at 900×700, 1280×900, and 1920×1080.

Unit/component tests cover fixture validity, conflicts, immutable givens, notes, hints, exhausted keys, full Undo, timers, completion, restarts, persistence, and corrupt history rejection. Browser tests cover complete gameplay, focus trapping, theme persistence, recovery, offline play, unavailable audio/storage, numpad input, and dark number contrast.

Layout checks cover 900×700, 1280×900, 1440×900, 1920×1080, and 2560×1080 in both themes. Browser scale-factor tests approximate 125%, 150%, and 200% Windows display scaling; they do not replace a manual Windows DPI check. Screenshots are written to `test-results/`.

`scripts/native-smoke.mjs` connects to a test-launched WebView2 on localhost port 9237 to verify native gameplay; `--restore` checks saved notes and Undo after relaunch. Run it only against an isolated test profile, using `WEBVIEW2_USER_DATA_FOLDER` and `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9237`. The shipping application does not enable remote debugging.

`scripts/native-stats-smoke.mjs` completes a puzzle and checks its persisted journal entry in native WebView2. Relaunch the app with the same isolated profile and run with `--restore` to check that exactly one result survives the process restart.

`scripts/native-archive-smoke.mjs` opens a specific Archive puzzle, adds a note, and verifies return-to-board behavior; `--restore` checks that selection and notes survive native relaunch. Use a new isolated profile for its first run.

`scripts/native-daily-smoke.mjs` checks independent Classic and Daily progress, including a process restart with `--restore`. Run against a new isolated profile on the same local calendar date for both passes.

`scripts/native-expanded-smoke.mjs` checks Archive pagination, opens added puzzle 036, and verifies its saved notes on relaunch with `--restore`. The same isolated-profile precautions apply.

`scripts/native-graded-smoke.mjs` checks the technique filter, opens graded puzzle 043, and verifies saved notes on process restart with `--restore`. Use a fresh isolated profile for its first pass.

`scripts/native-bank-smoke.mjs` checks Archive search, opens imported puzzle 9045, and verifies its saved notes after process restart with `--restore`. The same isolated-profile precautions apply.

After `npm run desktop:build`, run `node scripts/release-checksums.mjs` to write SHA-256 hashes for the matching EXE and MSI into `src-tauri/target/release/bundle/SHA256SUMS.txt`. These identify the exact build artifacts; they do not replace publisher signing. Outstanding native release checks are tracked in `VERIFICATION.md`; runnable administrator/offline checks and the signing/DPI handoff are described in [WINDOWS_RELEASE.md](WINDOWS_RELEASE.md).
