param(
  [string]$EnvFile,
  [string]$ReleaseVersion,
  [string]$ReleaseChannel
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FromExternal = Join-Path $ScriptDir "signing\from-external"
$ToExternal = Join-Path $ScriptDir "signing\to-external"

New-Item -ItemType Directory -Force -Path $FromExternal, $ToExternal | Out-Null

$stage1Params = @{}
if (-not [string]::IsNullOrWhiteSpace($EnvFile)) { $stage1Params.EnvFile = $EnvFile }
if (-not [string]::IsNullOrWhiteSpace($ReleaseVersion)) { $stage1Params.ReleaseVersion = $ReleaseVersion }
if (-not [string]::IsNullOrWhiteSpace($ReleaseChannel)) { $stage1Params.ReleaseChannel = $ReleaseChannel }

& (Join-Path $ScriptDir "release_win_1_build_app.ps1") @stage1Params

$appSigningRequestZip = Join-Path $ToExternal "app-signing-request.zip"
if (-not (Test-Path -LiteralPath $appSigningRequestZip)) {
  throw "app signing request zip was not created: $appSigningRequestZip"
}
Copy-Item `
  -LiteralPath $appSigningRequestZip `
  -Destination (Join-Path $FromExternal "signed-app.zip") `
  -Force

$stage2Params = @{
  SignedAppZip = Join-Path $FromExternal "signed-app.zip"
  AllowUnsignedTest = $true
}
if (-not [string]::IsNullOrWhiteSpace($EnvFile)) { $stage2Params.EnvFile = $EnvFile }
if (-not [string]::IsNullOrWhiteSpace($ReleaseVersion)) { $stage2Params.ReleaseVersion = $ReleaseVersion }
if (-not [string]::IsNullOrWhiteSpace($ReleaseChannel)) { $stage2Params.ReleaseChannel = $ReleaseChannel }

& (Join-Path $ScriptDir "release_win_2_after_app_signed_build_installer.ps1") @stage2Params

$installerSigningRequestZip = Join-Path $ToExternal "installer-signing-request.zip"
if (-not (Test-Path -LiteralPath $installerSigningRequestZip)) {
  throw "installer signing request zip was not created: $installerSigningRequestZip"
}
Copy-Item `
  -LiteralPath $installerSigningRequestZip `
  -Destination (Join-Path $FromExternal "signed-installer.zip") `
  -Force

& (Join-Path $ScriptDir "release_win_3_after_installer_signed_prepare_release.ps1") `
  -SignedInstallerZip (Join-Path $FromExternal "signed-installer.zip") `
  -AllowUnsignedTest

Write-Host "Unsigned Windows release dry run completed."
