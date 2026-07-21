#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_RELEASE_PUBLIC_ORIGIN="https://ilous12.github.io/nn-design-release-feed"
DEFAULT_RELEASE_PUBLIC_GH_REPO="ilous12/nn-design-release-feed"
RELEASE_PUBLIC_ORIGIN="${RELEASE_PUBLIC_ORIGIN:-$DEFAULT_RELEASE_PUBLIC_ORIGIN}"
RELEASE_PUBLIC_GH_REPO="${RELEASE_PUBLIC_GH_REPO:-$DEFAULT_RELEASE_PUBLIC_GH_REPO}"
DEPLOY_PUBLIC_GITHUB="${DEPLOY_PUBLIC_GITHUB:-true}"

PLATFORM_MANIFESTS="$SCRIPT_DIR/manifests"
WIN_STAGE="$SCRIPT_DIR/staging/win/final/assets"
PUBLIC_DIR="${RELEASE_PUBLIC_DIR:-$ROOT_DIR/.tmp/release-public}"

echo "Release publish checklist"
echo "  platform manifests: $PLATFORM_MANIFESTS"
echo "  win staging: $WIN_STAGE"
echo "  public dir:   $PUBLIC_DIR"

if [ ! -d "$PUBLIC_DIR" ]; then
  echo "public release directory not found: $PUBLIC_DIR" >&2
  echo "Run release_mac.sh and the Windows release steps first." >&2
  exit 1
fi

find "$PUBLIC_DIR" -maxdepth 4 -type f | sort

if [ "${DEPLOY_PUBLIC_GITHUB:-false}" = "true" ]; then
  : "${RELEASE_PUBLIC_GH_REPO:?RELEASE_PUBLIC_GH_REPO is required when DEPLOY_PUBLIC_GITHUB=true}"
  : "${RELEASE_PUBLIC_ORIGIN:?RELEASE_PUBLIC_ORIGIN is required when DEPLOY_PUBLIC_GITHUB=true}"
  "$ROOT_DIR/scripts/deploy-public-release-github.sh"
else
  echo "Set DEPLOY_PUBLIC_GITHUB=true to upload the release feed and assets."
fi
