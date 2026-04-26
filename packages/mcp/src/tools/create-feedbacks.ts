import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FasterFixesClient } from "../api-client";
import { FeedbackItemSchema } from "../schemas";

export function registerCreateFeedbacks(
  server: McpServer,
  client: FasterFixesClient,
) {
  server.registerTool(
    "create_feedbacks",
    {
      title: "Create Feedbacks",
      description:
        'Create one or many feedback items in Faster Fixes. Use this to migrate existing feedback from another tool (BugHerd, Marker.io, Userback, Usersnap, etc.) by feeding parsed CSV/JSON exports. The batch is atomic and skips integration fan-out (no GitHub issues are auto-opened). Pass `source` (e.g. "bugherd") to tag the origin in metadata, and `reviewer_name` to group all imported items under a labelled reviewer.',
      inputSchema: {
        feedbacks: z
          .array(FeedbackItemSchema)
          .min(1)
          .max(100)
          .describe("Up to 100 feedback items to create in one call"),
        reviewer_name: z
          .string()
          .min(1)
          .max(100)
          .optional()
          .describe(
            "Name of the reviewer to attribute these feedbacks to. Reused if it already exists in the project; otherwise created. Defaults to 'Imported feedback'",
          ),
        source: z
          .string()
          .min(1)
          .max(50)
          .optional()
          .describe(
            "Origin tool identifier (e.g. 'bugherd', 'marker.io'). Stamped into each feedback's metadata for traceability",
          ),
      },
    },
    async ({ feedbacks, reviewer_name, source }) => {
      try {
        const result = await client.createFeedbacks({
          feedbacks,
          reviewerName: reviewer_name,
          source,
        });
        const summary = result.atLimit
          ? `Created ${result.created} feedback(s). Plan limit reached — stop further imports until the plan is upgraded.`
          : `Created ${result.created} feedback(s) under reviewer "${result.reviewer.name}".`;
        return {
          content: [
            { type: "text" as const, text: summary },
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
