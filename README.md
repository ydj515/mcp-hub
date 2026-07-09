# MCP Hub

Node/TypeScript 공식 MCP SDK 기반의 로컬 stdio 및 Streamable HTTP MCP 서버 허브입니다.

이 레포는 여러 MCP 서버를 한 곳에서 관리하되, remote server 모드에서는 서버별 HTTP endpoint를 분리해서 노출하는 방향을 기준으로 합니다.

## 지원 서버

| id | 설명 |
| --- | --- |
| `api-finder` | data.go.kr 공공데이터 API 검색과 Swagger/OpenAPI 명세 조회 |
| `shortcuts` | macOS/Windows 단축키 카테고리와 검색 |
| `mysql` | MySQL 읽기 전용 introspection과 쿼리 실행 |
| `postgres` | PostgreSQL 읽기 전용 introspection과 쿼리 실행 |

## 빠른 시작

```bash
npm install
npm run build
node packages/cli/dist/index.js list
```

## 주요 실행 방식

```bash
node packages/cli/dist/index.js stdio postgres
node packages/cli/dist/index.js serve all --port 3333
node packages/cli/dist/index.js init --target codex --server postgres --scope project
```

`serve all`은 다음처럼 서버별 endpoint를 제공합니다.

```text
/mcp/api-finder
/mcp/shortcuts
/mcp/mysql
/mcp/postgres
```

## 문서

- [사용 가이드](docs/usage.md)
- [환경별 MCP 설정 파일 위치](docs/config-locations.md)
- [예시 설정 파일](examples/README.md)

## 개발 환경

이 프로젝트는 `mise.toml`에서 Node.js `24.13.0`을 사용합니다.
