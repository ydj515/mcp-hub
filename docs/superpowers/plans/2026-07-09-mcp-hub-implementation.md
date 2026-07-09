# MCP Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Node/TypeScript 공식 MCP SDK 기반의 `mcp-hub` CLI를 만들어 로컬 stdio 실행, 서버별 Streamable HTTP endpoint, 프로젝트별 MCP 설정 생성을 지원한다.

**Architecture:** 각 MCP 서버는 `ServerDefinition`으로 tool 등록만 제공하고, 실행 방식은 `@mcp-hub/core`가 담당한다. `mcp-hub` CLI는 서버 registry를 통해 `stdio`, `serve`, `init`, `list` 명령을 제공한다. Remote 모드의 `serve all`은 tool 병합이 아니라 `/mcp/:serverId` endpoint를 서버별로 제공한다.

**Tech Stack:** Node.js 20 이상, TypeScript, npm workspaces, `@modelcontextprotocol/sdk`, Express, CORS, Zod, `pg`, Vitest, `smol-toml`.

## Global Constraints

- 모든 새 TypeScript 패키지는 ESM(`"type": "module"`)으로 작성한다.
- MCP SDK는 공식 `@modelcontextprotocol/sdk`를 사용한다.
- 기본 HTTP host는 `127.0.0.1`, 기본 port는 `3333`이다.
- `serve all`은 서버별 endpoint 방식이며 tool 이름에 namespace를 붙이지 않는다.
- 단일 서버 `serve`는 `/mcp`와 `/mcp/:serverId`를 모두 지원한다.
- `init`은 preview-first이며 `--write`가 있을 때만 파일을 수정한다.
- 기존 설정의 같은 서버 이름은 충돌로 처리하고 `--force`가 있을 때만 교체한다.
- 환경 변수 값은 설정 파일에 직접 쓰지 않고 변수 이름 또는 참조만 기록한다.
- `postgres` 서버 id는 `postgres`다.
- `postgres` 기본값은 `ALLOWED_SCHEMAS=public`, `MAX_ROWS=500`, `QUERY_TIMEOUT_MS=10000`, `PG_POOL_MAX=5`다.
- `DATABASE_URL`은 `postgres` 서버의 필수 환경 변수다.
- stdio 모드에서는 stdout에 MCP JSON-RPC 메시지만 출력하고 로그는 stderr로 보낸다.
- `.env`와 DB 접속 정보는 커밋하지 않는다.
- 현재 사용자 변경분인 `shortcut-mcp/src/data/shortcuts.ts`와 untracked `database/`는 실행 전 상태를 확인하고 보존한다.

---

## File Structure

최종 구조는 아래와 같다.

```text
package.json
tsconfig.base.json
vitest.config.ts
packages/
  core/
    package.json
    tsconfig.json
    src/
      config/
        init.ts
        targets/
          antigravity.ts
          claude.ts
          codex.ts
          cursor.ts
      http/
        auth.ts
        streamable-http-app.ts
      create-server.ts
      index.ts
      logger.ts
      registry.ts
      server-definition.ts
      transports/
        stdio.ts
  cli/
    package.json
    tsconfig.json
    src/
      commands/
        init.ts
        list.ts
        serve.ts
        stdio.ts
      index.ts
      server-registry.ts
  servers/
    shortcuts/
      package.json
      tsconfig.json
      src/
        data/
        services/
        types/
        index.ts
        tools.ts
    api-finder/
      package.json
      tsconfig.json
      src/
        index.ts
        services/
          public-data-api.ts
        tools.ts
    postgres/
      package.json
      tsconfig.json
      src/
        config.ts
        db.ts
        index.ts
        sql-safety.ts
        tools.ts
```

책임 분리:

- `packages/core`: 서버 정의 타입, registry, MCP 서버 생성, stdio transport, Streamable HTTP app, 설정 adapter.
- `packages/cli`: CLI argument parsing과 명령 실행. MCP tool 구현을 직접 포함하지 않는다.
- `packages/servers/shortcuts`: 기존 단축키 데이터와 검색 도구.
- `packages/servers/api-finder`: 공공데이터 API 검색 도구. 기존 `mcp-framework` 의존성을 제거한다.
- `packages/servers/postgres`: TypeScript로 마이그레이션한 PostgreSQL 읽기 전용 MCP.

---

### Task 1: Workspace와 Core 계약 만들기

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/server-definition.ts`
- Create: `packages/core/src/logger.ts`
- Create: `packages/core/src/registry.ts`
- Create: `packages/core/src/create-server.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/registry.test.ts`

**Interfaces:**
- Produces: `ServerDefinition`, `ServerContext`, `createRegistry()`, `createMcpServerFromDefinition()`, `createStderrLogger()`.
- Consumes: 없음.

- [ ] **Step 1: 실패하는 registry 테스트 작성**

Create `packages/core/src/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRegistry } from "./registry.js";
import type { ServerDefinition } from "./server-definition.js";

const fixtureServer = (id: string): ServerDefinition => ({
  id,
  displayName: `${id} server`,
  version: "1.0.0",
  registerTools: () => {}
});

describe("createRegistry", () => {
  it("returns registered servers in insertion order", () => {
    const registry = createRegistry([
      fixtureServer("shortcuts"),
      fixtureServer("postgres")
    ]);

    expect(registry.list().map((server) => server.id)).toEqual([
      "shortcuts",
      "postgres"
    ]);
  });

  it("throws for duplicate server ids", () => {
    expect(() =>
      createRegistry([fixtureServer("postgres"), fixtureServer("postgres")])
    ).toThrow('Duplicate MCP server id: "postgres"');
  });

  it("throws for unknown server lookup", () => {
    const registry = createRegistry([fixtureServer("shortcuts")]);
    expect(() => registry.get("missing")).toThrow('Unknown MCP server: "missing"');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
npm test -- packages/core/src/registry.test.ts
```

Expected: FAIL with module resolution errors because workspace files do not exist yet.

- [ ] **Step 3: workspace와 core 파일 작성**

Create `package.json`:

```json
{
  "name": "mcp-hub-monorepo",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/core",
    "packages/cli",
    "packages/servers/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "typecheck": "tsc -b packages/core packages/cli packages/servers/shortcuts packages/servers/api-finder packages/servers/postgres",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^20.12.12",
    "tsx": "^4.9.3",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  }
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    pool: "forks"
  }
});
```

Create `packages/core/package.json`:

```json
{
  "name": "@mcp-hub/core",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.1",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "smol-toml": "^1.3.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21"
  }
}
```

Create `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src/**/*.ts"]
}
```

Create `packages/core/src/logger.ts`:

```ts
export type Logger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export const createStderrLogger = (prefix = "mcp-hub"): Logger => ({
  info: (message) => console.error(`[${prefix}] ${message}`),
  warn: (message) => console.error(`[${prefix}] WARN ${message}`),
  error: (message) => console.error(`[${prefix}] ERROR ${message}`)
});
```

Create `packages/core/src/server-definition.ts`:

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "./logger.js";

export type ServerMode = "stdio" | "http";

export type ServerContext = {
  env: NodeJS.ProcessEnv;
  logger: Logger;
  mode: ServerMode;
  serverId: string;
};

export type ServerDefinition = {
  id: string;
  displayName: string;
  version: string;
  requiredEnv?: string[];
  registerTools: (
    server: McpServer,
    context: ServerContext
  ) => void | Promise<void>;
};
```

Create `packages/core/src/registry.ts`:

```ts
import type { ServerDefinition } from "./server-definition.js";

export type ServerRegistry = {
  list: () => ServerDefinition[];
  get: (id: string) => ServerDefinition;
  has: (id: string) => boolean;
};

export const createRegistry = (
  definitions: ServerDefinition[]
): ServerRegistry => {
  const servers = new Map<string, ServerDefinition>();

  for (const definition of definitions) {
    if (servers.has(definition.id)) {
      throw new Error(`Duplicate MCP server id: "${definition.id}"`);
    }
    servers.set(definition.id, definition);
  }

  return {
    list: () => [...servers.values()],
    get: (id: string) => {
      const definition = servers.get(id);
      if (!definition) {
        throw new Error(`Unknown MCP server: "${id}"`);
      }
      return definition;
    },
    has: (id: string) => servers.has(id)
  };
};
```

Create `packages/core/src/create-server.ts`:

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createStderrLogger } from "./logger.js";
import type { ServerDefinition, ServerMode } from "./server-definition.js";

