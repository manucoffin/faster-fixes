import { afterEach, describe, expect, it, vi } from "vitest";

import { FasterFixesClient } from "./client.js";

const client = new FasterFixesClient({
  apiKey: "project_key",
  apiOrigin: "https://api.test/",
});

function stubFetch(response: Response) {
  const fetchDouble = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchDouble);
  return fetchDouble;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FasterFixesClient.attachRecording", () => {
  it("puts the gzip file, its duration and its format version on the feedback", async () => {
    const fetchDouble = stubFetch(new Response(null, { status: 204 }));
    const recording = new Blob([new Uint8Array([0x1f, 0x8b, 8])], {
      type: "application/gzip",
    });

    await client.attachRecording(
      "feedback_1",
      recording,
      { durationMs: 42_000, formatVersion: 1 },
      "reviewer_token",
    );

    expect(fetchDouble).toHaveBeenCalledOnce();
    const [url, init] = fetchDouble.mock.calls[0]!;
    expect(url).toBe("https://api.test/api/v1/feedback/feedback_1/recording");
    expect(init?.method).toBe("PUT");
    expect(init?.headers).toEqual({
      "X-API-Key": "project_key",
      "X-Reviewer-Token": "reviewer_token",
    });

    const body = init?.body as FormData;
    const file = body.get("recording");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("recording.gz");
    expect(new Uint8Array(await (file as File).arrayBuffer())).toEqual(
      new Uint8Array([0x1f, 0x8b, 8]),
    );
    expect(body.get("durationMs")).toBe("42000");
    expect(body.get("formatVersion")).toBe("1");
  });

  it("rejects with the status when the server refuses the Recording", async () => {
    stubFetch(
      Response.json({ error: "Recording already attached" }, { status: 409 }),
    );

    await expect(
      client.attachRecording(
        "feedback_1",
        new Blob([]),
        { durationMs: 1_000, formatVersion: 1 },
        "reviewer_token",
      ),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "Recording already attached",
    });
  });
});

describe("FasterFixesClient.createFeedback", () => {
  it("sends the Recording declaration in the data field", async () => {
    const fetchDouble = stubFetch(Response.json({ id: "feedback_1" }));

    await client.createFeedback(
      {
        comment: "Menu closes too early",
        pageUrl: "https://site.test/",
        recordingFollows: true,
      },
      "reviewer_token",
    );

    const body = fetchDouble.mock.calls[0]![1]?.body as FormData;
    expect(JSON.parse(body.get("data") as string)).toMatchObject({
      recordingFollows: true,
    });
  });
});
