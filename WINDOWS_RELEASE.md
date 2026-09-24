# Windows release checks

The application and both installers build locally. Public release still needs the environment-dependent checks below. Do not record a script as passing merely because it exists or parses.

## Administrator MSI installation

On an isolated Windows machine with administrator access, build the installers and run:

```powershell
./scripts/verify-msi.ps1
```

This verifies silent installation, product/company metadata, and uninstall. It refuses to run over an existing Sudoku installation. Logs remain in `.cache/msi-verification`. The Windows CI workflow includes this step; no CI result has been observed in this workspace.

## Offline WebView2 provisioning

Build the EXE, then generate an isolated Windows Sandbox configuration:

```powershell
./scripts/create-sandbox-check.ps1
```

Open `.cache/offline-verification/verify-offline.wsb` on a Windows Sandbox-capable machine. The configuration disables networking, maps the installers/scripts read-only, and writes results only to `.cache/offline-verification`. The script refuses a machine that already has WebView2: that would not exercise first-time provisioning. Some Windows Sandbox images already include WebView2; use a disposable clean Windows VM in that case. Never remove the shared runtime from your working machine for this check.

In an offline VM without WebView2, run `scripts/verify-clean-windows.ps1 -InstallerPath <installer.exe> -OutputDirectory <results-directory>`. The check verifies runtime provisioning, creation of the native application window, and uninstall. Inspect `offline-verification.json`; `passed` must be true. Gameplay rendering and persistence are separate browser/native smoke tests, not inferred from a window handle.

Configuration format: [Microsoft Windows Sandbox documentation](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-configure-using-wsb-file). Offline runtime packaging: [Tauri Windows installer documentation](https://v2.tauri.app/distribute/windows-installer/).

## Physical display scaling

On the target 1080p display, check Windows scaling at 125%, 150%, and 200% in each theme. Maximize Classic and Daily, confirm the board stays square, and check the last keypad row and dialogs. Move the window between monitors with different scaling and restore/maximize again. Wide windows should not scroll; below 1100 CSS pixels the controls intentionally stack and smaller windows may scroll. Browser viewport/device-scale coverage does not certify physical monitor transitions.

## Signing

No publisher certificate is available in this workspace. Choose a Windows code-signing certificate or signing service for Antonis Valvis before configuring signing; do not place private keys/passwords in the repository. Sign the application and final installers, timestamp signatures, verify the publisher with Windows signature tools, then regenerate SHA-256 checksums from the signed installers. Current unsigned artifacts are suitable for testing, not a signed public release.
