# Release TODO

Default release origin:

```text
https://ilous12.github.io/nn-design-release-feed
```

## Windows unsigned test

| 순서 | 커맨드 | 내용 |
|---:|---|---|
| 1 | `./release/release_mac.sh` | Mac 서명/공증 빌드, mac asset 업로드, mac manifest/version commit/push |
| 2 | `powershell -ExecutionPolicy Bypass -File .\release\release_win_unsigned_test.ps1` | Windows VM에서 `git pull` 후 무서명 앱 빌드, installer/payload 생성, mac+win 통합 metadata 로컬 생성 |
| 3 | `DEPLOY_PUBLIC_GITHUB=false ./release/release_publish.sh` | 운영 feed에 올리지 않고 로컬 `release-public` 결과 확인 |

## Windows signed release

| 순서 | 커맨드 | 내용 |
|---:|---|---|
| 1 | `./release/release_mac.sh` | Mac 서명/공증 빌드, mac DMG/payload 업로드, mac manifest/version commit/push |
| 2 | `powershell -ExecutionPolicy Bypass -File .\release\release_win_1_build_app.ps1` | Windows VM에서 `git pull --ff-only` 후 앱 빌드, 앱 서명 요청 zip 생성 |
| 3 | 외부 전달: `release\signing\to-external\app-signing-request.zip` | 외부 서명팀에 앱 실행 파일 서명 요청 |
| 4 | 외부 수령: `release\signing\from-external\signed-app.zip` | 서명된 앱 zip 수령 |
| 5 | `powershell -ExecutionPolicy Bypass -File .\release\release_win_2_after_app_signed_build_installer.ps1 -SignedAppZip .\release\signing\from-external\signed-app.zip` | 서명 앱으로 NSIS installer/payload 생성, installer 서명 요청 zip 생성 |
| 6 | 외부 전달: `release\signing\to-external\installer-signing-request.zip` | 외부 서명팀에 installer 서명 요청 |
| 7 | 외부 수령: `release\signing\from-external\signed-installer.zip` | 서명된 installer zip 수령 |
| 8 | `powershell -ExecutionPolicy Bypass -File .\release\release_win_3_after_installer_signed_prepare_release.ps1 -SignedInstallerZip .\release\signing\from-external\signed-installer.zip` | Windows asset 정리, mac+win 통합 metadata 생성 |
| 9 | `./release/release_publish.sh` | 최종 feed/metadata/Windows asset 배포 |

## Sequence checks

- Mac 단계가 먼저 완료되어야 Windows VM이 `git pull`로 mac platform manifest와 동일 버전을 받을 수 있다.
- Mac 산출물은 git에 커밋하지 않는다. `release/manifests/*.json`만 commit/push 대상이다.
- Windows 무서명 테스트 결과물은 운영 업데이트 feed에 배포하지 않는다.
- 실제 서명 릴리즈에서는 앱 서명 후 installer를 만들고, installer를 다시 서명한다.
- 최종 metadata는 Windows 3단계에서 mac manifest와 Windows manifest를 합쳐 만든다.
