param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $RootDir

function Get-EnvValue([string]$Name, [string]$Default = "") {
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }
  return $value
}

function Set-EnvValue([string]$Name, [string]$Value) {
  [Environment]::SetEnvironmentVariable($Name, $Value, "Process")
}

function Import-EnvFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  foreach ($line in Get-Content -LiteralPath $Path -Encoding utf8) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }
    $equals = $trimmed.IndexOf("=")
    if ($equals -lt 1) {
      continue
    }
    $name = $trimmed.Substring(0, $equals).Trim()
    $value = $trimmed.Substring($equals + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    Set-EnvValue $name $value
  }
}

function Require-Env([string]$Name) {
  if ([string]::IsNullOrWhiteSpace((Get-EnvValue $Name))) {
    throw "$Name is required"
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

function Resolve-PnpmCommand {
  $packageManager = (& node -p "require('./package.json').packageManager || 'pnpm@10.33.2'").Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($packageManager)) {
    throw "failed to resolve packageManager from package.json"
  }
  $pnpmVersion = $packageManager -replace '^pnpm@', ''

  if (Get-Command corepack -ErrorAction SilentlyContinue) {
    Invoke-Checked "corepack" @("prepare", "pnpm@$pnpmVersion", "--activate")
  }

  $pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
  if ($pnpm -ne $null) {
    return $pnpm.Source
  }
  $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
  if ($pnpm -ne $null) {
    return $pnpm.Source
  }
  $npx = Get-Command npx.cmd -ErrorAction SilentlyContinue
  if ($npx -ne $null) {
    return "$($npx.Source)|pnpm@$pnpmVersion"
  }
  throw "pnpm or corepack is required"
}

function Invoke-Pnpm([string[]]$Arguments) {
  if ($script:PnpmCommand.Contains("|")) {
    $parts = $script:PnpmCommand.Split("|", 2)
    Invoke-Checked $parts[0] (@($parts[1]) + $Arguments)
  } else {
    Invoke-Checked $script:PnpmCommand $Arguments
  }
}

function Convert-ToBool([string]$Value, [bool]$Default) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Default
  }
  switch ($Value.ToLowerInvariant()) {
    "true" { return $true }
    "false" { return $false }
    default { throw "expected boolean true/false, got: $Value" }
  }
}

function Infer-GitHubReleaseDefaults {
  if ((Get-EnvValue "EXPORT_PUBLIC_RELEASE" "true") -ne "true") {
    return
  }
  if ((Get-EnvValue "DEPLOY_PUBLIC_GITHUB") -eq "false") {
    return
  }
  if (-not [string]::IsNullOrWhiteSpace((Get-EnvValue "RELEASE_PUBLIC_ORIGIN")) -and [string]::IsNullOrWhiteSpace((Get-EnvValue "RELEASE_PUBLIC_GH_REPO"))) {
    return
  }
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    return
  }

  $owner = (& gh api user --jq ".login" 2>$null)
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($owner)) {
    return
  }

  $repo = Get-EnvValue "RELEASE_PUBLIC_GH_REPO" "$owner/nn-design-release-feed"
  Set-EnvValue "RELEASE_PUBLIC_GH_REPO" $repo
  if ([string]::IsNullOrWhiteSpace((Get-EnvValue "DEPLOY_PUBLIC_GITHUB"))) {
    Set-EnvValue "DEPLOY_PUBLIC_GITHUB" "true"
  }
  if ([string]::IsNullOrWhiteSpace((Get-EnvValue "RELEASE_PUBLIC_ORIGIN"))) {
    $repoParts = $repo.Split("/", 2)
    Set-EnvValue "RELEASE_PUBLIC_ORIGIN" "https://$($repoParts[0]).github.io/$($repoParts[1])"
  }
}

function Copy-RequiredFile([string]$Source, [string]$Destination) {
  if (-not (Test-Path -LiteralPath $Source)) {
    throw "expected file not found: $Source"
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Destination) | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Destination -Force
}

