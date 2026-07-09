# MCP Hub 설정 예시 위치

이 디렉터리의 예시는 `api-finder`, `shortcuts`, `postgres` MCP 서버를 모두 등록합니다.

예시 파일을 그대로 새 파일로 저장하기보다, 기존 설정 파일이 있으면 `mcpServers` 또는 `mcp_servers` 항목에 병합해서 사용하세요.

## 파일 위치

| 환경 | 예시 파일 | 글로벌 위치 | 프로젝트별 위치 | 실제 파일명 |
| --- | --- | --- | --- | --- |
| Codex | `examples/codex-all.config.toml` | `~/.codex/config.toml` | `<repo>/.codex/config.toml` | `config.toml` |
| Cursor | `examples/cursor-all.mcp.json` | `~/.cursor/mcp.json` | `<repo>/.cursor/mcp.json` | `mcp.json` |
| Claude Desktop | `examples/claude-all.json` | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`<br>Windows: `%APPDATA%\\Claude\\claude_desktop_config.json` | 지원하지 않음 | `claude_desktop_config.json` |
| Claude Code | `examples/claude-all.json` | `~/.claude.json` | `<repo>/.mcp.json` | 글로벌: `.claude.json`<br>프로젝트: `.mcp.json` |
| Antigravity | `examples/antigravity-all.mcp.json` | `~/.gemini/config/mcp_config.json` | `<repo>/.agents/settings.json` | 글로벌: `mcp_config.json`<br>프로젝트: `settings.json` |

## 환경 변수

`api-finder`와 `postgres`는 실행 환경에 다음 변수가 필요합니다.

```text
PUBLIC_DATA_API_KEY
DATABASE_URL
```

`shortcuts`는 별도 환경 변수가 필요 없습니다.

## 참고

- Codex는 사용자 설정 `~/.codex/config.toml`과 프로젝트 설정 `<repo>/.codex/config.toml`을 모두 읽습니다.
- Cursor는 글로벌 `~/.cursor/mcp.json`과 프로젝트별 `<repo>/.cursor/mcp.json`을 사용할 수 있습니다.
- Claude Desktop의 로컬 MCP 설정은 `claude_desktop_config.json` 방식입니다. 프로젝트별 공유 설정이 필요하면 Claude Code의 `<repo>/.mcp.json`을 사용하세요.
- Antigravity 공식 MCP 문서는 글로벌 `~/.gemini/config/mcp_config.json` 중심입니다. 프로젝트별 설정은 이 레포의 Antigravity adapter가 사용하는 `<repo>/.agents/settings.json` 형식으로 정리했습니다.
