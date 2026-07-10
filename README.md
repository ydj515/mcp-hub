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
| `gitlab` | GitLab.com 및 self-hosted GitLab 프로젝트, 이슈, MR, pipeline 조회와 선택적 write tool |

## 빠른 시작

```bash
npm install
npm run build
node packages/cli/dist/index.js list
```

## 주요 실행 방식

```bash
node packages/cli/dist/index.js stdio postgres # postgres MCP를 로컬 stdio 방식으로 실행
node packages/cli/dist/index.js serve all --port 3333 # 모든 MCP를 localhost:3333의 서버별 HTTP endpoint로 실행
node packages/cli/dist/index.js serve all --host 0.0.0.0 --port 3333 --auth-token-env MCP_HUB_TOKEN # 외부 접속용으로 bind하고 Bearer token 인증 적용
node packages/cli/dist/index.js init --target codex --server postgres --scope project # Codex 프로젝트 설정 preview 생성
```

`serve all`은 다음처럼 서버별 endpoint를 제공합니다.

```text
/mcp/api-finder
/mcp/shortcuts
/mcp/mysql
/mcp/postgres
/mcp/gitlab
```

remote MCP server로 노출할 때는 `MCP_HUB_TOKEN` 같은 환경 변수에 토큰을 두고 `--auth-token-env`로 지정합니다. 클라이언트는 서버별 URL과 Bearer token만 알면 되고, DB URL과 API key는 remote server 쪽에만 둡니다. 자세한 설정은 [Remote Streamable HTTP 실행](docs/remote-http.md)을 확인하세요.

## 문서

- [사용 가이드](docs/usage.md)
- [Remote Streamable HTTP 실행](docs/remote-http.md)
- [환경별 MCP 설정 파일 위치](docs/config-locations.md)
- [서버 패키지 구조](docs/server-package-structure.md)
- [예시 설정 파일](examples/README.md)

## 개발 환경

이 프로젝트는 `mise.toml`에서 Node.js `24.13.0`을 사용합니다.
