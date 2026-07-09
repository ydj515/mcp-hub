# 서버 패키지 구조

이 문서는 `packages/servers/*` 아래의 MCP 서버 패키지가 따라야 하는 `src/` 계층을 정의합니다. 새 서버를 추가하거나 기존 서버를 리팩터링할 때 이 구조를 기준으로 맞춥니다.

## 기본 계층

```text
src/
  index.ts
  server.ts
  config.ts
  tools/
    index.ts
    schemas.ts
  services/
    ...
  data/
    ...
  types/
    ...
```

## 파일 역할

- `src/index.ts`: 패키지의 public entry입니다. `server.ts`의 `ServerDefinition`을 re-export하는 수준으로 유지합니다.
- `src/server.ts`: 실제 `ServerDefinition` wiring을 둡니다. config 로딩, client/database 생성, `context.onClose`, tool 등록 연결만 담당합니다.
- `src/tools/index.ts`: MCP tool 등록을 담당합니다. `server.registerTool()` 호출은 이 파일에 모읍니다.
- `src/tools/schemas.ts`: Zod input schema와 schema 기반 입력 타입을 둡니다.
- `src/config.ts`: 환경변수 파싱, 기본값, limit, allowlist 같은 서버 설정을 둡니다. 설정이 없는 서버는 생략할 수 있습니다.
- `src/services/`: 외부 API 호출, DB 접근, 검색 로직처럼 실제 작업을 수행하는 코드를 둡니다.
- `src/services/database.ts`: DB 계열 서버의 database client와 query helper를 둡니다.
- `src/sql/safety.ts`: DB 계열 서버의 SQL read-only 검증, schema 제한, limit wrapping을 둡니다.
- `src/data/`: 정적 데이터를 둡니다.
- `src/types/`: 도메인 타입을 둡니다.

## DB 서버 예시

`postgres`와 `mysql`은 같은 구조를 따릅니다.

```text
src/
  index.ts
  server.ts
  config.ts
  services/
    database.ts
  sql/
    safety.ts
    safety.test.ts
  tools/
    index.ts
    schemas.ts
```

## API/Search 서버 예시

외부 API나 검색 중심 서버는 필요한 폴더만 둡니다.

```text
src/
  index.ts
  server.ts
  tools/
    index.ts
    schemas.ts
  services/
    public-data-api.ts
    public-data-api.test.ts
```

정적 데이터가 있으면 `data/`, 공유 타입이 있으면 `types/`를 추가합니다.

## 네이밍 규칙

- 디렉터리와 파일명은 kebab-case를 사용합니다. 예: `shortcut-search.ts`.
- 서버 export 이름은 `<id>Server` 형태를 사용합니다. 예: `postgresServer`.
- tool schema 이름은 `<tool>Parameters` 형태를 사용합니다. 예: `searchShortcutsParameters`.
- 테스트는 구현 파일 가까이에 `*.test.ts`로 둡니다.

## 새 서버 추가 체크리스트

1. `packages/servers/<id>/src/index.ts`에서 `ServerDefinition`을 re-export합니다.
2. `src/server.ts`에 서버 id, display name, version, required env, tool wiring을 정의합니다.
3. `src/tools/index.ts`에 `server.registerTool()` 호출을 추가합니다.
4. `src/tools/schemas.ts`에 Zod schema와 입력 타입을 정의합니다.
5. 필요한 경우 `config.ts`, `services/`, `sql/`, `data/`, `types/`를 추가합니다.
6. `packages/cli/src/server-registry.ts`와 root `typecheck` 경로에 새 서버를 연결합니다.
7. `npm run lint`, `npm run typecheck`, `npm run test`를 실행합니다.
