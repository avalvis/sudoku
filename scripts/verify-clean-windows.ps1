param(
  [Parameter(Mandatory = $true)][string]$InstallerPath,
  [Parameter(Mandatory = $true)][string]$OutputDirectory
)
# Run only in a disposable, offline Windows VM with WebView2 absent.
$ErrorActionPreference = 'Stop'
function Get-WebViewRuntime {
  foreach ($key in @('HKLM:\Software\Microsoft\EdgeUpdate\Clients', 'HKLM:\Software\WOW6432Node\Microsoft\EdgeUpdate\Clients', 'HKCU:\Software\Microsoft\EdgeUpdate\Clients')) {
    if (Test-Path -LiteralPath $key) {
      Get-ChildItem -LiteralPath $key | Get-ItemProperty | Where-Object { $_.name -match 'WebView2' -and $_.pv -and $_.pv -ne '0.0.0.0' }
    }
  }
}
if (Get-WebViewRuntime) { throw 'WebView2 is already installed. Use a fresh Windows VM to verify offline provisioning.' }
foreach ($root in @('HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall')) {
  if (Test-Path -LiteralPath $root) {
    if (Get-ChildItem -LiteralPath $root | Get-ItemProperty | Where-Object { $_.DisplayName -in @('Sudoku', 'Editorial Sudoku') }) { throw 'An existing Sudoku installation is registered.' }
  }
}
if (-not (Test-Path -LiteralPath $InstallerPath -PathType Leaf)) { throw 'Installer not found.' }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$installRoot = Join-Path $env:TEMP ('sudoku-offline-' + [guid]::NewGuid())
$profileRoot = Join-Path $env:TEMP ('sudoku-profile-' + [guid]::NewGuid())
$exePath = Join-Path $installRoot 'sudoku.exe'
$result = [ordered]@{ installer = $InstallerPath; sha256 = (Get-FileHash -LiteralPath $InstallerPath -Algorithm SHA256).Hash; webviewAbsentBefore = $true; installExit = $null; runtimeVersion = $null; launched = $false; uninstallExit = $null; passed = $false }
$app = $null
try {
  $setup = Start-Process -FilePath $InstallerPath -ArgumentList '/S', ('/D=' + $installRoot) -WindowStyle Hidden -Wait -PassThru
  $result.installExit = $setup.ExitCode
  if ($setup.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $exePath)) { throw 'Offline installation failed.' }
  $runtime = @(Get-WebViewRuntime)
  if (-not $runtime.Count) { throw 'WebView2 was not provisioned.' }
  $result.runtimeVersion = @($runtime | ForEach-Object { $_.pv })
  $env:WEBVIEW2_USER_DATA_FOLDER = $profileRoot
  $app = Start-Process -FilePath $exePath -WindowStyle Hidden -PassThru
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 250
    $app.Refresh()
    if ($app.HasExited) { throw 'Sudoku exited during startup.' }
    if ($app.MainWindowHandle -ne 0) { $result.launched = $true; break }
  }
  if (-not $result.launched) { throw 'Sudoku did not create its application window.' }
  # This is an installer/startup check; gameplay restoration is covered separately.
} finally {
  if ($app -and -not $app.HasExited -and $app.Path -eq $exePath) { Stop-Process -Id $app.Id }
  $uninstaller = Join-Path $installRoot 'uninstall.exe'
  if (Test-Path -LiteralPath $uninstaller) {
    $uninstall = Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
    $result.uninstallExit = $uninstall.ExitCode
  }
  $result.passed = $result.launched -and $result.uninstallExit -eq 0 -and -not (Test-Path -LiteralPath $exePath)
  $result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'offline-verification.json')
}
if (-not $result.passed) { throw 'Offline installation verification failed; inspect offline-verification.json.' }
Write-Output 'Offline runtime provisioning, native window startup, and uninstall passed.'
