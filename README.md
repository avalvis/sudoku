# Editorial Sudoku

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

The Windows CI workflow runs lint, TypeScript, unit/component tests, browser tests, and native packaging, then uploads both installer artifacts. It does not publish releases.

## Gameplay

- Click a cell, then use the keypad, number row, or numpad. Numpad digit keys enter numbers even with Num Lock off.
- Arrow keys move selection. `N` toggles notes. Delete/Backspace erases. Ctrl/Cmd+Z undoes.
- Printed numbers are immutable. Re-entering the same number does nothing. Notes can be edited only in empty cells.
- Duplicate row, column, or block entries highlight every involved cell. One invalid entry adds one mistake, even if it conflicts in several units.
- At three mistakes, restart or continue without a limit in Practice. Undo restores the board, not consumed hints, mistakes, or elapsed time.
- Two hints per puzzle fill the selected empty/incorrect editable cell; otherwise the first eligible cell is used.
- The clock pauses when the app loses focus, becomes hidden, leaves Classic, or restores a saved game. Resume is explicit.
- A full, valid board completes the puzzle. Review it or start the next puzzle. New games cycle through three puzzles at the selected difficulty.

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

The version-2 IndexedDB save contains the board, selection, notes mode, full undo history, session, preferences, and result journal. Results and board state are committed in one snapshot; stable attempt IDs prevent duplicate completion records. Restore validates cell invariants, immutable givens, session values, the history chain, and result consistency. Corrupt or unsupported saves are preserved until the player explicitly chooses Start Fresh. If storage is unavailable or full, play continues with a visible warning and later writes retry. There is no artificial Undo or journal limit; practical capacity is bounded by available memory/storage.

Version-1 saves migrate automatically with board, notes, Undo, time, and preferences intact. A saved completed puzzle is imported once. Earlier versions did not retain dates or older results, so imported dates are labeled unavailable and previously discarded games cannot be reconstructed.

## Stats and personal journal

Stats shows completion rate, completed puzzles, best and average completion times, mistakes, hints, difficulty breakdowns, and paginated history. Normal and Practice games have separate views, with an optional difficulty filter. All data stays on this device.

An attempt starts on the first effective board change, including a note or hint. Replacing or restarting a started unfinished puzzle records an abandoned attempt; pausing, closing, or navigating away does not. Completion rate includes the current started attempt in its denominator. Undoing every move does not erase the attempt. Continue Practice classifies the whole attempt as Practice. Times include completed games with hints; mistakes and hints remain cumulative. Results are ordered by finalization, even if the system clock changes.

Web Audio creates its context only after a user gesture. Sounds use short oscillator/gain envelopes, disconnect finished nodes, and fail harmlessly if audio is unavailable. Audio objects never enter persisted state.

## Archive

The Archive browses all nine bundled puzzles with board previews, difficulty filters, and a not-yet-completed filter. Cards show completion counts (including Practice) and the best normal-game time. Returning to the current board preserves its progress; starting another puzzle or replay requires confirmation. Replays have new attempt IDs and retain all prior journal entries. The Archive shares the Classic engine and version-2 save format.

## Desktop design

The source references in `assets/stitch/` are preserved. Their visual language is adapted to desktop: top navigation, a centered square board, a 280px control panel, and a 3×3 keypad. Below 1100 CSS pixels, controls stack beneath the board with a horizontal keypad. The native window starts at 1280×900 with a 900×700 minimum. Short windows scroll rather than clipping controls.

The exact reference color palette is preserved in `src/reference-tokens.css`. Semantic aliases in `src/styles.css` implement the explicit cream/cobalt/ochre requirements and dark-mode contrast. Domine is used for editorial headings; Space Grotesk is used for digits and controls. Fonts and their OFL licenses are bundled locally in the build.

Reference conflicts were resolved in favor of the approved plan: four utility actions, Space Grotesk givens, a 1.5px inset selected outline, no floating shadows, and desktop navigation instead of the Android status/bottom bars. Board digits scale from 28–36px; notes scale from 10–12px. Reduced motion disables positional feedback.

## Puzzle fixtures and future work

The included nine original fixtures are reproducibly authored by `scripts/create-puzzle-pack.mjs`, with 43/33/26 givens for Easy/Medium/Hard. Each is tested for a unique solution matching its stored solution. These initial difficulty labels use clue density; they are not a formal human-technique difficulty rating. The authoring script is not included in the app bundle.

Daily is explicitly labeled a future edition. Runtime puzzle generation, formally graded puzzle packs, cloud synchronization, a daily calendar, automatic updates, signing, and Android are deferred. The game engine and persisted model do not depend on the desktop layout.

## Test coverage

Unit/component tests cover fixture validity, conflicts, immutable givens, notes, hints, exhausted keys, full Undo, timers, completion, restarts, persistence, and corrupt history rejection. Browser tests cover complete gameplay, focus trapping, theme persistence, recovery, offline play, unavailable audio/storage, numpad input, and dark number contrast.

Layout checks cover 900×700, 1280×900, 1440×900, 1920×1080, and 2560×1080 in both themes. Browser scale-factor tests approximate 125%, 150%, and 200% Windows display scaling; they do not replace a manual Windows DPI check. Screenshots are written to `test-results/`.

`scripts/native-smoke.mjs` connects to a test-launched WebView2 on localhost port 9237 to verify native gameplay; `--restore` checks saved notes and Undo after relaunch. Run it only against an isolated test profile, using `WEBVIEW2_USER_DATA_FOLDER` and `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9237`. The shipping application does not enable remote debugging.

`scripts/native-stats-smoke.mjs` completes a puzzle and checks its persisted journal entry in native WebView2. Relaunch the app with the same isolated profile and run with `--restore` to check that exactly one result survives the process restart.

`scripts/native-archive-smoke.mjs` opens a specific Archive puzzle, adds a note, and verifies return-to-board behavior; `--restore` checks that selection and notes survive native relaunch. Use a new isolated profile for its first run.
