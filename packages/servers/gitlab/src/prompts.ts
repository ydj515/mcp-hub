import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerGitLabPrompts = (server: McpServer) => {
  server.registerPrompt(
    "prepare_mr_review",
    {
      title: "Prepare GitLab Merge Request Review",
      description:
        "Guide a structured review of one GitLab merge request using the read tools.",
      argsSchema: {
        project_id: z.string(),
        merge_request_iid: z.string()
      }
    },
    ({ project_id, merge_request_iid }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Prepare a review of GitLab merge request !${merge_request_iid} in project ${project_id}.`,
              "Use get_merge_request, list_commits, and get_pipeline_jobs",
              "to review the changes, commit history, and CI status, then summarize what to check before approving."
            ].join(" ")
          }
        }
      ]
    })
  );
};