export type CreateMcpServerOptions = {
  env?: NodeJS.ProcessEnv;
  mode: ServerMode;
};

export const validateRequiredEnv = (
  definition: ServerDefinition,
  env: NodeJS.ProcessEnv
) => {
  const missing = (definition.requiredEnv ?? []).filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `${definition.id} is missing required environment variables: ${missing.join(", ")}`
    );
  }
};

export const createMcpServerFromDefinition = async (
  definition: ServerDefinition,
  options: CreateMcpServerOptions
) => {
  const env = options.env ?? process.env;
  validateRequiredEnv(definition, env);

  const server = new McpServer({
    name: definition.id,
    version: definition.version
  });

  await definition.registerTools(server, {
    env,
    logger: createStderrLogger(definition.id),
    mode: options.mode,
    serverId: definition.id
  });

  return server;
};
```

Create `packages/core/src/index.ts`:

```ts
export * from "./create-server.js";
export * from "./logger.js";
export * from "./registry.js";
export * from "./server-definition.js";
```

- [ ] **Step 4: 의존성 설치**

Run:

```bash
npm install
```

Expected: PASS, root `package-lock.json` is created or updated.

- [ ] **Step 5: 테스트 통과 확인**

Run:

```bash
npm test -- packages/core/src/registry.test.ts
```

Expected: PASS, 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json vitest.config.ts packages/core
git commit -m "feat: add mcp hub core workspace"
```

---

### Task 2: Shortcuts 서버 패키지 이전

**Files:**
- Create: `packages/servers/shortcuts/package.json`
- Create: `packages/servers/shortcuts/tsconfig.json`
- Create: `packages/servers/shortcuts/src/index.ts`
- Create: `packages/servers/shortcuts/src/tools.ts`
- Move: `shortcut-mcp/src/data/*` to `packages/servers/shortcuts/src/data/`
- Move: `shortcut-mcp/src/services/*` to `packages/servers/shortcuts/src/services/`
- Move: `shortcut-mcp/src/types/*` to `packages/servers/shortcuts/src/types/`
- Test: `packages/servers/shortcuts/src/services/shortcutSearch.test.ts`

**Interfaces:**
- Consumes: `ServerDefinition` from `@mcp-hub/core`.
- Produces: `shortcutsServer: ServerDefinition`.

- [ ] **Step 1: 현재 사용자 변경 확인**

Run:

```bash
git status --short shortcut-mcp/src/data/shortcuts.ts database
```

Expected: output includes existing user changes. Do not discard them.

- [ ] **Step 2: 실패하는 검색 테스트 작성**

Create `packages/servers/shortcuts/src/services/shortcutSearch.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { listShortcutCategories, searchShortcuts } from "./shortcutSearch.js";

describe("shortcutSearch", () => {
  it("lists registered categories", () => {
    const categories = listShortcutCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty("id");
    expect(categories[0]).toHaveProperty("name");
  });

  it("returns scored shortcut results for a query", () => {
    const results = searchShortcuts({ query: "copy", limit: 5 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run:

```bash
npm test -- packages/servers/shortcuts/src/services/shortcutSearch.test.ts
```

Expected: FAIL because the shortcuts package and moved files do not exist.

- [ ] **Step 4: 기존 shortcuts 소스 이동**

Run:

```bash
mkdir -p packages/servers/shortcuts/src
git mv shortcut-mcp/src/data packages/servers/shortcuts/src/data
git mv shortcut-mcp/src/services packages/servers/shortcuts/src/services
git mv shortcut-mcp/src/types packages/servers/shortcuts/src/types
```

Expected: moved files preserve existing user edits in `shortcuts.ts`.

- [ ] **Step 5: shortcuts package 작성**

Create `packages/servers/shortcuts/package.json`:

```json
{
  "name": "@mcp-hub/server-shortcuts",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@mcp-hub/core": "0.1.0",
    "zod": "^3.23.8"
  }
}
```

Create `packages/servers/shortcuts/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "references": [{ "path": "../../core" }],
  "include": ["src/**/*.ts"]
}
```

Create `packages/servers/shortcuts/src/tools.ts`:

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listShortcutCategories,
  searchShortcuts,
  type ShortcutPlatform
} from "./services/shortcutSearch.js";

const searchShortcutsParameters = z.object({
  query: z.string().min(1).max(300),
  category: z.string().min(1).optional(),
  platform: z.enum(["mac", "win"]).optional(),
  limit: z.number().int().min(1).max(25).optional()
});

export const registerShortcutTools = (server: McpServer) => {
  server.tool(
    "list_shortcut_categories",
    "List supported shortcut categories",
    async () => {
      const categories = listShortcutCategories();
      return {
        content: [
          {
            type: "text",
            text: categories.length
              ? categories.map((category) => `- ${category.id}: ${category.name}`).join("\n")
              : "No categories are registered."
          }
        ],
        structuredContent: { categories }
      };
    }
  );

  server.tool(
    "search_shortcuts",
    "Search keyboard shortcuts by query and optional filters.",
    searchShortcutsParameters.shape,
    async ({ query, category, platform, limit }: z.infer<typeof searchShortcutsParameters>) => {
      const results = searchShortcuts({
        query,
        category,
        platform: platform as ShortcutPlatform | undefined,
        limit
      });

      return {
        content: [
          {
            type: "text",
            text: results.length
              ? [
                  `Shortcuts for "${query}":`,
                  ...results.map((result, index) => {
                    const bindings =
                      platform === "mac"
                        ? result.mac
                        : platform === "win"
                          ? result.win
                          : `${result.mac} | ${result.win}`;
                    return `${index + 1}. [${result.categoryName}] ${result.action} -> ${bindings}`;
                  })
                ].join("\n")
              : `No shortcuts found for "${query}".`
          }
        ],
        structuredContent: {
          query,
          category: category ?? null,
          platform: platform ?? null,
          results
        }
      };
    }
  );
};
```

Create `packages/servers/shortcuts/src/index.ts`:

```ts
import type { ServerDefinition } from "@mcp-hub/core";
import { registerShortcutTools } from "./tools.js";

export const shortcutsServer: ServerDefinition = {
  id: "shortcuts",
  displayName: "Keyboard Shortcuts MCP",
  version: "0.1.0",
  registerTools: (server) => {
    registerShortcutTools(server);
  }
};
```

- [ ] **Step 6: 테스트와 빌드 통과 확인**

Run:

```bash
npm test -- packages/servers/shortcuts/src/services/shortcutSearch.test.ts
npm run build --workspace @mcp-hub/server-shortcuts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/servers/shortcuts shortcut-mcp/src
git commit -m "feat: migrate shortcuts server package"
```

---

### Task 3: CLI list와 stdio 실행 구현

**Files:**
- Create: `packages/core/src/transports/stdio.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/server-registry.ts`
- Create: `packages/cli/src/commands/list.ts`
- Create: `packages/cli/src/commands/stdio.ts`
- Create: `packages/cli/src/index.ts`
- Test: `packages/cli/src/commands/list.test.ts`

**Interfaces:**
- Consumes: `shortcutsServer`, `createRegistry()`, `createMcpServerFromDefinition()`.
- Produces: executable `mcp-hub`, `runStdioServer(definition)`.

- [ ] **Step 1: 실패하는 list command 테스트 작성**

Create `packages/cli/src/commands/list.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatServerList } from "./list.js";
import type { ServerDefinition } from "@mcp-hub/core";

const servers: ServerDefinition[] = [
  {
    id: "shortcuts",
    displayName: "Keyboard Shortcuts MCP",
    version: "0.1.0",
    registerTools: () => {}
  }
];

describe("formatServerList", () => {
  it("renders server id, name, version, and env requirements", () => {
    expect(formatServerList(servers)).toContain("shortcuts");
    expect(formatServerList(servers)).toContain("Keyboard Shortcuts MCP");
    expect(formatServerList(servers)).toContain("0.1.0");
    expect(formatServerList(servers)).toContain("required env: none");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
npm test -- packages/cli/src/commands/list.test.ts
```

Expected: FAIL because CLI files do not exist.

- [ ] **Step 3: stdio transport와 CLI 작성**

Create `packages/core/src/transports/stdio.ts`:

```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServerFromDefinition } from "../create-server.js";
import type { ServerDefinition } from "../server-definition.js";

export const runStdioServer = async (
  definition: ServerDefinition,
  env: NodeJS.ProcessEnv = process.env
) => {
  const server = await createMcpServerFromDefinition(definition, {
    env,
    mode: "stdio"
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
```

Modify `packages/core/src/index.ts`:

