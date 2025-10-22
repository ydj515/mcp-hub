# shortcut-mcp

Express와 Model Context Protocol(MCP)을 활용해 단축키 데이터를 조회하는 스트리머블 HTTP MCP 서버입니다. 카테고리별로 정리된 단축키 데이터를 기반으로 MCP 클라이언트가 툴 호출을 통해 검색하거나 메타데이터를 받아갈 수 있도록 구성되어 있습니다.

## 주요 기능
- Express 기반의 HTTP 엔드포인트(`/mcp`, `/health`) 제공
- `StreamableHTTPServerTransport`를 이용한 MCP 세션 관리 및 스트리밍 응답
- `zod` 스키마로 정의된 MCP 툴 파라미터 검증
- 카테고리/플랫폼/키워드 기반 단축키 검색 및 정렬 로직
- 구조화된 응답(`structuredContent`)과 텍스트 응답을 동시에 반환

## 디렉터리 구조
```
shortcut-mcp/
|- src/
|  |- server.ts                 # Express 서버 및 MCP 세션 라우팅
|  |- mcp/
|  |  |- sdk.ts                 # MCP SDK 재노출 모듈
|  |  |- tools.ts               # MCP 툴 정의 및 등록 로직
|  |- services/
|  |  |- shortcutSearch.ts      # 단축키 검색 서비스와 정렬 알고리즘
|  |- data/
|  |  |- categories.ts          # 지원 카테고리(id, name)
|  |  |- shortcuts.ts           # 카테고리별 단축키 전체 데이터셋
|  |- types/
|  |  |- category.ts            # Category 타입 정의
|  |  |- shortcut.ts            # Shortcut 타입 정의
|- TODO.md                      # 초기 요구사항과 참고 샘플 코드
|- package.json                 # 의존성 및 npm 스크립트
|- tsconfig.json                # TypeScript 컴파일 설정
|- dist/                        # `npm run build` 실행 시 생성되는 산출물
|- node_modules/                # npm 의존성 (설치 후 생성)
```

## 설치 및 실행
1. Node.js 18 이상 환경을 준비합니다.
2. 의존성을 설치합니다.
   ```bash
   npm install
   ```
3. 개발 서버(자동 재시작 포함)를 실행하거나 빌드 후 실행합니다.
   ```bash
   npm run dev      # tsx를 이용해 src/server.ts 실행
   npm run build    # dist/ 디렉터리에 컴파일
   npm start        # dist/server.js 실행
   ```
4. 기본 포트는 `PORT` 환경 변수를 통해 조정할 수 있으며, 지정하지 않으면 3000번을 사용합니다.

## npm 스크립트
| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | `tsx`를 사용해 TypeScript 소스 파일을 직접 실행합니다. |
| `npm run build` | `tsc`로 `dist/`에 JavaScript 빌드를 생성합니다. |
| `npm start` | 빌드 결과(`dist/server.js`)를 Node로 실행합니다. |

## HTTP 엔드포인트
- `POST /mcp`  
  - `initialize` 요청을 받으면 새로운 MCP 세션을 생성합니다.  
  - 이후 요청은 세션 헤더(`mcp-session-id` 또는 `Mcp-Session-Id`)를 사용해 동일한 트랜스포트를 재활용합니다.
- `GET /mcp`  
  - 열린 세션에서 서버→클라이언트 스트림을 전달합니다.
- `DELETE /mcp`  
  - 세션을 종료하고 서버 측 리소스를 정리합니다.
- `GET /health`  
  - 단순 헬스체크로 `{ ok: true }`를 반환합니다.

에러 발생 시 4xx/5xx 응답에 간단한 오류 메시지가 포함됩니다.

## 등록된 MCP 툴
- `list_shortcut_categories`
  - 모든 카테고리의 `id`, `name`을 정렬된 리스트로 반환합니다.
  - `structuredContent.categories`에도 동일한 배열을 포함합니다.
- `search_shortcuts`
  - 파라미터
    - `query` *(필수)*: 검색어(최대 300자)
    - `category` *(선택)*: 카테고리 ID 또는 이름
    - `platform` *(선택)*: `mac` 또는 `win`
    - `limit` *(선택)*: 최대 반환 개수(1~25, 기본 10)
  - 검색 결과는 점수 기반으로 정렬되며, `structuredContent.results`에 상세 정보를 제공합니다.
  - 조회된 항목은 `Category`, 단축키 액션, Mac/Windows 키 바인딩, 일치한 키워드 및 필드 목록을 포함합니다.

## 단축키 데이터 구조
- `categories.ts`: `Category` 타입(`id`, `name`)의 배열을 보유합니다.
- `shortcuts.ts`: 카테고리별 단축키 데이터(`Shortcut`)를 정의합니다.
  - `Shortcut`
    - `category`: 카테고리 ID
    - `action`: 동작 이름
    - `mac`, `win`: 플랫폼별 단축키 표기 (`-` 또는 `n/a`는 미지원)
    - `keywords`: 검색 시 참고할 키워드 배열
- `shortcutSearch.ts`
  - 입력 문자열을 정규화(NFKC, 소문자화, 공백 정리)하여 검색 정확도를 높입니다.
  - 플랫폼 필터링, 카테고리 매칭, 키워드/필드별 가중치 점수를 통해 결과를 정렬합니다.

## 개발 팁
- 서버 로그는 `SetLevelRequest` 처리 시 `server.server.sendLoggingMessage`를 통해 전송됩니다.
- MCP Inspector로 테스트하려면 서버 실행 후 아래 명령을 사용할 수 있습니다.
  ```bash
  npx @modelcontextprotocol/inspector --server http://localhost:3000/mcp
  ```
- 추가 도구나 리소스를 등록하려면 `src/mcp/tools.ts` 또는 별도 모듈을 확장하면 됩니다.

## TODO
초기 요구사항과 샘플 코드는 `TODO.md`에 정리되어 있습니다. 향후 기능 확장 시 참고하세요.
