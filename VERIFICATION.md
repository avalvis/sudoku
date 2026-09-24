# Verification — 24 September 2026

## Passed

- `npm run lint` and `npm run typecheck`.
- `npm test`: 22 unit/component tests.
- `npm run test:e2e`: 16 browser tests, including gameplay completion, unlimited board Undo, hints, mistake-limit/practice transitions, session restoration, corrupt-save recovery, unavailable storage/audio, offline input, numpad input, and dark number contrast of at least 7:1.
- Desktop layouts inspected in both themes at 900×700, 1280×900, 1440×900, 1920×1080, and 2560×1080. Browser device-scale checks passed at 125%, 150%, and 200%.
- A follow-up five-layout run passed after fixing the dark page background below short content.
- `npm run build`: production Vite assets, including locally bundled fonts and licenses.
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`.
- Tauri native release compilation and generation of both NSIS EXE and WiX MSI installers with the WebView2 offline installer.
- Native WebView2 smoke test using an isolated profile: bundled fonts, board rendering, keyboard notes, themes, and pause.
- Full native process restart: saved notes and Undo history restored.
- NSIS per-user installation and uninstallation both returned exit code 0. The installed executable was launched and passed the native smoke test; uninstallation removed it.

## Environment limitations and release follow-up

- The per-machine MSI install smoke test returned 1603 with Windows Installer error **1925: insufficient privileges to install for all users**. The current account is not an administrator. The installer rolled back. Full MSI installation/uninstallation still needs an administrator test; this is distinct from successful MSI compilation.
- The WebView2 runtime was already present. Installation on a clean Windows machine without WebView2 has not been exercised, although the offline runtime is included in both packages.
- Display scaling was tested through browser device-scale factors. A manual Windows DPI/multi-monitor check remains a release follow-up.
- Installers are unsigned. Signing and public distribution are intentionally not configured.
- The nine puzzles have verified unique solutions; difficulty tiers are based on clue density, not calibrated human solving techniques.

Browser screenshots are generated under `test-results/`. Build artifacts are under `src-tauri/target/release/bundle/`. Temporary native profiles and installer logs are isolated under `.cache/`; these directories are ignored by version control.
