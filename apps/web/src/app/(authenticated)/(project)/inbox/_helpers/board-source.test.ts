import { describe, expect, it } from "vitest";
import {
  type BoardSource,
  matchesBoardSource,
  parseBoardSource,
  serializeBoardSource,
} from "./board-source";

describe("parseBoardSource and serializeBoardSource", () => {
  it.each<[string, BoardSource]>([
    ["pages", { kind: "pages" }],
    ["videos", { kind: "videos" }],
    [
      "page:https://example.com:8080/pricing?plan=pro&ref=a:b",
      {
        kind: "page",
        url: "https://example.com:8080/pricing?plan=pro&ref=a:b",
      },
    ],
    ["video:video_1", { kind: "video", videoId: "video_1" }],
  ])("round trips %s", (value, source) => {
    expect(parseBoardSource(value)).toEqual(source);
    expect(serializeBoardSource(source)).toBe(value);
  });

  it.each([null, "", "everything", "page:", "video:", "VIDEOS", "unknown:x"])(
    "parses %j to every source",
    (value) => {
      expect(parseBoardSource(value)).toEqual({ kind: "all" });
    },
  );

  it("serializes every source to no parameter", () => {
    expect(serializeBoardSource({ kind: "all" })).toBeNull();
  });
});

describe("matchesBoardSource", () => {
  const pageItem = { pageUrl: "https://example.com/a", videoId: null };
  const videoItem = { pageUrl: null, videoId: "video_1" };

  it("keeps every item for every source", () => {
    expect(matchesBoardSource(pageItem, { kind: "all" })).toBe(true);
    expect(matchesBoardSource(videoItem, { kind: "all" })).toBe(true);
  });

  it("keeps the items without a Video for all pages", () => {
    expect(matchesBoardSource(pageItem, { kind: "pages" })).toBe(true);
    expect(matchesBoardSource(videoItem, { kind: "pages" })).toBe(false);
  });

  it("keeps the items with a Video for all videos", () => {
    expect(matchesBoardSource(pageItem, { kind: "videos" })).toBe(false);
    expect(matchesBoardSource(videoItem, { kind: "videos" })).toBe(true);
  });

  it("matches one page by its URL", () => {
    const source: BoardSource = { kind: "page", url: "https://example.com/a" };
    expect(matchesBoardSource(pageItem, source)).toBe(true);
    expect(
      matchesBoardSource(
        { pageUrl: "https://example.com/b", videoId: null },
        source,
      ),
    ).toBe(false);
  });

  it("matches one Video by its id", () => {
    const source: BoardSource = { kind: "video", videoId: "video_1" };
    expect(matchesBoardSource(videoItem, source)).toBe(true);
    expect(
      matchesBoardSource({ pageUrl: null, videoId: "video_2" }, source),
    ).toBe(false);
    expect(matchesBoardSource(pageItem, source)).toBe(false);
  });
});