```ts
export * from "./create-server.js";
export * from "./logger.js";
export * from "./registry.js";
export * from "./server-definition.js";
export * from "./transports/stdio.js";
```

Create `packages/cli/package.json`:

```json
{
  "name": "mcp-hub",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "bin": {
    "mcp-hub": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@mcp-hub/core": "0.1.0",
    "@mcp-hub/server-shortcuts": "0.1.0"
  }
}
```

Create `packages/cli/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "references": [
    { "path": "../core" },
    { "path": "../servers/shortcuts" }
  ],
  "include": ["src/**/*.ts"]
}
```

Create `packages/cli/src/server-registry.ts`:

```ts
import { createRegistry } from "@mcp-hub/core";
import { shortcutsServer } from "@mcp-hub/server-shortcuts";

export const serverRegistry = createRegistry([shortcutsServer]);
```

Create `packages/cli/src/commands/list.ts`:

```ts
import type { ServerDefinition, ServerRegistry } from "@mcp-hub/core";

export const formatServerList = (servers: ServerDefinition[]) =>
  servers
    .map((server) => {
      const requiredEnv = server.requiredEnv?.length
        ? server.requiredEnv.join(", ")
        : "none";
      return `${server.id}\t${server.displayName}\t${server.version}\trequired env: ${requiredEnv}`;
    })
    .join("\n");

export const runListCommand = (registry: ServerRegistry) => {
  console.log(formatServerList(registry.list()));
};
```

Create `packages/cli/src/commands/stdio.ts`:

```ts
import { runStdioServer, type ServerRegistry } from "@mcp-hub/core";

export const runStdioCommand = async (
  registry: ServerRegistry,
  args: string[]
) => {
  const serverId = args[0];
  if (!serverId) {
    throw new Error("Usage: mcp-hub stdio <server-id>");
  }

  await runStdioServer(registry.get(serverId));
};
```

Create `packages/cli/src/index.ts`:

```ts
#!/usr/bin/env node
import { runListCommand } from "./commands/list.js";
import { runStdioCommand } from "./commands/stdio.js";
import { serverRegistry } from "./server-registry.js";

const [, , command, ...args] = process.argv;

const main = async () => {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.error("Usage: mcp-hub <list|stdio> [args]");
    return;
  }

  if (command === "list") {
    runListCommand(serverRegistry);
    return;
  }

  if (command === "stdio") {
    await runStdioCommand(serverRegistry, args);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
```

- [ ] **Step 4: 테스트와 빌드 통과 확인**

Run:

```bash
npm test -- packages/cli/src/commands/list.test.ts
npm run build
node packages/cli/dist/index.js list
```

Expected: PASS, list output includes `shortcuts`.

- [ ] **Step 5: Commit**

```bash
git add packages/core packages/cli
git commit -m "feat: add mcp hub cli stdio runner"
```

---

### Task 4: 서버별 Streamable HTTP endpoint 구현

**Files:**
- Create: `packages/core/src/http/auth.ts`
- Create: `packages/core/src/http/streamable-http-app.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`
- Create: `packages/cli/src/commands/serve.ts`
- Modify: `packages/cli/src/index.ts`
- Test: `packages/core/src/http/streamable-http-app.test.ts`

**Interfaces:**
- Consumes: `ServerDefinition`, `createMcpServerFromDefinition()`.
- Produces: `createStreamableHttpApp()`, CLI command `mcp-hub serve`.

- [ ] **Step 1: 실패하는 HTTP route 테스트 작성**

Create `packages/core/src/http/streamable-http-app.test.ts`:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { ServerDefinition } from "../server-definition.js";
import { createStreamableHttpApp } from "./streamable-http-app.js";

const fixtureServer: ServerDefinition = {
  id: "shortcuts",
  displayName: "Keyboard Shortcuts MCP",
  version: "0.1.0",
  registerTools: () => {}
};

