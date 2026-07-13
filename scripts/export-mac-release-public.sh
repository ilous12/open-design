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
RELEASE_ARTIFACT_MODE="${RELEASE_ARTIFACT_MODE:-dmg-and-zip}"
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

cat > "$RELEASE_PUBLIC_DIR/README.md" <<EOF
# nn.design release feed

Static update feed exported by \`scripts/export-mac-release-public.sh\`.

- Latest metadata: ${RELEASE_PUBLIC_ORIGIN}/${latest_prefix}/metadata.json
- Version metadata: ${RELEASE_PUBLIC_ORIGIN}/${version_prefix}/metadata.json
EOF

echo "Exported public release feed to $RELEASE_PUBLIC_DIR"
echo "Set OD_UPDATE_METADATA_URL=${RELEASE_PUBLIC_ORIGIN}/${latest_prefix}/metadata.json before building clients."
