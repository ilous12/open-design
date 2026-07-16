# nn.design release scripts

This folder keeps the handoff-oriented release flow in one place.

## Run order

```text
./release/release_mac.sh

# release_mac.sh uploads mac assets when DEPLOY_PUBLIC_GITHUB=true, then commits
# and pushes the small mac platform manifest files plus version bump files.
# release_win_1_build_app.ps1 starts with git pull --ff-only.

powershell -ExecutionPolicy Bypass -File .\release\release_win_1_build_app.ps1
-> send:    release/signing/to-external/app-signing-request.zip
<- receive: release/signing/from-external/signed-app.zip

powershell -ExecutionPolicy Bypass -File .\release\release_win_2_after_app_signed_build_installer.ps1 `
  -SignedAppZip .\release\signing\from-external\signed-app.zip
-> send:    release/signing/to-external/installer-signing-request.zip
<- receive: release/signing/from-external/signed-installer.zip

powershell -ExecutionPolicy Bypass -File .\release\release_win_3_after_installer_signed_prepare_release.ps1 `
  -SignedInstallerZip .\release\signing\from-external\signed-installer.zip

./release/release_publish.sh
```

Default release origin: `https://ilous12.github.io/nn-design-release-feed`

## Folders

```text
release/signing/to-external/     files sent to the external signing team
release/signing/from-external/   files returned by the external signing team
release/manifests/               committed platform manifests used to merge metadata
release/staging/mac/             ignored local mac scratch space
release/staging/win/             windows release staging
release/logs/                    release logs
```

Generated staging binaries are intentionally ignored by git. The mac step writes
only small platform manifest files under `release/manifests/`; commit those files
so the Windows VM can merge mac and Windows update metadata after `git pull`.
The actual mac DMG/payload assets must already be available at the URLs recorded
inside those manifests, usually through GitHub Release upload from the mac step.

## Windows signing split

Windows uses two signing rounds:

1. Sign the unpacked app executable and runtime files before installer/payload packaging.
2. Sign the final NSIS setup executable.

The external-signing path uses `tools-pack win build-from-signed-app` after the first signing round. That command packages the returned signed app into an unsigned NSIS setup and Windows launcher payload, then the setup executable is sent out for the second signing round.

## Unsigned Windows dry run

Use this only for local VM testing without a signing key. It keeps the same
handoff shape but skips Authenticode validation.

```text
powershell -ExecutionPolicy Bypass -File .\release\release_win_unsigned_test.ps1
```

The manual three-step sequence still works if you need to inspect each external
signing handoff zip.
