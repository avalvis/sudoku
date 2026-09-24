# Verification — 24 September 2026

## Passed

- Version 0.5.0 production build and both Windows installers generated successfully. NSIS installation into an isolated directory returned 0. The installed executable opened expanded puzzle 036 through paginated Archive navigation, saved notes, and restored them after process restart with no runtime errors. Uninstallation returned 0 and removed the executable; its leftover test registry entry was cleaned. SHA-256 hashes are recorded in `src-tauri/target/release/bundle/SHA256SUMS.txt`.

- Version 0.4.0 production frontend and both Windows installers built successfully. Native Daily tests passed before and after process restart using an isolated profile: Classic and Daily notes/history persisted independently, switching caused no false abandonments, and no runtime errors occurred. The 0.4.0 installer installation/uninstallation cycle was not repeated.

- Version 0.3.0 production frontend and both Windows installers built successfully. Native Archive smoke tests passed before and after process restart: exact puzzle selection, pencil notes, current-board return, no false abandoned results, and no runtime errors. Tests used an isolated WebView2 profile. Installation/uninstallation was not repeated for 0.3.0.

- `npm run lint` and `npm run typecheck`.
- 51 unit/component tests passed, including all 36 Classic puzzles having exactly one solution matching the bundled solution, cycling through 12 puzzles per difficulty, Daily date validation, deterministic board stability, a month of Daily unique-solution checks, independent saved editions, completion/replay, corrupted parked-history rejection, and version-2 to version-3 migration. Expanded fixture generation repeated with identical SHA-256 output.
- `npm run test:e2e`: 35 browser tests, including gameplay completion, unlimited board Undo, hints, mistake-limit/practice transitions, session restoration, corrupt-save recovery, unavailable storage/audio, offline input, numpad input, and dark number contrast of at least 7:1. Stats coverage includes completion idempotence across reloads, abandonment confirmation, Practice separation, and real IndexedDB migration preserving notes, Undo, and elapsed time. Archive coverage includes pagination, filter resets, keyboard focus, opening added puzzle 036 and restoring it, cancellation, replay, and current-board return.
- Archive layouts checked at 900, 1280, and 1920 pixels in both themes; screenshots inspected at 900 and 1280 pixels.
- Daily browser coverage includes separate Classic/Daily/date progress, reload, completion and replay, midnight rollover without replacement, and layouts at 900×700, 1280×900, and 1920×900 in both themes. Daily screenshots inspected at 900 and 1280 pixels.
- Stats layouts inspected at 900, 1280, and 1920 pixels in both themes; no horizontal overflow.
- Desktop layouts inspected in both themes at 900×700, 1280×900, 1440×900, 1920×1080, and 2560×1080. Browser device-scale checks passed at 125%, 150%, and 200%.
- A follow-up five-layout run passed after fixing the dark page background below short content.
- `npm run build`: production Vite assets, including locally bundled fonts and licenses.
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`.
- Version 0.2.0 Tauri native release compilation and generation of both NSIS EXE and WiX MSI installers with the WebView2 offline installer.
- Version 0.2.0 native Stats smoke test: completed a puzzle through the UI, verified one result and 100% completion, then restarted the isolated native process and verified exactly one restored result with no runtime errors. Populated journal screenshot inspected.
- Native WebView2 smoke test using an isolated profile: bundled fonts, board rendering, keyboard notes, themes, and pause.
- Full native process restart: saved notes and Undo history restored.
- Version 0.1.0 NSIS per-user installation and uninstallation both returned exit code 0. The installed executable was launched and passed the native smoke test; uninstallation removed it. Version 0.2.0 was tested directly from its release executable; its installation/uninstallation cycle was not repeated.

## Environment limitations and release follow-up

- The per-machine MSI install smoke test returned 1603 with Windows Installer error **1925: insufficient privileges to install for all users**. The current account is not an administrator. The installer rolled back. Full MSI installation/uninstallation still needs an administrator test; this is distinct from successful MSI compilation.
- The WebView2 runtime was already present. Installation on a clean Windows machine without WebView2 has not been exercised, although the offline runtime is included in both packages.
- Display scaling was tested through browser device-scale factors. A manual Windows DPI/multi-monitor check remains a release follow-up.
- Installers are unsigned. Signing and public distribution are intentionally not configured.
- All 36 Classic puzzles have verified unique solutions; difficulty tiers are based on clue density, not calibrated human solving techniques. Daily retains its original nine base fixtures to preserve published date mappings.

Browser screenshots are generated under `test-results/`. Build artifacts are under `src-tauri/target/release/bundle/`. Temporary native profiles and installer logs are isolated under `.cache/`; these directories are ignored by version control.
