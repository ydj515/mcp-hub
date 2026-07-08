"""
MCP 도구 모듈 - AI 에이전트가 호출할 수 있는 도구(Tool)들을 정의합니다.

모든 도구는 읽기 전용이며, 위험한 SQL 키워드를 필터링합니다.
"""

from __future__ import annotations

import json
import re
from typing import Any

from pg_mcp.db import Database
from pg_mcp.config import Config


# 실행을 차단할 SQL 키워드 패턴 (대소문자 무시)
_DANGEROUS_PATTERNS = re.compile(
    r"\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|GRANT|REVOKE|"
    r"COPY|EXECUTE|DO|CALL|SET\s+ROLE|SET\s+SESSION)\b",
    re.IGNORECASE,
)


def _format_result(data: Any) -> str:
    """결과를 JSON 문자열로 포맷팅합니다."""
    return json.dumps(data, ensure_ascii=False, indent=2, default=str)


def _validate_schema(schema: str, config: Config) -> None:
    """스키마가 허용 목록에 있는지 검증합니다."""
    if schema not in config.allowed_schemas:
        raise ValueError(
            f"스키마 '{schema}'는 허용되지 않습니다. "
            f"허용된 스키마: {config.allowed_schemas}"
        )


def _validate_sql(sql: str) -> None:
    """SQL에 위험한 키워드가 포함되어 있는지 검증합니다."""
    match = _DANGEROUS_PATTERNS.search(sql)
    if match:
        raise ValueError(
            f"안전하지 않은 SQL 키워드가 감지되었습니다: '{match.group()}'. "
            f"이 MCP 서버는 읽기 전용(SELECT)만 지원합니다."
        )


