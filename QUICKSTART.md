# Quickstart

Design For AIR를 로컬에서 실행하는 가장 빠른 방법을 정리한 문서입니다.  
현재 기준 기본 흐름은 `pnpm tools-dev`이며, 로컬 CLI는 아래 3가지만 지원합니다.

- Codex CLI
- Antigravity CLI
- Claude Code CLI

로컬 CLI를 설치하지 않아도 BYOK API 모드로 사용할 수 있습니다.

## 1. 환경 요구사항

- Node.js: `24.x`
- pnpm: `10.33.x`
- 권장 OS: macOS
- 추가 지원: Windows, WSL2

프로젝트는 `packageManager`와 `engines`로 버전을 고정합니다. Corepack 사용을 권장합니다.

```bash
corepack enable
corepack pnpm --version
```

`nvm`을 쓰는 경우:

```bash
nvm install 24
nvm use 24
```

## 2. 저장소 실행

```bash
pnpm install
pnpm tools-dev
```

또는 포그라운드로 웹 중심 실행:

```bash
pnpm tools-dev run web
```

실행 후 출력되는 로컬 URL로 접속하면 됩니다.

## 3. 최초 실행 흐름

최초 실행 시에는 다음 중 하나를 선택해 작업을 시작합니다.

- 로컬 Coding Agent 사용
- API Key 사용

Design For AIR는 한국어 기본 경험을 전제로 구성되어 있으며, 프로젝트와 산출물은 로컬 우선으로 관리됩니다.

## 4. 로컬 CLI 준비

### Codex CLI

CLI가 정상 설치되어 있고, 현재 쉘에서 실행 가능해야 합니다.

```bash
codex --help
```

### Antigravity CLI

```bash
antigravity --help
```

### Claude Code CLI

```bash
claude --help
```

앱에서 감지되지 않으면, 데몬이 사용하는 `PATH`에 실행 파일이 포함되어 있는지 확인한 뒤 실행 모드 화면에서 재스캔합니다.

## 5. BYOK API 모드

로컬 CLI를 사용하지 않는 경우, 실행 모드에서 API Key 기반으로 사용할 수 있습니다.

현재 제품 방향상 BYOK 모델 선택은 최소화되어 있으며, 운영 대상 모델도 제한적으로 관리하는 것이 좋습니다.

## 6. 주요 실행 명령어

```bash
pnpm tools-dev
pnpm tools-dev run web
pnpm tools-dev restart
pnpm tools-dev stop
pnpm tools-dev status
pnpm tools-dev logs
pnpm typecheck
```

## 7. 패키징 전 확인

패키징 전에는 아래를 우선 확인하세요.

- 앱명/번들명/아이콘이 `Design For AIR` 기준으로 반영되었는지
- 지원 로컬 CLI가 3개만 노출되는지
- 온보딩에서 로컬 Agent / API Key 선택이 정상 동작하는지
- 홈/편집/프로젝트 화면에서 한국어 문구가 기본 노출되는지
- 레퍼런스 리믹스와 미리보기가 정상 동작하는지

## 8. 문제 해결 포인트

### CLI가 감지되지 않을 때

- 해당 CLI가 현재 쉘에서 직접 실행되는지 확인
- 앱이 사용하는 `PATH`와 터미널 `PATH`가 다른지 확인
- 실행 모드에서 재스캔

### 홈 진입이 느릴 때

- 로컬 CLI 감지 시간이 길어지는지 확인
- 모델/설정 로딩이 과도한지 확인
- 데몬 재시작 후 재현 여부 확인

### 미리보기가 비어 보일 때

- 프로젝트 내 엔트리 HTML이 실제로 생성되었는지 확인
- 리믹스 소스가 정적 HTML 구조인지 확인
- 저장 직후 preview 반영 로직이 정상 동작하는지 확인

## 9. 권장 사용 방식

Design For AIR는 아래 흐름에서 가장 효과적입니다.

1. 레퍼런스 선택
2. 리믹스 또는 새 프로토타입 시작
3. 통신사 디자인 시스템 기준으로 화면 생성
4. 편집과 미리보기로 빠르게 조정
5. 프로젝트 단위로 저장/복사/후속 작업

이 문서보다 더 큰 맥락은 [README.md](/Users/ilous12/Work/Github/nn.design/README.md), 제품 배경은 [story/STORY.md](/Users/ilous12/Work/Github/nn.design/story/STORY.md)를 참고하세요.
