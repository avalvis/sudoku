$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
if (-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'MSI verification requires an administrator PowerShell session.'
}
$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$msiPath = Join-Path $projectRoot "src-tauri\target\release\bundle\msi\Sudoku_${version}_x64_en-US.msi"
if (-not (Test-Path -LiteralPath $msiPath)) { throw "Build the MSI before running this check: $msiPath" }
foreach ($root in @('HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall')) {
  if (Test-Path -LiteralPath $root) {
    $existing = Get-ChildItem -LiteralPath $root | Get-ItemProperty | Where-Object { $_.DisplayName -in @('Sudoku', 'Editorial Sudoku') }
    if ($existing) { throw 'An existing Sudoku installation is registered. Run this check on an isolated Windows machine.' }
  }
}
$testRoot = Join-Path $projectRoot '.cache\msi-verification'
if (Test-Path -LiteralPath $testRoot) { throw 'MSI test directory already exists. Choose a fresh checkout for verification.' }
New-Item -ItemType Directory -Path $testRoot | Out-Null
$installRoot = Join-Path $testRoot 'app'
$installed = $false
try {
  $arguments = "/i `"$msiPath`" /qn /norestart INSTALLDIR=`"$installRoot`" /l*v `"$testRoot\install.log`""
  $process = Start-Process msiexec.exe -ArgumentList $arguments -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -notin @(0, 3010)) { throw "MSI installation failed: $($process.ExitCode). See $testRoot\install.log" }
  $installed = $true
  $exe = Get-Item -LiteralPath (Join-Path $installRoot 'sudoku.exe')
  if ($exe.VersionInfo.ProductName -ne 'Sudoku' -or $exe.VersionInfo.CompanyName -ne 'Antonis Valvis') { throw 'Unexpected executable metadata.' }
  Write-Output 'MSI installation and executable metadata verified.'
} finally {
  if ($installed) {
    $arguments = "/x `"$msiPath`" /qn /norestart /l*v `"$testRoot\uninstall.log`""
    $process = Start-Process msiexec.exe -ArgumentList $arguments -WindowStyle Hidden -Wait -PassThru
    if ($process.ExitCode -notin @(0, 3010)) { throw "MSI uninstallation failed: $($process.ExitCode). See $testRoot\uninstall.log" }
    if (Test-Path -LiteralPath (Join-Path $installRoot 'sudoku.exe')) { throw 'MSI left the application executable installed.' }
    Write-Output 'MSI uninstallation verified.'
  }
}
