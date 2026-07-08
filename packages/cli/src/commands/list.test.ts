import type { ServerDefinition } from "@mcp-hub/core";
import { describe, expect, it } from "vitest";
import { formatServerList } from "./list.js";

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
