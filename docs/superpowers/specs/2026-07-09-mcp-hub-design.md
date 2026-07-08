# MCP Hub 설계 문서

작성일: 2026-07-09

## 1. 배경

이 레포지토리는 현재 여러 MCP 서버를 모아둔 상태다. 앞으로는 단순 모음이 아니라, 로컬에서는 쉽게 stdio MCP로 실행하고, 필요할 때는 Streamable HTTP 기반 remote MCP server로 바로 전환할 수 있는 hub 형태로 발전시킨다.

주요 목표는 다음과 같다.

- Node/TypeScript와 공식 `@modelcontextprotocol/sdk` 기반으로 통일한다.
- `mcp-hub` CLI를 중심으로 로컬 stdio 실행을 지원한다.
- 같은 서버 정의를 Streamable HTTP 실행에도 재사용한다.
- 프로젝트별 MCP 설정 생성을 지원한다.
- Claude Desktop, Codex, Cursor, Antigravity 설정을 모두 지원한다.
- `postgres` MCP는 기존 Python 구현을 TypeScript로 마이그레이션한다.
- remote 모드에서는 서로 독립적인 MCP를 서버별 HTTP endpoint로 제공한다.

## 2. 요구사항

### 2.1 로컬 stdio 사용

사용자는 레포 clone, npm 설치, 또는 추후 brew 설치를 통해 MCP 서버를 로컬 stdio 방식으로 쉽게 실행할 수 있어야 한다.

예상 사용법:

```bash
mcp-hub list
mcp-hub stdio api-finder
mcp-hub stdio shortcuts
mcp-hub stdio postgres
```

프로젝트별 MCP 설정에서는 `npx` 사용을 기본 권장한다.

```json
{
  "command": "npx",
  "args": ["-y", "mcp-hub", "stdio", "postgres"]
}
```

### 2.2 Remote MCP Server

Streamable HTTP 기반 remote MCP server를 쉽게 실행할 수 있어야 한다.

예상 사용법:

```bash
mcp-hub serve postgres --port 3333
mcp-hub serve all --port 3333
```

`serve all`은 여러 MCP를 하나의 MCP 서버로 병합하지 않는다. 하나의 HTTP 프로세스에서 서버별 endpoint를 제공한다.

### 2.3 프로젝트별 설정 생성

CLI는 MCP 클라이언트별 설정 파일 생성을 지원한다.

```bash
mcp-hub init --target codex --server postgres --scope project
mcp-hub init --target cursor --server shortcuts --scope project --write
mcp-hub init --target claude-desktop --server api-finder --scope user --write
mcp-hub init --target antigravity --server postgres --scope user --write
```

기본 동작은 preview-only이며, `--write`가 있을 때만 파일을 수정한다.

## 3. 전체 아키텍처

권장 구조:

```text
mcp-hub/
  package.json
  tsconfig.base.json
  packages/
    core/
      src/
        registry.ts
        server-definition.ts
        transports/
          stdio.ts
          streamable-http.ts
        config/
          targets/
            claude.ts
            codex.ts
            cursor.ts
            antigravity.ts
    cli/
      src/
        index.ts
        commands/
          list.ts
          stdio.ts
          serve.ts
          init.ts
    servers/
      api-finder/
        src/
          index.ts
          tools/
      shortcuts/
        src/
          index.ts
          tools/
      postgres/
        src/
          index.ts
          config.ts
          db.ts
          sql-safety.ts
          tools/
```

각 MCP 서버는 실행 방식을 직접 알지 않는다. 서버 패키지는 서버 id, 표시 이름, 필수 환경 변수, tool 등록 함수만 제공한다.

```ts
export type ServerDefinition = {
  id: string;
  displayName: string;
  version: string;
  requiredEnv?: string[];
  registerTools: (server: McpServer, context: ServerContext) => void | Promise<void>;
};
```

transport 실행은 `packages/core`가 담당한다.

