import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BASE_URL,
  PROJECT_ID,
  connectTools,
  fetchStub,
} from "../testing/connect-tools";
import { registerListFeedbacks } from "./list-feedbacks";

const LIST_PATH = `${BASE_URL}/api/v1/agent/feedbacks`;
const MARKDOWN =
  "# Feedback\n\n## 1. Save does nothing\n\n**Recording:** 12.4 s, 8 steps. Call `get_feedback` with `6f1c2a3b`.\n";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("list_feedbacks", () => {
  it("passes the markdown through unchanged", async () => {
    const fetchMock = vi.fn(
      fetchStub({
        [LIST_PATH]: () =>
          new Response(MARKDOWN, {
            headers: { "Content-Type": "text/markdown; charset=utf-8" },
          }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = await connectTools(registerListFeedbacks);

    const result = await client.callTool({
      name: "list_feedbacks",
      arguments: { status: "new" },
    });

    expect(result.content).toEqual([{ type: "text", text: MARKDOWN }]);
    const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get("project")).toBe(PROJECT_ID);
    expect(url.searchParams.get("status")).toBe("new");
    expect(url.searchParams.get("format")).toBe("markdown");
  });

  it("describes the Recording line and points to get_feedback", async () => {
    const client = await connectTools(registerListFeedbacks);

    const { tools } = await client.listTools();
    const description = tools.find(
      (t) => t.name === "list_feedbacks",
    )?.description;

    expect(description).toContain("Recording line");
    expect(description).toContain(
      "list feedbacks → get one in full with get_feedback → fix the issue in code → update status to resolved",
    );
  });

  it("turns an API error into an error result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        fetchStub({
          [LIST_PATH]: () =>
            Response.json(
              { error: "Insufficient scope", code: "FORBIDDEN" },
              { status: 403 },
            ),
        }),
      ),
    );
    const client = await connectTools(registerListFeedbacks);

    const result = await client.callTool({
      name: "list_feedbacks",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Error: Insufficient scope" },
    ]);
  });
});
