# MCP Hub

두 개의 MCP 기반 프로젝트를 한곳에서 관리하기 위한 모노레포입니다. 각 폴더는 서로 다른 배포/사용 환경을 대상으로 하며, 동일한 도메인(맥락 프로토콜)을 다른 방식으로 노출합니다.

## api-finder
- **역할**: mcp-framework로 구성된 순수 MCP 서버입니다. Claude Desktop 같은 MCP 호환 클라이언트에서 바로 실행할 수 있도록 CLI 형태로 배포됩니다.
- **주요 기능**
  - `searchPublicDataAPI`: 사용자가 만들고 싶은 서비스 설명과 키워드로 data.go.kr 공공데이터 API를 검색합니다.
  - `getPublicDataAPIDetails`: 선택한 API의 상세 명세(swaggerJson 또는 swaggerUrl)까지 추출합니다.
- **아키텍처**: `src/index.ts`에서 `MCPServer`를 구동하고, `src/tools/`에 실제 도구가 정의됩니다. 외부 의존성으로 `axios`, `zod` 등을 사용합니다.
- **실행 방법**
  1. `npm install`
  2. `npm run build`
  3. Claude Desktop에서 `dist/index.js`(또는 `npx api-finder`)를 MCP 서버로 등록해 바로 사용할 수 있습니다.
- **활용 시나리오**: 로컬 Claude Desktop 또는 MCP 호환 LLM 클라이언트에 직접 붙여 공공데이터 포털 API 탐색 도우미로 활용할 때 적합합니다.

## shortcut-mcp
- **역할**: 동일한 MCP 기능을 HTTP(S)로 노출하기 위해 `StreamableHTTPServerTransport`로 래핑한 Express 서버입니다. 외부 서비스가 HTTP 요청만으로 MCP 세션을 생성하고 스트리밍 응답을 받을 수 있게 합니다.
- **주요 기능**
  - `/mcp` 엔드포인트: 초기화(POST), 명령 처리(GET/POST), 세션 종료(DELETE)를 지원하며, 세션을 `Map`으로 관리합니다.
  - MCP 도구: `list_shortcut_categories`, `search_shortcuts` – macOS/Windows 단축키 데이터셋을 빠르게 검색합니다.
- **아키텍처**: `src/server.ts`에서 Express 앱을 구성하고, `src/mcp/tools.ts`가 MCP 도구 등록을 담당합니다. `src/services/shortcutSearch.ts`는 키워드 정규화와 점수 계산으로 검색 품질을 높입니다.
- **실행 방법**
  1. `npm install`
  2. `npm run build` 후 `node dist/server.js` 또는 개발 시 `ts-node`/`tsx`로 `src/server.ts` 실행
  3. 기본 포트는 `PORT` 환경 변수(없으면 3000). `/health` 엔드포인트로 상태 확인 가능.
- **활용 시나리오**: 브라우저 확장, 서버리스 함수 등에서 HTTP 기반으로 MCP 인터페이스를 호출해야 할 때 사용합니다. 스트리밍을 지원하므로 Claude Desktop 외 환경에서도 재사용이 쉽습니다.

## 선택 기준
- Claude Desktop이나 CLI에서 바로 붙여 쓰고 싶다면 **api-finder**처럼 사용합니다.
- MCP 서버 기능을 외부 HTTP 서비스에 노출하거나 여러 세션을 관리해야 한다면 **shortcut-mcp**처럼 사용합니다.

## 참고 자료

- [MCP Framework GitHub](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Framework 문서](https://mcp-framework.com)
- [MCP 문서](https://modelcontextprotocol.io/docs/getting-started/intro)
- [MCP inspector](https://modelcontextprotocol.io/docs/tools/inspector)