function Export-WinReleasePublic {
  $releaseTarget = Get-EnvValue "RELEASE_TARGET"
  $releaseVersion = Get-EnvValue "RELEASE_VERSION"
  $releaseChannel = Get-EnvValue "RELEASE_CHANNEL"
  $releaseNamespace = Get-EnvValue "RELEASE_NAMESPACE"
  $releasePublicOrigin = (Get-EnvValue "RELEASE_PUBLIC_ORIGIN").TrimEnd("/")
  $releasePublicDir = Get-EnvValue "RELEASE_PUBLIC_DIR" (Join-Path $RootDir ".tmp\release-public")
  $releaseAssetsDir = Get-EnvValue "RELEASE_ASSETS_DIR" (Join-Path $RootDir ".tmp\release-assets\$releaseTarget")
  $manifestDir = Get-EnvValue "RELEASE_MANIFEST_DIR" (Join-Path $RootDir ".tmp\release-manifests")
  $metadataDir = Get-EnvValue "RELEASE_METADATA_DIR" (Join-Path $RootDir ".tmp\release-metadata")
  $outputsDir = Get-EnvValue "RELEASE_OUTPUTS_DIR" (Join-Path $RootDir ".tmp\release-outputs")
  $assetSuffix = Get-EnvValue "RELEASE_ASSET_SUFFIX" ""
  $includeZip = (Get-EnvValue "BUILD_TARGET") -in @("all", "zip")

  Remove-Item -LiteralPath $releaseAssetsDir -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $releaseAssetsDir, $manifestDir, $metadataDir, $outputsDir | Out-Null

  & (Join-Path $RootDir "tools\release\scripts\prepare-platform-assets.ps1") `
    -ReleaseTarget $releaseTarget `
    -ReleaseAssetsDir $releaseAssetsDir `
    -BuildJsonPath (Get-EnvValue "BUILD_JSON_PATH") `
    -ReleaseNamespace $releaseNamespace `
    -ReleaseVersion $releaseVersion `
    -ReleaseAssetSuffix $assetSuffix `
    -ReleaseChannel $releaseChannel `
    -ReleasePublicOrigin $releasePublicOrigin `
    -IncludeZip $includeZip
  if ($LASTEXITCODE -ne 0) {
    throw "prepare-platform-assets.ps1 failed"
  }

  Set-EnvValue "RELEASE_ASSET_SUFFIX" $assetSuffix
  Set-EnvValue "RELEASE_ASSETS_DIR" $releaseAssetsDir
  Set-EnvValue "RELEASE_CHANNEL" $releaseChannel
  Set-EnvValue "RELEASE_MANIFEST_DIR" $manifestDir
  Set-EnvValue "RELEASE_OUTPUTS_PATH" (Join-Path $outputsDir "$releaseTarget-publish-outputs.json")
  Set-EnvValue "RELEASE_PUBLIC_ORIGIN" $releasePublicOrigin
  Set-EnvValue "RELEASE_PUBLISH_SIDE_EFFECTS" "false"
  $releaseSigned = if ((Get-EnvValue "SIGN_MODE") -eq "on") { "true" } else { "false" }
  Set-EnvValue "RELEASE_SIGNED" $releaseSigned
  Set-EnvValue "RELEASE_TARGET" $releaseTarget
  Set-EnvValue "RELEASE_VERSION" $releaseVersion
  $winIncludeZip = if ($includeZip) { "true" } else { "false" }
  Set-EnvValue "WIN_INCLUDE_ZIP" $winIncludeZip
  Invoke-Pnpm -Arguments @("exec", "tools-release", "publish-platform")

  Set-EnvValue "ENABLE_MAC_ARM64" "false"
  Set-EnvValue "ENABLE_MAC_X64" "false"
  Set-EnvValue "ENABLE_WIN_X64" "true"
  Set-EnvValue "ENABLE_LINUX_X64" "false"
  Set-EnvValue "MAC_ARM64_RESULT" "skipped"
  Set-EnvValue "MAC_X64_RESULT" "skipped"
  Set-EnvValue "WIN_X64_RESULT" "success"
  Set-EnvValue "LINUX_X64_RESULT" "skipped"
  Set-EnvValue "RELEASE_METADATA_DIR" $metadataDir
  Set-EnvValue "RELEASE_OUTPUTS_PATH" (Join-Path $outputsDir "metadata-outputs.json")
  Set-EnvValue "STATE_SOURCE" "local-public-export"
  Invoke-Pnpm -Arguments @("exec", "tools-release", "publish-metadata")

  $versionPrefix = "$releaseChannel/versions/$releaseVersion$assetSuffix"
  $latestPrefix = "$releaseChannel/latest"
  $versionDir = Join-Path $releasePublicDir $versionPrefix
  $latestDir = Join-Path $releasePublicDir $latestPrefix

  New-Item -ItemType Directory -Force -Path (Join-Path $versionDir "platforms"), (Join-Path $latestDir "platforms") | Out-Null
  foreach ($file in Get-ChildItem -LiteralPath $releaseAssetsDir -File) {
    Copy-RequiredFile $file.FullName (Join-Path $versionDir $file.Name)
  }
  Copy-RequiredFile (Join-Path $manifestDir "$releaseTarget.json") (Join-Path $versionDir "platforms\$releaseTarget.json")
  Copy-RequiredFile (Join-Path $manifestDir "$releaseTarget.json") (Join-Path $latestDir "platforms\$releaseTarget.json")
  Copy-RequiredFile (Join-Path $metadataDir "metadata.json") (Join-Path $versionDir "metadata.json")
  Copy-RequiredFile (Join-Path $metadataDir "metadata.json") (Join-Path $latestDir "metadata.json")
  if (Test-Path -LiteralPath (Join-Path $releaseAssetsDir "latest.yml")) {
    Copy-RequiredFile (Join-Path $releaseAssetsDir "latest.yml") (Join-Path $latestDir "latest.yml")
  }

  @(
    "# nn.design 배포 채널"
    ""
    "이 저장소는 nn.design 데스크톱 앱의 공개 배포 피드입니다. 설치 파일과 업데이트 메타데이터는 버전별로 관리되며, 앱은 이 피드를 통해 최신 버전을 확인합니다."
    ""
    "## 최신 설치 파일"
    ""
    "- [최신 릴리스에서 설치 파일 받기](https://github.com/$(Get-EnvValue 'RELEASE_PUBLIC_GH_REPO' '<owner>/<repo>')/releases/latest)"
    "- [전체 릴리스 목록 보기](https://github.com/$(Get-EnvValue 'RELEASE_PUBLIC_GH_REPO' '<owner>/<repo>')/releases)"
    ""
    "운영체제에 맞는 파일을 선택해 설치하세요."
    ""
    "- macOS: ``.dmg``"
    "- Windows: ``setup.exe``"
    ""
    "## 업데이트 피드"
    ""
    "- [최신 메타데이터]($releasePublicOrigin/$latestPrefix/metadata.json)"
    "- [macOS 업데이트 피드]($releasePublicOrigin/$latestPrefix/latest-mac.yml)"
    "- [Windows 업데이트 피드]($releasePublicOrigin/$latestPrefix/latest.yml)"
    ""
    "## 배포 구조"
    ""
    "이 저장소에는 앱이 참조하는 작은 메타데이터만 보관합니다. 용량이 큰 설치 파일, 런처 payload, 체크섬 파일은 각 버전의 GitHub Release asset으로 업로드됩니다."
    ""
    '```text'
    "stable/"
    "  latest/"
    "    metadata.json"
    "    latest-mac.yml"
    "    latest.yml"
    "    platforms/"
    "  versions/"
    "    <version>/"
    "      metadata.json"
    "      platforms/"
    '```'
    ""
    "## 무결성"
    ""
    "릴리스 asset에는 SHA-256 체크섬이 함께 제공됩니다. 설치 파일을 직접 배포하거나 검증해야 하는 경우, 같은 릴리스에 포함된 ``.sha256`` 파일을 기준으로 확인하세요."
    ""
    "## 참고"
    ""
    "이 저장소는 배포 자동화에 의해 갱신됩니다. 이슈 제보나 기능 요청은 제품 본 저장소에서 관리합니다."
  ) | Set-Content -LiteralPath (Join-Path $releasePublicDir "README.md") -Encoding utf8

  Write-Host "Exported public release feed to $releasePublicDir"
}

