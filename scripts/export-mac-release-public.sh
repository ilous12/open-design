#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f "$ROOT_DIR/.nvmrc" ] && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
  nvm use --silent
fi

PACKAGE_MANAGER="$(node -p "require('./package.json').packageManager || 'pnpm@10.33.2'")"
PNPM_VERSION="${PACKAGE_MANAGER#pnpm@}"
if command -v corepack >/dev/null 2>&1; then
  corepack prepare "pnpm@$PNPM_VERSION" --activate >/dev/null
  PNPM_CMD=(corepack pnpm)
elif command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD=(pnpm)
else
  PNPM_CMD=(npx "pnpm@$PNPM_VERSION")
fi

run_pnpm() {
  "${PNPM_CMD[@]}" "$@"
}

required() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "$name is required" >&2
    exit 1
  fi
}

copy_file() {
  local source="$1"
  local destination="$2"
  if [ ! -f "$source" ]; then
    echo "expected file not found: $source" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$destination")"
  cp "$source" "$destination"
}

required RELEASE_CHANNEL
required RELEASE_VERSION
required RELEASE_TARGET
required RELEASE_NAMESPACE
required RELEASE_PUBLIC_ORIGIN
required TOOLS_PACK_DIR

RELEASE_PUBLIC_DIR="${RELEASE_PUBLIC_DIR:-$ROOT_DIR/.tmp/release-public}"
RELEASE_ASSETS_DIR="${RELEASE_ASSETS_DIR:-$ROOT_DIR/.tmp/release-assets/$RELEASE_TARGET}"
RELEASE_MANIFEST_DIR="${RELEASE_MANIFEST_DIR:-$ROOT_DIR/.tmp/release-manifests}"
RELEASE_METADATA_DIR="${RELEASE_METADATA_DIR:-$ROOT_DIR/.tmp/release-metadata}"
RELEASE_OUTPUTS_DIR="${RELEASE_OUTPUTS_DIR:-$ROOT_DIR/.tmp/release-outputs}"
RELEASE_ARTIFACT_MODE="${RELEASE_ARTIFACT_MODE:-dmg-and-payload}"
RELEASE_SIGNED="${RELEASE_SIGNED:-false}"
RELEASE_PUBLIC_ORIGIN="${RELEASE_PUBLIC_ORIGIN%/}"
RELEASE_NOTES="${RELEASE_NOTES:-nn.design $RELEASE_VERSION}"

case "$RELEASE_TARGET" in
  mac_arm64 | mac_x64) ;;
  *) echo "unsupported RELEASE_TARGET for mac export: $RELEASE_TARGET" >&2; exit 1 ;;
esac

rm -rf "$RELEASE_ASSETS_DIR"
mkdir -p "$RELEASE_ASSETS_DIR" "$RELEASE_MANIFEST_DIR" "$RELEASE_METADATA_DIR" "$RELEASE_OUTPUTS_DIR"

RELEASE_ASSETS_DIR="$RELEASE_ASSETS_DIR" \
RELEASE_ARTIFACT_MODE="$RELEASE_ARTIFACT_MODE" \
RELEASE_CHANNEL="$RELEASE_CHANNEL" \
RELEASE_NAMESPACE="$RELEASE_NAMESPACE" \
RELEASE_PUBLIC_ORIGIN="$RELEASE_PUBLIC_ORIGIN" \
RELEASE_NOTES="$RELEASE_NOTES" \
RELEASE_TARGET="$RELEASE_TARGET" \
RELEASE_VERSION="$RELEASE_VERSION" \
TOOLS_PACK_DIR="$TOOLS_PACK_DIR" \
bash tools/release/scripts/prepare-platform-assets.sh

RELEASE_ASSETS_DIR="$RELEASE_ASSETS_DIR" \
RELEASE_ARTIFACT_MODE="$RELEASE_ARTIFACT_MODE" \
RELEASE_CHANNEL="$RELEASE_CHANNEL" \
RELEASE_MANIFEST_DIR="$RELEASE_MANIFEST_DIR" \
RELEASE_OUTPUTS_PATH="$RELEASE_OUTPUTS_DIR/$RELEASE_TARGET-publish-outputs.json" \
RELEASE_PUBLIC_ORIGIN="$RELEASE_PUBLIC_ORIGIN" \
RELEASE_PUBLISH_SIDE_EFFECTS=false \
RELEASE_SIGNED="$RELEASE_SIGNED" \
RELEASE_TARGET="$RELEASE_TARGET" \
RELEASE_VERSION="$RELEASE_VERSION" \
run_pnpm exec tools-release publish-platform

