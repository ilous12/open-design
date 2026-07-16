param(
  [Parameter(Mandatory = $true)]
  [string]$SignedAppZip,
  [switch]$AllowUnsignedTest,
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
$SignedAppDir = Join-Path $StagingDir "signed-app"
$InstallerRequestZip = Join-Path $SigningToExternal "installer-signing-request.zip"
$WorkRoot = Join-Path $StagingDir "work"
$ToolsPackDir = Join-Path $WorkRoot "tools-pack"
$ToolsPackCacheDir = Join-Path $WorkRoot "tools-pack-cache"
$BuildJsonPath = Join-Path $StagingDir "build\build-from-signed-app.json"
$ContextJsonPath = Join-Path $StagingDir "build\release-context.json"

function Import-EnvFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return }
  foreach ($line in Get-Content -LiteralPath $Path -Encoding utf8) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) { continue }
    $equals = $trimmed.IndexOf("=")
    if ($equals -lt 1) { continue }
    $name = $trimmed.Substring(0, $equals).Trim()
    $value = $trimmed.Substring($equals + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Invoke-Checked([string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory = $RootDir) {
  Push-Location -LiteralPath $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path -LiteralPath $SignedAppZip)) {
  throw "signed app zip not found: $SignedAppZip"
}

New-Item -ItemType Directory -Force -Path $SigningToExternal, $StagingDir, (Split-Path -Parent $BuildJsonPath), $WorkRoot | Out-Null
Remove-Item -LiteralPath $SignedAppDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $SignedAppDir | Out-Null
Expand-Archive -LiteralPath $SignedAppZip -DestinationPath $SignedAppDir -Force

$exe = Get-ChildItem -LiteralPath $SignedAppDir -Recurse -File -Filter "*.exe" |
  Where-Object { $_.Name -notmatch '^Uninstall' } |
  Sort-Object FullName |
  Select-Object -First 1
if ($null -eq $exe) {
  throw "no signed app executable found under $SignedAppDir"
}

$signature = Get-AuthenticodeSignature -LiteralPath $exe.FullName
if ($signature.Status -ne "Valid") {
  if (-not $AllowUnsignedTest) {
    throw "signed app executable is not Authenticode-valid: $($exe.FullName) ($($signature.Status))"
  }
  Write-Warning "AllowUnsignedTest enabled; continuing with unsigned app executable: $($exe.FullName) ($($signature.Status))"
}

$resolvedEnvFile = if ([string]::IsNullOrWhiteSpace($EnvFile)) {
  Join-Path $RootDir "env\win-release.env"
} else {
  $EnvFile
}
Import-EnvFile $resolvedEnvFile
if (-not [string]::IsNullOrWhiteSpace($ReleaseVersion)) { $env:RELEASE_VERSION = $ReleaseVersion }
if (-not [string]::IsNullOrWhiteSpace($ReleaseChannel)) { $env:RELEASE_CHANNEL = $ReleaseChannel }
if ([string]::IsNullOrWhiteSpace($env:RELEASE_VERSION)) {
  $env:RELEASE_VERSION = (& node -p "require('./package.json').version").Trim()
}
if ([string]::IsNullOrWhiteSpace($env:RELEASE_CHANNEL)) { $env:RELEASE_CHANNEL = "stable" }
if ([string]::IsNullOrWhiteSpace($env:RELEASE_NAMESPACE)) {
  $env:RELEASE_NAMESPACE = "release-$($env:RELEASE_CHANNEL)-win"
}
if (-not [string]::IsNullOrWhiteSpace($env:RELEASE_PUBLIC_ORIGIN)) {
  $env:OD_UPDATE_METADATA_URL = "$($env:RELEASE_PUBLIC_ORIGIN.TrimEnd('/'))/$($env:RELEASE_CHANNEL)/latest/metadata.json"
}

Push-Location -LiteralPath $RootDir
try {
  Invoke-Checked "corepack" @("pnpm", "--filter", "@nn-design/tools-pack", "build")
  $json = & corepack pnpm exec tools-pack win build-from-signed-app `
    --dir $ToolsPackDir `
    --cache-dir $ToolsPackCacheDir `
    --namespace $env:RELEASE_NAMESPACE `
    --app-version $env:RELEASE_VERSION `
    --portable `
    --to nsis `
    --signed-app-dir $SignedAppDir `
    --json
  if ($LASTEXITCODE -ne 0) {
    throw "tools-pack win build-from-signed-app failed with exit code $LASTEXITCODE"
  }
  $json | Set-Content -LiteralPath $BuildJsonPath -Encoding utf8
} finally {
  Pop-Location
}

$build = Get-Content -LiteralPath $BuildJsonPath -Raw -Encoding utf8 | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace([string]$build.installerPath) -or -not (Test-Path -LiteralPath ([string]$build.installerPath))) {
  throw "installer was not produced by build-from-signed-app"
}
if ([string]::IsNullOrWhiteSpace([string]$build.payloadPath) -or -not (Test-Path -LiteralPath ([string]$build.payloadPath))) {
  throw "payload was not produced by build-from-signed-app"
}

Remove-Item -LiteralPath $InstallerRequestZip -Force -ErrorAction SilentlyContinue
Compress-Archive -LiteralPath ([string]$build.installerPath) -DestinationPath $InstallerRequestZip -Force

@{
  buildJsonPath = $BuildJsonPath
  installerRequestZip = $InstallerRequestZip
  unsignedTest = [bool]$AllowUnsignedTest
  releaseChannel = $env:RELEASE_CHANNEL
  releaseNamespace = $env:RELEASE_NAMESPACE
  releasePublicOrigin = $env:RELEASE_PUBLIC_ORIGIN
  releaseVersion = $env:RELEASE_VERSION
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ContextJsonPath -Encoding utf8

Write-Host "Created external installer signing request:"
Write-Host "  send:    $InstallerRequestZip"
Write-Host "  receive: $(Join-Path $ScriptDir 'signing\from-external\signed-installer.zip')"
