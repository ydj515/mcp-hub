# Repository Guidelines

## 프로젝트 구조와 모듈 구성

이 레포지토리는 MCP Hub를 위한 Node/TypeScript npm workspace입니다. 소스 코드는 `packages/` 아래에 있습니다. `packages/core`는 공통 서버 정의, 설정 adapter, transport, HTTP helper를 담고, `packages/cli`는 `mcp-hub` CLI를 제공합니다. 개별 MCP 서버는 `packages/servers/*`에 있으며 현재 `api-finder`, `shortcuts`, `mysql`, `postgres`, `gitlab`이 포함됩니다. MCP 서버의 `src/` 계층은 [서버 패키지 구조](server-package-structure.md)를 따릅니다. 테스트는 구현 파일 가까이에 `*.test.ts` 이름으로 둡니다. 사용자 문서는 `docs/`, 실행 가능한 클라이언트 예시는 `examples/`에 둡니다.

## 빌드, 테스트, 개발 명령

- `mise install`: `mise.toml`에 고정된 Node.js `24.13.0`을 설치합니다.
- `npm install`: 루트와 workspace 의존성을 설치합니다.
- `npm run build`: 모든 workspace를 TypeScript로 컴파일합니다.
- `npm run lint`: Oxlint로 repository lint를 실행합니다.
- `npm run lint:fix`: 자동 수정 가능한 lint 문제를 수정합니다.
- `npm run typecheck`: project reference 기반 타입 검사를 실행합니다.
- `npm run test`: Vitest 테스트를 한 번 실행합니다.
- `npm run test:watch`: Vitest watch 모드를 실행합니다.
- `mise run check`: lint, typecheck, test를 함께 실행합니다.
- `node packages/cli/dist/index.js list`: 빌드 후 등록된 MCP 서버를 확인합니다.
- `node packages/cli/dist/index.js serve all --port 3333`: 모든 서버를 서버별 HTTP endpoint로 노출합니다.

## 코딩 스타일과 네이밍

TypeScript strict mode, ES modules, `NodeNext` module resolution을 기준으로 작성합니다. 들여쓰기는 2칸을 사용하고, 가능한 named export를 선호합니다. 패키지와 디렉터리는 kebab-case, 변수와 함수는 camelCase, TypeScript 타입은 PascalCase를 사용합니다. 새 MCP 서버는 `packages/servers/<server>/src/index.ts`를 public entry로 두고, 상세 구조는 [서버 패키지 구조](server-package-structure.md)를 따릅니다.

## 테스트 지침

테스트 runner는 Vitest입니다. 테스트 파일은 검증 대상 코드 옆에 `*.test.ts` 접미사로 추가합니다. 예: `packages/core/src/registry.test.ts`. 설정 병합, registry 동작, SQL safety, transport/HTTP 동작을 변경할 때는 해당 경로의 테스트를 함께 보강하세요. 제출 전에는 `npm run test`를 실행합니다.

## 커밋과 Pull Request 지침

최근 커밋은 `feat: migrate postgres mcp to typescript`, `docs: document mcp hub usage`, `chore: remove legacy mcp sources`처럼 Conventional Commit 스타일을 따릅니다. 커밋은 한 가지 목적에 집중합니다. Pull Request에는 변경 요약, 영향받은 패키지, 실행한 검증 명령, 설정 또는 환경 변수 변경 사항을 적습니다. 관련 issue가 있으면 링크합니다.

## 보안과 설정 팁

`.env`, credential, log, 로컬 editor 설정은 커밋하지 않습니다. `postgres` 서버는 읽기 전용 DB 계정 사용을 권장합니다. `POSTGRESQL_URL`, `ALLOWED_SCHEMAS`, row/query limit은 신중하게 설정하세요. `gitlab` write tool은 `GITLAB_ENABLE_WRITE_TOOLS=true`가 필요하므로 토큰 scope와 대상 instance를 검토하세요. remote HTTP serving을 사용할 때는 `--host`와 인증 관련 옵션을 명확히 지정합니다.
