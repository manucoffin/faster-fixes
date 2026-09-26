import type { FeedbackItem, FeedbackStatus } from "@fasterfixes/core";
import { describe, expect, it } from "vitest";

import { listedFeedback, pagePath } from "./feedback-list.js";

function item(id: string, status: FeedbackStatus) {
  return { id, status } as FeedbackItem;
}

describe("listedFeedback", () => {
  const items = [
    item("new", "new"),
    item("progress", "in_progress"),
    item("resolved", "resolved"),
    item("closed", "closed"),
  ];

  it("hides resolved and closed items by default", () => {
    expect(listedFeedback(items, false).map(({ id }) => id)).toEqual([
      "new",
      "progress",
    ]);
  });

  it("lists every item when resolved ones are shown", () => {
    expect(listedFeedback(items, true)).toEqual(items);
  });
});

describe("pagePath", () => {
  it("keeps the path and query of the page URL", () => {
    expect(pagePath("https://example.com/pricing?plan=pro#faq")).toBe(
      "/pricing?plan=pro",
    );
  });

  it("returns an unparsable value unchanged", () => {
    expect(pagePath("not a url")).toBe("not a url");
  });
});
