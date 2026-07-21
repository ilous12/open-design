#!/usr/bin/env bash
set -euo pipefail

if [ -d /usr/bin ]; then
  PATH="/usr/bin:$PATH"
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "$name is required" >&2
    exit 1
  fi
}

required RELEASE_PUBLIC_DIR
required RELEASE_PUBLIC_GH_REPO

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required for GitHub deployment" >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "git is required for GitHub deployment" >&2
  exit 1
fi
if [ ! -d "$RELEASE_PUBLIC_DIR" ]; then
  echo "RELEASE_PUBLIC_DIR does not exist: $RELEASE_PUBLIC_DIR" >&2
  exit 1
fi

GH_PAGES_BRANCH="${GH_PAGES_BRANCH:-main}"
CLONE_DIR="${GH_DEPLOY_CLONE_DIR:-$ROOT_DIR/.tmp/github-release-feed/${RELEASE_PUBLIC_GH_REPO#*/}}"
REPO_DESCRIPTION="${GH_REPO_DESCRIPTION:-Static update feed for nn.design}"
GIT_FILE_SIZE_LIMIT_BYTES="${GIT_FILE_SIZE_LIMIT_BYTES:-100000000}"
DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES="${DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES:-true}"

replace_text_in_feed() {
  local search="$1"
  local replacement="$2"

  while IFS= read -r -d '' feed_file; do
    SEARCH="$search" REPLACEMENT="$replacement" perl -0pi -e 's/\Q$ENV{SEARCH}\E/$ENV{REPLACEMENT}/g' "$feed_file"
  done < <(/usr/bin/find "$CLONE_DIR" -type f \( -name '*.json' -o -name '*.yml' -o -name '*.yaml' -o -name '*.md' \) -print0)
}

is_release_feed_metadata_file() {
  case "$1" in
    *.json | *.yml | *.yaml | *.md) return 0 ;;
    *) return 1 ;;
  esac
}

release_tag_for_version() {
  local version="$1"
  printf '%s\n' "${RELEASE_GITHUB_TAG:-v$version}"
}

release_version_dirs() {
  /usr/bin/find "$CLONE_DIR" -mindepth 3 -maxdepth 3 -type d -path '*/versions/*' -print | sort
}

upload_version_assets_to_github_release() {
  if [ "$DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES" != "true" ]; then
    return 0
  fi

  local feed_origin
  feed_origin="${RELEASE_PUBLIC_ORIGIN:-https://${RELEASE_PUBLIC_GH_REPO%%/*}.github.io/${RELEASE_PUBLIC_GH_REPO#*/}}"
  feed_origin="${feed_origin%/}"

  local uploaded_count=0
  while IFS= read -r version_dir; do
    local release_version tag release_origin
    release_version="$(basename "$version_dir")"
    tag="$(release_tag_for_version "$release_version")"
    release_origin="https://github.com/${RELEASE_PUBLIC_GH_REPO}/releases/download/${tag}"

    if ! gh release view "$tag" --repo "$RELEASE_PUBLIC_GH_REPO" >/dev/null 2>&1; then
      gh release create "$tag" \
        --repo "$RELEASE_PUBLIC_GH_REPO" \
        --title "nn.design $release_version" \
        --notes "Release assets for nn.design $release_version"
    fi

    while IFS= read -r -d '' file; do
      if is_release_feed_metadata_file "$file"; then
        continue
      fi

      local rel asset_url
      rel="${file#$CLONE_DIR/}"
      asset_url="$release_origin/$(basename "$file")"

      gh release upload "$tag" "$file" --repo "$RELEASE_PUBLIC_GH_REPO" --clobber
      replace_text_in_feed "$feed_origin/$rel" "$asset_url"
      rm -f "$file"
      uploaded_count=$((uploaded_count + 1))
    done < <(/usr/bin/find "$version_dir" -maxdepth 1 -type f -print0)
  done < <(release_version_dirs)

  if [ "$uploaded_count" -gt 0 ]; then
    echo "Uploaded $uploaded_count release asset file(s) to versioned GitHub Releases."
  fi
}

