import cors from "cors";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import {
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  SetLevelRequestSchema,
  StreamableHTTPServerTransport,
  isInitializeRequest,
  McpServer
} from "./mcp/sdk.js";
import type { CreateMessageRequest, SetLevelRequest } from "./mcp/sdk.js";
import { registerShortcutTools } from "./mcp/tools.js";

type SessionEntry = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
};

const sessions = new Map<string, SessionEntry>();

function buildMcpServer() {
  const server = new McpServer(
    {
      name: "shortcut-mcp-server",
      version: "1.0.0"
    },
    {
      capabilities: {
        sampling: {},
        elicitation: {},
        logging: {}
      }
    }
  );

  registerShortcutTools(server);

  server.server.setRequestHandler(
    CreateMessageRequestSchema,
    async (request: CreateMessageRequest) => {
      const userText = request.params.messages
        .map((message: CreateMessageRequest["params"]["messages"][number]) =>
          message.content.type === "text" ? message.content.text : "[non-text]"
        )
        .join("\n\n");

      return {
        model: "shortcut-mcp-sampler",
        role: "assistant",
        stopReason: "endTurn",
        content: {
          type: "text",
          text: userText
            ? `Echoed by shortcut-mcp server:\n\n${userText}`
            : "No text content to echo."
        }
      };
    }
  );

  server.server.setRequestHandler(ElicitRequestSchema, async () => {
    return { action: "decline" } as const;
  });

  server.server.setRequestHandler(
    SetLevelRequestSchema,
    async (request: SetLevelRequest) => {
      const { level } = request.params;
      await server.server.sendLoggingMessage({
        level,
        logger: "shortcut-mcp-server",
        data: `Log level set to ${level}`
      });
      return {};
    }
  );

  return server;
}

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Mcp-Session-Id"],
    allowedHeaders: ["Content-Type", "mcp-session-id", "Mcp-Session-Id"]
  })
);

const getHeaderSessionId = (req: Request) =>
  req.header("mcp-session-id") ?? req.header("Mcp-Session-Id") ?? undefined;

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = getHeaderSessionId(req);
    let session = sessionId ? sessions.get(sessionId) : undefined;

    if (!session && isInitializeRequest(req.body)) {
      const server = buildMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId: string) => {
          sessions.set(newSessionId, { server, transport });
        },
        onsessionclosed: (closedSessionId: string) => {
          sessions.delete(closedSessionId);
        }
      });

      transport.onclose = async () => {
        if (transport.sessionId) {
          sessions.delete(transport.sessionId);
        }
        await server.close();
      };

      await server.connect(transport);

      session = { server, transport };
    }

    if (!session) {
      res.status(400).json({ error: "No valid session" });
      return;
    }

    await session.transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Failed to process MCP POST request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = getHeaderSessionId(req);

    if (!sessionId) {
      res.status(400).send("Missing session ID");
      return;
    }

    const session = sessions.get(sessionId);

    if (!session) {
      res.status(400).send("Invalid or expired session ID");
      return;
    }

    await session.transport.handleRequest(req, res);
  } catch (error) {
    console.error("Failed to process MCP GET request:", error);
    res.status(500).send("Internal server error");
  }
});

app.delete("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = getHeaderSessionId(req);

    if (!sessionId) {
      res.status(400).json({ error: "Missing session ID" });
      return;
    }

    const session = sessions.get(sessionId);

    if (!session) {
      res.status(400).json({ error: "Invalid or expired session ID" });
      return;
    }

    await session.transport.close();
    res.status(204).end();
  } catch (error) {
    console.error("Failed to process MCP DELETE request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);

app.listen(PORT, () => {
  // console.log(`Shortcut MCP server listening on port ${PORT}`);
});