function Get-ReleaseVersionDirs([string]$CloneDir) {
  $dirs = @()
  foreach ($channelDir in Get-ChildItem -LiteralPath $CloneDir -Directory -ErrorAction SilentlyContinue) {
    $versionsRoot = Join-Path $channelDir.FullName "versions"
    if (Test-Path -LiteralPath $versionsRoot) {
      $dirs += Get-ChildItem -LiteralPath $versionsRoot -Directory
    }
  }
  return $dirs | Sort-Object FullName
}

function Test-FeedMetadataFile([string]$Path) {
  return $Path -match '\.(json|ya?ml|md)$'
}

function Replace-TextInFeed([string]$Root, [string]$Search, [string]$Replacement) {
  foreach ($file in Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object { Test-FeedMetadataFile $_.FullName }) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
    $text.Replace($Search, $Replacement) | Set-Content -LiteralPath $file.FullName -Encoding utf8
  }
}

function Deploy-PublicGitHubRelease {
  if ((Get-EnvValue "DEPLOY_PUBLIC_GITHUB" "false") -ne "true") {
    return
  }
  Require-Env "RELEASE_PUBLIC_DIR"
  Require-Env "RELEASE_PUBLIC_GH_REPO"

  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "gh CLI is required for GitHub deployment"
  }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required for GitHub deployment"
  }

  $repo = Get-EnvValue "RELEASE_PUBLIC_GH_REPO"
  $publicDir = Get-EnvValue "RELEASE_PUBLIC_DIR"
  $repoParts = $repo.Split("/", 2)
  $publicOrigin = (Get-EnvValue "RELEASE_PUBLIC_ORIGIN" "https://$($repoParts[0]).github.io/$($repoParts[1])").TrimEnd("/")
  $branch = Get-EnvValue "GH_PAGES_BRANCH" "main"
  $cloneDir = Get-EnvValue "GH_DEPLOY_CLONE_DIR" (Join-Path $RootDir ".tmp\github-release-feed\$($repoParts[1])")
  $deployAssets = Get-EnvValue "DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES" "true"

  & gh repo view $repo *> $null
  if ($LASTEXITCODE -ne 0) {
    Invoke-Checked "gh" @("repo", "create", $repo, "--public", "--description", "Static update feed for nn.design", "--disable-issues", "--disable-wiki")
  }

  Remove-Item -LiteralPath $cloneDir -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $cloneDir) | Out-Null
  Invoke-Checked "git" @("clone", "https://github.com/$repo.git", $cloneDir)
  Invoke-Checked "git" @("checkout", "-B", $branch) $cloneDir
  Get-ChildItem -LiteralPath $cloneDir -Force | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
  Copy-Item -Path (Join-Path $publicDir "*") -Destination $cloneDir -Recurse -Force
  New-Item -ItemType File -Force -Path (Join-Path $cloneDir ".nojekyll") | Out-Null

  if ($deployAssets -eq "true") {
    $uploadedCount = 0
    foreach ($versionDir in Get-ReleaseVersionDirs $cloneDir) {
      $releaseVersion = $versionDir.Name
      $tag = Get-EnvValue "RELEASE_GITHUB_TAG" "v$releaseVersion"
      $releaseOrigin = "https://github.com/$repo/releases/download/$tag"
      & gh release view $tag --repo $repo *> $null
      if ($LASTEXITCODE -ne 0) {
        Invoke-Checked "gh" @("release", "create", $tag, "--repo", $repo, "--title", "nn.design $releaseVersion", "--notes", "Release assets for nn.design $releaseVersion")
      }
      foreach ($file in Get-ChildItem -LiteralPath $versionDir.FullName -File) {
        if (Test-FeedMetadataFile $file.FullName) {
          continue
        }
        $relative = $file.FullName.Substring($cloneDir.Length + 1).Replace("\", "/")
        $assetUrl = "$releaseOrigin/$($file.Name)"
        Invoke-Checked "gh" @("release", "upload", $tag, $file.FullName, "--repo", $repo, "--clobber")
        Replace-TextInFeed $cloneDir "$publicOrigin/$relative" $assetUrl
        Remove-Item -LiteralPath $file.FullName -Force
        $uploadedCount += 1
      }
    }
    if ($uploadedCount -gt 0) {
      Write-Host "Uploaded $uploadedCount release asset file(s) to versioned GitHub Releases."
    }
  }

  $largeFiles = Get-ChildItem -LiteralPath $cloneDir -Recurse -File -Force |
    Where-Object { $_.FullName -notmatch '\\.git\\' -and $_.Length -gt 100000000 }
  if ($largeFiles.Count -gt 0) {
    throw "GitHub blocks regular Git pushes containing files over 100MB: $($largeFiles.FullName -join ', ')"
  }

  Invoke-Checked "git" @("add", "-A") $cloneDir
  Push-Location -LiteralPath $cloneDir
  try {
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
      Write-Host "No public release feed changes to deploy."
    } else {
      Invoke-Checked "git" @("commit", "-m", "Publish nn.design Windows update feed")
      Invoke-Checked "git" @("push", "-u", "origin", $branch)
    }
  } finally {
    Pop-Location
  }

  & gh api "repos/$repo/pages" *> $null
  if ($LASTEXITCODE -eq 0) {
    & gh api --method PUT "repos/$repo/pages" -f "source[branch]=$branch" -f "source[path]=/" *> $null
  } else {
    & gh api --method POST "repos/$repo/pages" -f "source[branch]=$branch" -f "source[path]=/" *> $null
  }
  Write-Host "Deployed public release feed to https://github.com/$repo"
}

