param(
  [Parameter(Mandatory = $true)]
  [string]$SignedInstallerZip,
  [switch]$AllowUnsignedTest,
  [string]$ReleasePublicDir,
  [string]$ReleasePublicOrigin,
  [string]$ReleasePublicGhRepo,
  [string]$ReleaseManifestDir
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$DefaultReleasePublicOrigin = "https://ilous12.github.io/nn-design-release-feed"
$StagingDir = Join-Path $ScriptDir "staging\win"
$FinalDir = Join-Path $StagingDir "final"
$ReleaseAssetsDir = Join-Path $FinalDir "assets"
$SignedInstallerDir = Join-Path $FinalDir "signed-installer"
$ContextJsonPath = Join-Path $StagingDir "build\release-context.json"
$FinalBuildJsonPath = Join-Path $FinalDir "final-build.json"
$CommittedManifestDir = if ([string]::IsNullOrWhiteSpace($ReleaseManifestDir)) {
  Join-Path $ScriptDir "manifests"
} else {
  $ReleaseManifestDir
}
$ManifestDir = Join-Path $RootDir ".tmp\release-manifests"
$MetadataDir = Join-Path $RootDir ".tmp\release-metadata"
$OutputsDir = Join-Path $RootDir ".tmp\release-outputs"

function Set-EnvValue([string]$Name, [string]$Value) {
  [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
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

function Copy-RequiredFile([string]$Source, [string]$Destination) {
  if (-not (Test-Path -LiteralPath $Source)) {
    throw "expected file not found: $Source"
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Destination -Force
}

function Test-PlatformManifestForCurrentRelease([System.IO.FileInfo]$Manifest, [object]$ReleaseContext) {
  if ($Manifest.Name.EndsWith(".context.json")) {
    return $false
  }

  try {
    $platformManifest = Get-Content -LiteralPath $Manifest.FullName -Raw -Encoding utf8 | ConvertFrom-Json
  } catch {
    Write-Warning "Skipping unreadable platform manifest: $($Manifest.FullName)"
    return $false
  }

  $expectedChannel = [string]$ReleaseContext.releaseChannel
  $expectedVersion = [string]$ReleaseContext.releaseVersion
  $platformKey = [string]$platformManifest.platformKey

  if ([string]$platformManifest.channel -ne $expectedChannel -or [string]$platformManifest.releaseVersion -ne $expectedVersion) {
    Write-Warning "Skipping stale platform manifest: $($Manifest.Name)"
    return $false
  }
  if ($platformKey -ne [System.IO.Path]::GetFileNameWithoutExtension($Manifest.Name)) {
    Write-Warning "Skipping mismatched platform manifest: $($Manifest.Name)"
    return $false
  }

  return $true
}

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
if (-not [string]::IsNullOrWhiteSpace($ReleasePublicOrigin)) {
  $releasePublicOrigin = $ReleasePublicOrigin
}
if ([string]::IsNullOrWhiteSpace($releasePublicOrigin)) {
  $releasePublicOrigin = $DefaultReleasePublicOrigin
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

$releasePublicDir = if ([string]::IsNullOrWhiteSpace($ReleasePublicDir)) {
  $envDir = [Environment]::GetEnvironmentVariable("RELEASE_PUBLIC_DIR", "Process")
  if ([string]::IsNullOrWhiteSpace($envDir)) { Join-Path $RootDir ".tmp\release-public" } else { $envDir }
} else {
  $ReleasePublicDir
}

New-Item -ItemType Directory -Force -Path $ManifestDir, $MetadataDir, $OutputsDir, $releasePublicDir | Out-Null
if (Test-Path -LiteralPath $CommittedManifestDir) {
  foreach ($manifest in Get-ChildItem -LiteralPath $CommittedManifestDir -File -Filter "*.json") {
    if (Test-PlatformManifestForCurrentRelease $manifest $context) {
      Copy-Item -LiteralPath $manifest.FullName -Destination (Join-Path $ManifestDir $manifest.Name) -Force
    }
  }
}

Set-EnvValue "RELEASE_ASSET_SUFFIX" ""
Set-EnvValue "RELEASE_ASSETS_DIR" $ReleaseAssetsDir
Set-EnvValue "RELEASE_CHANNEL" ([string]$context.releaseChannel)
Set-EnvValue "RELEASE_MANIFEST_DIR" $ManifestDir
Set-EnvValue "RELEASE_OUTPUTS_PATH" (Join-Path $OutputsDir "win_x64-publish-outputs.json")
Set-EnvValue "RELEASE_PUBLIC_ORIGIN" $releasePublicOrigin.TrimEnd("/")
Set-EnvValue "RELEASE_PUBLISH_SIDE_EFFECTS" "false"
Set-EnvValue "RELEASE_SIGNED" ($(if ($AllowUnsignedTest) { "false" } else { "true" }))
Set-EnvValue "RELEASE_TARGET" "win_x64"
Set-EnvValue "RELEASE_VERSION" ([string]$context.releaseVersion)
Set-EnvValue "WIN_INCLUDE_ZIP" "false"
Invoke-Checked "corepack" @("pnpm", "--filter", "@nn-design/tools-release", "build")
Invoke-Checked "corepack" @("pnpm", "exec", "tools-release", "publish-platform")

$enableMacArm64 = Test-Path -LiteralPath (Join-Path $ManifestDir "mac_arm64.json")
$enableMacX64 = Test-Path -LiteralPath (Join-Path $ManifestDir "mac_x64.json")
Set-EnvValue "ENABLE_MAC_ARM64" ($(if ($enableMacArm64) { "true" } else { "false" }))
Set-EnvValue "ENABLE_MAC_X64" ($(if ($enableMacX64) { "true" } else { "false" }))
Set-EnvValue "ENABLE_WIN_X64" "true"
Set-EnvValue "ENABLE_LINUX_X64" "false"
Set-EnvValue "MAC_ARM64_RESULT" ($(if ($enableMacArm64) { "success" } else { "skipped" }))
Set-EnvValue "MAC_X64_RESULT" ($(if ($enableMacX64) { "success" } else { "skipped" }))
Set-EnvValue "WIN_X64_RESULT" "success"
Set-EnvValue "LINUX_X64_RESULT" "skipped"
Set-EnvValue "RELEASE_METADATA_DIR" $MetadataDir
Set-EnvValue "RELEASE_OUTPUTS_PATH" (Join-Path $OutputsDir "metadata-outputs.json")
Set-EnvValue "STATE_SOURCE" "local-public-export"
Invoke-Checked "corepack" @("pnpm", "exec", "tools-release", "publish-metadata")

$versionPrefix = "$([string]$context.releaseChannel)\versions\$([string]$context.releaseVersion)"
$latestPrefix = "$([string]$context.releaseChannel)\latest"
$versionDir = Join-Path $releasePublicDir $versionPrefix
$latestDir = Join-Path $releasePublicDir $latestPrefix
New-Item -ItemType Directory -Force -Path (Join-Path $versionDir "platforms"), (Join-Path $latestDir "platforms") | Out-Null

foreach ($asset in Get-ChildItem -LiteralPath $ReleaseAssetsDir -File) {
  Copy-Item -LiteralPath $asset.FullName -Destination (Join-Path $versionDir $asset.Name) -Force
}
foreach ($manifest in Get-ChildItem -LiteralPath $ManifestDir -File -Filter "*.json") {
  Copy-RequiredFile $manifest.FullName (Join-Path $versionDir "platforms\$($manifest.Name)")
  Copy-RequiredFile $manifest.FullName (Join-Path $latestDir "platforms\$($manifest.Name)")
}
Copy-RequiredFile (Join-Path $MetadataDir "metadata.json") (Join-Path $versionDir "metadata.json")
Copy-RequiredFile (Join-Path $MetadataDir "metadata.json") (Join-Path $latestDir "metadata.json")
if (Test-Path -LiteralPath (Join-Path $ReleaseAssetsDir "latest.yml")) {
  Copy-RequiredFile (Join-Path $ReleaseAssetsDir "latest.yml") (Join-Path $latestDir "latest.yml")
}
if (Test-Path -LiteralPath (Join-Path $versionDir "latest-mac.yml")) {
  Copy-RequiredFile (Join-Path $versionDir "latest-mac.yml") (Join-Path $latestDir "latest-mac.yml")
}

if (-not [string]::IsNullOrWhiteSpace($ReleasePublicGhRepo)) {
  Set-EnvValue "RELEASE_PUBLIC_GH_REPO" $ReleasePublicGhRepo
}

Write-Host "Prepared final Windows release assets:"
Write-Host "  dir: $ReleaseAssetsDir"
Write-Host "Prepared combined public release feed:"
Write-Host "  dir: $releasePublicDir"
Write-Host "Used platform manifest directory:"
Write-Host "  dir: $CommittedManifestDir"
