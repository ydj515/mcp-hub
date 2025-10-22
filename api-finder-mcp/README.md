# API Finder MCP Server

한국 공공데이터 포털(data.go.kr)의 Open API를 탐색하고 명세를 추출해 주는 Model Context Protocol(MCP) 서버입니다. AI 비서나 Claude Desktop과 같은 MCP 클라이언트가 이 서버와 통신해 서비스 아이디어에 맞는 공공데이터 API를 찾고, 선택한 API의 상세 스펙을 바로 확인할 수 있도록 돕습니다.

## 주요 기능

- `searchPublicDataAPI`  
  서비스 설명과 키워드를 바탕으로 공공데이터 포털에서 관련성이 높은 API를 최대 10건까지 검색해 이름, 제공기관, 활용 신청 링크 등의 핵심 정보를 반환합니다.
- `getPublicDataAPIDetails`  
  선택한 API의 상세 페이지에서 Swagger/OpenAPI 명세를 추출해 요청/응답 스키마와 예시를 JSON 형태로 돌려줍니다.
- `example_tool`  
  MCP 클라이언트 연동을 빠르게 검증할 수 있는 단순한 에코(예시) 도구입니다.

## 요구 사항

- Node.js 18.19.0 이상
- npm 9 이상 권장
- 한국 공공데이터 포털(data.go.kr) 발급 API 키  
  (환경 변수 `PUBLIC_DATA_API_KEY`에 설정, 미설정 시 샘플 키가 사용되므로 반드시 교체를 권장합니다.)

## 설치 및 초기 설정

```bash
# 의존성 설치
npm install

# TypeScript 컴파일 및 MCP 번들 생성
npm run build
```

Build 결과물은 `dist/` 디렉터리에 생성되며, `node dist/index.js`로 MCP 서버를 실행할 수 있습니다.

## 환경 변수 설정

`PUBLIC_DATA_API_KEY`를 환경 변수로 등록해야 안정적으로 API 호출이 가능합니다. 다음과 같이 설정해 사용하세요.

```bash
# macOS / Linux (bash 기준)
export PUBLIC_DATA_API_KEY="발급받은_서비스키"

# Windows PowerShell
$Env:PUBLIC_DATA_API_KEY="발급받은_서비스키"
```

또는 프로젝트 루트에 `.env` 파일을 만들어 개발용으로 관리할 수도 있습니다.

## 실행 방법

- 1회성 실행: `npm run build` → `npm run start`  
  (`npm run start`는 `node dist/index.js`를 호출합니다.)
- 개발 편의를 위한 워치 모드:

  ```bash
  # 터미널 1 - TypeScript 변경 감지 및 재컴파일
  npm run watch

  # 터미널 2 - 컴파일 결과 실행
  node dist/index.js
  ```

MCP 서버는 실행 후 즉시 도구들을 로드하고, MCP 클라이언트에서 오는 요청을 대기합니다.

## MCP 클라이언트 연동 (Claude Desktop 예시)

Claude Desktop 설정 파일에 아래 항목을 추가하면 로컬에서 빌드한 MCP 서버를 사용할 수 있습니다.

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "api-finder": {
      "command": "node",
      "args": ["/absolute/path/to/api-finder/dist/index.js"]
    }
  }
}
```

패키지를 npm에 배포한 뒤에는 다음과 같이 npx로 바로 실행하도록 바꿀 수 있습니다.

```json
{
  "mcpServers": {
    "api-finder": {
      "command": "npx",
      "args": ["api-finder"]
    }
  }
}
```

## 도구 상세

### searchPublicDataAPI

- **입력**
  - `service_description` (string): 만들고 싶은 서비스/앱에 대한 자연어 설명.
  - `keywords` (string[]): 설명에서 추출한 핵심 키워드 목록.
- **출력**  
  공공데이터 포털 검색 결과를 정리한 JSON 배열. 각 항목에는 `name`, `description`, `provider`, `url`, `api_id` 등이 포함됩니다.
- **예시 응답**

```json
[
  {
    "name": "기상청_단기예보 조회서비스",
    "description": "동네예보 정보(기온, 강수 등)를 조회",
    "dataType": "REST",
    "extension": "JSON, XML",
    "provider": "기상청",
    "url": "https://www.data.go.kr/data/15084084/openapi.do",
    "api_id": "15084084/openapi.do"
  }
]
```

### getPublicDataAPIDetails

- **입력**
  - `api_id` (string): `openapi.do` 상세 페이지 경로. `searchPublicDataAPI`의 응답에서 바로 전달할 수 있습니다.
- **동작**  
  상세 페이지 HTML에서 Swagger JSON을 직접 파싱하거나, Swagger 파일 URL을 추출해 불러옵니다.
- **출력**  
  OpenAPI 규격 JSON 문자열. `swagger/` 디렉터리에는 예시(`search-api.json`)가 포함돼 있습니다.

### example_tool

- **입력**
  - `message` (string)
- **출력**  
  `Processed: <message>` 형식의 문자열. MCP 연동 확인용으로 활용하세요.

## 프로젝트 구조

```
api-finder/
├── src/
│   ├── index.ts
│   └── tools/
│       ├── ExampleTool.ts
│       ├── GetPublicDataAPIDetailsTool.ts
│       └── SearchPublicDataAPITool.ts
├── swagger/
│   └── search-api.json          # 참고용 Swagger 응답 예시
├── dist/                        # 빌드 산출물 (npm run build 후 생성)
├── package.json
├── tsconfig.json
└── README.md
```

## 개발 가이드

- 새로운 도구 추가 시 `src/tools`에 파일을 생성하고 `MCPTool`을 상속해 구현합니다.
  - 혹은 아래의 명령어 형태로도 tool을 추가할 수 있습니다.(`src/tools/ExampleTool` 참고)
    ```bash
    mcp add tool my-tool
    ```
- HTTP 호출은 현재 `axios`로 처리하며, 로그는 `console.log`/`console.error`를 활용합니다.
- `npm run build`는 TypeScript 컴파일 후 `mcp-build`를 호출해 MCP 매니페스트를 갱신합니다.
- 외부 API 호출에 실패하면 MCP 클라이언트로 에러 메시지가 전달되므로, 필요한 경우 예외 메시지를 보완하세요.

## 문제 해결 팁

- 401/403 오류가 발생하면 API 키가 올바르게 설정됐는지 확인하세요.
- 공공데이터 포털의 응답 구조가 변경되면 `SearchPublicDataAPITool`의 파싱 로직을 점검해야 합니다.
- Swagger 명세가 제공되지 않는 API는 `getPublicDataAPIDetails`에서 에러를 반환할 수 있습니다.

## 참고 자료

- [공공데이터 포털 개발자 센터](https://www.data.go.kr/)
- [MCP Framework GitHub](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Framework 문서](https://mcp-framework.com)