- `runStdio(definition)`
- `runHttp(definition)`
- `runHttpEndpoints(definitions)`

## 4. CLI 설계

### 4.1 명령어

```bash
mcp-hub list

mcp-hub stdio api-finder
mcp-hub stdio shortcuts
mcp-hub stdio postgres

mcp-hub serve api-finder --port 3333
mcp-hub serve shortcuts --port 3333
mcp-hub serve postgres --port 3333
mcp-hub serve all --port 3333

mcp-hub init --target codex --server postgres --scope project
mcp-hub init --target cursor --server shortcuts --scope project
mcp-hub init --target claude-desktop --server api-finder --scope user
mcp-hub init --target antigravity --server postgres --scope user
```

### 4.2 설정 생성 정책

`init`은 기본적으로 설정 파일을 바로 수정하지 않고 preview를 출력한다. 실제 파일 수정은 `--write`가 있을 때만 수행한다.

기존 설정에 같은 서버 이름이 있으면 충돌로 처리한다. 교체는 `--force`가 있을 때만 허용한다.

환경 변수 값은 기본적으로 설정 파일에 직접 쓰지 않고 변수 참조 또는 변수 이름만 기록한다.

### 4.3 지원 대상

| Target | Scope | 기본 파일 |
| --- | --- | --- |
| Claude Desktop | user | `claude_desktop_config.json` |
| Codex | project | `.codex/config.toml` |
| Codex | user | `~/.codex/config.toml` |
| Cursor | project | `.cursor/mcp.json` |
| Cursor | user | `~/.cursor/mcp.json` |
| Antigravity | user | `~/.gemini/config/mcp_config.json` |

프로젝트 설정을 직접 쓰기 애매한 대상은 adapter에서 preview/snippet 중심으로 처리한다.

## 5. HTTP Endpoint 설계

`serve all`은 서버별 HTTP endpoint를 제공한다.

```text
GET    /health
GET    /servers

POST   /mcp/api-finder
GET    /mcp/api-finder
DELETE /mcp/api-finder

POST   /mcp/shortcuts
GET    /mcp/shortcuts
DELETE /mcp/shortcuts

POST   /mcp/postgres
GET    /mcp/postgres
DELETE /mcp/postgres
```

단일 서버 실행에서는 편의상 `/mcp`와 `/mcp/:serverId`를 모두 지원한다.

```text
mcp-hub serve postgres --port 3333

/mcp
/mcp/postgres
```

도구 이름에는 namespace를 붙이지 않는다. endpoint 자체가 서버 경계이기 때문이다.

```text
/mcp/postgres
  - list_tables
  - describe_table
  - run_query

/mcp/shortcuts
  - list_shortcut_categories
  - search_shortcuts
```

세션 저장소는 서버별로 분리한다.

```ts
type HttpSessionStore = Map<string, Map<string, SessionEntry>>;
```

첫 번째 key는 `serverId`, 두 번째 key는 `sessionId`다.

## 6. HTTP 보안 정책

로컬 기본값:

- host: `127.0.0.1`
- port: `3333`
- Origin allowlist는 localhost 중심

외부 배포는 명시적 옵션을 요구한다.

```bash
mcp-hub serve all --host 0.0.0.0 --port 8080 --auth-token-env MCP_HUB_AUTH_TOKEN
```

권장 정책:

- 기본 host는 `127.0.0.1`
- `0.0.0.0` 바인딩은 명시 옵션 필요
- bearer token 인증 지원
- Origin allowlist 지원
- `/health`는 공개 가능
- `/mcp/*`는 인증 적용 가능
- 세션 TTL 지원
- 최대 세션 수 제한 지원

## 7. Postgres MCP TypeScript 마이그레이션

기존 Python `pg-mcp`는 TypeScript 공식 SDK 기반 서버로 마이그레이션한다.

서버 id는 `postgres`로 확정한다.

### 7.1 의존성