case "$RELEASE_TARGET" in
  mac_arm64)
    enable_mac_arm64=true
    enable_mac_x64=false
    mac_arm64_result=success
    mac_x64_result=skipped
    ;;
  mac_x64)
    enable_mac_arm64=false
    enable_mac_x64=true
    mac_arm64_result=skipped
    mac_x64_result=success
    ;;
esac

ENABLE_MAC_ARM64="$enable_mac_arm64" \
ENABLE_MAC_X64="$enable_mac_x64" \
ENABLE_WIN_X64=false \
ENABLE_LINUX_X64=false \
MAC_ARM64_RESULT="$mac_arm64_result" \
MAC_X64_RESULT="$mac_x64_result" \
WIN_X64_RESULT=skipped \
LINUX_X64_RESULT=skipped \
RELEASE_CHANNEL="$RELEASE_CHANNEL" \
RELEASE_MANIFEST_DIR="$RELEASE_MANIFEST_DIR" \
RELEASE_METADATA_DIR="$RELEASE_METADATA_DIR" \
RELEASE_OUTPUTS_PATH="$RELEASE_OUTPUTS_DIR/metadata-outputs.json" \
RELEASE_PUBLIC_ORIGIN="$RELEASE_PUBLIC_ORIGIN" \
RELEASE_PUBLISH_SIDE_EFFECTS=false \
RELEASE_SIGNED="$RELEASE_SIGNED" \
RELEASE_VERSION="$RELEASE_VERSION" \
STATE_SOURCE=local-public-export \
run_pnpm exec tools-release publish-metadata

version_prefix="$RELEASE_CHANNEL/versions/$RELEASE_VERSION"
latest_prefix="$RELEASE_CHANNEL/latest"
version_dir="$RELEASE_PUBLIC_DIR/$version_prefix"
latest_dir="$RELEASE_PUBLIC_DIR/$latest_prefix"

mkdir -p "$version_dir/platforms" "$latest_dir/platforms"
find "$RELEASE_ASSETS_DIR" -maxdepth 1 -type f -print0 | while IFS= read -r -d '' file; do
  copy_file "$file" "$version_dir/$(basename "$file")"
done
copy_file "$RELEASE_MANIFEST_DIR/$RELEASE_TARGET.json" "$version_dir/platforms/$RELEASE_TARGET.json"
copy_file "$RELEASE_METADATA_DIR/metadata.json" "$version_dir/metadata.json"
copy_file "$RELEASE_METADATA_DIR/metadata.json" "$latest_dir/metadata.json"
copy_file "$RELEASE_MANIFEST_DIR/$RELEASE_TARGET.json" "$latest_dir/platforms/$RELEASE_TARGET.json"

if [ -f "$RELEASE_ASSETS_DIR/latest-mac.yml" ]; then
  copy_file "$RELEASE_ASSETS_DIR/latest-mac.yml" "$latest_dir/latest-mac.yml"
fi

copy_file "$ROOT_DIR/design-systems/air/assets/logo.svg" "$RELEASE_PUBLIC_DIR/air.svg"

cat > "$RELEASE_PUBLIC_DIR/README.md" <<EOF
# design for air 시작 가이드

design for air는 nn.design 배포판의 데스크톱 앱입니다. 회사 기준으로 AI 디자인 작업을 운영하고, Codex, Claude Code, Gemini CLI 같은 로컬 CLI와 사내 승인 모델을 연결해 비용, 데이터, 실행 환경을 통제합니다.

## 설치