$envFile = Get-EnvValue "ENV_FILE" (Join-Path $RootDir "env\win-release.env")
Import-EnvFile $envFile

Set-EnvValue "RELEASE_CHANNEL" (Get-EnvValue "RELEASE_CHANNEL" "stable")
Set-EnvValue "AUTO_BUMP_PATCH" (Get-EnvValue "AUTO_BUMP_PATCH" "true")
Set-EnvValue "AUTO_BUILD_RELEASE_TOOLS" (Get-EnvValue "AUTO_BUILD_RELEASE_TOOLS" "true")
Set-EnvValue "RELEASE_TARGET" (Get-EnvValue "RELEASE_TARGET" "win_x64")
Set-EnvValue "BUILD_TARGET" (Get-EnvValue "BUILD_TARGET" "nsis")
Set-EnvValue "SIGN_MODE" (Get-EnvValue "SIGN_MODE" "off")
Set-EnvValue "SMOKE_MODE" (Get-EnvValue "SMOKE_MODE" "skip")
Set-EnvValue "EXPORT_PUBLIC_RELEASE" (Get-EnvValue "EXPORT_PUBLIC_RELEASE" "true")

if ((Get-EnvValue "RELEASE_TARGET") -ne "win_x64") {
  throw "RELEASE_TARGET must be win_x64"
}
if ((Get-EnvValue "BUILD_TARGET") -notin @("all", "dir", "nsis", "zip")) {
  throw "BUILD_TARGET must be one of: all, dir, nsis, zip"
}
if ((Get-EnvValue "SIGN_MODE") -notin @("off", "on")) {
  throw "SIGN_MODE must be one of: off, on"
}
if ((Get-EnvValue "SMOKE_MODE") -notin @("skip", "core", "full")) {
  throw "SMOKE_MODE must be one of: skip, core, full"
}
if ((Get-EnvValue "SIGN_MODE") -eq "on") {
  Require-Env "OD_WIN_SIGN_CERT_SHA1"
}
if ((Get-EnvValue "AUTO_BUILD_RELEASE_TOOLS") -notin @("true", "false")) {
  throw "AUTO_BUILD_RELEASE_TOOLS must be one of: true, false"
}

