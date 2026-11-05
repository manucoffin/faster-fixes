import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FasterFixesClient } from "../api-client";

export function registerListVideos(
  server: McpServer,
  client: FasterFixesClient,
) {
  server.registerTool(
    "list_videos",
    {
      title: "List Videos",
      description:
        "List the videos of the configured Faster Fixes project that are ready for review, newest first. Each video carries its id, title, filename, duration in milliseconds, pixel width and height, whether annotations are open, and its count of open feedback. Pass a video id to list_feedbacks as video_id to get that video's feedback. The video file itself is never returned.",
      inputSchema: {},
    },
    async () => {
      try {
        const result = await client.listVideos();
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
