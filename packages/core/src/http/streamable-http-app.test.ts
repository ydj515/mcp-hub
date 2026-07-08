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
