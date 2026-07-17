import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const registerRedisPrompts = (server: McpServer) => {
  server.registerPrompt(
    "diagnose_instance",
    {
      title: "Diagnose Redis Instance",
      description:
        "Guide a read-only health check of the connected Redis instance using the read tools."
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Diagnose the connected Redis instance.",
              "Use get_server_info, get_database_size, get_slowlog, and get_topology_status",
              "to review memory, key counts, slow commands, and topology, then summarize health and risks."
            ].join(" ")
          }
        }
      ]
    })
  );
};
