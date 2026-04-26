import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FasterFixesClient } from "../api-client";
import { FeedbackStatusEnum } from "../schemas";

export function registerUpdateFeedbackStatus(
  server: McpServer,
  client: FasterFixesClient,
) {
  server.registerTool(
    "update_feedback_status",
    {
      title: "Update Feedback Status",
      description:
        "Update the status of a feedback item. Use 'in_progress' when you start working on a fix, and 'resolved' when the fix is complete.",
      inputSchema: {
        feedback_id: z
          .string()
          .uuid()
          .describe("The feedback item ID to update"),
        status: FeedbackStatusEnum.describe("The new status"),
      },
    },
    async ({ feedback_id, status }) => {
      try {
        const result = await client.updateFeedbackStatus(feedback_id, status);
        return {
          content: [
            {
              type: "text" as const,
              text: `Feedback ${result.id} status updated to "${result.status}".`,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
