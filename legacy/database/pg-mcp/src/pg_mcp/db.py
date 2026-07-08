"""
데이터베이스 연결 모듈 - PostgreSQL 커넥션 풀을 관리합니다.
"""

import psycopg2
import psycopg2.pool
import psycopg2.extras

from pg_mcp.config import Config


class Database:
    """
    PostgreSQL 커넥션 풀을 관리하는 클래스.

    SimpleConnectionPool을 사용하여 커넥션을 재사용하고,
    모든 쿼리는 읽기 전용 트랜잭션으로 실행합니다.
    """

    def __init__(self, config: Config):
        self._config = config
        self._pool: psycopg2.pool.SimpleConnectionPool | None = None

    def connect(self) -> None:
        """커넥션 풀을 초기화합니다."""
        if self._pool is not None:
            return

        self._pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=self._config.database_url,
        )

    def close(self) -> None:
        """커넥션 풀을 닫습니다."""
        if self._pool is not None:
            self._pool.closeall()
            self._pool = None

    def execute_query(
        self, sql: str, params: tuple | None = None
    ) -> list[dict]:
        """
        SQL 쿼리를 실행하고 결과를 딕셔너리 리스트로 반환합니다.

        모든 쿼리는 읽기 전용 트랜잭션에서 실행되며,
        결과 행 수는 max_rows로 제한됩니다.

        Args:
            sql: 실행할 SQL 쿼리
            params: 쿼리 파라미터 (SQL 인젝션 방지용)

        Returns:
            딕셔너리 리스트 형태의 쿼리 결과

        Raises:
            RuntimeError: 커넥션 풀이 초기화되지 않은 경우
            psycopg2.Error: SQL 실행 오류
        """
        if self._pool is None:
            raise RuntimeError("데이터베이스에 연결되지 않았습니다. connect()를 먼저 호출하세요.")

        conn = self._pool.getconn()
        try:
            # 읽기 전용 트랜잭션으로 설정
            conn.set_session(readonly=True, autocommit=True)

            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)

                # SELECT 등 결과가 있는 쿼리인 경우에만 fetch
                if cur.description is not None:
                    rows = cur.fetchmany(self._config.max_rows)
                    return [dict(row) for row in rows]
                return []
        finally:
            self._pool.putconn(conn)

    def get_tables(self, schema: str = "public") -> list[dict]:
        """
        지정한 스키마의 테이블 목록을 조회합니다.

        Args:
            schema: 조회할 스키마 이름 (기본: public)

        Returns:
            테이블 이름, 타입, 행 수 추정치를 포함하는 딕셔너리 리스트
        """
        sql = """
            SELECT
                t.table_name,
                t.table_type,
                pg_stat.n_live_tup AS estimated_row_count,
                obj_description(
                    (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
                ) AS table_comment
            FROM information_schema.tables t
            LEFT JOIN pg_stat_user_tables pg_stat
                ON pg_stat.schemaname = t.table_schema
                AND pg_stat.relname = t.table_name
            WHERE t.table_schema = %s
                AND t.table_type IN ('BASE TABLE', 'VIEW')
            ORDER BY t.table_name;
        """
        return self.execute_query(sql, (schema,))

    def get_table_columns(self, table_name: str, schema: str = "public") -> list[dict]:
        """
        테이블의 컬럼 정보를 조회합니다.

        Args:
            table_name: 테이블 이름
            schema: 스키마 이름 (기본: public)

        Returns:
            컬럼 이름, 데이터 타입, nullable 여부, 기본값 등을 포함하는 딕셔너리 리스트
        """
        sql = """
            SELECT
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                c.character_maximum_length,
                c.numeric_precision,
                pgd.description AS column_comment
            FROM information_schema.columns c
            LEFT JOIN pg_catalog.pg_statio_all_tables st
                ON st.schemaname = c.table_schema
                AND st.relname = c.table_name
            LEFT JOIN pg_catalog.pg_description pgd
                ON pgd.objoid = st.relid
                AND pgd.objsubid = c.ordinal_position
            WHERE c.table_schema = %s
                AND c.table_name = %s
            ORDER BY c.ordinal_position;
        """
        return self.execute_query(sql, (schema, table_name))

    def get_constraints(self, table_name: str, schema: str = "public") -> list[dict]:
        """
        테이블의 제약조건(PK, FK, UNIQUE 등)을 조회합니다.

        Args:
            table_name: 테이블 이름
            schema: 스키마 이름 (기본: public)

        Returns:
            제약조건 정보 딕셔너리 리스트
        """
        sql = """
            SELECT
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.table_schema = %s
                AND tc.table_name = %s
            ORDER BY tc.constraint_type, tc.constraint_name;
        """
        return self.execute_query(sql, (schema, table_name))

    def get_indexes(self, table_name: str, schema: str = "public") -> list[dict]:
        """
        테이블의 인덱스 정보를 조회합니다.

        Args:
            table_name: 테이블 이름
            schema: 스키마 이름 (기본: public)

        Returns:
            인덱스 정보 딕셔너리 리스트
        """
        sql = """
            SELECT
                indexname AS index_name,
                indexdef AS index_definition
            FROM pg_indexes
            WHERE schemaname = %s
                AND tablename = %s
            ORDER BY indexname;
        """
        return self.execute_query(sql, (schema, table_name))
