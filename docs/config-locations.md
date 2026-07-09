# 환경별 MCP 설정 파일 위치

이 문서는 Codex, Cursor, Claude Desktop, Claude Code, Antigravity에서 MCP Hub 예시 설정을 어디에 두면 되는지 정리합니다.

## 예시 파일

| 예시 파일 | 용도 |
| --- | --- |
| [`examples/codex-all.config.toml`](../examples/codex-all.config.toml) | Codex용 npm/npx 실행 예시 |
| [`examples/codex-local.config.toml`](../examples/codex-local.config.toml) | Codex용 local clone 실행 예시 |
| [`examples/codex-remote.config.toml`](../examples/codex-remote.config.toml) | Codex용 remote Streamable HTTP 실행 예시 |
| [`examples/cursor-all.mcp.json`](../examples/cursor-all.mcp.json) | Cursor용 npm/npx 실행 예시 |
| [`examples/cursor-local.mcp.json`](../examples/cursor-local.mcp.json) | Cursor용 local clone 실행 예시 |
| [`examples/cursor-remote.mcp.json`](../examples/cursor-remote.mcp.json) | Cursor용 remote Streamable HTTP 실행 예시 |
| [`examples/claude-all.json`](../examples/claude-all.json) | Claude Desktop 및 Claude Code용 npm/npx 실행 예시 |
| [`examples/claude-local.json`](../examples/claude-local.json) | Claude Desktop 및 Claude Code용 local clone 실행 예시 |
| [`examples/claude-code-remote.mcp.json`](../examples/claude-code-remote.mcp.json) | Claude Code용 remote Streamable HTTP 실행 예시 |
| [`examples/antigravity-all.mcp.json`](../examples/antigravity-all.mcp.json) | Antigravity용 npm/npx 실행 예시 |
| [`examples/antigravity-local.mcp.json`](../examples/antigravity-local.mcp.json) | Antigravity용 local clone 실행 예시 |
| [`examples/antigravity-remote.mcp.json`](../examples/antigravity-remote.mcp.json) | Antigravity용 remote HTTP 실행 예시 |

모든 예시는 `api-finder`, `shortcuts`, `mysql`, `postgres` MCP 서버를 함께 등록합니다.
`*-local.*` 예시는 `<mcp-hub-repo>`를 실제 clone 경로로 바꿔서 사용하세요.
`*-remote.*` 예시는 `https://mcp.example.com`을 실제 remote MCP server domain으로 바꾸고, 클라이언트 환경에 `MCP_HUB_TOKEN`을 설정하세요.

```text
<mcp-hub-repo>/packages/cli/dist/index.js
```

이 로컬 머신에서는 다음처럼 바꾸면 됩니다.

```text
/Users/dongjin/dev/study/mcp-hub/packages/cli/dist/index.js
```

## 파일 위치

| 환경 | 예시 파일 | 글로벌 위치 | 프로젝트별 위치 | 실제 파일명 |
| --- | --- | --- | --- | --- |
| Codex | [`examples/codex-all.config.toml`](../examples/codex-all.config.toml), [`examples/codex-local.config.toml`](../examples/codex-local.config.toml), [`examples/codex-remote.config.toml`](../examples/codex-remote.config.toml) | `~/.codex/config.toml` | `<repo>/.codex/config.toml` | `config.toml` |
| Cursor | [`examples/cursor-all.mcp.json`](../examples/cursor-all.mcp.json), [`examples/cursor-local.mcp.json`](../examples/cursor-local.mcp.json), [`examples/cursor-remote.mcp.json`](../examples/cursor-remote.mcp.json) | `~/.cursor/mcp.json` | `<repo>/.cursor/mcp.json` | `mcp.json` |
| Claude Desktop | [`examples/claude-all.json`](../examples/claude-all.json), [`examples/claude-local.json`](../examples/claude-local.json) | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`<br>Windows: `%APPDATA%\\Claude\\claude_desktop_config.json` | 지원하지 않음 | `claude_desktop_config.json` |
| Claude Code | [`examples/claude-all.json`](../examples/claude-all.json), [`examples/claude-local.json`](../examples/claude-local.json), [`examples/claude-code-remote.mcp.json`](../examples/claude-code-remote.mcp.json) | `~/.claude.json` | `<repo>/.mcp.json` | 글로벌: `.claude.json`<br>프로젝트: `.mcp.json` |
| Antigravity | [`examples/antigravity-all.mcp.json`](../examples/antigravity-all.mcp.json), [`examples/antigravity-local.mcp.json`](../examples/antigravity-local.mcp.json), [`examples/antigravity-remote.mcp.json`](../examples/antigravity-remote.mcp.json) | `~/.gemini/config/mcp_config.json` | `<repo>/.agents/settings.json` | 글로벌: `mcp_config.json`<br>프로젝트: `settings.json` |

## 적용 방식

기존 설정 파일이 없으면 위 예시 파일 내용을 새 설정 파일로 만들 수 있습니다.

기존 설정 파일이 있으면 파일 전체를 덮어쓰기보다 MCP 서버 등록 영역만 병합하세요.

| 환경 | 병합 대상 |
| --- | --- |
| Codex | `mcp_servers` |
| Cursor | `mcpServers` |
| Claude Desktop | `mcpServers` |
| Claude Code | `mcpServers` |
| Antigravity | `mcpServers` |

## 환경 변수

로컬 stdio 방식에서 `api-finder`, `mysql`, `postgres`는 실행 환경에 다음 변수가 필요합니다.

```text
PUBLIC_DATA_API_KEY
MYSQL_URL
POSTGRESQL_URL
```

remote HTTP 방식에서는 위 변수들을 remote MCP server 프로세스 쪽에만 설정합니다. 클라이언트 PC에는 다음 토큰만 설정합니다.

```text
MCP_HUB_TOKEN
```

`shortcuts`는 별도 환경 변수가 필요 없습니다.

## 참고

- Codex는 사용자 설정 `~/.codex/config.toml`과 프로젝트 설정 `<repo>/.codex/config.toml`을 모두 사용할 수 있습니다.
- Cursor는 글로벌 `~/.cursor/mcp.json`과 프로젝트별 `<repo>/.cursor/mcp.json`을 사용할 수 있습니다.
- Claude Desktop의 로컬 MCP 설정은 `claude_desktop_config.json` 방식입니다. remote MCP는 Claude의 custom connector UI 또는 Claude Code의 HTTP 설정을 사용하세요.
- Antigravity 공식 MCP 문서는 글로벌 `~/.gemini/config/mcp_config.json` 중심입니다. 프로젝트별 설정은 이 레포의 Antigravity adapter가 사용하는 `<repo>/.agents/settings.json` 형식으로 정리했습니다. remote HTTP header 지원 여부는 사용하는 Antigravity 버전의 raw config schema를 확인하세요.
- token 기반 remote HTTP 실행 흐름은 [Remote Streamable HTTP 실행](remote-http.md)을 확인하세요.