describe("createStreamableHttpApp", () => {
  it("lists exposed servers", async () => {
    const app = createStreamableHttpApp({
      definitions: [fixtureServer],
      env: {},
      exposeRootMcp: false
    });

    const response = await request(app).get("/servers").expect(200);
    expect(response.body.servers).toEqual([
      {
        id: "shortcuts",
        displayName: "Keyboard Shortcuts MCP",
        version: "0.1.0",
        endpoint: "/mcp/shortcuts"
      }
    ]);
  });

  it("returns 404 for unknown mcp endpoint", async () => {
    const app = createStreamableHttpApp({
      definitions: [fixtureServer],
      env: {},
      exposeRootMcp: false
    });

    await request(app).post("/mcp/missing").send({}).expect(404);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
npm test -- packages/core/src/http/streamable-http-app.test.ts
```

Expected: FAIL because `supertest` and HTTP app files do not exist.

- [ ] **Step 3: HTTP app 구현**

Modify root `package.json` devDependencies:

```json
{
  "devDependencies": {
    "@types/node": "^20.12.12",
    "@types/supertest": "^6.0.2",
    "supertest": "^6.3.4",
    "tsx": "^4.9.3",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

Create `packages/core/src/http/auth.ts`:

```ts
import type { Request, Response, NextFunction } from "express";

export type AuthOptions = {
  bearerToken?: string;
};

export const createBearerAuthMiddleware = (options: AuthOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!options.bearerToken || req.path === "/health") {
      next();
      return;
    }

    const expected = `Bearer ${options.bearerToken}`;
    if (req.header("authorization") !== expected) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  };
};
```

Create `packages/core/src/http/streamable-http-app.ts`:

```ts
import cors from "cors";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import {
  isInitializeRequest
} from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServerFromDefinition } from "../create-server.js";
import type { ServerDefinition } from "../server-definition.js";
import { createBearerAuthMiddleware } from "./auth.js";

type SessionEntry = {
  transport: StreamableHTTPServerTransport;
  close: () => Promise<void>;
};

export type CreateStreamableHttpAppOptions = {
  definitions: ServerDefinition[];
  env?: NodeJS.ProcessEnv;
  exposeRootMcp: boolean;
  bearerToken?: string;
};

const getHeaderSessionId = (req: Request) =>
  req.header("mcp-session-id") ?? req.header("Mcp-Session-Id") ?? undefined;

export const createStreamableHttpApp = (options: CreateStreamableHttpAppOptions) => {
  const env = options.env ?? process.env;
  const definitions = new Map(options.definitions.map((definition) => [definition.id, definition]));
  const sessions = new Map<string, Map<string, SessionEntry>>();
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: true,
      exposedHeaders: ["Mcp-Session-Id"],
      allowedHeaders: ["Content-Type", "mcp-session-id", "Mcp-Session-Id", "Authorization"]
    })
  );
  app.use(createBearerAuthMiddleware({ bearerToken: options.bearerToken }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/servers", (_req, res) => {
    res.json({
      servers: options.definitions.map((definition) => ({
        id: definition.id,
        displayName: definition.displayName,
        version: definition.version,
        endpoint: `/mcp/${definition.id}`
      }))
    });
  });

  const handleMcpRequest = async (
    serverId: string,
    req: Request,
    res: Response
  ) => {
    const definition = definitions.get(serverId);
    if (!definition) {
      res.status(404).json({ error: `Unknown MCP server: ${serverId}` });
      return;
    }

    const serverSessions = sessions.get(serverId) ?? new Map<string, SessionEntry>();
    sessions.set(serverId, serverSessions);

    const sessionId = getHeaderSessionId(req);
    let session = sessionId ? serverSessions.get(sessionId) : undefined;

    if (req.method === "POST" && !session && isInitializeRequest(req.body)) {
      const server = await createMcpServerFromDefinition(definition, {
        env,
        mode: "http"
      });
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          serverSessions.set(newSessionId, {
            transport,
            close: async () => {
              await transport.close();
              await server.close();
            }
          });
        },
        onsessionclosed: (closedSessionId) => {
          serverSessions.delete(closedSessionId);
        }
      });

      transport.onclose = async () => {
        if (transport.sessionId) {
          serverSessions.delete(transport.sessionId);
        }
        await server.close();
      };

      await server.connect(transport);
      session = {
        transport,
        close: async () => {
          await transport.close();
          await server.close();
        }
      };
    }

    if (!session) {
      res.status(400).json({ error: "No valid MCP session" });
      return;
    }

    if (req.method === "DELETE") {
      await session.close();
      res.status(204).end();
      return;
    }

    await session.transport.handleRequest(req, res, req.body);
  };

  for (const definition of options.definitions) {
    app.all(`/mcp/${definition.id}`, (req, res) => {
      handleMcpRequest(definition.id, req, res).catch((error) => {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Internal server error"
        });
      });
    });
  }

  if (options.exposeRootMcp && options.definitions.length === 1) {
    const [definition] = options.definitions;
    app.all("/mcp", (req, res) => {
      handleMcpRequest(definition.id, req, res).catch((error) => {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Internal server error"
        });
      });
    });
  }

  return app;
};
```

Modify `packages/core/src/index.ts`:

```ts
export * from "./create-server.js";
export * from "./http/auth.js";
export * from "./http/streamable-http-app.js";
export * from "./logger.js";
export * from "./registry.js";
export * from "./server-definition.js";
export * from "./transports/stdio.js";
```

Create `packages/cli/src/commands/serve.ts`:

```ts
import { createStreamableHttpApp, type ServerDefinition, type ServerRegistry } from "@mcp-hub/core";
import http from "node:http";

export const selectServeDefinitions = (
  registry: ServerRegistry,
  args: string[]
): ServerDefinition[] => {
  const serverIds = args.filter((arg) => !arg.startsWith("--"));
  if (!serverIds.length) {
    throw new Error("Usage: mcp-hub serve <server-id|all> [--port 3333] [--host 127.0.0.1]");
  }

  if (serverIds[0] === "all") {
    return registry.list();
  }

  return serverIds.map((serverId) => registry.get(serverId));
};

const readOption = (args: string[], name: string, fallback: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};

export const runServeCommand = async (
  registry: ServerRegistry,
  args: string[]
) => {
  const definitions = selectServeDefinitions(registry, args);
  const port = Number.parseInt(readOption(args, "--port", "3333"), 10);
  const host = readOption(args, "--host", "127.0.0.1");
  const authTokenEnv = readOption(args, "--auth-token-env", "");
  const bearerToken = authTokenEnv ? process.env[authTokenEnv] : undefined;

  const app = createStreamableHttpApp({
    definitions,
    exposeRootMcp: definitions.length === 1,
    bearerToken
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(port, host, resolve);
  });

  console.error(`mcp-hub listening on http://${host}:${port}`);
};
```

Modify `packages/cli/src/index.ts`:

```ts
#!/usr/bin/env node
import { runListCommand } from "./commands/list.js";
import { runServeCommand } from "./commands/serve.js";
import { runStdioCommand } from "./commands/stdio.js";
import { serverRegistry } from "./server-registry.js";

const [, , command, ...args] = process.argv;

const main = async () => {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.error("Usage: mcp-hub <list|stdio|serve> [args]");
    return;
  }

  if (command === "list") {
    runListCommand(serverRegistry);
    return;
  }

  if (command === "stdio") {
    await runStdioCommand(serverRegistry, args);
    return;
  }

  if (command === "serve") {
    await runServeCommand(serverRegistry, args);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
```

- [ ] **Step 4: 설치, 테스트, 빌드 확인**

Run:

```bash
npm install
npm test -- packages/core/src/http/streamable-http-app.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 5: HTTP smoke test**

Run:

```bash
node packages/cli/dist/index.js serve shortcuts --port 3333
```

In another terminal:

```bash
curl -s http://127.0.0.1:3333/health
curl -s http://127.0.0.1:3333/servers
```

Expected: health returns `{"ok":true}` and servers includes `/mcp/shortcuts`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json packages/core packages/cli
git commit -m "feat: add streamable http server endpoints"
```

---

### Task 5: 프로젝트별 MCP 설정 init adapter 구현

**Files:**
- Create: `packages/core/src/config/init.ts`
- Create: `packages/core/src/config/targets/codex.ts`
- Create: `packages/core/src/config/targets/cursor.ts`
- Create: `packages/core/src/config/targets/claude.ts`
- Create: `packages/core/src/config/targets/antigravity.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/cli/src/commands/init.ts`
- Modify: `packages/cli/src/index.ts`
- Test: `packages/core/src/config/init.test.ts`

**Interfaces:**
- Consumes: `ServerDefinition`.
- Produces: `buildInitPreview()`, `mergeMcpServerConfig()`, CLI command `mcp-hub init`.

- [ ] **Step 1: 실패하는 init 테스트 작성**

Create `packages/core/src/config/init.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildInitPreview } from "./init.js";
import type { ServerDefinition } from "../server-definition.js";

const postgresServer: ServerDefinition = {
  id: "postgres",
  displayName: "PostgreSQL MCP",
  version: "0.1.0",
  requiredEnv: ["DATABASE_URL"],
  registerTools: () => {}
};

describe("buildInitPreview", () => {
  it("builds Codex project TOML preview", () => {
    const result = buildInitPreview({
      target: "codex",
      scope: "project",
      server: postgresServer,
      commandMode: "npx",
      packageName: "mcp-hub"
    });

    expect(result.path).toBe(".codex/config.toml");
    expect(result.content).toContain("[mcp_servers.mcp_hub_postgres]");
    expect(result.content).toContain('command = "npx"');
    expect(result.content).toContain('"stdio"');
    expect(result.content).toContain('"postgres"');
  });

  it("builds Cursor project JSON preview", () => {
    const result = buildInitPreview({
      target: "cursor",
      scope: "project",
      server: postgresServer,
      commandMode: "npx",
      packageName: "mcp-hub"
    });

    expect(result.path).toBe(".cursor/mcp.json");
    expect(JSON.parse(result.content).mcpServers["mcp-hub-postgres"].args).toEqual([
      "-y",
      "mcp-hub",
      "stdio",
      "postgres"
    ]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
npm test -- packages/core/src/config/init.test.ts
```

Expected: FAIL because config files do not exist.

- [ ] **Step 3: target adapter 구현**

Create `packages/core/src/config/init.ts`:

```ts
import type { ServerDefinition } from "../server-definition.js";
import { buildAntigravityConfig } from "./targets/antigravity.js";
import { buildClaudeConfig } from "./targets/claude.js";
import { buildCodexConfig } from "./targets/codex.js";
import { buildCursorConfig } from "./targets/cursor.js";

export type InitTarget = "claude-desktop" | "codex" | "cursor" | "antigravity";
export type InitScope = "project" | "user";
export type CommandMode = "npx" | "local";

export type InitRequest = {
  target: InitTarget;
  scope: InitScope;
  server: ServerDefinition;
  commandMode: CommandMode;
  packageName: string;
  localCliPath?: string;
};

export type InitPreview = {
  path: string;
  content: string;
};

export const serverConfigName = (server: ServerDefinition) =>
  `mcp-hub-${server.id}`;

export const commandForServer = (request: InitRequest) => {
  if (request.commandMode === "local") {
    if (!request.localCliPath) {
      throw new Error("local mode requires localCliPath");
    }
    return {
      command: "node",
      args: [request.localCliPath, "stdio", request.server.id]
    };
  }

  return {
    command: "npx",
    args: ["-y", request.packageName, "stdio", request.server.id]
  };
};

export const buildInitPreview = (request: InitRequest): InitPreview => {
  if (request.target === "codex") {
    return buildCodexConfig(request);
  }
  if (request.target === "cursor") {
    return buildCursorConfig(request);
  }
  if (request.target === "claude-desktop") {
    return buildClaudeConfig(request);
  }
  return buildAntigravityConfig(request);
};
```

Create `packages/core/src/config/targets/codex.ts`:

```ts
import { stringify } from "smol-toml";
import { commandForServer, serverConfigName, type InitPreview, type InitRequest } from "../init.js";

export const buildCodexConfig = (request: InitRequest): InitPreview => {
  const command = commandForServer(request);
  const name = serverConfigName(request).replaceAll("-", "_");
  const path = request.scope === "project" ? ".codex/config.toml" : "~/.codex/config.toml";
  const content = stringify({
    mcp_servers: {
      [name]: {
        command: command.command,
        args: command.args,
        env_vars: request.server.requiredEnv ?? [],
        startup_timeout_sec: 20,
        tool_timeout_sec: 60
      }
    }
  });

  return { path, content };
};
```

Create `packages/core/src/config/targets/cursor.ts`:

```ts
import { commandForServer, serverConfigName, type InitPreview, type InitRequest } from "../init.js";

export const buildCursorConfig = (request: InitRequest): InitPreview => {
  const command = commandForServer(request);
  const path = request.scope === "project" ? ".cursor/mcp.json" : "~/.cursor/mcp.json";
  const env = Object.fromEntries((request.server.requiredEnv ?? []).map((key) => [key, `\${${key}}`]));
  const content = JSON.stringify(
    {
      mcpServers: {
        [serverConfigName(request.server)]: {
          command: command.command,
          args: command.args,
          env
        }
      }
    },
    null,
    2
  );

  return { path, content };
};
```

Create `packages/core/src/config/targets/claude.ts`:

```ts
import { commandForServer, serverConfigName, type InitPreview, type InitRequest } from "../init.js";

export const buildClaudeConfig = (request: InitRequest): InitPreview => {
  const command = commandForServer(request);
  const env = Object.fromEntries((request.server.requiredEnv ?? []).map((key) => [key, `\${${key}}`]));
  const content = JSON.stringify(
    {
      mcpServers: {
        [serverConfigName(request.server)]: {
          command: command.command,
          args: command.args,
          env
        }
      }
    },
    null,
    2
  );

  return {
    path: "claude_desktop_config.json",
    content
  };
};
```

Create `packages/core/src/config/targets/antigravity.ts`:

```ts
import { commandForServer, serverConfigName, type InitPreview, type InitRequest } from "../init.js";

export const buildAntigravityConfig = (request: InitRequest): InitPreview => {
  const command = commandForServer(request);
  const env = Object.fromEntries((request.server.requiredEnv ?? []).map((key) => [key, `\${${key}}`]));
  const content = JSON.stringify(
    {
      mcpServers: {
        [serverConfigName(request.server)]: {
          command: command.command,
          args: command.args,
          env
        }
      }
    },
    null,
    2
  );

  return {
    path: request.scope === "project" ? ".agents/settings.json" : "~/.gemini/config/mcp_config.json",
    content
  };
};
```

Modify `packages/core/src/index.ts`:

```ts
export * from "./config/init.js";
export * from "./create-server.js";
export * from "./http/auth.js";
export * from "./http/streamable-http-app.js";
export * from "./logger.js";
export * from "./registry.js";
export * from "./server-definition.js";
export * from "./transports/stdio.js";
```

- [ ] **Step 4: CLI init command 작성**

Create `packages/cli/src/commands/init.ts`:

```ts
import { buildInitPreview, type InitScope, type InitTarget, type ServerRegistry } from "@mcp-hub/core";

const readOption = (args: string[], name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

export const runInitCommand = (
  registry: ServerRegistry,
  args: string[],
  stdout: Pick<typeof console, "log"> = console
) => {
  const target = readOption(args, "--target") as InitTarget | undefined;
  const serverId = readOption(args, "--server");
  const scope = (readOption(args, "--scope") ?? "project") as InitScope;
  const write = args.includes("--write");

  if (!target || !serverId) {
    throw new Error("Usage: mcp-hub init --target <target> --server <server-id> [--scope project|user] [--write]");
  }

  const preview = buildInitPreview({
    target,
    scope,
    server: registry.get(serverId),
    commandMode: "npx",
    packageName: "mcp-hub"
  });

  if (write) {
    throw new Error("init --write file merging is implemented after preview generation tests pass");
  }

  stdout.log(`# ${preview.path}`);
  stdout.log(preview.content);
};
```

Modify `packages/cli/src/index.ts`:

```ts
#!/usr/bin/env node
import { runInitCommand } from "./commands/init.js";
import { runListCommand } from "./commands/list.js";
import { runServeCommand } from "./commands/serve.js";
import { runStdioCommand } from "./commands/stdio.js";
import { serverRegistry } from "./server-registry.js";

const [, , command, ...args] = process.argv;

const main = async () => {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.error("Usage: mcp-hub <init|list|stdio|serve> [args]");
    return;
  }

  if (command === "init") {
    runInitCommand(serverRegistry, args);
    return;
  }

  if (command === "list") {
    runListCommand(serverRegistry);
    return;
  }

  if (command === "stdio") {
    await runStdioCommand(serverRegistry, args);
    return;
  }

  if (command === "serve") {
    await runServeCommand(serverRegistry, args);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
```

- [ ] **Step 5: 테스트와 preview 확인**

Run:

```bash
npm test -- packages/core/src/config/init.test.ts
npm run build
node packages/cli/dist/index.js init --target codex --server shortcuts --scope project
```

Expected: tests PASS and preview prints `.codex/config.toml`.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/cli
git commit -m "feat: add mcp client config previews"
```

---

### Task 6: API Finder 서버를 공식 SDK 패키지로 이전

**Files:**
- Create: `packages/servers/api-finder/package.json`
- Create: `packages/servers/api-finder/tsconfig.json`
- Create: `packages/servers/api-finder/src/services/public-data-api.ts`
- Create: `packages/servers/api-finder/src/tools.ts`
- Create: `packages/servers/api-finder/src/index.ts`
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/tsconfig.json`
- Modify: `packages/cli/src/server-registry.ts`
- Test: `packages/servers/api-finder/src/services/public-data-api.test.ts`

**Interfaces:**
- Consumes: `ServerDefinition`.
- Produces: `apiFinderServer: ServerDefinition`.

- [ ] **Step 1: 실패하는 service 테스트 작성**

Create `packages/servers/api-finder/src/services/public-data-api.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractSwaggerSpecReference, parseSearchResults } from "./public-data-api.js";

describe("public-data-api service", () => {
  it("parses public data search results", () => {
    const parsed = parseSearchResults({
      result: {
        data: [
          {
            dataName: "기상청_단기예보 조회서비스",
            dataDescription: "동네예보 정보 조회",
            dataType: "REST",
            extension: "JSON",
            organization: "기상청",
            detailPageUrl: "https://www.data.go.kr/data/15084084/openapi.do"
          }
        ]
      }
    });

    expect(parsed[0]).toEqual({
      name: "기상청_단기예보 조회서비스",
      description: "동네예보 정보 조회",
      dataType: "REST",
      extension: "JSON",
      provider: "기상청",
      url: "https://www.data.go.kr/data/15084084/openapi.do",
      api_id: "15084084/openapi.do"
    });
  });

  it("extracts inline swagger json", () => {
    const reference = extractSwaggerSpecReference('var swaggerJson = {"openapi":"3.0.0"};');
    expect(reference).toEqual({
      type: "json",
      value: { openapi: "3.0.0" }
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
npm test -- packages/servers/api-finder/src/services/public-data-api.test.ts
```

Expected: FAIL because package files do not exist.

- [ ] **Step 3: API Finder package 작성**

Create `packages/servers/api-finder/package.json`:

```json
{
  "name": "@mcp-hub/server-api-finder",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@mcp-hub/core": "0.1.0",
    "axios": "^1.10.0",
    "zod": "^3.23.8"
  }
}
```

Create `packages/servers/api-finder/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "references": [{ "path": "../../core" }],
  "include": ["src/**/*.ts"]
}
```

Create `packages/servers/api-finder/src/services/public-data-api.ts`:

```ts
import axios from "axios";

export type PublicDataSearchResult = {
  name: string;
  description: string;
  dataType: string;
  extension: string;
  provider: string;
  url: string;
  api_id: string;
};

export type SwaggerReference =
  | { type: "json"; value: unknown }
  | { type: "url"; value: string };

const detailPathFromUrl = (url: string) => {
  const match = url.match(/data\/(.+)$/);
  return match?.[1] ?? url;
};

export const parseSearchResults = (body: unknown): PublicDataSearchResult[] => {
  const data = (body as { result?: { data?: unknown[] } }).result?.data;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((api) => {
    const item = api as Record<string, string | undefined>;
    const url = item.detailPageUrl || "(링크 없음)";
    return {
      name: item.dataName || "(이름 없음)",
      description: item.dataDescription || "(설명 없음)",
      dataType: item.dataType || "(알수 없음)",
      extension: item.extension || "(미제공)",
      provider: item.organization || "(제공기관 없음)",
      url,
      api_id: detailPathFromUrl(url)
    };
  });
};

export const extractSwaggerSpecReference = (htmlContent: string): SwaggerReference => {
  const jsonMatch = htmlContent.match(/var swaggerJson = (\{.*?\});/s);
  if (jsonMatch?.[1]) {
    return {
      type: "json",
      value: JSON.parse(jsonMatch[1])
    };
  }

  const urlMatch =
    htmlContent.match(/var swaggerUrl = ['"](.*?)['"];/) ??
    htmlContent.match(/SwaggerUIBundle\(\{[\s\S]*?url: ['"](.*?)['"]/);

  if (urlMatch?.[1]) {
    return {
      type: "url",
      value: urlMatch[1]
    };
  }

  throw new Error("Could not find Swagger/OpenAPI specification on the detail page.");
};

export const searchPublicDataApis = async (params: {
  apiKey: string;
  keywords: string[];
}) => {
  const response = await axios.post(
    "https://api.odcloud.kr/api/GetSearchDataList/v1/searchData",
    {
      keyword: params.keywords.join(" "),
      page: 1,
      size: 10
    },
    {
      params: { serviceKey: params.apiKey },
      headers: { "Content-Type": "application/json" }
    }
  );

  return parseSearchResults(response.data);
};

export const getPublicDataApiDetails = async (apiId: string) => {
  const detailPageUrl = `https://www.data.go.kr/data/${apiId}`;
  const response = await axios.get(detailPageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
    }
  });
  const reference = extractSwaggerSpecReference(String(response.data));

  if (reference.type === "json") {
    return reference.value;
  }

  const specResponse = await axios.get(reference.value);
  return specResponse.data;
};
```

Create `packages/servers/api-finder/src/tools.ts`:

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPublicDataApiDetails, searchPublicDataApis } from "./services/public-data-api.js";

const searchParameters = z.object({
  service_description: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1)
});

const detailsParameters = z.object({
  api_id: z.string().min(1)
});

export const registerApiFinderTools = (server: McpServer, env: NodeJS.ProcessEnv) => {
  server.tool(
    "searchPublicDataAPI",
    "Search data.go.kr public APIs for a service idea and keywords.",
    searchParameters.shape,
    async ({ keywords }: z.infer<typeof searchParameters>) => {
      const apiKey = env.PUBLIC_DATA_API_KEY;
      if (!apiKey) {
        throw new Error("PUBLIC_DATA_API_KEY is required.");
      }

      const results = await searchPublicDataApis({ apiKey, keywords });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        structuredContent: { results }
      };
    }
  );

  server.tool(
    "getPublicDataAPIDetails",
    "Fetch the Swagger/OpenAPI specification for a selected public API.",
    detailsParameters.shape,
    async ({ api_id }: z.infer<typeof detailsParameters>) => {
      const spec = await getPublicDataApiDetails(api_id);
      return {
        content: [{ type: "text", text: JSON.stringify(spec, null, 2) }],
        structuredContent: { spec }
      };
    }
  );
};
```

Create `packages/servers/api-finder/src/index.ts`:

```ts
import type { ServerDefinition } from "@mcp-hub/core";
import { registerApiFinderTools } from "./tools.js";

export const apiFinderServer: ServerDefinition = {
  id: "api-finder",
  displayName: "Public Data API Finder MCP",
  version: "0.1.0",
  requiredEnv: ["PUBLIC_DATA_API_KEY"],
  registerTools: (server, context) => {
    registerApiFinderTools(server, context.env);
  }
};
```

- [ ] **Step 4: CLI registry에 api-finder 추가**

Modify `packages/cli/package.json` dependencies:

```json
{
  "dependencies": {
    "@mcp-hub/core": "0.1.0",
    "@mcp-hub/server-api-finder": "0.1.0",
    "@mcp-hub/server-shortcuts": "0.1.0"
  }
}
```

Modify `packages/cli/tsconfig.json` references:

```json
{
  "references": [
    { "path": "../core" },
    { "path": "../servers/api-finder" },
    { "path": "../servers/shortcuts" }
  ]
}
```

Modify `packages/cli/src/server-registry.ts`:

```ts
import { createRegistry } from "@mcp-hub/core";
import { apiFinderServer } from "@mcp-hub/server-api-finder";
import { shortcutsServer } from "@mcp-hub/server-shortcuts";

export const serverRegistry = createRegistry([apiFinderServer, shortcutsServer]);
```

- [ ] **Step 5: 테스트와 빌드 확인**

Run:

```bash
npm install
npm test -- packages/servers/api-finder/src/services/public-data-api.test.ts
npm run build
node packages/cli/dist/index.js list
```

Expected: PASS and list output includes `api-finder`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json packages/servers/api-finder packages/cli
git commit -m "feat: migrate api finder server package"
```

---

### Task 7: Postgres MCP TypeScript 마이그레이션

**Files:**
- Create: `packages/servers/postgres/package.json`
- Create: `packages/servers/postgres/tsconfig.json`
- Create: `packages/servers/postgres/src/config.ts`
- Create: `packages/servers/postgres/src/sql-safety.ts`
- Create: `packages/servers/postgres/src/db.ts`
- Create: `packages/servers/postgres/src/tools.ts`
- Create: `packages/servers/postgres/src/index.ts`
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/tsconfig.json`
- Modify: `packages/cli/src/server-registry.ts`
- Test: `packages/servers/postgres/src/config.test.ts`
- Test: `packages/servers/postgres/src/sql-safety.test.ts`

**Interfaces:**
- Consumes: `ServerDefinition`.
- Produces: `postgresServer: ServerDefinition`, `loadPostgresConfig()`, `validateReadOnlySql()`.

- [ ] **Step 1: 실패하는 config와 SQL safety 테스트 작성**

Create `packages/servers/postgres/src/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./config.js";

describe("loadPostgresConfig", () => {
  it("loads defaults", () => {
    const config = loadPostgresConfig({
      DATABASE_URL: "postgresql://readonly:pw@localhost:5432/app"
    });

    expect(config).toEqual({
      databaseUrl: "postgresql://readonly:pw@localhost:5432/app",
      allowedSchemas: ["public"],
      maxRows: 500,
      queryTimeoutMs: 10000,
      poolMax: 5
    });
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => loadPostgresConfig({})).toThrow("DATABASE_URL is required");
  });
});
```

Create `packages/servers/postgres/src/sql-safety.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateReadOnlySql, withMaxRowsLimit } from "./sql-safety.js";

describe("validateReadOnlySql", () => {
  it("allows SELECT statements", () => {
    expect(() => validateReadOnlySql("select * from users")).not.toThrow();
  });

  it("allows WITH statements without dangerous keywords", () => {
    expect(() => validateReadOnlySql("with active as (select * from users) select * from active")).not.toThrow();
  });

  it("rejects dangerous keywords", () => {
    expect(() => validateReadOnlySql("select * from users; drop table users")).toThrow("Unsafe SQL keyword detected: DROP");
  });

  it("rejects multiple statements", () => {
    expect(() => validateReadOnlySql("select 1; select 2")).toThrow("Only one SQL statement is allowed");
  });

  it("rejects non-read statements", () => {
    expect(() => validateReadOnlySql("show search_path")).toThrow("Only SELECT, WITH, and EXPLAIN statements are allowed");
  });
});

describe("withMaxRowsLimit", () => {
  it("wraps query with max rows limit", () => {
    expect(withMaxRowsLimit("select * from users", 500)).toBe("select * from (select * from users) as mcp_limited_query limit 500");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
npm test -- packages/servers/postgres/src/config.test.ts packages/servers/postgres/src/sql-safety.test.ts
```

Expected: FAIL because postgres package files do not exist.

- [ ] **Step 3: postgres package와 안전 모듈 작성**

Create `packages/servers/postgres/package.json`:

```json
{
  "name": "@mcp-hub/server-postgres",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@mcp-hub/core": "0.1.0",
    "pg": "^8.12.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/pg": "^8.11.6"
  }
}
```

Create `packages/servers/postgres/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "references": [{ "path": "../../core" }],
  "include": ["src/**/*.ts"]
}
```

Create `packages/servers/postgres/src/config.ts`:

```ts
export type PostgresConfig = {
  databaseUrl: string;
  allowedSchemas: string[];
  maxRows: number;
  queryTimeoutMs: number;
  poolMax: number;
};

const parsePositiveInteger = (value: string | undefined, fallback: number, name: string) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

export const loadPostgresConfig = (env: NodeJS.ProcessEnv): PostgresConfig => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  return {
    databaseUrl: env.DATABASE_URL,
    allowedSchemas: (env.ALLOWED_SCHEMAS ?? "public")
      .split(",")
      .map((schema) => schema.trim())
      .filter(Boolean),
    maxRows: parsePositiveInteger(env.MAX_ROWS, 500, "MAX_ROWS"),
    queryTimeoutMs: parsePositiveInteger(env.QUERY_TIMEOUT_MS, 10000, "QUERY_TIMEOUT_MS"),
    poolMax: parsePositiveInteger(env.PG_POOL_MAX, 5, "PG_POOL_MAX")
  };
};
```

Create `packages/servers/postgres/src/sql-safety.ts`:

```ts
const DANGEROUS_PATTERN =
  /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|GRANT|REVOKE|COPY|EXECUTE|DO|CALL|SET\s+ROLE|SET\s+SESSION)\b/i;

const stripTrailingSemicolon = (sql: string) => sql.trim().replace(/;$/, "").trim();

export const validateReadOnlySql = (sql: string) => {
  const normalized = stripTrailingSemicolon(sql);
  if (!normalized) {
    throw new Error("SQL must not be empty");
  }

  if (normalized.includes(";")) {
    throw new Error("Only one SQL statement is allowed");
  }

  const dangerousMatch = normalized.match(DANGEROUS_PATTERN);
  if (dangerousMatch) {
    throw new Error(`Unsafe SQL keyword detected: ${dangerousMatch[1].toUpperCase()}`);
  }

  if (!/^(select|with|explain)\b/i.test(normalized)) {
    throw new Error("Only SELECT, WITH, and EXPLAIN statements are allowed");
  }

  if (/^explain\b/i.test(normalized) && /\banalyze\b/i.test(normalized)) {
    throw new Error("EXPLAIN ANALYZE is not allowed");
  }
};

export const withMaxRowsLimit = (sql: string, maxRows: number) => {
  const normalized = stripTrailingSemicolon(sql);
  return `select * from (${normalized}) as mcp_limited_query limit ${maxRows}`;
};
```

- [ ] **Step 4: DB와 tools 작성**

Create `packages/servers/postgres/src/db.ts`:

```ts
import pg from "pg";
import type { PostgresConfig } from "./config.js";
import { validateReadOnlySql, withMaxRowsLimit } from "./sql-safety.js";

const { Pool } = pg;

export type PostgresDatabase = ReturnType<typeof createPostgresDatabase>;

export const createPostgresDatabase = (config: PostgresConfig) => {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: config.poolMax
  });

  const query = async <T extends Record<string, unknown>>(sql: string, params: unknown[] = []) => {
    const result = await pool.query<T>(sql, params);
    return result.rows;
  };

  return {
    close: async () => {
      await pool.end();
    },
    listTables: async (schema: string) =>
      query(
        `
          select table_name, table_type
          from information_schema.tables
          where table_schema = $1
          order by table_name
        `,
        [schema]
      ),
    describeTable: async (schema: string, tableName: string) =>
      query(
        `
          select column_name, data_type, is_nullable, column_default
          from information_schema.columns
          where table_schema = $1 and table_name = $2
          order by ordinal_position
        `,
        [schema, tableName]
      ),
    getForeignKeys: async (schema: string, tableName: string) =>
      query(
        `
          select
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema as foreign_table_schema,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name
          from information_schema.table_constraints tc
          join information_schema.key_column_usage kcu
            on tc.constraint_name = kcu.constraint_name
            and tc.table_schema = kcu.table_schema
          join information_schema.constraint_column_usage ccu
            on ccu.constraint_name = tc.constraint_name
            and ccu.table_schema = tc.table_schema
          where tc.constraint_type = 'FOREIGN KEY'
            and tc.table_schema = $1
            and tc.table_name = $2
          order by tc.constraint_name, kcu.column_name
        `,
        [schema, tableName]
      ),
    getTableStats: async (schema: string, tableName: string) =>
      query(
        `
          select
            pg_stat.n_live_tup as live_rows,
            pg_stat.n_dead_tup as dead_rows,
            pg_stat.last_vacuum,
            pg_stat.last_autovacuum,
            pg_stat.last_analyze,
            pg_stat.last_autoanalyze,
            pg_size_pretty(pg_total_relation_size((quote_ident($1) || '.' || quote_ident($2))::regclass)) as total_size,
            pg_size_pretty(pg_table_size((quote_ident($1) || '.' || quote_ident($2))::regclass)) as table_size,
            pg_size_pretty(pg_indexes_size((quote_ident($1) || '.' || quote_ident($2))::regclass)) as indexes_size
          from pg_stat_user_tables pg_stat
          where pg_stat.schemaname = $1 and pg_stat.relname = $2
        `,
        [schema, tableName]
      ),
    runReadOnlyQuery: async (sql: string) => {
      validateReadOnlySql(sql);
      const client = await pool.connect();
      try {
        await client.query("begin read only");
        await client.query(`set local statement_timeout = ${config.queryTimeoutMs}`);
        const result = await client.query(withMaxRowsLimit(sql, config.maxRows));
        await client.query("commit");
        return result.rows;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
    explainQuery: async (sql: string) => {
      validateReadOnlySql(sql);
      return query(`explain (format json, analyze false) ${sql}`);
    }
  };
};
```

Create `packages/servers/postgres/src/tools.ts`:

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PostgresConfig } from "./config.js";
import type { PostgresDatabase } from "./db.js";

const schemaParameter = z.object({
  schema: z.string().min(1).optional()
});

const tableParameter = z.object({
  schema: z.string().min(1).optional(),
  table_name: z.string().min(1)
});

const queryParameter = z.object({
  sql: z.string().min(1)
});

const validateSchema = (schema: string, config: PostgresConfig) => {
  if (!config.allowedSchemas.includes(schema)) {
    throw new Error(`Schema "${schema}" is not allowed. Allowed schemas: ${config.allowedSchemas.join(", ")}`);
  }
};

const jsonText = (value: unknown) => JSON.stringify(value, null, 2);

export const registerPostgresTools = (
  server: McpServer,
  db: PostgresDatabase,
  config: PostgresConfig
) => {
  server.tool("list_tables", "List tables in an allowed PostgreSQL schema.", schemaParameter.shape, async ({ schema = "public" }) => {
    validateSchema(schema, config);
    const tables = await db.listTables(schema);
    return {
      content: [{ type: "text", text: jsonText({ schema, table_count: tables.length, tables }) }],
      structuredContent: { schema, table_count: tables.length, tables }
    };
  });

  server.tool("describe_table", "Describe columns for a PostgreSQL table.", tableParameter.shape, async ({ schema = "public", table_name }) => {
    validateSchema(schema, config);
    const columns = await db.describeTable(schema, table_name);
    return {
      content: [{ type: "text", text: jsonText({ table: `${schema}.${table_name}`, columns }) }],
      structuredContent: { table: `${schema}.${table_name}`, columns }
    };
  });

  server.tool("run_query", "Run a read-only SQL query.", queryParameter.shape, async ({ sql }) => {
    const rows = await db.runReadOnlyQuery(sql);
    return {
      content: [{ type: "text", text: jsonText({ row_count: rows.length, max_rows: config.maxRows, rows }) }],
      structuredContent: { row_count: rows.length, max_rows: config.maxRows, rows }
    };
  });

  server.tool("get_foreign_keys", "List foreign keys for a PostgreSQL table.", tableParameter.shape, async ({ schema = "public", table_name }) => {
    validateSchema(schema, config);
    const foreign_keys = await db.getForeignKeys(schema, table_name);
    return {
      content: [{ type: "text", text: jsonText({ table: `${schema}.${table_name}`, foreign_keys }) }],
      structuredContent: { table: `${schema}.${table_name}`, foreign_keys }
    };
  });

  server.tool("explain_query", "Return EXPLAIN JSON for a read-only SQL query.", queryParameter.shape, async ({ sql }) => {
    const plan = await db.explainQuery(sql);
    return {
      content: [{ type: "text", text: jsonText(plan) }],
      structuredContent: { plan }
    };
  });

  server.tool("get_table_stats", "Return PostgreSQL table statistics.", tableParameter.shape, async ({ schema = "public", table_name }) => {
    validateSchema(schema, config);
    const stats = await db.getTableStats(schema, table_name);
    return {
      content: [{ type: "text", text: jsonText({ table: `${schema}.${table_name}`, stats }) }],
      structuredContent: { table: `${schema}.${table_name}`, stats }
    };
  });
};
```

Create `packages/servers/postgres/src/index.ts`:

```ts
import type { ServerDefinition } from "@mcp-hub/core";
import { loadPostgresConfig } from "./config.js";
import { createPostgresDatabase } from "./db.js";
import { registerPostgresTools } from "./tools.js";

export const postgresServer: ServerDefinition = {
  id: "postgres",
  displayName: "PostgreSQL MCP",
  version: "0.1.0",
  requiredEnv: ["DATABASE_URL"],
  registerTools: (server, context) => {
    const config = loadPostgresConfig(context.env);
    const db = createPostgresDatabase(config);
    registerPostgresTools(server, db, config);
  }
};
```

- [ ] **Step 5: CLI registry에 postgres 추가**

Modify `packages/cli/package.json` dependencies:

```json
{
  "dependencies": {
    "@mcp-hub/core": "0.1.0",
    "@mcp-hub/server-api-finder": "0.1.0",
    "@mcp-hub/server-postgres": "0.1.0",
    "@mcp-hub/server-shortcuts": "0.1.0"
  }
}
```

Modify `packages/cli/tsconfig.json` references:

```json
{
  "references": [
    { "path": "../core" },
    { "path": "../servers/api-finder" },
    { "path": "../servers/postgres" },
    { "path": "../servers/shortcuts" }
  ]
}
```

Modify `packages/cli/src/server-registry.ts`:

```ts
import { createRegistry } from "@mcp-hub/core";
import { apiFinderServer } from "@mcp-hub/server-api-finder";
import { postgresServer } from "@mcp-hub/server-postgres";
import { shortcutsServer } from "@mcp-hub/server-shortcuts";

export const serverRegistry = createRegistry([
  apiFinderServer,
  shortcutsServer,
  postgresServer
]);
```

- [ ] **Step 6: 테스트와 빌드 확인**

Run:

```bash
npm install
npm test -- packages/servers/postgres/src/config.test.ts packages/servers/postgres/src/sql-safety.test.ts
npm run build
node packages/cli/dist/index.js list
```

Expected: PASS and list output includes `postgres` with `DATABASE_URL`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json packages/servers/postgres packages/cli
git commit -m "feat: migrate postgres mcp to typescript"
```

---

### Task 8: 문서, legacy 보존, 전체 검증

**Files:**
- Modify: `README.md`
- Create: `examples/codex-postgres.config.toml`
- Create: `examples/cursor-shortcuts.mcp.json`
- Create: `examples/claude-api-finder.json`
- Create: `examples/antigravity-postgres.mcp.json`
- Move: `api-finder-mcp/` to `legacy/api-finder-mcp/`
- Move: `shortcut-mcp/` to `legacy/shortcut-mcp/`
- Move: `database/pg-mcp/` to `legacy/database/pg-mcp/`

**Interfaces:**
- Consumes: built CLI from earlier tasks.
- Produces: migration-complete repo layout and usage docs.

- [ ] **Step 1: 전체 상태 확인**

Run:

```bash
git status --short
```

Expected: only intentional changes from completed tasks remain. `.env` files must not be staged.

- [ ] **Step 2: legacy 이동**

Run:

```bash
mkdir -p legacy/database
git mv api-finder-mcp legacy/api-finder-mcp
git mv shortcut-mcp legacy/shortcut-mcp
git mv database/pg-mcp legacy/database/pg-mcp
```

Expected: existing source history is preserved by `git mv`. If `database/pg-mcp/.env` exists, leave it untracked and remove it from staging with `git restore --staged database/pg-mcp/.env legacy/database/pg-mcp/.env`.

- [ ] **Step 3: README 갱신**

Replace `README.md` with:

```md
# MCP Hub

Node/TypeScript 공식 MCP SDK 기반의 로컬 및 remote MCP 서버 허브입니다.

## 서버

| id | 설명 |
| --- | --- |
| `api-finder` | data.go.kr 공공데이터 API 검색과 Swagger/OpenAPI 명세 조회 |
| `shortcuts` | macOS/Windows 단축키 카테고리와 검색 |
| `postgres` | PostgreSQL 읽기 전용 introspection과 쿼리 실행 |

## 설치

```bash
npm install
npm run build
```

## 로컬 stdio 실행

```bash
node packages/cli/dist/index.js list
node packages/cli/dist/index.js stdio shortcuts
node packages/cli/dist/index.js stdio postgres
```

npm 배포 후 프로젝트별 MCP 설정에는 다음 형태를 권장합니다.

```json
{
  "command": "npx",
  "args": ["-y", "mcp-hub", "stdio", "postgres"]
}
```

## Streamable HTTP 실행

```bash
node packages/cli/dist/index.js serve shortcuts --port 3333
node packages/cli/dist/index.js serve all --port 3333
```

`serve all`은 서버별 endpoint를 제공합니다.

```text
/mcp/api-finder
/mcp/shortcuts
/mcp/postgres
```

## 설정 preview

```bash
node packages/cli/dist/index.js init --target codex --server postgres --scope project
node packages/cli/dist/index.js init --target cursor --server shortcuts --scope project
node packages/cli/dist/index.js init --target claude-desktop --server api-finder --scope user
node packages/cli/dist/index.js init --target antigravity --server postgres --scope user
```

`init`은 기본적으로 preview만 출력합니다. 파일 쓰기는 `--write`에서 지원합니다.

## Postgres 환경 변수

```text
DATABASE_URL=postgresql://readonly:password@localhost:5432/app
ALLOWED_SCHEMAS=public
MAX_ROWS=500
QUERY_TIMEOUT_MS=10000
PG_POOL_MAX=5
```

읽기 전용 DB 계정을 사용하세요.
```

- [ ] **Step 4: examples 작성**

Create `examples/codex-postgres.config.toml`:

```toml
[mcp_servers.mcp_hub_postgres]
command = "npx"
args = ["-y", "mcp-hub", "stdio", "postgres"]
env_vars = ["DATABASE_URL"]
startup_timeout_sec = 20
tool_timeout_sec = 60
```

Create `examples/cursor-shortcuts.mcp.json`:

```json
{
  "mcpServers": {
    "mcp-hub-shortcuts": {
      "command": "npx",
      "args": ["-y", "mcp-hub", "stdio", "shortcuts"],
      "env": {}
    }
  }
}
```

Create `examples/claude-api-finder.json`:

```json
{
  "mcpServers": {
    "mcp-hub-api-finder": {
      "command": "npx",
      "args": ["-y", "mcp-hub", "stdio", "api-finder"],
      "env": {
        "PUBLIC_DATA_API_KEY": "${PUBLIC_DATA_API_KEY}"
      }
    }
  }
}
```

Create `examples/antigravity-postgres.mcp.json`:

```json
{
  "mcpServers": {
    "mcp-hub-postgres": {
      "command": "npx",
      "args": ["-y", "mcp-hub", "stdio", "postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

- [ ] **Step 5: 전체 검증**

Run:

```bash
npm run build
npm run typecheck
npm run test
node packages/cli/dist/index.js list
node packages/cli/dist/index.js init --target codex --server postgres --scope project
```

Expected: all commands PASS. `list` shows `api-finder`, `shortcuts`, and `postgres`.

- [ ] **Step 6: HTTP smoke test**

Run:

```bash
node packages/cli/dist/index.js serve all --port 3333
```

In another terminal:

```bash
curl -s http://127.0.0.1:3333/health
curl -s http://127.0.0.1:3333/servers
```

Expected: health returns `{"ok":true}` and servers lists `/mcp/api-finder`, `/mcp/shortcuts`, `/mcp/postgres`.

- [ ] **Step 7: Commit**

```bash
git add README.md examples legacy package.json package-lock.json packages
git commit -m "docs: document mcp hub usage"
```

---

## Self-Review

### Spec Coverage

- Node/TypeScript 공식 SDK 통일: Task 1, Task 2, Task 6, Task 7.
- `mcp-hub` CLI 중심: Task 3, Task 4, Task 5.
- 로컬 stdio 실행: Task 3.
- Streamable HTTP remote server: Task 4.
- `serve all` 서버별 endpoint: Task 4.
- Claude Desktop, Codex, Cursor, Antigravity 설정 preview: Task 5.
- `pg-mcp` TypeScript 마이그레이션: Task 7.
- npm 중심 패키징: Task 1, Task 3, Task 8.
- legacy 보존: Task 8.
- 테스트와 검증: 각 task의 test/build/smoke step.

### Placeholder Scan

- 미확정 상태를 나타내는 빈 항목이나 임시 표기를 포함하지 않는다.
- 각 코드 변경 step은 생성 또는 수정할 파일 내용과 검증 명령을 포함한다.

### Type Consistency

- `ServerDefinition`, `ServerContext`, `ServerRegistry`는 Task 1에서 정의되고 이후 task에서 같은 이름으로 사용한다.
- `shortcutsServer`, `apiFinderServer`, `postgresServer`는 각각 서버 package의 public export로 정의하고 CLI registry에서 같은 이름으로 import한다.
- `createStreamableHttpApp()`은 Task 4에서 정의하고 `runServeCommand()`가 같은 signature로 사용한다.