- `@modelcontextprotocol/sdk`
- `pg`
- `zod`
- `@types/pg`

### 7.2 환경 변수

```text
DATABASE_URL=postgresql://readonly:password@localhost:5432/app
ALLOWED_SCHEMAS=public
MAX_ROWS=500
QUERY_TIMEOUT_MS=10000
PG_POOL_MAX=5
```

기본값:

- `ALLOWED_SCHEMAS=public`
- `MAX_ROWS=500`
- `QUERY_TIMEOUT_MS=10000`
- `PG_POOL_MAX=5`

`DATABASE_URL`은 필수다.

### 7.3 유지할 도구

| 도구 | 설명 |
| --- | --- |
| `list_tables` | 허용 schema의 테이블 목록 조회 |
| `describe_table` | 컬럼, nullable, default, comment, constraint, index 조회 |
| `run_query` | 읽기 전용 SQL 실행 |
| `get_foreign_keys` | FK 관계 조회 |
| `explain_query` | `EXPLAIN (FORMAT JSON, ANALYZE false)` 실행 |
| `get_table_stats` | 테이블 통계와 크기 조회 |

### 7.4 SQL 안전 정책

`run_query`는 다음 조건을 적용한다.

- 단일 statement만 허용
- 위험 키워드 차단
- `SELECT`, `WITH` 중심 허용
- `EXPLAIN ANALYZE` 금지
- 읽기 전용 트랜잭션 사용
- `statement_timeout` 적용
- `MAX_ROWS`로 결과 제한
- schema allowlist 적용

위험 키워드 예시:

```text
DROP DELETE TRUNCATE ALTER CREATE INSERT UPDATE GRANT REVOKE
COPY EXECUTE DO CALL SET ROLE SET SESSION
```

SQL 키워드 필터링은 보조 방어선이며, 실제 1차 방어선은 읽기 전용 DB 계정과 DB 권한이다.

## 8. 패키징과 배포

### 8.1 npm

1차 배포축은 npm이다.

```bash
npm install -g mcp-hub
mcp-hub list
mcp-hub stdio postgres
mcp-hub serve all --port 3333
```

프로젝트별 설정에서는 `npx`를 권장한다.

```json
{
  "command": "npx",
  "args": ["-y", "mcp-hub", "stdio", "postgres"]
}
```

패키지명은 설계상 `mcp-hub`로 둔다. 실제 npm 배포 시 이름이 점유되어 있으면 scoped package를 fallback으로 사용한다.

### 8.2 brew

brew는 npm 배포 이후 후속 단계로 진행한다.

단계:

1. npm 배포 가능 구조 완성
2. GitHub Release tarball 생성
3. Homebrew tap repository 준비
4. Formula에서 release tarball 설치
5. `brew install <tap>/mcp-hub` 문서화

## 9. 레포 마이그레이션 전략

기존 폴더는 바로 삭제하지 않고, 새 구조 이전이 안정화될 때까지 보존한다.

기존 구조:

```text
api-finder-mcp/
shortcut-mcp/
database/pg-mcp/
```

신규 구조:

```text
packages/
  core/
  cli/
  servers/
    api-finder/
    shortcuts/
    postgres/
```

마이그레이션 순서:

1. root npm workspace 생성
2. `shortcut-mcp`를 공식 SDK 기반 server package로 이전
3. `api-finder-mcp`를 `mcp-framework`에서 공식 SDK 기반으로 이전
4. `pg-mcp`를 TypeScript로 재구현
5. core transport 레이어 추가
6. CLI 추가
7. `init` target adapter 추가
8. README와 예시 설정 갱신
9. 기존 폴더를 `legacy/`로 보존하거나 최종 제거 여부 결정

## 10. 테스트와 검증

기본 검증:

```bash
npm run build
npm run typecheck
npm run test
mcp-hub list
mcp-hub stdio shortcuts
mcp-hub serve shortcuts --port 3333
mcp-hub serve all --port 3333
mcp-hub init --target codex --server postgres --scope project
```

