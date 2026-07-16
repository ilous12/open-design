param(
  [string]$EnvFile,
  [string]$ReleaseVersion,
  [string]$ReleaseChannel
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$SigningToExternal = Join-Path $ScriptDir "signing\to-external"
$StagingDir = Join-Path $ScriptDir "staging\win"
$WorkRoot = Join-Path $StagingDir "work"
$BuildJsonPath = Join-Path $StagingDir "build\build.json"
$RequestZip = Join-Path $SigningToExternal "app-signing-request.zip"

New-Item -ItemType Directory -Force -Path $SigningToExternal, (Split-Path -Parent $BuildJsonPath), $WorkRoot | Out-Null

$env:ENV_FILE = if ([string]::IsNullOrWhiteSpace($EnvFile)) { Join-Path $RootDir "env\win-release.env" } else { $EnvFile }
$env:AUTO_BUMP_PATCH = "false"
$env:EXPORT_PUBLIC_RELEASE = "false"
$env:SIGN_MODE = "off"
$env:BUILD_TARGET = "dir"
$env:SMOKE_MODE = "skip"
$env:WORK_ROOT = $WorkRoot
$env:BUILD_JSON_PATH = $BuildJsonPath
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

Remove-Item -LiteralPath $RequestZip -Force -ErrorAction SilentlyContinue
Compress-Archive -LiteralPath (Join-Path $unpackedPath "*") -DestinationPath $RequestZip -Force

Write-Host "Created external app signing request:"
Write-Host "  send:    $RequestZip"
Write-Host "  receive: $(Join-Path $ScriptDir 'signing\from-external\signed-app.zip')"
