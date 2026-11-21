import { describe, expect, it } from "vitest";
import {
  feedbackStatusFromJiraStatusCategory,
  isJiraStatusCategoryMirroring,
  resolveJiraStateToWrite,
  type JiraIssueState,
} from "./transition-mapping";
import type { FeedbackStatus } from "@/app/_domains/feedback";

const CATEGORIES = ["new", "indeterminate", "done"];

describe("resolveJiraStateToWrite", () => {
  const rows: Array<{ status: FeedbackStatus; state: JiraIssueState }> = [
    { status: "new", state: "not_done" },
    { status: "in_progress", state: "not_done" },
    { status: "resolved", state: "done" },
    { status: "closed", state: "done" },
  ];

  it.each(rows)("writes $state for a $status Feedback", ({ status, state }) => {
    expect(resolveJiraStateToWrite(status)).toBe(state);
  });
});

describe("isJiraStatusCategoryMirroring", () => {
  const rows: Array<{
    category: string;
    status: FeedbackStatus;
    mirrors: boolean;
  }> = [
    { category: "new", status: "new", mirrors: true },
    { category: "new", status: "in_progress", mirrors: true },
    { category: "new", status: "resolved", mirrors: false },
    { category: "new", status: "closed", mirrors: false },
    { category: "indeterminate", status: "new", mirrors: true },
    { category: "indeterminate", status: "in_progress", mirrors: true },
    { category: "indeterminate", status: "resolved", mirrors: false },
    { category: "indeterminate", status: "closed", mirrors: false },
    { category: "done", status: "new", mirrors: false },
    { category: "done", status: "in_progress", mirrors: false },
    { category: "done", status: "resolved", mirrors: true },
    { category: "done", status: "closed", mirrors: true },
  ];

  it.each(rows)(
    "a $category issue mirrors a $status Feedback: $mirrors",
    ({ category, status, mirrors }) => {
      expect(isJiraStatusCategoryMirroring(category, status)).toBe(mirrors);
    },
  );
});

describe("feedbackStatusFromJiraStatusCategory", () => {
  it("implies Resolved for a Done issue", () => {
    expect(feedbackStatusFromJiraStatusCategory("done")).toBe("resolved");
  });

  it.each(CATEGORIES.filter((category) => category !== "done"))(
    "implies In progress for a %s issue, never new",
    (category) => {
      expect(feedbackStatusFromJiraStatusCategory(category)).toBe(
        "in_progress",
      );
    },
  );

  it("implies a Status the issue's own category mirrors", () => {
    for (const category of CATEGORIES) {
      expect(
        isJiraStatusCategoryMirroring(
          category,
          feedbackStatusFromJiraStatusCategory(category),
        ),
      ).toBe(true);
    }
  });
});
