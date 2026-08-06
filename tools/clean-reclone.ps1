param(
  [string]$RepositoryUrl = "https://github.com/Jenovic-th/monopoly-chonburi-game.git",
  [string]$TargetPath,
  [string]$ArchiveRoot,
  [switch]$SkipInstall,
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message"
}

function Resolve-FullPath {
  param([string]$Path)

  $executionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
}

if ([string]::IsNullOrWhiteSpace($TargetPath)) {
  $TargetPath = Resolve-FullPath (Join-Path $PSScriptRoot "..")
} else {
  $TargetPath = Resolve-FullPath $TargetPath
}

$targetParent = Split-Path -Parent $TargetPath
$targetName = Split-Path -Leaf $TargetPath

if ([string]::IsNullOrWhiteSpace($ArchiveRoot)) {
  $ArchiveRoot = Join-Path $targetParent "_repo_archive"
} else {
  $ArchiveRoot = Resolve-FullPath $ArchiveRoot
}

if (-not $Force) {
  Write-Host "Dry run only. Add -Force to archive the old clone and create a clean clone."
  Write-Host "RepositoryUrl: $RepositoryUrl"
  Write-Host "TargetPath:    $TargetPath"
  Write-Host "ArchiveRoot:   $ArchiveRoot"
  Write-Host ""
  Write-Host "Example:"
  Write-Host "powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Force"
  exit 0
}

if (-not (Test-Path -LiteralPath $targetParent)) {
  throw "Target parent does not exist: $targetParent"
}

Write-Step "Preparing archive folder"
New-Item -ItemType Directory -Force -Path $ArchiveRoot | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archivePath = Join-Path $ArchiveRoot "$targetName-$timestamp"

if (Test-Path -LiteralPath $TargetPath) {
  Write-Step "Archiving existing clone"
  Write-Host "From: $TargetPath"
  Write-Host "To:   $archivePath"

  Set-Location -LiteralPath $targetParent
  try {
    Move-Item -LiteralPath $TargetPath -Destination $archivePath
  } catch {
    Write-Warning "Could not move the existing clone. It is probably open in an editor, terminal, dev server, or this AI workspace."
    Write-Warning $_.Exception.Message

    $fallbackTarget = Join-Path $targetParent "$targetName-clean-$timestamp"
    Write-Warning "Creating the clean clone at a fallback path instead:"
    Write-Warning $fallbackTarget

    $TargetPath = $fallbackTarget
    $archivePath = $null
  }
} else {
  Write-Step "No existing target folder found"
}

Write-Step "Cloning clean repository"
git clone $RepositoryUrl $TargetPath

Set-Location -LiteralPath $TargetPath

Write-Step "Verifying clean Git state"
git status --short --branch
git log -1 --oneline

if (-not $SkipInstall) {
  Write-Step "Installing npm dependencies"
  npm.cmd install
}

Write-Step "Done"
Write-Host "Clean clone: $TargetPath"
if ($null -ne $archivePath -and (Test-Path -LiteralPath $archivePath)) {
  Write-Host "Archived old clone: $archivePath"
}
