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
