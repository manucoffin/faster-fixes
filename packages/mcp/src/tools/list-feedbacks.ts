import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FasterFixesClient } from "../api-client";
import { FeedbackStatusEnum } from "../schemas";

export function registerListFeedbacks(
  server: McpServer,
  client: FasterFixesClient,
) {
  server.registerTool(
    "list_feedbacks",
    {
      title: "List Feedbacks",
      description:
        "List feedback items from Faster Fixes. Returns client feedback with page URL, CSS selector, click coordinates, viewport info, browser details, and screenshot. Use format=markdown for agent-readable output. Workflow: list feedbacks → fix the issues in code → update status to resolved.",
      inputSchema: {
        status: FeedbackStatusEnum.optional().describe(
          "Filter by feedback status",
        ),
        page_url: z
          .string()
          .url()
          .optional()
          .describe("Filter by the page URL where feedback was submitted"),
        format: z
          .enum(["json", "markdown"])
          .optional()
          .default("markdown")
          .describe("Response format. Use markdown for readable output"),
      },
    },
    async ({ status, page_url, format }) => {
      try {
        const result = await client.listFeedbacks({ status, page_url, format });

        if (typeof result === "string") {
          return { content: [{ type: "text" as const, text: result }] };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
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
