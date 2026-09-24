$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$bundleDirectory = Join-Path $projectRoot 'src-tauri\target\release\bundle\nsis'
$installer = "Sudoku_${version}_x64-setup.exe"
if (-not (Test-Path -LiteralPath (Join-Path $bundleDirectory $installer))) { throw 'Build the Windows installers first.' }
$outputDirectory = Join-Path $projectRoot '.cache\offline-verification'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$bundleXml = [Security.SecurityElement]::Escape($bundleDirectory)
$scriptsXml = [Security.SecurityElement]::Escape($PSScriptRoot)
$outputXml = [Security.SecurityElement]::Escape($outputDirectory)
$configuration = @"
<Configuration>
  <Networking>Disable</Networking>
  <MappedFolders>
    <MappedFolder><HostFolder>$bundleXml</HostFolder><SandboxFolder>C:\SudokuInstaller</SandboxFolder><ReadOnly>true</ReadOnly></MappedFolder>
    <MappedFolder><HostFolder>$scriptsXml</HostFolder><SandboxFolder>C:\SudokuChecks</SandboxFolder><ReadOnly>true</ReadOnly></MappedFolder>
    <MappedFolder><HostFolder>$outputXml</HostFolder><SandboxFolder>C:\SudokuResults</SandboxFolder><ReadOnly>false</ReadOnly></MappedFolder>
  </MappedFolders>
  <LogonCommand><Command>powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\SudokuChecks\verify-clean-windows.ps1 -InstallerPath C:\SudokuInstaller\$installer -OutputDirectory C:\SudokuResults</Command></LogonCommand>
</Configuration>
"@
$path = Join-Path $outputDirectory 'verify-offline.wsb'
$configuration | Set-Content -LiteralPath $path
Write-Output "Created $path. Open it on a machine with Windows Sandbox installed. Networking is disabled."
