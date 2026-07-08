# PostgreSQL MCP Server

AI 에이전트가 PostgreSQL 데이터베이스에 직접 접근하여 자연어로 데이터를 조회하고 분석할 수 있게 해주는 MCP(Model Context Protocol) 서버입니다.

## 기능

| 도구 | 설명 |
|------|------|
| `list_tables` | 데이터베이스의 테이블 목록 조회 |
| `describe_table` | 테이블 구조 (컬럼, 제약조건, 인덱스) 상세 조회 |
| `run_query` | 읽기 전용 SQL 쿼리 실행 |
| `get_foreign_keys` | 외래 키 관계 조회 |
| `explain_query` | SQL 실행 계획 분석 |
| `get_table_stats` | 테이블 통계 (크기, 행 수, vacuum 정보) 조회 |

## 보안

- **읽기 전용**: 모든 쿼리는 읽기 전용 트랜잭션으로 실행됩니다.
- **키워드 필터링**: DROP, DELETE, UPDATE, INSERT 등 쓰기 SQL 키워드가 차단됩니다.
- **결과 제한**: 쿼리 결과는 최대 `MAX_ROWS`(기본 500)행으로 제한됩니다.
- **스키마 허용 목록**: `ALLOWED_SCHEMAS`에 지정된 스키마만 접근 가능합니다.

## 시작하기

### 1. 의존성 설치

```bash
uv sync
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 실제 DB 접속 정보를 입력하세요
```

### 3. PostgreSQL 읽기 전용 사용자 생성 (권장)

```sql
CREATE USER mcp_readonly WITH PASSWORD 'secure_password_here';
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;
```

### 4. MCP Inspector로 테스트

```bash
uv run mcp dev src/pg_mcp/server.py
```

브라우저에서 MCP Inspector가 열리면, 도구 목록을 확인하고 직접 호출해볼 수 있습니다.

### 5. Antigravity에 연결

프로젝트 루트에 `.agents/settings.json` 파일을 생성합니다:

```json
{
  "mcpServers": {
    "pg-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "<프로젝트_경로>", "python", "-m", "pg_mcp.server"]
    }
  }
}
```

Antigravity CLI에서 `/mcp` 명령어로 연결을 확인합니다.

### 6. 전체 설정 우선순위

| 우선순위 | 위치 | 역할 |
|---|---|---|
| 높음 | 프로젝트 `/.agents/settings.json` | 프로젝트별 DB (production, staging 등) |
| 낮음 | `~/.gemini/config/settings.json` | 글로벌 기본 DB |

> [!TIP]
> 프로젝트에 `settings.json`이 있으면 그것이 우선 적용됩니다. 여러 DB를 동시에 연결하려면 동일한 MCP 서버 코드를 다른 이름으로 등록하고 `env`만 다르게 설정하세요.

## 프로젝트 구조

```
.
├── pyproject.toml          # 프로젝트 메타데이터 및 의존성
├── .env.example            # 환경 변수 템플릿
├── .env                    # 실제 환경 변수 (Git에 커밋하지 않음)
├── README.md
└── src/
    └── pg_mcp/
        ├── __init__.py
        ├── server.py       # MCP 서버 진입점
        ├── db.py           # DB 커넥션 풀 관리
        ├── tools.py        # MCP 도구 정의
        └── config.py       # 환경 변수 로딩
```
