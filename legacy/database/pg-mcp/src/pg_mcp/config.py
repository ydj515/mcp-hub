"""
설정 모듈 - 환경 변수를 로딩하고 검증합니다.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv


@dataclass
class Config:
    """MCP 서버 설정값을 담는 데이터 클래스."""

    # PostgreSQL 접속 URL
    database_url: str = ""

    # 쿼리 결과 최대 행 수
    max_rows: int = 500

    # 허용할 스키마 목록
    allowed_schemas: list[str] = field(default_factory=lambda: ["public"])


def load_config() -> Config:
    """
    환경 변수에서 설정을 로딩합니다.

    .env 파일이 존재하면 자동으로 로딩하고,
    환경 변수가 이미 설정되어 있으면 그 값을 우선합니다.

    Returns:
        Config: 검증된 설정 객체

    Raises:
        ValueError: DATABASE_URL이 설정되지 않은 경우
    """
    # 프로젝트 루트의 .env 파일 로딩
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)

    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        raise ValueError(
            "DATABASE_URL 환경 변수가 설정되지 않았습니다.\n"
            ".env.example 파일을 참고하여 .env 파일을 생성하세요."
        )

    max_rows_str = os.getenv("MAX_ROWS", "500")
    try:
        max_rows = int(max_rows_str)
    except ValueError:
        max_rows = 500

    schemas_str = os.getenv("ALLOWED_SCHEMAS", "public")
    allowed_schemas = [s.strip() for s in schemas_str.split(",") if s.strip()]

    return Config(
        database_url=database_url,
        max_rows=max_rows,
        allowed_schemas=allowed_schemas,
    )
