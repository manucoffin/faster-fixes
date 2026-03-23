import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FasterFixesClient } from "./api-client.js";

const token = process.env.FASTER_FIXES_TOKEN;
const project = process.env.FASTER_FIXES_PROJECT;
const baseUrl =
  process.env.FASTER_FIXES_URL ?? "https://faster-fixes.com";

if (!token) {
  process.stderr.write(
    "Error: FASTER_FIXES_TOKEN environment variable is required.\n",
  );
  process.exit(1);
}

if (!project) {
  process.stderr.write(
    "Error: FASTER_FIXES_PROJECT environment variable is required.\n",
  );
  process.exit(1);
}

const client = new FasterFixesClient(baseUrl, token, project);
const server = new McpServer({
  name: "faster-fixes",
  version: "0.0.1",
});

server.registerTool(
  "list_feedbacks",
  {
    title: "List Feedbacks",
    description:
      "List feedback items from Faster Fixes. Returns client feedback with page URL, CSS selector, click coordinates, viewport info, browser details, and screenshot. Use format=markdown for agent-readable output. Workflow: list feedbacks → fix the issues in code → update status to resolved.",
    inputSchema: {
      status: z
        .enum(["new", "in_progress", "resolved", "closed"])
        .optional()
        .describe("Filter by feedback status"),
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
      status: z
        .enum(["new", "in_progress", "resolved", "closed"])
        .describe("The new status"),
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

const transport = new StdioServerTransport();
await server.connect(transport);
