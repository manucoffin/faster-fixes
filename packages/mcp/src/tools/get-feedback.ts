import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FasterFixesClient } from "../api-client";

// Kept well under the 5 MB per image that model APIs accept once base64-encoded.
export const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024;
const SCREENSHOT_TIMEOUT_MS = 10_000;

export function registerGetFeedback(
  server: McpServer,
  client: FasterFixesClient,
) {
  server.registerTool(
    "get_feedback",
    {
      title: "Get Feedback",
      description:
        "Get one feedback item in full, as markdown, with its screenshot as an image. When the feedback has a recording, a Timeline section lists what the reviewer did before submitting (clicks, typing, navigations, scrolling), merged in time order with the console logs and network requests, and ends with the selected element. Works for page and video feedback alike. Use the feedback ID from list_feedbacks.",
      inputSchema: {
        feedback_id: z.string().uuid().describe("The feedback item ID"),
      },
    },
    // No `structuredContent`: at least one client drops images when it is present.
    async ({ feedback_id }) => {
      try {
        // Markdown first: it fills the steps cache, so the JSON request is cheap.
        const markdown = await client.getFeedbackMarkdown(feedback_id);
        const { screenshotUrl } = await client.getFeedback(feedback_id);
        const screenshot = screenshotUrl
          ? await downloadScreenshot(screenshotUrl)
          : null;

        const text = { type: "text" as const, text: markdown };
        if (!screenshot) return { content: [text] };
        return {
          content: [text, { type: "image" as const, ...screenshot }],
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

/** Null on any failure: the markdown still holds the Screenshot's link. */
async function downloadScreenshot(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(SCREENSHOT_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim();
    if (!mimeType?.startsWith("image/")) return null;

    // Checked before reading when announced, and again on the bytes.
    const announced = Number(res.headers.get("content-length"));
    if (announced > MAX_SCREENSHOT_BYTES) return null;

    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.byteLength > MAX_SCREENSHOT_BYTES) return null;

    return { data: bytes.toString("base64"), mimeType };
  } catch {
    return null;
  }
}
