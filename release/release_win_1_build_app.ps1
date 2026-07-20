param(
  [string]$EnvFile,
  [string]$ReleaseVersion,
  [string]$ReleaseChannel
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$DefaultReleasePublicOrigin = "https://ilous12.github.io/nn-design-release-feed"
$SigningToExternal = Join-Path $ScriptDir "signing\to-external"
$StagingDir = Join-Path $ScriptDir "staging\win"
$WorkRoot = Join-Path $StagingDir "work"
$BuildJsonPath = Join-Path $StagingDir "build\build.json"
$RequestZip = Join-Path $SigningToExternal "app-signing-request.zip"

function Compress-DirectoryContents([string]$SourceDir, [string]$DestinationZip) {
  $entries = @(Get-ChildItem -LiteralPath $SourceDir -Force)
  if ($entries.Count -eq 0) {
    throw "cannot create signing request from empty directory: $SourceDir"
  }

  $sevenZipExe = Join-Path $RootDir "tools\pack\resources\win\7zip\7z.exe"
  if (-not (Test-Path -LiteralPath $sevenZipExe)) {
    throw "bundled 7z.exe not found at $sevenZipExe"
  }

  Remove-Item -LiteralPath $DestinationZip -Force -ErrorAction SilentlyContinue
  Push-Location -LiteralPath $SourceDir
  try {
    & $sevenZipExe a -tzip $DestinationZip ".\*"
    if ($LASTEXITCODE -ne 0) {
      throw "7z failed to create signing request zip with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
  if (-not (Test-Path -LiteralPath $DestinationZip)) {
    throw "failed to create signing request zip: $DestinationZip"
  }
}

New-Item -ItemType Directory -Force -Path $SigningToExternal, (Split-Path -Parent $BuildJsonPath), $WorkRoot | Out-Null

Push-Location -LiteralPath $RootDir
try {
  & git pull --ff-only
  if ($LASTEXITCODE -ne 0) {
    throw "git pull --ff-only failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

$env:ENV_FILE = if ([string]::IsNullOrWhiteSpace($EnvFile)) { Join-Path $RootDir "env\win-release.env" } else { $EnvFile }
$env:AUTO_BUMP_PATCH = "false"
$env:EXPORT_PUBLIC_RELEASE = "false"
$env:SIGN_MODE = "off"
$env:BUILD_TARGET = "dir"
$env:SMOKE_MODE = "skip"
$env:WORK_ROOT = $WorkRoot
$env:BUILD_JSON_PATH = $BuildJsonPath
if ([string]::IsNullOrWhiteSpace($env:RELEASE_PUBLIC_ORIGIN)) {
  $env:RELEASE_PUBLIC_ORIGIN = $DefaultReleasePublicOrigin
}
if (-not [string]::IsNullOrWhiteSpace($ReleaseVersion)) { $env:RELEASE_VERSION = $ReleaseVersion }
if (-not [string]::IsNullOrWhiteSpace($ReleaseChannel)) { $env:RELEASE_CHANNEL = $ReleaseChannel }
if ([string]::IsNullOrWhiteSpace($env:RELEASE_VERSION)) {
  $env:RELEASE_VERSION = (& node -p "require('./package.json').version").Trim()
}
if (-not [string]::IsNullOrWhiteSpace($env:RELEASE_PUBLIC_ORIGIN)) {
  $channel = if ([string]::IsNullOrWhiteSpace($env:RELEASE_CHANNEL)) { "stable" } else { $env:RELEASE_CHANNEL }
  $env:OD_UPDATE_METADATA_URL = "$($env:RELEASE_PUBLIC_ORIGIN.TrimEnd('/'))/$channel/latest/metadata.json"
}

Push-Location -LiteralPath $RootDir
try {
  & (Join-Path $RootDir "build_win.ps1") `
    -SignMode off `
    -BuildTarget dir `
    -SmokeMode skip `
    -ReleaseVersion $env:RELEASE_VERSION
  if ($LASTEXITCODE -ne 0) {
    throw "build_win.ps1 failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $BuildJsonPath)) {
  throw "build json not found: $BuildJsonPath"
}

$build = Get-Content -LiteralPath $BuildJsonPath -Raw -Encoding utf8 | ConvertFrom-Json
$unpackedPath = [string]$build.unpackedPath
if ([string]::IsNullOrWhiteSpace($unpackedPath) -or -not (Test-Path -LiteralPath $unpackedPath)) {
  throw "unpacked app path not found in build json: $unpackedPath"
}

Compress-DirectoryContents -SourceDir $unpackedPath -DestinationZip $RequestZip

Write-Host "Created external app signing request:"
Write-Host "  send:    $RequestZip"
Write-Host "  receive: $(Join-Path $ScriptDir 'signing\from-external\signed-app.zip')"
