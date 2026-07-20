#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/env/mac-release.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

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

default_target() {
  case "$(uname -m)" in
    arm64) printf '%s\n' mac_arm64 ;;
    x86_64) printf '%s\n' mac_x64 ;;
    *) echo "unsupported mac architecture: $(uname -m)" >&2; exit 1 ;;
  esac
}

default_namespace() {
  case "${RELEASE_TARGET}" in
    mac_arm64) printf 'release-%s\n' "$RELEASE_CHANNEL" ;;
    mac_x64) printf 'release-%s-intel\n' "$RELEASE_CHANNEL" ;;
    *) echo "unsupported RELEASE_TARGET: $RELEASE_TARGET" >&2; exit 1 ;;
  esac
}

require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "$name is required" >&2
    exit 1
  fi
}

expand_local_path() {
  local value="$1"
  case "$value" in
    '$HOME'/*) printf '%s/%s\n' "$HOME" "${value#'$HOME'/}" ;;
    '${HOME}'/*) printf '%s/%s\n' "$HOME" "${value#'${HOME}'/}" ;;
    '~'/*) printf '%s/%s\n' "$HOME" "${value#'~'/}" ;;
    /*) printf '%s\n' "$value" ;;
    *) printf '%s/%s\n' "$ROOT_DIR" "$value" ;;
  esac
}

normalize_path_var() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    export "$name=$(expand_local_path "${!name}")"
  fi
}

require_public_origin() {
  if [ -n "${RELEASE_PUBLIC_ORIGIN:-}" ]; then
    return 0
  fi

  cat >&2 <<'EOF'
RELEASE_PUBLIC_ORIGIN is required because EXPORT_PUBLIC_RELEASE=true.

Set it to the HTTPS origin that will serve the exported update feed.

Examples:
  RELEASE_PUBLIC_ORIGIN=https://<owner>.github.io/<repo> ./build_mac.sh
  RELEASE_PUBLIC_ORIGIN=https://download.example.com/nn-design RELEASE_PUBLIC_DIR=/path/to/public-repo ./build_mac.sh

For a build without updater export:
  EXPORT_PUBLIC_RELEASE=false ./build_mac.sh
EOF
  exit 1
}

infer_github_release_defaults() {
  if [ "$EXPORT_PUBLIC_RELEASE" != "true" ]; then
    return 0
  fi
  if [ "${DEPLOY_PUBLIC_GITHUB:-}" = "false" ]; then
    return 0
  fi
  if [ -n "${RELEASE_PUBLIC_ORIGIN:-}" ] && [ -z "${RELEASE_PUBLIC_GH_REPO:-}" ]; then
    return 0
  fi
  if ! command -v gh >/dev/null 2>&1; then
    return 0
  fi

  local owner repo_name
  owner="$(gh api user --jq '.login' 2>/dev/null || true)"
  if [ -z "$owner" ]; then
    return 0
  fi

  repo_name="${RELEASE_PUBLIC_GH_REPO:-$owner/nn-design-release-feed}"
  RELEASE_PUBLIC_GH_REPO="$repo_name"
  DEPLOY_PUBLIC_GITHUB="${DEPLOY_PUBLIC_GITHUB:-true}"

  if [ -z "${RELEASE_PUBLIC_ORIGIN:-}" ]; then
    RELEASE_PUBLIC_ORIGIN="https://${repo_name%%/*}.github.io/${repo_name#*/}"
  fi
}

RELEASE_CHANNEL="${RELEASE_CHANNEL:-stable}"
AUTO_BUMP_PATCH="${AUTO_BUMP_PATCH:-true}"

case "$AUTO_BUMP_PATCH" in
  true | false) ;;
  *) echo "AUTO_BUMP_PATCH must be one of: true, false" >&2; exit 1 ;;
esac

if [ -z "${RELEASE_VERSION:-}" ] && [ "$AUTO_BUMP_PATCH" = "true" ]; then
  RELEASE_VERSION="$(node ./scripts/bump-release-patch.mjs)"
elif [ -z "${RELEASE_VERSION:-}" ]; then
  RELEASE_VERSION="$(node -p "require('./package.json').version")"
fi
RELEASE_TARGET="${RELEASE_TARGET:-$(default_target)}"
RELEASE_NAMESPACE="${RELEASE_NAMESPACE:-$(default_namespace)}"
TOOLS_PACK_DIR="${TOOLS_PACK_DIR:-$ROOT_DIR/.tmp/tools-pack}"
TOOLS_PACK_CACHE_DIR="${TOOLS_PACK_CACHE_DIR:-$ROOT_DIR/.tmp/tools-pack-cache}"
RELEASE_PUBLIC_DIR="${RELEASE_PUBLIC_DIR:-$ROOT_DIR/.tmp/release-public}"
MAC_COMPRESSION="${MAC_COMPRESSION:-normal}"
BUILD_TARGET="${BUILD_TARGET:-all}"
SIGN_MODE="${SIGN_MODE:-notarize}"
EXPORT_PUBLIC_RELEASE="${EXPORT_PUBLIC_RELEASE:-true}"
DEPLOY_PUBLIC_GITHUB="${DEPLOY_PUBLIC_GITHUB:-}"
AUTO_BUILD_RELEASE_TOOLS="${AUTO_BUILD_RELEASE_TOOLS:-true}"

