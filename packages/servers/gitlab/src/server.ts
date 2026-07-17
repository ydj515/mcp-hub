import type { ServerDefinition } from "@mcp-hub/core";
import { loadGitLabConfig } from "./config.js";
import { registerGitLabPrompts } from "./prompts.js";
import { createGitLabClient } from "./services/gitlab.js";
import { registerGitLabTools } from "./tools/index.js";

export const gitlabServer: ServerDefinition = {
  id: "gitlab",
  displayName: "GitLab MCP",
  version: "0.1.0",
  requiredEnv: ["GITLAB_TOKEN"],
  registerTools: (server, context) => {
    const config = loadGitLabConfig(context.env);
    const client = createGitLabClient(config);
    registerGitLabTools(server, client, config);
    registerGitLabPrompts(server);
  }
};
