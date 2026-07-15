# Remote Streamable HTTP 실행

이 문서는 MCP Hub를 토큰 기반 remote MCP server로 실행하고, 내 PC의 MCP 클라이언트에서 서버별 endpoint를 등록하는 방법을 정리합니다.

## 서버 실행

remote로 노출할 서버에서 빌드 후 토큰과 서버별 환경 변수를 설정합니다.

```bash
cd /Users/dongjin/dev/study/mcp-hub

mise install
npm install
npm run build

export MCP_HUB_TOKEN="$(openssl rand -base64 32)"
export PUBLIC_DATA_API_KEY="..."
export POSTGRESQL_URL="postgresql://readonly:password@localhost:5432/app"
export MYSQL_URL="mysql://readonly:password@localhost:3306/app"
export REDIS_URL="redis://readonly:password@localhost:6379/0"
export GITLAB_TOKEN="..."
export GITLAB_URL="https://gitlab.example.com"
export GITLAB_ENABLE_WRITE_TOOLS="false"

node packages/cli/dist/index.js serve all \
  --host 0.0.0.0 \
  --port 3333 \
  --auth-token-env MCP_HUB_TOKEN
```

같은 PC에서만 테스트할 때는 `--host 127.0.0.1`을 사용합니다. 다른 PC나 외부 네트워크에서 접근할 때는 `0.0.0.0`으로 bind하고, Caddy, Nginx, Cloudflare Tunnel, Tailscale 같은 HTTPS layer 뒤에 두는 것을 권장합니다.

## 서버별 Endpoint

`serve all`은 여러 MCP 서버의 tool을 하나로 합치지 않고 서버별 endpoint를 분리합니다.

```text
https://mcp.example.com/mcp/api-finder
https://mcp.example.com/mcp/shortcuts
https://mcp.example.com/mcp/mysql
https://mcp.example.com/mcp/postgres
https://mcp.example.com/mcp/redis
https://mcp.example.com/mcp/gitlab
```

단일 서버를 실행하면 `/mcp`와 `/mcp/<server-id>`를 함께 사용할 수 있습니다.

```bash
node packages/cli/dist/index.js serve postgres \
  --host 0.0.0.0 \
  --port 3333 \
  --auth-token-env MCP_HUB_TOKEN
```

```text
https://mcp.example.com/mcp
https://mcp.example.com/mcp/postgres
```

## 동작 확인

`/health`는 토큰 없이 확인할 수 있습니다.

```bash
curl http://127.0.0.1:3333/health
```

`/servers`와 `/mcp/<server-id>`는 `--auth-token-env`를 사용한 경우 Bearer token이 필요합니다.

```bash
curl -H "Authorization: Bearer $MCP_HUB_TOKEN" \
  http://127.0.0.1:3333/servers
```

## 클라이언트 설정

클라이언트 PC에는 DB·Redis URL, 공공데이터 API key, GitLab token을 둘 필요가 없습니다. remote MCP server에만 `POSTGRESQL_URL`, `MYSQL_URL`, `REDIS_URL`, `PUBLIC_DATA_API_KEY`, `GITLAB_TOKEN`, `GITLAB_URL`을 두고, 클라이언트에는 remote URL과 `MCP_HUB_TOKEN`만 설정합니다.

```bash
export MCP_HUB_TOKEN="remote-server와-같은-토큰"
```

예시 파일은 다음을 사용합니다.

| 대상 | 예시 파일 |
| --- | --- |
| Codex | [`examples/codex-remote.config.toml`](../examples/codex-remote.config.toml) |
| Cursor | [`examples/cursor-remote.mcp.json`](../examples/cursor-remote.mcp.json) |
| Claude Code | [`examples/claude-code-remote.mcp.json`](../examples/claude-code-remote.mcp.json) |
| Antigravity | [`examples/antigravity-remote.mcp.json`](../examples/antigravity-remote.mcp.json) |

`https://mcp.example.com`은 실제 HTTPS domain으로 바꾸세요. 로컬 테스트에서는 `http://127.0.0.1:3333`을 사용할 수 있습니다.

## 클라이언트별 메모

- Codex는 `url`과 `bearer_token_env_var`를 사용합니다.
- Cursor는 `url`과 `headers.Authorization` 형태의 JSON 예시를 제공합니다.
- Claude Code는 remote HTTP config에 `type: "http"`가 필요합니다.
- Claude Desktop의 `claude_desktop_config.json`은 로컬 MCP용 설정입니다. remote MCP는 Claude의 custom connector UI 또는 Claude Code 설정 흐름을 사용하세요.
- Antigravity는 버전에 따라 remote MCP schema가 다를 수 있습니다. 예시는 `serverUrl`과 `headers.Authorization` 형태이며, 사용하는 버전의 MCP raw config schema를 확인하세요.

## 보안 권장사항

- public internet에 노출할 때는 HTTPS 없이 직접 열지 않습니다.
- `MCP_HUB_TOKEN`은 repo나 공유 설정 파일에 직접 적지 않고 환경 변수로 둡니다.
- `postgres`, `mysql`은 읽기 전용 DB 계정을 사용합니다.
- `redis`는 조회 권한만 가진 Redis ACL 사용자로 실행합니다. `get_client_list`와 `get_slowlog`은 민감한 운영 정보를 반환할 수 있으므로 접근자를 제한합니다.
- `gitlab`은 필요한 scope만 가진 access token을 사용하고, self-hosted instance는 `GITLAB_URL`로 명시합니다. create/comment/approve/merge tool은 `GITLAB_ENABLE_WRITE_TOOLS=true`일 때만 실행됩니다.
- `ALLOWED_SCHEMAS`, `MYSQL_ALLOWED_SCHEMAS`, row limit, query timeout을 설정해 노출 범위를 줄입니다.
- 필요하면 endpoint별로 별도 토큰을 적용할 수 있도록 reverse proxy layer에서 추가 인증을 둡니다.

## 참고 문서

- [Codex MCP docs](https://developers.openai.com/codex/mcp)
- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)
- [Antigravity MCP docs](https://antigravity.google/docs/mcp)