def register_tools(mcp, db: Database, config: Config) -> None:
    """
    MCP 서버에 모든 도구를 등록합니다.

    Args:
        mcp: FastMCP 서버 인스턴스
        db: Database 인스턴스
        config: Config 인스턴스
    """

    @mcp.tool()
    def list_tables(schema: str = "public") -> str:
        """
        데이터베이스의 테이블 목록을 조회합니다.

        테이블 이름, 타입(BASE TABLE/VIEW), 예상 행 수, 테이블 코멘트를 반환합니다.

        Args:
            schema: 조회할 스키마 이름 (기본값: public)

        Returns:
            JSON 형태의 테이블 목록
        """
        _validate_schema(schema, config)
        tables = db.get_tables(schema)

        if not tables:
            return f"스키마 '{schema}'에 테이블이 없습니다."

        return _format_result({
            "schema": schema,
            "table_count": len(tables),
            "tables": tables,
        })

    @mcp.tool()
    def describe_table(table_name: str, schema: str = "public") -> str:
        """
        특정 테이블의 구조를 상세히 조회합니다.

        컬럼 이름, 데이터 타입, nullable 여부, 기본값, 컬럼 코멘트,
        그리고 제약조건(PK, FK, UNIQUE)과 인덱스 정보를 함께 반환합니다.

        Args:
            table_name: 조회할 테이블 이름
            schema: 스키마 이름 (기본값: public)

        Returns:
            JSON 형태의 테이블 구조 정보
        """
        _validate_schema(schema, config)

        columns = db.get_table_columns(table_name, schema)
        if not columns:
            return f"테이블 '{schema}.{table_name}'을 찾을 수 없습니다."

        constraints = db.get_constraints(table_name, schema)
        indexes = db.get_indexes(table_name, schema)

        return _format_result({
            "table": f"{schema}.{table_name}",
            "column_count": len(columns),
            "columns": columns,
            "constraints": constraints,
            "indexes": indexes,
        })

    @mcp.tool()
    def run_query(sql: str) -> str:
        """
        읽기 전용 SQL 쿼리를 실행합니다.

        SELECT 문만 허용되며, DROP/DELETE/UPDATE/INSERT 등의 쓰기 작업은 차단됩니다.
        결과는 최대 MAX_ROWS 행까지 반환됩니다.

        Args:
            sql: 실행할 SQL 쿼리 (SELECT 문만 허용)

        Returns:
            JSON 형태의 쿼리 결과
        """
        _validate_sql(sql)

        rows = db.execute_query(sql)
        return _format_result({
            "row_count": len(rows),
            "max_rows": config.max_rows,
            "note": f"결과가 {config.max_rows}행을 초과하면 잘립니다." if len(rows) >= config.max_rows else None,
            "rows": rows,
        })

    @mcp.tool()
    def get_foreign_keys(table_name: str, schema: str = "public") -> str:
        """
        테이블의 외래 키(FK) 관계를 조회합니다.

        어떤 테이블의 어떤 컬럼을 참조하는지 확인할 수 있으며,
        테이블 간의 관계를 파악하는 데 유용합니다.

        Args:
            table_name: 조회할 테이블 이름
            schema: 스키마 이름 (기본값: public)

        Returns:
            JSON 형태의 외래 키 관계 정보
        """
        _validate_schema(schema, config)

        constraints = db.get_constraints(table_name, schema)
        fk_list = [c for c in constraints if c.get("constraint_type") == "FOREIGN KEY"]

        if not fk_list:
            return f"테이블 '{schema}.{table_name}'에 외래 키가 없습니다."

        return _format_result({
            "table": f"{schema}.{table_name}",
            "foreign_key_count": len(fk_list),
            "foreign_keys": fk_list,
        })

    @mcp.tool()
    def explain_query(sql: str) -> str:
        """
        SQL 쿼리의 실행 계획(EXPLAIN)을 반환합니다.

        쿼리 성능을 분석하고 최적화 포인트를 찾는 데 유용합니다.
        SELECT 문만 허용됩니다.

        Args:
            sql: 분석할 SQL 쿼리 (SELECT 문만 허용)

        Returns:
            JSON 형태의 실행 계획
        """
        _validate_sql(sql)

        explain_sql = f"EXPLAIN (FORMAT JSON, ANALYZE false) {sql}"
        result = db.execute_query(explain_sql)
        return _format_result(result)

    @mcp.tool()
    def get_table_stats(table_name: str, schema: str = "public") -> str:
        """
        테이블의 통계 정보를 조회합니다.

        디스크 사용량, 행 수, 인덱스 크기, 최근 VACUUM/ANALYZE 시점 등을 반환합니다.

        Args:
            table_name: 조회할 테이블 이름
            schema: 스키마 이름 (기본값: public)

        Returns:
            JSON 형태의 테이블 통계 정보
        """
        _validate_schema(schema, config)

        sql = """
            SELECT
                pg_stat.n_live_tup AS live_rows,
                pg_stat.n_dead_tup AS dead_rows,
                pg_stat.last_vacuum,
                pg_stat.last_autovacuum,
                pg_stat.last_analyze,
                pg_stat.last_autoanalyze,
                pg_size_pretty(pg_total_relation_size(
                    (quote_ident(%s) || '.' || quote_ident(%s))::regclass
                )) AS total_size,
                pg_size_pretty(pg_table_size(
                    (quote_ident(%s) || '.' || quote_ident(%s))::regclass
                )) AS table_size,
                pg_size_pretty(pg_indexes_size(
                    (quote_ident(%s) || '.' || quote_ident(%s))::regclass
                )) AS indexes_size
            FROM pg_stat_user_tables pg_stat
            WHERE pg_stat.schemaname = %s
                AND pg_stat.relname = %s;
        """
        params = (schema, table_name, schema, table_name, schema, table_name, schema, table_name)
        result = db.execute_query(sql, params)

        if not result:
            return f"테이블 '{schema}.{table_name}'의 통계를 찾을 수 없습니다."

        return _format_result({
            "table": f"{schema}.{table_name}",
            "stats": result[0],
        })
