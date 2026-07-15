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
| `mysql` | MySQL 읽기 전용 introspection과 쿼리 실행 |
| `postgres` | PostgreSQL 읽기 전용 introspection과 쿼리 실행 |
| `redis` | standalone, Cluster, Sentinel Redis의 자료형과 운영 상태 읽기 전용 조회 |
| `gitlab` | GitLab.com 및 self-hosted GitLab 프로젝트, 이슈, MR 조회 |

## 로컬 stdio 실행

개발 중에는 빌드 결과물을 직접 실행할 수 있습니다.

```bash
node packages/cli/dist/index.js stdio api-finder
node packages/cli/dist/index.js stdio shortcuts
node packages/cli/dist/index.js stdio mysql
node packages/cli/dist/index.js stdio postgres
node packages/cli/dist/index.js stdio redis
node packages/cli/dist/index.js stdio gitlab
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

서버 id만 바꾸면 `api-finder`, `shortcuts`, `mysql`, `postgres`, `redis`, `gitlab`을 같은 방식으로 등록할 수 있습니다.

## Streamable HTTP 실행

단일 서버만 HTTP로 실행할 수 있습니다.

```bash
node packages/cli/dist/index.js serve shortcuts --port 3333
```

여러 서버를 함께 올릴 때는 `serve all`을 사용합니다.

```bash
node packages/cli/dist/index.js serve all --port 3333
```

remote MCP server로 노출할 때는 토큰을 환경 변수로 두고 `--auth-token-env`를 지정합니다.

```bash
export MCP_HUB_TOKEN="$(openssl rand -base64 32)"

node packages/cli/dist/index.js serve all \
  --host 0.0.0.0 \
  --port 3333 \
  --auth-token-env MCP_HUB_TOKEN
```

`serve all`은 tool을 하나로 병합하지 않고, 서버별 HTTP endpoint를 제공합니다.

```text
http://localhost:3333/mcp/api-finder
http://localhost:3333/mcp/shortcuts
http://localhost:3333/mcp/mysql
http://localhost:3333/mcp/postgres
http://localhost:3333/mcp/redis
http://localhost:3333/mcp/gitlab
```

단일 서버를 실행하는 경우에는 `/mcp`와 `/mcp/<server-id>`를 함께 사용할 수 있습니다.

```text
http://localhost:3333/mcp
http://localhost:3333/mcp/shortcuts
```

remote token 방식의 실행 절차, curl 확인, 클라이언트별 예시는 [Remote Streamable HTTP 실행](remote-http.md)을 확인하세요.

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
POSTGRESQL_URL=postgresql://readonly:password@localhost:5432/app
ALLOWED_SCHEMAS=public
MAX_ROWS=500
QUERY_TIMEOUT_MS=10000
PG_POOL_MAX=5
POSTGRES_ENABLE_WRITE_TOOLS=false
POSTGRES_ENABLE_DIAGNOSTIC_TOOLS=false
```

`mysql`은 데이터베이스 연결 정보가 필요합니다.

```text
MYSQL_URL=mysql://readonly:password@localhost:3306/app
MYSQL_ALLOWED_SCHEMAS=app
MYSQL_MAX_ROWS=500
MYSQL_QUERY_TIMEOUT_MS=10000
MYSQL_POOL_LIMIT=5
MYSQL_ENABLE_WRITE_TOOLS=false
MYSQL_ENABLE_DIAGNOSTIC_TOOLS=false
```

MySQL과 PostgreSQL은 공통으로 다음 구조·진단 tool을 제공합니다.

```text
get_server_capabilities
get_indexes
get_constraints
get_partitions
get_table_size
get_table_stats
list_database_objects
list_active_queries
get_locks
```

`get_indexes`, `get_constraints`, `get_partitions`, `get_table_size`, `get_table_stats`는
`schema`와 `table_name`을 받습니다. `list_database_objects`는 table, view, trigger,
routine 등 schema 객체를 반환하며, `list_active_queries`와 `get_locks`는 기본 50개,
최대 100개까지 반환합니다. 활성 쿼리 SQL은 1,000자로 잘립니다. `list_active_queries`와
`get_locks`는 기본 비활성이며, 개발·로컬 DB에서만 DB별 `*_ENABLE_DIAGNOSTIC_TOOLS=true`를
설정해 활성화합니다.

