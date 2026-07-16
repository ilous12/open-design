param(
  [Parameter(Mandatory = $true)]
  [string]$SignedInstallerZip,
  [switch]$AllowUnsignedTest
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$StagingDir = Join-Path $ScriptDir "staging\win"
$FinalDir = Join-Path $StagingDir "final"
$ReleaseAssetsDir = Join-Path $FinalDir "assets"
$SignedInstallerDir = Join-Path $FinalDir "signed-installer"
$ContextJsonPath = Join-Path $StagingDir "build\release-context.json"
$FinalBuildJsonPath = Join-Path $FinalDir "final-build.json"

if (-not (Test-Path -LiteralPath $SignedInstallerZip)) {
  throw "signed installer zip not found: $SignedInstallerZip"
}

Remove-Item -LiteralPath $FinalDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $ReleaseAssetsDir, $SignedInstallerDir | Out-Null
Expand-Archive -LiteralPath $SignedInstallerZip -DestinationPath $SignedInstallerDir -Force

$installer = Get-ChildItem -LiteralPath $SignedInstallerDir -Recurse -File -Filter "*.exe" |
  Where-Object { $_.Name -match "setup" } |
  Sort-Object FullName |
  Select-Object -First 1
if ($null -eq $installer) {
  throw "signed setup.exe not found in $SignedInstallerZip"
}

$signature = Get-AuthenticodeSignature -LiteralPath $installer.FullName
if ($signature.Status -ne "Valid") {
  if (-not $AllowUnsignedTest) {
    throw "signed installer is not Authenticode-valid: $($installer.FullName) ($($signature.Status))"
  }
  Write-Warning "AllowUnsignedTest enabled; continuing with unsigned installer: $($installer.FullName) ($($signature.Status))"
}

$hash = (Get-FileHash -LiteralPath $installer.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  $($installer.Name)" | Set-Content -Path "$($installer.FullName).sha256" -Encoding utf8

if (-not (Test-Path -LiteralPath $ContextJsonPath)) {
  throw "release context not found: $ContextJsonPath"
}
$context = Get-Content -LiteralPath $ContextJsonPath -Raw -Encoding utf8 | ConvertFrom-Json
if ([bool]$context.unsignedTest -and -not $AllowUnsignedTest) {
  throw "stage 2 was produced with AllowUnsignedTest; rerun this script with -AllowUnsignedTest"
}
$build = Get-Content -LiteralPath ([string]$context.buildJsonPath) -Raw -Encoding utf8 | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace([string]$build.payloadPath) -or -not (Test-Path -LiteralPath ([string]$build.payloadPath))) {
  throw "payload path from stage 2 build json not found: $($build.payloadPath)"
}

$finalBuild = [ordered]@{}
foreach ($property in $build.PSObject.Properties) {
  $finalBuild[$property.Name] = $property.Value
}
$finalBuild["installerPath"] = $installer.FullName
$finalBuild | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $FinalBuildJsonPath -Encoding utf8

$releasePublicOrigin = [string]$context.releasePublicOrigin
if ([string]::IsNullOrWhiteSpace($releasePublicOrigin)) {
  $releasePublicOrigin = "https://example.invalid/nn-design"
}

& (Join-Path $RootDir "tools\release\scripts\prepare-platform-assets.ps1") `
  -ReleaseTarget win_x64 `
  -ReleaseAssetsDir $ReleaseAssetsDir `
  -BuildJsonPath $FinalBuildJsonPath `
  -ReleaseNamespace ([string]$context.releaseNamespace) `
  -ReleaseVersion ([string]$context.releaseVersion) `
  -ReleaseAssetSuffix "" `
  -ReleaseChannel ([string]$context.releaseChannel) `
  -ReleasePublicOrigin $releasePublicOrigin `
  -IncludeZip $false
if ($LASTEXITCODE -ne 0) {
  throw "prepare-platform-assets.ps1 failed"
}

Write-Host "Prepared final Windows release assets:"
Write-Host "  dir: $ReleaseAssetsDir"
