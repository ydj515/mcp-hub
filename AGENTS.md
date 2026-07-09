# Repository Guidelines

이 파일은 MCP Hub contributor guide의 색인입니다.

상세 지침은 [docs/repository-guidelines.md](docs/repository-guidelines.md)를 확인하세요.

## Quick Links

- [프로젝트 구조](docs/repository-guidelines.md#프로젝트-구조와-모듈-구성)
- [빌드, 테스트, 개발 명령](docs/repository-guidelines.md#빌드-테스트-개발-명령)
- [코딩 스타일과 네이밍](docs/repository-guidelines.md#코딩-스타일과-네이밍)
- [테스트 지침](docs/repository-guidelines.md#테스트-지침)
- [커밋과 Pull Request 지침](docs/repository-guidelines.md#커밋과-pull-request-지침)
- [보안과 설정 팁](docs/repository-guidelines.md#보안과-설정-팁)

## Essential Rules

- 소스 코드는 `packages/`, 사용자 문서는 `docs/`, 실행 가능한 클라이언트 예시는 `examples/`에 둡니다.
- 코드 변경 제출 전 `npm run build`, `npm run typecheck`, `npm run test`를 실행합니다.
- `.env`, credential, log, 생성된 `dist/`, `*.tsbuildinfo` 파일은 커밋하지 않습니다.