PostgreSQL은 추가로 다음 tool을 제공합니다.

```text
get_index_usage
```

`get_index_usage`는 `pg_stat_user_indexes`의 누적 scan/tuple 통계를 반환하며, 통계 초기화
시점과 배치성 워크로드를 함께 검토한 후에만 인덱스 제거 판단에 사용해야 합니다.

고급 메타데이터 tool은 MySQL 8.0+와 PostgreSQL 11+을 기준으로 구현했습니다. MySQL
`get_indexes`는 `EXPRESSION`, `IS_VISIBLE` column이 없는 서버에서 호환 projection으로
재시도하지만, `get_locks`는 MySQL 8.0의 Performance Schema가 필요합니다. PostgreSQL
`get_locks`는 허용 schema에 속한 relation lock만 반환하므로 transaction ID, virtual XID,
advisory lock은 범위에 포함하지 않습니다.

`redis`는 `REDIS_MODE`에 따라 standalone, Cluster, Sentinel 연결을 선택합니다. 기본값은 standalone이며 모든 도구는 조회 전용입니다.

```text
# standalone (기본값)
REDIS_MODE=standalone
REDIS_URL=redis://readonly:password@localhost:6379/0

# Cluster
REDIS_MODE=cluster
REDIS_CLUSTER_NODES=rediss://redis-a:6379,rediss://redis-b:6379

# Sentinel
REDIS_MODE=sentinel
REDIS_SENTINEL_NODES=sentinel-a:26379,sentinel-b:26379
REDIS_SENTINEL_MASTER_NAME=mymaster

# 공통 선택 설정
REDIS_USERNAME=readonly
REDIS_PASSWORD=password
REDIS_TLS=true
REDIS_MAX_RESULTS=100
REDIS_MAX_VALUE_BYTES=1048576
REDIS_SCAN_COUNT=100
REDIS_SLOWLOG_COUNT=100
REDIS_CONNECT_TIMEOUT_MS=10000
REDIS_COMMAND_TIMEOUT_MS=10000
```

Redis tool은 다음과 같습니다.

```text
scan_keys
get_key_metadata
get_string
get_hash
get_list_range
get_set_members
get_sorted_set_range
get_stream_entries
get_server_info
get_database_size
get_client_list
get_slowlog
get_topology_status
```

`scan_keys`는 `KEYS`가 아닌 `SCAN`을 사용하며, Cluster에서는 노드별 cursor를 포함한 불투명 cursor를 반환합니다. 문자열·컬렉션 값은 유효한 UTF-8이면 텍스트로, 아니면 Base64로 반환합니다. `REDIS_MAX_RESULTS`는 범위 조회·진단 목록과 요청 `count`의 상한입니다. Redis의 `SCAN`/`HSCAN`/`SSCAN`에서 `COUNT`는 힌트이므로, 페이지를 임의로 잘라 다음 cursor에서 항목이 유실되는 일을 막기 위해 Redis가 반환한 한 페이지 전체를 보존합니다. 값 바이트는 항상 `REDIS_MAX_VALUE_BYTES`로 제한합니다.

`shortcuts`는 별도 환경 변수가 필요 없습니다.

`gitlab`은 GitLab access token이 필요합니다. GitLab.com은 `GITLAB_URL`을 생략할 수 있고, self-hosted GitLab은 instance URL을 지정합니다.

```text
GITLAB_TOKEN=...
GITLAB_URL=https://gitlab.example.com
GITLAB_AUTH_MODE=private-token
GITLAB_ENABLE_WRITE_TOOLS=false
GITLAB_MAX_PER_PAGE=50
GITLAB_MAX_FILE_BYTES=1048576
GITLAB_TIMEOUT_MS=10000
```

기본 제공 GitLab tool은 다음과 같습니다.

