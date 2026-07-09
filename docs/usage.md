# MCP Hub 사용 가이드

이 문서는 MCP Hub의 설치, 로컬 stdio 실행, Streamable HTTP 실행, `init` preview, 서버별 환경 변수를 정리합니다.

## 요구사항

- Node.js `24.13.0`
- npm
- 선택 사항: `mise`

```bash
mise install
npm install
npm run build
```

`mise`를 사용하지 않는 경우에도 Node.js `24.13.0`에 맞춰 실행하면 됩니다.

## 서버 목록 확인

```bash
node packages/cli/dist/index.js list
```

현재 등록된 서버는 다음과 같습니다.

| id | 설명 |
| --- | --- |
| `api-finder` | data.go.kr 공공데이터 API 검색과 Swagger/OpenAPI 명세 조회 |
| `shortcuts` | macOS/Windows 단축키 카테고리와 검색 |
| `postgres` | PostgreSQL 읽기 전용 introspection과 쿼리 실행 |

## 로컬 stdio 실행

개발 중에는 빌드 결과물을 직접 실행할 수 있습니다.

```bash
node packages/cli/dist/index.js stdio api-finder
node packages/cli/dist/index.js stdio shortcuts
node packages/cli/dist/index.js stdio postgres
```

프로젝트별 MCP 설정에서 로컬 clone을 직접 가리킬 때는 다음 형태를 사용합니다.

```json
{
  "command": "node",
  "args": [
    "/Users/dongjin/dev/study/mcp-hub/packages/cli/dist/index.js",
    "stdio",
    "shortcuts"
  ]
}
```

npm 배포 후에는 프로젝트별 MCP 설정에서 다음 형태를 권장합니다.

```json
{
  "command": "npx",
  "args": ["-y", "mcp-hub", "stdio", "postgres"]
}
```

서버 id만 바꾸면 `api-finder`, `shortcuts`, `postgres`를 같은 방식으로 등록할 수 있습니다.

## Streamable HTTP 실행

단일 서버만 HTTP로 실행할 수 있습니다.

```bash
node packages/cli/dist/index.js serve shortcuts --port 3333
```

여러 서버를 함께 올릴 때는 `serve all`을 사용합니다.

```bash
node packages/cli/dist/index.js serve all --port 3333
```

`serve all`은 tool을 하나로 병합하지 않고, 서버별 HTTP endpoint를 제공합니다.

```text
http://localhost:3333/mcp/api-finder
http://localhost:3333/mcp/shortcuts
http://localhost:3333/mcp/postgres
```

단일 서버를 실행하는 경우에는 `/mcp`와 `/mcp/<server-id>`를 함께 사용할 수 있습니다.

```text
http://localhost:3333/mcp
http://localhost:3333/mcp/shortcuts
```

## init preview

`init`은 Codex, Cursor, Claude Desktop, Antigravity용 MCP 설정 preview를 출력합니다.

```bash
node packages/cli/dist/index.js init --target codex --server postgres --scope project
node packages/cli/dist/index.js init --target cursor --server shortcuts --scope project
node packages/cli/dist/index.js init --target claude-desktop --server api-finder --scope user
node packages/cli/dist/index.js init --target antigravity --server postgres --scope user
```

현재 `init`은 preview만 출력합니다. 기존 설정 파일 병합과 `--write` 쓰기는 후속 작업 범위입니다.

설정 파일 위치와 예시 파일은 [환경별 MCP 설정 파일 위치](config-locations.md)를 확인하세요.

## 서버별 환경 변수

`api-finder`는 공공데이터 포털 API 키가 필요합니다.

```text
PUBLIC_DATA_API_KEY=...
```

`postgres`는 데이터베이스 연결 정보가 필요합니다.

```text
DATABASE_URL=postgresql://readonly:password@localhost:5432/app
ALLOWED_SCHEMAS=public
MAX_ROWS=500
QUERY_TIMEOUT_MS=10000
PG_POOL_MAX=5
```

`shortcuts`는 별도 환경 변수가 필요 없습니다.

> `postgres` 서버는 읽기 전용 DB 계정으로 실행하는 것을 권장합니다.
> `ALLOWED_SCHEMAS`를 지정하면 노출할 schema 범위를 줄일 수 있습니다.

## 배포 후 사용 흐름

목표 배포 형태는 다음과 같습니다.

| 배포 방식 | 로컬 stdio 사용 예 |
| --- | --- |
| Git clone | `node packages/cli/dist/index.js stdio postgres` |
| npm | `npx -y mcp-hub stdio postgres` |
| brew | `mcp-hub stdio postgres` |

remote MCP server를 만들 때는 같은 CLI에서 `serve <server-id>` 또는 `serve all`을 사용합니다.
