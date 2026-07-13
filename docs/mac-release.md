# macOS Release

Use `build_mac.sh` for local macOS release builds. It signs/notarizes the app,
generates updater metadata, and exports the static files needed by the public
update feed.

## Setup

1. Copy `.env.mac-release.example` to `env/mac-release.env`.
2. Fill in local signing/notarization values in `env/mac-release.env`.
3. Set `RELEASE_PUBLIC_ORIGIN` to the final HTTPS origin that will serve the
   exported files, for example a GitHub Pages origin.

Never commit `env/mac-release.env`, `.p12` files, Apple passwords, or certificate
passwords. If a secret was committed or shared, rotate it before release.

## Build And Export

```sh
./build_mac.sh
```

By default, the script:

- bumps the synchronized workspace package versions by patch only, for example
  `0.12.1` to `0.12.2`;
- builds the current Mac architecture with `tools-pack mac build --to all`;
- signs and notarizes when `SIGN_MODE=notarize`;
- bakes `OD_UPDATE_METADATA_URL` as
  `$RELEASE_PUBLIC_ORIGIN/$RELEASE_CHANNEL/latest/metadata.json`;
- exports update files under `.tmp/release-public`;
- deploys installer/update artifacts to versioned GitHub Releases and keeps the
  GitHub Pages repo limited to small updater metadata.
- includes the macOS DMG and launcher payload in the release assets by default.

To export directly to a separate public repo checkout:

```sh
RELEASE_PUBLIC_DIR=/path/to/public-release-repo ./build_mac.sh
```

Major and minor versions are manual decisions. To publish an exact version, pass
`RELEASE_VERSION` and the script will not auto-bump:

```sh
RELEASE_VERSION=0.13.0 ./build_mac.sh
```

To build with the current package version without changing manifests:

```sh
AUTO_BUMP_PATCH=false ./build_mac.sh
```

If `gh` is authenticated and `RELEASE_PUBLIC_ORIGIN` is not set, the script
defaults to a public GitHub Pages repo named `nn-design-release-feed` under the
active GitHub account. To choose the repo explicitly:

```sh
RELEASE_PUBLIC_GH_REPO=<owner>/nn-design-release-feed ./build_mac.sh
```

The deploy script commits only updater metadata from `RELEASE_PUBLIC_DIR` to the
public Pages repo. Binary artifacts under each version directory are uploaded to
the matching GitHub Release, for example `v0.12.1`, and metadata URLs are
rewritten to `https://github.com/<owner>/<repo>/releases/download/v0.12.1/...`.

The public Pages repo keeps this metadata layout:

```text
stable/
  latest/
    metadata.json
    platforms/mac_arm64.json
  versions/
    0.12.1/
      metadata.json
      platforms/mac_arm64.json
```

Set `DEPLOY_RELEASE_ASSETS_TO_GITHUB_RELEASES=false` only if another static host
will serve every artifact and the host accepts the file sizes involved.