infer_github_release_defaults

case "$AUTO_BUILD_RELEASE_TOOLS" in
  true | false) ;;
  *) echo "AUTO_BUILD_RELEASE_TOOLS must be one of: true, false" >&2; exit 1 ;;
esac

case "$SIGN_MODE" in
  no | sign-only | notarize) ;;
  *) echo "SIGN_MODE must be one of: no, sign-only, notarize" >&2; exit 1 ;;
esac

case "$BUILD_TARGET" in
  all | app | dmg | zip) ;;
  *) echo "BUILD_TARGET must be one of: all, app, dmg, zip" >&2; exit 1 ;;
esac

if [ "$SIGN_MODE" != "no" ]; then
  normalize_path_var CSC_LINK
  require_var CSC_LINK
  require_var CSC_KEY_PASSWORD
fi

if [ "$SIGN_MODE" = "notarize" ]; then
  require_var APPLE_ID
  require_var APPLE_TEAM_ID
  if [ -z "${APPLE_NOTARY_KEYCHAIN_PROFILE:-}" ]; then
    require_var APPLE_APP_SPECIFIC_PASSWORD
  fi
fi

if [ "$EXPORT_PUBLIC_RELEASE" = "true" ]; then
  require_public_origin
  export OD_UPDATE_METADATA_URL="${OD_UPDATE_METADATA_URL:-${RELEASE_PUBLIC_ORIGIN%/}/$RELEASE_CHANNEL/latest/metadata.json}"
fi

if [ "$AUTO_BUILD_RELEASE_TOOLS" = "true" ]; then
  echo "Preparing release tool builds"
  run_pnpm --filter @nn-design/tools-pack build
  if [ "$EXPORT_PUBLIC_RELEASE" = "true" ]; then
    run_pnpm --filter @nn-design/tools-release build
  fi
fi

build_args=(
  exec tools-pack mac build
  --dir "$TOOLS_PACK_DIR"
  --cache-dir "$TOOLS_PACK_CACHE_DIR"
  --namespace "$RELEASE_NAMESPACE"
  --portable
  --app-version "$RELEASE_VERSION"
  --mac-compression "$MAC_COMPRESSION"
  --to "$BUILD_TARGET"
  --json
)

if [ "$SIGN_MODE" != "no" ]; then
  build_args+=(--signed)
fi
if [ "$SIGN_MODE" = "notarize" ]; then
  build_args+=(--notarize)
fi

echo "Building $RELEASE_TARGET $RELEASE_VERSION ($RELEASE_NAMESPACE, sign=$SIGN_MODE, target=$BUILD_TARGET)"
run_pnpm "${build_args[@]}"

if [ "$EXPORT_PUBLIC_RELEASE" = "true" ]; then
  echo "Exporting public release files for ${RELEASE_PUBLIC_ORIGIN%/}/$RELEASE_CHANNEL/latest/metadata.json"
  RELEASE_CHANNEL="$RELEASE_CHANNEL" \
  RELEASE_VERSION="$RELEASE_VERSION" \
  RELEASE_TARGET="$RELEASE_TARGET" \
  RELEASE_NAMESPACE="$RELEASE_NAMESPACE" \
  RELEASE_PUBLIC_ORIGIN="$RELEASE_PUBLIC_ORIGIN" \
  RELEASE_PUBLIC_GH_REPO="${RELEASE_PUBLIC_GH_REPO:-}" \
  RELEASE_PUBLIC_DIR="$RELEASE_PUBLIC_DIR" \
  TOOLS_PACK_DIR="$TOOLS_PACK_DIR" \
  RELEASE_SIGNED="$([ "$SIGN_MODE" = "no" ] && printf false || printf true)" \
  RELEASE_ARTIFACT_MODE="${RELEASE_ARTIFACT_MODE:-dmg-and-payload}" \
  ./scripts/export-mac-release-public.sh

  if [ "${DEPLOY_PUBLIC_GITHUB:-false}" = "true" ]; then
    RELEASE_PUBLIC_DIR="$RELEASE_PUBLIC_DIR" \
    RELEASE_PUBLIC_GH_REPO="$RELEASE_PUBLIC_GH_REPO" \
    RELEASE_PUBLIC_ORIGIN="$RELEASE_PUBLIC_ORIGIN" \
    RELEASE_VERSION="$RELEASE_VERSION" \
    ./scripts/deploy-public-release-github.sh
  fi
fi
