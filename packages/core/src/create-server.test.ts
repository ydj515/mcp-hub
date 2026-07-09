import { describe, expect, it, vi } from "vitest";
import { createMcpServerFromDefinition } from "./create-server.js";
import type { ServerDefinition } from "./server-definition.js";

describe("createMcpServerFromDefinition", () => {
  it("runs registered cleanup callbacks when the server closes", async () => {
    const cleanup = vi.fn();
    const definition: ServerDefinition = {
      id: "fixture",
      displayName: "Fixture",
      version: "0.1.0",
      registerTools: (_server, context) => {
        context.onClose(cleanup);
      }
    };

    const server = await createMcpServerFromDefinition(definition, {
      env: {},
      mode: "http"
    });

    await server.close();
    await server.close();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("cleans up resources registered before setup fails", async () => {
    const cleanup = vi.fn();
    const definition: ServerDefinition = {
      id: "fixture",
      displayName: "Fixture",
      version: "0.1.0",
      registerTools: (_server, context) => {
        context.onClose(cleanup);
        throw new Error("setup failed");
      }
    };

    await expect(
      createMcpServerFromDefinition(definition, {
        env: {},
        mode: "http"
      })
    ).rejects.toThrow("setup failed");
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
