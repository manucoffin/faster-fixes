// The Task board's `source` query parameter: `pages`, `videos`, `page:{url}`
// or `video:{id}`. Absent, empty or unknown means every source.

export type BoardSource =
  | { kind: "all" }
  | { kind: "pages" }
  | { kind: "videos" }
  | { kind: "page"; url: string }
  | { kind: "video"; videoId: string };

const PAGE_PREFIX = "page:";
const VIDEO_PREFIX = "video:";

export function parseBoardSource(value: string | null): BoardSource {
  if (value === "pages") return { kind: "pages" };
  if (value === "videos") return { kind: "videos" };
  // Only the prefix is cut off: a page URL carries colons of its own.
  if (value?.startsWith(PAGE_PREFIX) && value.length > PAGE_PREFIX.length) {
    return { kind: "page", url: value.slice(PAGE_PREFIX.length) };
  }
  if (value?.startsWith(VIDEO_PREFIX) && value.length > VIDEO_PREFIX.length) {
    return { kind: "video", videoId: value.slice(VIDEO_PREFIX.length) };
  }
  return { kind: "all" };
}

export function serializeBoardSource(
  source: Exclude<BoardSource, { kind: "all" }>,
): string;
export function serializeBoardSource(source: BoardSource): string | null;
export function serializeBoardSource(source: BoardSource): string | null {
  switch (source.kind) {
    case "all":
      return null;
    case "pages":
    case "videos":
      return source.kind;
    case "page":
      return `${PAGE_PREFIX}${source.url}`;
    case "video":
      return `${VIDEO_PREFIX}${source.videoId}`;
  }
}

export function matchesBoardSource(
  item: { pageUrl: string | null; videoId: string | null },
  source: BoardSource,
) {
  switch (source.kind) {
    case "all":
      return true;
    case "pages":
      return item.videoId === null;
    case "videos":
      return item.videoId !== null;
    case "page":
      return item.pageUrl === source.url;
    case "video":
      return item.videoId === source.videoId;
  }
}