$script:PnpmCommand = Resolve-PnpmCommand

if ([string]::IsNullOrWhiteSpace((Get-EnvValue "RELEASE_VERSION")) -and (Get-EnvValue "AUTO_BUMP_PATCH") -eq "true") {
  $nextVersion = (& node ".\scripts\bump-release-patch.mjs").Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($nextVersion)) {
    throw "failed to auto-bump patch version"
  }
  Set-EnvValue "RELEASE_VERSION" $nextVersion
} elseif ([string]::IsNullOrWhiteSpace((Get-EnvValue "RELEASE_VERSION"))) {
  Set-EnvValue "RELEASE_VERSION" ((& node -p "require('./package.json').version").Trim())
}

if ([string]::IsNullOrWhiteSpace((Get-EnvValue "RELEASE_NAMESPACE"))) {
  Set-EnvValue "RELEASE_NAMESPACE" "release-$(Get-EnvValue 'RELEASE_CHANNEL')-win"
}

$releaseTarget = Get-EnvValue "RELEASE_TARGET"
$workRoot = Get-EnvValue "WORK_ROOT" (Join-Path $RootDir ".tmp\runner\win_x64")
Set-EnvValue "WORK_ROOT" $workRoot
Set-EnvValue "TOOLS_PACK_DIR" (Get-EnvValue "TOOLS_PACK_DIR" (Join-Path $workRoot "tools-pack"))
Set-EnvValue "TOOLS_PACK_CACHE_DIR" (Get-EnvValue "TOOLS_PACK_CACHE_DIR" (Join-Path $workRoot "tools-pack-cache"))
Set-EnvValue "BUILD_JSON_PATH" (Get-EnvValue "BUILD_JSON_PATH" (Join-Path $workRoot "build\build.json"))
Set-EnvValue "INDEX_PATH" (Get-EnvValue "INDEX_PATH" (Join-Path $workRoot "build\index.json"))
Set-EnvValue "REPORT_ROOT" (Get-EnvValue "REPORT_ROOT" (Join-Path $workRoot "release-report\$releaseTarget"))
Set-EnvValue "OUTPUTS_PATH" (Get-EnvValue "OUTPUTS_PATH" (Join-Path $workRoot "build\outputs.json"))
Set-EnvValue "RELEASE_PUBLIC_DIR" (Get-EnvValue "RELEASE_PUBLIC_DIR" (Join-Path $RootDir ".tmp\release-public"))

