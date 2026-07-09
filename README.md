# MCP Hub

Node/TypeScript 공식 MCP SDK 기반의 로컬 및 remote MCP 서버 허브입니다.

## 서버

| id | 설명 |
| --- | --- |
| `api-finder` | data.go.kr 공공데이터 API 검색과 Swagger/OpenAPI 명세 조회 |
| `shortcuts` | macOS/Windows 단축키 카테고리와 검색 |
| `postgres` | PostgreSQL 읽기 전용 introspection과 쿼리 실행 |

## 설치

```bash
npm install
npm run build
```

## 로컬 stdio 실행

```bash
node packages/cli/dist/index.js list
node packages/cli/dist/index.js stdio shortcuts
node packages/cli/dist/index.js stdio postgres
```

npm 배포 후 프로젝트별 MCP 설정에는 다음 형태를 권장합니다.

```json
{
  "command": "npx",
  "args": ["-y", "mcp-hub", "stdio", "postgres"]
}
```

## Streamable HTTP 실행

```bash
node packages/cli/dist/index.js serve shortcuts --port 3333
node packages/cli/dist/index.js serve all --port 3333
```

`serve all`은 서버별 endpoint를 제공합니다.

```text
/mcp/api-finder
/mcp/shortcuts
/mcp/postgres
```

## 설정 preview

```bash
node packages/cli/dist/index.js init --target codex --server postgres --scope project
node packages/cli/dist/index.js init --target cursor --server shortcuts --scope project
node packages/cli/dist/index.js init --target claude-desktop --server api-finder --scope user
node packages/cli/dist/index.js init --target antigravity --server postgres --scope user
```

`init`은 현재 preview만 출력합니다. 기존 설정 파일 병합과 `--write` 쓰기는 후속 작업 범위입니다.

## 예시 설정

```text
examples/codex-postgres.config.toml
examples/cursor-shortcuts.mcp.json
examples/claude-api-finder.json
examples/antigravity-postgres.mcp.json
```

## Postgres 환경 변수

```text
DATABASE_URL=postgresql://readonly:password@localhost:5432/app
ALLOWED_SCHEMAS=public
MAX_ROWS=500
QUERY_TIMEOUT_MS=10000
PG_POOL_MAX=5
```

읽기 전용 DB 계정을 사용하세요.
