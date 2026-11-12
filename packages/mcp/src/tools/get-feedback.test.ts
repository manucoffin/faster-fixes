import { afterEach, describe, expect, it, vi } from "vitest";
import { BASE_URL, connectTools, fetchStub } from "../testing/connect-tools";
import { MAX_SCREENSHOT_BYTES, registerGetFeedback } from "./get-feedback";

const FEEDBACK_ID = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const FEEDBACK_PATH = `${BASE_URL}/api/v1/agent/feedbacks/${FEEDBACK_ID}`;
const SCREENSHOT_URL = "https://storage.test/screenshots/one.png";
const MARKDOWN = `# Feedback\n\n## Timeline\n\n-1.2 s  click button "Save"\n\n![Feedback screenshot](${SCREENSHOT_URL})\n`;
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

function feedbackJson(screenshotUrl: string | null) {
  return { id: FEEDBACK_ID, screenshotUrl, recording: null };
}

function apiRoute(screenshotUrl: string | null) {
  return (url: URL) =>
    url.searchParams.get("format") === "markdown"
      ? new Response(MARKDOWN, {
          headers: { "Content-Type": "text/markdown; charset=utf-8" },
        })
      : Response.json(feedbackJson(screenshotUrl));
}

async function callGetFeedback() {
  const client = await connectTools(registerGetFeedback);
  return client.callTool({
    name: "get_feedback",
    arguments: { feedback_id: FEEDBACK_ID },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("get_feedback", () => {
  it("returns the markdown and the Screenshot as an image", async () => {
    const fetchMock = vi.fn(
      fetchStub({
        [FEEDBACK_PATH]: apiRoute(SCREENSHOT_URL),
        [SCREENSHOT_URL]: () =>
          new Response(PNG_BYTES, { headers: { "Content-Type": "image/png" } }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await callGetFeedback();

    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([
      { type: "text", text: MARKDOWN },
      {
        type: "image",
        data: Buffer.from(PNG_BYTES).toString("base64"),
        mimeType: "image/png",
      },
    ]);
    expect(result).not.toHaveProperty("structuredContent");
  });

  it("sends the token to the API and not to the Screenshot's host", async () => {
    const fetchMock = vi.fn(
      fetchStub({
        [FEEDBACK_PATH]: apiRoute(SCREENSHOT_URL),
        [SCREENSHOT_URL]: () =>
          new Response(PNG_BYTES, { headers: { "Content-Type": "image/png" } }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await callGetFeedback();

    const authorizationOf = (url: string) => {
      const call = fetchMock.mock.calls.find(([input]) => input === url);
      return new Headers(call?.[1]?.headers).get("authorization");
    };
    expect(authorizationOf(`${FEEDBACK_PATH}?format=markdown`)).toBe(
      "Bearer test-token",
    );
    expect(authorizationOf(FEEDBACK_PATH)).toBe("Bearer test-token");
    expect(authorizationOf(SCREENSHOT_URL)).toBeNull();
  });

  it("returns the text alone when the Feedback has no Screenshot", async () => {
    const fetchMock = vi.fn(fetchStub({ [FEEDBACK_PATH]: apiRoute(null) }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await callGetFeedback();

    expect(result.content).toEqual([{ type: "text", text: MARKDOWN }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns the text alone when the download fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        fetchStub({
          [FEEDBACK_PATH]: apiRoute(SCREENSHOT_URL),
          [SCREENSHOT_URL]: () => new Response("Forbidden", { status: 403 }),
        }),
      ),
    );

    const result = await callGetFeedback();

    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([{ type: "text", text: MARKDOWN }]);
  });

  it("returns the text alone when the download throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        fetchStub({
          [FEEDBACK_PATH]: apiRoute(SCREENSHOT_URL),
          [SCREENSHOT_URL]: () => {
            throw new TypeError("fetch failed");
          },
        }),
      ),
    );

    const result = await callGetFeedback();

    expect(result.content).toEqual([{ type: "text", text: MARKDOWN }]);
  });

  it("returns the text alone when the image is over the size bound", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        fetchStub({
          [FEEDBACK_PATH]: apiRoute(SCREENSHOT_URL),
          [SCREENSHOT_URL]: () =>
            new Response(new Uint8Array(MAX_SCREENSHOT_BYTES + 1), {
              headers: { "Content-Type": "image/png" },
            }),
        }),
      ),
    );

    const result = await callGetFeedback();

    expect(result.content).toEqual([{ type: "text", text: MARKDOWN }]);
  });

  it("returns the text alone when the download is not an image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        fetchStub({
          [FEEDBACK_PATH]: apiRoute(SCREENSHOT_URL),
          [SCREENSHOT_URL]: () =>
            new Response("<html></html>", {
              headers: { "Content-Type": "text/html" },
            }),
        }),
      ),
    );

    const result = await callGetFeedback();

    expect(result.content).toEqual([{ type: "text", text: MARKDOWN }]);
  });

  it("turns a Feedback not found into an error result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        fetchStub({
          [FEEDBACK_PATH]: () =>
            Response.json(
              { error: "Feedback not found", code: "NOT_FOUND" },
              { status: 404 },
            ),
        }),
      ),
    );

    const result = await callGetFeedback();

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Error: Feedback not found" },
    ]);
  });

  it("turns an API error without a body into an error result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        fetchStub({
          [FEEDBACK_PATH]: () =>
            new Response(null, {
              status: 500,
              statusText: "Internal Server Error",
            }),
        }),
      ),
    );

    const result = await callGetFeedback();

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Error: API error: 500 Internal Server Error" },
    ]);
  });
});