Infer-GitHubReleaseDefaults

if ((Get-EnvValue "EXPORT_PUBLIC_RELEASE") -eq "true") {
  Require-Env "RELEASE_PUBLIC_ORIGIN"
  $origin = (Get-EnvValue "RELEASE_PUBLIC_ORIGIN").TrimEnd("/")
  $channel = Get-EnvValue "RELEASE_CHANNEL"
  Set-EnvValue "OD_UPDATE_METADATA_URL" (Get-EnvValue "OD_UPDATE_METADATA_URL" "$origin/$channel/latest/metadata.json")
}

if ((Get-EnvValue "AUTO_BUILD_RELEASE_TOOLS") -eq "true") {
  Write-Host "Preparing release tool builds"
  Invoke-Pnpm -Arguments @("--filter", "@nn-design/tools-pack", "build")
  if ((Get-EnvValue "EXPORT_PUBLIC_RELEASE") -eq "true") {
    Invoke-Pnpm -Arguments @("--filter", "@nn-design/tools-release", "build")
  }
}

$releaseVersionForLog = Get-EnvValue "RELEASE_VERSION"
$releaseNamespaceForLog = Get-EnvValue "RELEASE_NAMESPACE"
$signModeForLog = Get-EnvValue "SIGN_MODE"
$buildTargetForLog = Get-EnvValue "BUILD_TARGET"
Write-Host "Building $releaseTarget $releaseVersionForLog ($releaseNamespaceForLog, sign=$signModeForLog, target=$buildTargetForLog)"

& (Join-Path $RootDir "tools\release\scripts\build-platform.ps1") `
  -ReleaseTarget $releaseTarget `
  -ReleaseNamespace (Get-EnvValue "RELEASE_NAMESPACE") `
  -ReleaseVersion (Get-EnvValue "RELEASE_VERSION") `
  -SmokeMode (Get-EnvValue "SMOKE_MODE") `
  -BuildTarget (Get-EnvValue "BUILD_TARGET") `
  -SignMode (Get-EnvValue "SIGN_MODE") `
  -WorkRoot (Get-EnvValue "WORK_ROOT") `
  -ToolsPackDir (Get-EnvValue "TOOLS_PACK_DIR") `
  -CacheDir (Get-EnvValue "TOOLS_PACK_CACHE_DIR") `
  -BuildJsonPath (Get-EnvValue "BUILD_JSON_PATH") `
  -IndexPath (Get-EnvValue "INDEX_PATH") `
  -ReportRoot (Get-EnvValue "REPORT_ROOT") `
  -OutputsPath (Get-EnvValue "OUTPUTS_PATH")
if ($LASTEXITCODE -ne 0) {
  throw "build-platform.ps1 failed"
}

if ((Get-EnvValue "EXPORT_PUBLIC_RELEASE") -eq "true") {
  Export-WinReleasePublic
  Deploy-PublicGitHubRelease
}