MCP 검증:

- `@modelcontextprotocol/inspector`로 stdio 서버 확인
- `@modelcontextprotocol/inspector`로 `/mcp/shortcuts`, `/mcp/postgres` HTTP endpoint 확인
- `init --write`는 fixture 기반 테스트로 기존 설정 병합 검증
- stdio 모드에서 stdout 로그 오염 여부 확인

## 11. 복잡도

- CLI 서버 조회: `O(1)`
- 단일 서버 도구 등록: `O(T)`
- `serve all` endpoint 등록: 선택 서버 수 `K` 기준 `O(K)`
- HTTP 요청 라우팅: `O(1)`
- HTTP 세션 조회: `O(1)`
- HTTP 세션 저장 공간: 활성 세션 수 `C` 기준 `O(C)`
- 설정 파일 병합: 파일 크기 `N` 기준 `O(N)`
- `list_tables`: 테이블 수 `T` 기준 `O(T)`
- `describe_table`: 컬럼 수 `C`, 제약조건 수 `K`, 인덱스 수 `I` 기준 `O(C + K + I)`
- `run_query`: PostgreSQL 실행 계획과 반환 row 수 `R`에 의존하며, 애플리케이션 반환 처리 자체는 `O(R)`

## 12. 주의사항

> - stdio MCP는 stdout에 MCP JSON-RPC 메시지만 출력해야 한다. 로그는 stderr로 보내야 한다.
> - remote MCP server로 공개할 때는 bearer token, Origin allowlist, session TTL을 기본 보안 정책에 포함해야 한다.
> - `postgres` MCP는 반드시 읽기 전용 DB 계정 사용을 권장한다.
> - SQL 키워드 필터링은 완전한 SQL sandbox가 아니다. DB 권한이 1차 방어선이다.
> - `serve all`은 도구 병합이 아니라 서버별 endpoint 제공 방식이다.
> - 기존 작업트리에 사용자 변경분이 있을 수 있으므로 마이그레이션 시 삭제보다 보존을 우선한다.
> - `.env` 파일과 DB 접속 정보는 절대 커밋하지 않는다.

## 13. 대안과 비교

### 13.1 Node/TypeScript 통일

장점:

- npm 배포가 쉽다.
- 현재 `shortcut-mcp` 구조를 재사용하기 좋다.
- 공식 MCP TypeScript SDK의 Streamable HTTP transport를 활용할 수 있다.
- CLI, config adapter, HTTP server 구현이 자연스럽다.

단점:

- Python `pg-mcp`를 TypeScript로 마이그레이션해야 한다.

### 13.2 Python/FastMCP 통일

장점:

- FastMCP 문법이 간결하다.
- DB 관련 구현이 편하다.

단점:

- 기존 TypeScript 서버 2개를 옮겨야 한다.
- npm 중심 배포와 `npx` 사용 경험이 약해진다.

### 13.3 언어 혼합 유지

장점:

- 초기 마이그레이션 비용이 낮다.

단점:

- 배포, 테스트, 설정, runtime 관리가 복잡해진다.
- "통일된 mcp-hub CLI" 목표와 맞지 않는다.

최종 선택은 Node/TypeScript 통일이다.

## 14. 승인된 결정

- Node/TypeScript 공식 SDK 기반으로 통일한다.
- `mcp-hub` CLI를 중심에 둔다.
- `pg-mcp`는 TypeScript로 마이그레이션한다.
- Claude Desktop, Codex, Cursor, Antigravity 설정을 지원한다.
- `serve all`은 tool 병합이 아니라 서버별 HTTP endpoint 제공 방식으로 구현한다.
- `postgres` 서버 id는 `postgres`로 사용한다.
- `init`은 preview-first, `--write` 명시 수정 방식으로 구현한다.
- npm을 1차 배포축으로 두고, brew는 후속 단계로 진행한다.
