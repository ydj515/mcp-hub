"""
PostgreSQL MCP 서버 - 메인 진입점

AI 에이전트가 PostgreSQL 데이터베이스에 직접 접근할 수 있도록
MCP(Model Context Protocol) 서버를 제공합니다.

사용법:
    # uv로 실행
    uv run python -m pg_mcp.server

    # 또는 MCP Inspector로 테스트
    uv run mcp dev src/pg_mcp/server.py
"""

import atexit
import sys

from mcp.server.fastmcp import FastMCP

from pg_mcp.config import load_config
from pg_mcp.db import Database
from pg_mcp.tools import register_tools


def create_server() -> FastMCP:
    """
    MCP 서버를 생성하고 설정합니다.

    Returns:
        설정이 완료된 FastMCP 서버 인스턴스
    """
    # 설정 로딩
    try:
        config = load_config()
    except ValueError as e:
        print(f"[오류] 설정 실패: {e}", file=sys.stderr)
        sys.exit(1)

    # FastMCP 서버 생성
    mcp = FastMCP(
        "PostgreSQL MCP Server",
        instructions=(
            "이 서버는 PostgreSQL 데이터베이스에 대한 읽기 전용 접근을 제공합니다. "
            "테이블 목록 조회, 스키마 탐색, SQL 쿼리 실행 등의 도구를 사용할 수 있습니다. "
            "데이터를 분석하기 전에 먼저 list_tables로 테이블 목록을 확인하고, "
            "describe_table로 구조를 파악한 후 run_query로 데이터를 조회하세요."
        ),
    )

    # DB 연결
    db = Database(config)
    db.connect()

    # 종료 시 커넥션 풀 정리
    atexit.register(db.close)

    # 도구 등록
    register_tools(mcp, db, config)

    return mcp


# FastMCP가 이 모듈 수준의 변수를 참조하여 서버를 시작합니다
mcp = create_server()


def main():
    """CLI 진입점: MCP 서버를 stdio 모드로 실행합니다."""
    mcp.run()


if __name__ == "__main__":
    main()
