import cors from "cors";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
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

export const createStreamableHttpApp = (
  options: CreateStreamableHttpAppOptions
) => {
  const env = options.env ?? process.env;
  const definitions = new Map(
    options.definitions.map((definition) => [definition.id, definition])
  );
  const sessions = new Map<string, Map<string, SessionEntry>>();
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: true,
      exposedHeaders: ["Mcp-Session-Id"],
      allowedHeaders: [
        "Content-Type",
        "mcp-session-id",
        "Mcp-Session-Id",
        "Authorization"
      ]
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

    const serverSessions =
      sessions.get(serverId) ?? new Map<string, SessionEntry>();
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
          error:
            error instanceof Error ? error.message : "Internal server error"
        });
      });
    });
  }

  if (options.exposeRootMcp && options.definitions.length === 1) {
    const [definition] = options.definitions;
    app.all("/mcp", (req, res) => {
      handleMcpRequest(definition.id, req, res).catch((error) => {
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Internal server error"
        });
      });
    });
  }

  return app;
};
