# MCP Hub 예시 설정

이 디렉터리는 `api-finder`, `shortcuts`, `mysql`, `postgres`, `redis`, `docker`, `gitlab` MCP 서버를 모두 등록하는 예시 설정을 제공합니다.

`*-all.*` 파일은 npm 배포 후 `npx -y mcp-hub`로 실행하는 예시입니다.
`*-local.*` 파일은 이 레포를 clone/build한 뒤 `node <mcp-hub-repo>/packages/cli/dist/index.js`로 실행하는 예시입니다.
`*-remote.*` 파일은 이미 실행 중인 remote Streamable HTTP endpoint에 Bearer token으로 연결하는 예시입니다.

| 파일 | 대상 |
| --- | --- |
| [`codex-all.config.toml`](codex-all.config.toml) | Codex, npm/npx |
| [`codex-local.config.toml`](codex-local.config.toml) | Codex, local clone |
| [`codex-remote.config.toml`](codex-remote.config.toml) | Codex, remote HTTP |
| [`cursor-all.mcp.json`](cursor-all.mcp.json) | Cursor, npm/npx |
| [`cursor-local.mcp.json`](cursor-local.mcp.json) | Cursor, local clone |
| [`cursor-remote.mcp.json`](cursor-remote.mcp.json) | Cursor, remote HTTP |
| [`claude-all.json`](claude-all.json) | Claude Desktop, Claude Code, npm/npx |
| [`claude-local.json`](claude-local.json) | Claude Desktop, Claude Code, local clone |
| [`claude-code-remote.mcp.json`](claude-code-remote.mcp.json) | Claude Code, remote HTTP |
| [`antigravity-all.mcp.json`](antigravity-all.mcp.json) | Antigravity, npm/npx |
| [`antigravity-local.mcp.json`](antigravity-local.mcp.json) | Antigravity, local clone |
| [`antigravity-remote.mcp.json`](antigravity-remote.mcp.json) | Antigravity, remote HTTP |

각 환경의 글로벌/프로젝트별 설정 파일 위치와 실제 파일명은 [환경별 MCP 설정 파일 위치](../docs/config-locations.md)를 확인하세요.
토큰 기반 remote server 실행 방법은 [Remote Streamable HTTP 실행](../docs/remote-http.md)을 확인하세요.

local 예시를 실제로 사용할 때는 `<mcp-hub-repo>`를 로컬 MCP Hub 경로로 바꾸세요.

```text
/Users/dongjin/dev/study/mcp-hub
```

remote 예시를 실제로 사용할 때는 `https://mcp.example.com`을 실제 remote MCP server domain으로 바꾸고, 클라이언트 환경에 `MCP_HUB_TOKEN`을 설정하세요.