```text
get_current_user
search_projects
get_project
list_issues
get_issue
list_merge_requests
get_merge_request
list_project_branches
list_commits
get_file
list_pipelines
get_pipeline_jobs
create_issue
create_merge_request
create_issue_note
create_merge_request_note
approve_merge_request
merge_merge_request
```

> `postgres` 서버는 기본적으로 읽기 전용입니다. 개발·로컬 DB에서만 `POSTGRES_ENABLE_WRITE_TOOLS=true`로 `run_write_query`를 활성화하세요. 이 도구는 한 SQL statement로 DML, index, partition, 통계·maintenance 명령을 실행하지만 `DROP TABLE`, `TRUNCATE`, database/schema 제거, 권한·역할 변경은 거부합니다.
> `ALLOWED_SCHEMAS`를 지정하면 노출할 schema 범위를 줄일 수 있습니다.
> PostgreSQL의 `list_active_queries`, `get_locks`, `get_index_usage`는 각각 `pg_stat_activity`, `pg_locks`, `pg_stat_user_indexes` 접근 권한과 통계 수집 상태에 따라 보이는 범위가 달라집니다. 활성 쿼리와 잠금 응답에는 SQL 텍스트와 사용자·세션 정보가 포함될 수 있습니다.
> PostgreSQL의 `list_active_queries`, `get_locks`는 `POSTGRES_ENABLE_DIAGNOSTIC_TOOLS=true`일 때만 실행됩니다. `get_locks`는 allowlist 경계를 유지하기 위해 relation lock만 반환합니다.
> `mysql` 서버도 기본적으로 읽기 전용입니다. 개발·로컬 DB에서만 `MYSQL_ENABLE_WRITE_TOOLS=true`로 `run_write_query`를 활성화하세요. 이 도구는 한 SQL statement로 DML, index, partition, 통계·maintenance 명령을 실행하지만 `DROP TABLE`, `TRUNCATE`, database/schema 제거, 권한·역할 변경은 거부합니다.
> `MYSQL_ALLOWED_SCHEMAS`를 지정하면 노출할 schema 범위를 줄일 수 있습니다.
> MySQL의 `get_locks`는 MySQL 8.0의 `performance_schema.data_locks` 접근이 필요합니다. `list_active_queries`는 PROCESS 권한이 없으면 다른 세션을 모두 볼 수 없으며, 두 tool의 응답에는 SQL 텍스트와 연결 메타데이터가 포함될 수 있습니다.
> MySQL의 `list_active_queries`, `get_locks`는 `MYSQL_ENABLE_DIAGNOSTIC_TOOLS=true`일 때만 실행됩니다. `list_active_queries`는 현재 database가 허용 schema인 세션만 대상으로 하지만, SQL 본문에 schema-qualified relation이나 리터럴이 포함될 수 있습니다.
> `redis` 서버는 쓰기·삭제·Lua·범용 명령 실행 도구를 제공하지 않지만, Redis ACL도 조회 명령만 허용하도록 별도로 구성해야 합니다.
> `get_client_list`, `get_slowlog`, `get_topology_status` 응답에는 연결 주소, 키 이름 또는 명령 인자가 포함될 수 있으므로 remote MCP 접근 범위를 제한하세요.
> `gitlab` 서버의 create/comment/approve/merge tool은 `GITLAB_ENABLE_WRITE_TOOLS=true`일 때만 실행됩니다. self-hosted instance가 relative URL 아래에 있으면 `GITLAB_URL=https://example.com/gitlab`처럼 지정하세요.

## 배포 후 사용 흐름

목표 배포 형태는 다음과 같습니다.

| 배포 방식 | 로컬 stdio 사용 예 |
| --- | --- |
| Git clone | `node packages/cli/dist/index.js stdio postgres` |
| npm | `npx -y mcp-hub stdio postgres` |
| brew | `mcp-hub stdio postgres` |

remote MCP server를 만들 때는 같은 CLI에서 `serve <server-id>` 또는 `serve all`을 사용합니다.