[최신 릴리스](https://github.com/${RELEASE_PUBLIC_GH_REPO:-<owner>/<repo>}/releases/latest)에서 운영체제에 맞는 설치 파일을 받아 실행하면 됩니다. macOS와 Windows를 같은 배포 흐름에서 안내합니다.

## 활용 컨셉

- **플랫폼 비종속**: Claude Design 같은 특정 플랫폼의 사용량, 모델, 저장 방식에 업무가 묶이지 않도록 운영합니다.
- **로컬 CLI 우선**: Codex, Claude Code, Gemini CLI, 로컬 모델을 회사 정책 안에서 연결해 API 방식만 고집하지 않습니다.
- **데이터 통제**: 디자인 파일, 프롬프트, 결과물, 프로젝트 컨텍스트를 로컬 또는 사내 승인 경로에서 관리합니다.
- **회사 맞춤 시스템**: 사내 서비스 UI, 브랜드 톤, 컴포넌트 규칙, 개발팀 산출물 형식에 맞게 nn.design 전용 시스템으로 운영합니다.
- **검증 가능한 운영**: 생성 결과를 검토, 수정, 재사용하고 에이전트 권한, 로그, 품질 기준을 관리합니다.

## 가이드

- **열기**: 프로젝트 폴더, 디자인 시스템, 사내 템플릿을 열어 컨텍스트를 고정합니다.
- **리믹스**: AIR 서비스 톤, 모바일 우선, 관리자 업무 흐름, 개발 전달물 기준으로 다시 요청합니다.
- **설정**: Codex, Claude Code, Gemini CLI, 로컬 모델, BYOK, 사내 API 키를 보안 정책과 비용 기준에 맞춥니다.

## 배포 구조

이 저장소에는 앱이 참조하는 작은 메타데이터만 보관합니다. 용량이 큰 설치 파일, 런처 payload, 체크섬 파일은 각 버전의 GitHub Release asset으로 업로드됩니다.

\`\`\`text
stable/
  latest/
    metadata.json
    platforms/
  versions/
    <version>/
      metadata.json
      platforms/
\`\`\`

EOF

cat > "$RELEASE_PUBLIC_DIR/index.html" <<EOF
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>design for air 시작 가이드</title>
    <link rel="icon" href="./air.svg" type="image/svg+xml" />
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f5f5;
        --surface: #ffffff;
        --surface-soft: #f8fafc;
        --text: #111827;
        --muted: #6b7280;
        --border: #e5e7eb;
        --primary: #6366f1;
        --primary-2: #8b5cf6;
        --secondary: #10b981;
        --shadow: 0 20px 45px rgba(17, 24, 39, 0.12);
      }

      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
        line-height: 1.6;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 20;
        border-bottom: 1px solid rgba(229, 231, 235, 0.8);
        background: rgba(245, 245, 245, 0.82);
        backdrop-filter: blur(14px);
      }

      .nav-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: min(1152px, calc(100% - 32px));
        height: 64px;
        margin: 0 auto;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: var(--text);
        font-size: 18px;
        font-weight: 800;
      }

      .mark {
        display: grid;
        place-items: center;
        width: 40px;
        height: 32px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: #ffffff;
      }

      .brand-logo {
        display: block;
        width: 24px;
        height: auto;
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 32px;
      }

      .nav-links a {
        color: var(--muted);
        font-size: 14px;
        font-weight: 600;
      }

      .nav-links a:hover {
        color: var(--text);
      }

      .nav-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nav-actions a {
        color: var(--muted);
        font-size: 14px;
        font-weight: 700;
      }

      .nav-actions .small-primary {
        border-radius: 10px;
        background: linear-gradient(135deg, var(--primary), var(--primary-2));
        color: #ffffff;
        padding: 9px 15px;
      }

      main {
        padding-top: 64px;
      }

      .container {
        width: min(1152px, calc(100% - 32px));
        margin: 0 auto;
      }

      .hero {
        padding: 72px 0 64px;
        text-align: center;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        background: rgba(99, 102, 241, 0.1);
        color: var(--primary);
        padding: 7px 13px;
        font-size: 14px;
        font-weight: 800;
      }

      .bolt {
        width: 16px;
        height: 16px;
      }

      h1 {
        max-width: 840px;
        margin: 24px auto 0;
        color: var(--text);
        font-size: clamp(42px, 7vw, 72px);
        line-height: 1.05;
        letter-spacing: 0;
        word-break: keep-all;
      }

      .gradient-text {
        background: linear-gradient(135deg, var(--primary), var(--primary-2));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .summary {
        max-width: 680px;
        margin: 24px auto 0;
        color: var(--muted);
        font-size: 20px;
        word-break: keep-all;
      }

      .actions {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 32px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 50px;
        border-radius: 12px;
        padding: 0 22px;
        font-size: 16px;
        font-weight: 800;
      }

      .button.primary {
        background: linear-gradient(135deg, var(--primary), var(--primary-2));
        color: #ffffff;
        box-shadow: 0 12px 24px rgba(99, 102, 241, 0.24);
      }

      .button.secondary {
        border: 1px solid var(--border);
        background: #ffffff;
        color: var(--text);
      }

      .chat-demo {
        max-width: 768px;
        margin: 48px auto 0;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: #ffffff;
        box-shadow: var(--shadow);
        overflow: hidden;
        text-align: left;
      }

      .chat-header {
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid var(--border);
        padding: 18px 24px;
      }

      .avatar {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--primary), var(--primary-2));
        color: #ffffff;
        font-weight: 900;
      }

      .chat-title {
        color: var(--text);
        font-weight: 800;
      }

      .status {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary);
        font-size: 12px;
        font-weight: 700;
      }

      .status::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--secondary);
      }

      .chat-body {
        display: grid;
        gap: 18px;
        padding: 24px;
      }

      .message {
        display: flex;
        gap: 12px;
      }

      .message.user {
        justify-content: flex-end;
      }

      .bubble {
        max-width: 80%;
        border-radius: 18px;
        padding: 13px 16px;
        font-size: 14px;
      }

      .user .bubble {
        border-bottom-right-radius: 5px;
        background: var(--primary);
        color: #ffffff;
      }

      .assistant .bubble {
        border-bottom-left-radius: 5px;
        background: var(--bg);
        color: var(--text);
      }

      .typing {
        display: flex;
        gap: 5px;
      }

      .typing span {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #9ca3af;
      }

      .composer {
        display: flex;
        align-items: center;
        gap: 12px;
        border-top: 1px solid var(--border);
        padding: 16px 24px;
      }

      .input {
        flex: 1;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--bg);
        color: var(--muted);
        padding: 13px 16px;
        font-size: 14px;
      }

      .send {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--primary), var(--primary-2));
        color: #ffffff;
        font-weight: 900;
      }

      .agent-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .agent-chip {
        border: 1px solid rgba(99, 102, 241, 0.18);
        border-radius: 8px;
        background: #ffffff;
        color: var(--primary);
        padding: 5px 8px;
        font-size: 12px;
        font-weight: 800;
      }

      .install-line {
        max-width: 760px;
        margin: 28px auto 0;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: #ffffff;
        color: var(--muted);
        padding: 13px 16px;
        font-size: 15px;
        font-weight: 700;
      }

      .section {
        padding: 72px 0;
      }

      .white-section {
        background: #ffffff;
      }

      .section-head {
        max-width: 720px;
        margin: 0 auto 42px;
        text-align: center;
      }

      .section-head h2 {
        margin: 0;
        color: var(--text);
        font-size: clamp(30px, 4vw, 44px);
        line-height: 1.16;
        letter-spacing: 0;
        word-break: keep-all;
      }

      .section-head p {
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 18px;
        word-break: keep-all;
      }

      .feature-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
      }

      .feature-card,
      .install-card,
      .feed-card {
        border: 1px solid var(--border);
        border-radius: 18px;
        background: #ffffff;
        padding: 24px;
      }

      .feature-card {
        cursor: default;
        transition: border-color 160ms ease, box-shadow 160ms ease;
      }

      .feature-card:hover {
        border-color: rgba(99, 102, 241, 0.35);
        box-shadow: 0 12px 26px rgba(17, 24, 39, 0.08);
      }

      .icon-box {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: rgba(99, 102, 241, 0.1);
        color: var(--primary);
        font-size: 22px;
      }

      .feature-card h3,
      .install-card h3,
      .feed-card h3 {
        margin: 18px 0 8px;
        color: var(--text);
        font-size: 19px;
        line-height: 1.35;
        word-break: keep-all;
      }

      .feature-card p,
      .install-card p,
      .feed-card p {
        margin: 0;
        color: var(--muted);
        font-size: 15px;
        word-break: keep-all;
      }

      .feature-card strong,
      .install-card strong,
      .guide-item strong {
        color: var(--text);
      }

      code {
        border-radius: 5px;
        background: #eef2ff;
        color: var(--primary);
        padding: 2px 6px;
        font-size: 0.92em;
      }

      .install-layout {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
      }

      .usage-layout {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
      }

      .usage-layout .icon-box {
        width: auto;
        min-width: 64px;
        padding: 0 12px;
        white-space: nowrap;
      }

      .install-card.emphasis {
        position: relative;
        border-color: var(--primary);
        box-shadow: 0 18px 36px rgba(99, 102, 241, 0.15);
      }

      .guide-tabs {
        max-width: 896px;
        margin: 0 auto;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: #ffffff;
        overflow: hidden;
      }

      .guide-tabs input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .tab-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        border-bottom: 1px solid var(--border);
        background: var(--surface-soft);
      }

      .tab-list label {
        cursor: pointer;
        padding: 16px;
        color: var(--muted);
        text-align: center;
        font-weight: 800;
      }

      #tab-install:checked ~ .tab-list label[for="tab-install"],
      #tab-guide:checked ~ .tab-list label[for="tab-guide"] {
        background: #ffffff;
        color: var(--primary);
      }

      .tab-panel {
        display: none;
      }

      #tab-install:checked ~ .panels #install-panel,
      #tab-guide:checked ~ .panels #guide-panel {
        display: block;
      }

      .panels {
        padding: 28px;
      }

      .guide-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .guide-item {
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface-soft);
        padding: 18px;
      }

      .guide-item h3 {
        margin: 0 0 8px;
        word-break: keep-all;
      }

      .guide-item p {
        margin: 0;
        color: var(--muted);
        font-size: 15px;
        word-break: keep-all;
      }

      .note {
        margin-top: 20px;
        border-radius: 12px;
        background: #eef2ff;
        color: #4338ca;
        padding: 14px 16px;
        font-size: 14px;
        font-weight: 700;
      }

      .feed-card {
        max-width: 896px;
        margin: 24px auto 0;
      }

      .feed-links {
        display: grid;
        gap: 8px;
        margin-top: 16px;
      }

      .feed-links a {
        color: var(--primary);
        font-weight: 800;
      }

      .cta-band {
        border-radius: 24px;
        background: linear-gradient(135deg, var(--primary), var(--primary-2));
        color: #ffffff;
        padding: 56px 24px;
        text-align: center;
      }

      .cta-band h2 {
        margin: 0;
        font-size: clamp(30px, 5vw, 48px);
        line-height: 1.15;
      }

      .cta-band p {
        max-width: 620px;
        margin: 16px auto 0;
        color: rgba(255, 255, 255, 0.82);
        font-size: 18px;
      }

      .cta-band .button {
        margin-top: 28px;
        background: #ffffff;
        color: var(--primary);
      }

      @media (max-width: 860px) {
        .nav-links,
        .nav-actions a:first-child {
          display: none;
        }

        .hero {
          padding-top: 48px;
        }

        h1 {
          font-size: 39px;
        }

        .chat-demo {
          margin-top: 36px;
        }

        .feature-grid,
        .install-layout,
        .usage-layout,
        .guide-grid {
          grid-template-columns: 1fr;
        }

        .section {
          padding: 54px 0;
        }

        .composer {
          padding: 14px;
        }

        .bubble {
          max-width: 88%;
        }

        .container {
          width: min(100% - 28px, 1152px);
        }
      }
    </style>
  </head>
  <body>
    <nav class="nav" aria-label="design for air navigation">
        <div class="nav-inner">
          <a class="brand" href="#">
            <span class="mark"><img class="brand-logo" src="./air.svg" alt="" /></span>
            <span>design</span>
          </a>
          <div class="nav-links">
          <a href="#features">컨셉</a>
          <a href="#usage">활용</a>
          <a href="#install">설치</a>
        </div>
        <div class="nav-actions">
          <a href="https://github.com/${RELEASE_PUBLIC_GH_REPO:-<owner>/<repo>}/releases">릴리스</a>
          <a class="small-primary" href="https://github.com/${RELEASE_PUBLIC_GH_REPO:-<owner>/<repo>}/releases/latest">받기</a>
        </div>
      </div>
    </nav>

    <main>
      <section class="hero">
        <div class="container">
          <div class="pill">
            <svg class="bolt" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Codex · Claude Code · Gemini CLI · Local Model
          </div>
          <h1>회사 기준으로 쓰는<br /><span class="gradient-text">AI 디자인 도구</span></h1>
          <p class="summary">nn.design은 특정 플랫폼에 업무를 맡기지 않고, Codex, Claude Code, Gemini CLI 같은 로컬 도구와 사내 승인 모델을 연결해 비용과 데이터를 통제합니다.</p>
          <div class="actions">
            <a class="button primary os-download-label" href="https://github.com/${RELEASE_PUBLIC_GH_REPO:-<owner>/<repo>}/releases/latest">OS에 맞는 설치 파일 받기</a>
            <a class="button secondary" href="#usage">활용 방식 보기</a>
          </div>
          <div class="install-line">설치: 운영체제에 맞는 설치 파일을 받고, 팀에서 허용한 CLI와 키를 연결합니다.</div>

          <div class="chat-demo" aria-label="design for air chatbot style preview">
            <div class="chat-header">
              <div class="avatar">AI</div>
              <div>
                <div class="chat-title">nn.design Assistant</div>
                <div class="status">Internal workspace ready</div>
              </div>
            </div>
            <div class="chat-body">
              <div class="message user">
                <div class="bubble">Build me a Notion-style team dashboard.</div>
              </div>
              <div class="message assistant">
                <div class="avatar">AI</div>
                <div class="bubble">
                  사내 디자인 시스템을 기준으로 작업하고, 외부 서비스 하나에 묶지 않고 로컬 CLI를 골라 실행합니다.
                  <div class="agent-row">
                    <span class="agent-chip">Codex: code</span>
                    <span class="agent-chip">Claude Code: UX draft</span>
                    <span class="agent-chip">Gemini CLI: review</span>
                    <span class="agent-chip">Local: private context</span>
                  </div>
                </div>
              </div>
              <div class="message assistant">
                <div class="avatar" style="opacity:.5">AI</div>
                <div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>
              </div>
            </div>
            <div class="composer">
              <div class="input">Open a project, choose an agent, review the result...</div>
              <div class="send">→</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="section white-section">
        <div class="container">
          <div class="section-head">
            <h2>중요한 건 모델보다<br /><span class="gradient-text">플랫폼 비종속과 데이터 통제입니다</span></h2>
            <p>nn.design은 Claude Design에 업무를 종속시키지 않고, 회사가 허용한 CLI와 모델을 로컬 중심으로 묶어 운영합니다.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card">
              <div class="icon-box">01</div>
              <h3>플랫폼 비종속 운영</h3>
              <p>특정 플랫폼의 사용량, 모델, 저장 방식에 묶이지 않고 회사 기준으로 실행 경로를 선택합니다.</p>
            </article>
            <article class="feature-card">
              <div class="icon-box">02</div>
              <h3>로컬 CLI 우선 연결</h3>
              <p>Codex, Claude Code, Gemini CLI, 로컬 모델을 작업 PC 또는 사내 승인 환경에서 먼저 사용합니다.</p>
            </article>
            <article class="feature-card">
              <div class="icon-box">03</div>
              <h3>전체 작업 로컬 통제</h3>
              <p>디자인 파일, 프롬프트, 산출물, 프로젝트 컨텍스트를 로컬 또는 사내 승인 경로에서 관리합니다.</p>
            </article>
            <article class="feature-card">
              <div class="icon-box">04</div>
              <h3>회사 맞춤 디자인/업무 시스템</h3>
              <p>Open.design의 범용 시스템을 그대로 쓰지 않고 사내 서비스 UI, 브랜드 톤, 컴포넌트 규칙, 개발팀 산출물 형식에 맞게 정제합니다.</p>
            </article>
            <article class="feature-card">
              <div class="icon-box">05</div>
              <h3>결과물 재사용 기준</h3>
              <p>생성 결과는 검토, 수정, 재사용할 수 있는 형태로 남기고 팀의 품질 기준에 맞춰 관리합니다.</p>
            </article>
            <article class="feature-card">
              <div class="icon-box">₩</div>
              <h3>정액제와 비용 분산</h3>
              <p>API 방식만 고집하지 않고 정액제 CLI, BYOK, 사내 키, 로컬 모델을 조합해 비용과 사용량 한도를 분산합니다.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="usage" class="section">
        <div class="container">
          <div class="section-head">
            <h2>작업은 로컬에서 시작하고<br /><span class="gradient-text">필요한 도구만 선택합니다</span></h2>
            <p>초안 생성, 리믹스, 코드 변환, 리뷰를 같은 프로젝트 컨텍스트 안에서 이어가되 API, 정액제 CLI, 로컬 모델 중 팀 정책에 맞는 방식을 선택합니다.</p>
          </div>
          <div class="usage-layout">
            <article class="install-card">
              <div class="icon-box">열기</div>
              <h3>프로젝트 컨텍스트 연결</h3>
              <p>작업 폴더, 사내 템플릿, 디자인 시스템 기준을 먼저 열어 AI가 회사 맥락 안에서 답하게 만듭니다.</p>
            </article>
            <article class="install-card">
              <div class="icon-box">선택</div>
              <h3>목적에 맞는 CLI 지정</h3>
              <p><strong>Codex</strong>, <strong>Claude Code</strong>, <strong>Gemini CLI</strong>, 로컬 모델 중 작업 성격과 보안 기준에 맞는 실행 경로를 선택합니다.</p>
            </article>
            <article class="install-card">
              <div class="icon-box">리믹스</div>
              <h3>결과를 업무 형식으로 재구성</h3>
              <p>관리자 화면, 모바일 우선, AIR 톤, 개발 전달용 스펙처럼 같은 요구를 여러 산출물 형태로 다시 만듭니다.</p>
            </article>
            <article class="install-card">
              <div class="icon-box">검토</div>
              <h3>결과를 내부 기준으로 확인</h3>
              <p>생성물은 그대로 끝내지 않고 검토, 수정, 재사용 가능한 형태로 정리합니다.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="install" class="section white-section">
        <div class="container">
          <div class="section-head">
            <h2>설치는 가볍게,<br /><span class="gradient-text">실행은 로컬 기준으로</span></h2>
            <p>macOS와 Windows 모두 같은 활용 흐름을 기준으로 안내하고, 설치 후에는 팀에서 허용한 CLI와 키 관리 방식을 설정합니다.</p>
          </div>
          <div class="install-line">설치: 최신 릴리스에서 현재 운영체제에 맞는 설치 파일을 받아 실행하세요.</div>
        </div>
      </section>

      <section class="section white-section">
        <div class="container">
          <div class="cta-band">
            <h2>작업 도구는 고르고, 데이터는 내부에 둡니다</h2>
            <p>Codex, Claude Code, Gemini CLI, 로컬 모델을 필요한 만큼 연결하고 결과물은 회사 기준 안에서 관리합니다.</p>
            <a class="button os-download-label" href="https://github.com/${RELEASE_PUBLIC_GH_REPO:-<owner>/<repo>}/releases/latest">OS에 맞는 설치 파일 받기</a>
          </div>
        </div>
      </section>
    </main>
    <script>
      (() => {
        const platform = [
          navigator.userAgentData && navigator.userAgentData.platform,
          navigator.platform,
          navigator.userAgent,
        ].filter(Boolean).join(" ").toLowerCase();
        let label = "OS에 맞는 설치 파일 받기";
        if (platform.includes("mac")) {
          label = "macOS 설치 파일 받기";
        } else if (platform.includes("win")) {
          label = "Windows 설치 파일 받기";
        }
        document.querySelectorAll(".os-download-label").forEach((element) => {
          element.textContent = label;
        });
      })();
    </script>
  </body>
</html>
EOF

echo "Exported public release feed to $RELEASE_PUBLIC_DIR"
echo "Set OD_UPDATE_METADATA_URL=${RELEASE_PUBLIC_ORIGIN}/${latest_prefix}/metadata.json before building clients."