fail_if_release_assets_remain() {
  if [ "$DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES" != "true" ]; then
    return 0
  fi

  local remaining
  remaining="$(while IFS= read -r version_dir; do
    /usr/bin/find "$version_dir" -maxdepth 1 -type f \
      ! -name '*.json' \
      ! -name '*.yml' \
      ! -name '*.yaml' \
      ! -name '*.md' \
      -print
  done < <(release_version_dirs) | sort)"
  if [ -n "$remaining" ]; then
    cat >&2 <<EOF
Release asset files still present in the feed checkout after GitHub Release upload:
$remaining

Set DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES=true, or remove release artifacts
from RELEASE_PUBLIC_DIR before deploying the static feed.
EOF
    exit 1
  fi
}

fail_if_large_git_files_remain() {
  local remaining
  remaining="$(/usr/bin/find "$CLONE_DIR" -type f -size +"$GIT_FILE_SIZE_LIMIT_BYTES"c -not -path "$CLONE_DIR/.git/*" -print | sort)"
  if [ -n "$remaining" ]; then
    cat >&2 <<EOF
GitHub blocks regular Git pushes containing files over $GIT_FILE_SIZE_LIMIT_BYTES bytes.

Large files still present in the feed checkout:
$remaining

Set DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES=true to upload release artifacts as GitHub Release assets,
or remove them from RELEASE_PUBLIC_DIR before deploying.
EOF
    exit 1
  fi
}

if ! gh repo view "$RELEASE_PUBLIC_GH_REPO" >/dev/null 2>&1; then
  gh repo create "$RELEASE_PUBLIC_GH_REPO" \
    --public \
    --description "$REPO_DESCRIPTION" \
    --disable-issues \
    --disable-wiki
fi

rm -rf "$CLONE_DIR"
mkdir -p "$(dirname "$CLONE_DIR")"
git clone "https://github.com/${RELEASE_PUBLIC_GH_REPO}.git" "$CLONE_DIR"

(
  cd "$CLONE_DIR"
  git checkout -B "$GH_PAGES_BRANCH"
  /usr/bin/find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
)

(
  cd "$RELEASE_PUBLIC_DIR"
  tar -cf - .
) | (
  cd "$CLONE_DIR"
  tar -xf -
)

touch "$CLONE_DIR/.nojekyll"
upload_version_assets_to_github_release
fail_if_release_assets_remain
fail_if_large_git_files_remain

(
  cd "$CLONE_DIR"
  git add -A
  if git diff --cached --quiet; then
    echo "No public release feed changes to deploy."
  else
    git commit -m "Publish nn.design update feed

Constraint: Public repository must not contain private signing material.
Confidence: high
Scope-risk: narrow
Tested: static feed files generated before deploy.
Not-tested: installer notarization."
    git push -u origin "$GH_PAGES_BRANCH"
  fi
)

if gh api "repos/$RELEASE_PUBLIC_GH_REPO/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/$RELEASE_PUBLIC_GH_REPO/pages" \
    -f "source[branch]=$GH_PAGES_BRANCH" \
    -f "source[path]=/" >/dev/null || true
else
  gh api --method POST "repos/$RELEASE_PUBLIC_GH_REPO/pages" \
    -f "source[branch]=$GH_PAGES_BRANCH" \
    -f "source[path]=/" >/dev/null || true
fi

pages_url="$(gh api "repos/$RELEASE_PUBLIC_GH_REPO/pages" --jq '.html_url' 2>/dev/null || true)"
if [ -z "$pages_url" ]; then
  pages_url="https://${RELEASE_PUBLIC_GH_REPO%%/*}.github.io/${RELEASE_PUBLIC_GH_REPO#*/}/"
fi

echo "Deployed public release feed to https://github.com/$RELEASE_PUBLIC_GH_REPO"
echo "GitHub Pages URL: ${pages_url%/}"
