import { describe, expect, it } from "vitest";
import type { FeedbackStatus } from "@/app/_domains/feedback";
import {
  feedbackStatusFromJiraStatusCategory,
  isJiraStatusCategoryMirroring,
  resolveJiraStateToWrite,
} from "../_helpers/jira/transition-mapping";
import { inMemoryStatusConvergence } from "./_in-memory-status-convergence";
import { applyObservedIssueState } from "./apply-observed-issue-state";
import {
  convergeTracker,
  type TrackerWrite,
  type TrackerWriter,
} from "./converge-tracker";
import { updateStatus } from "./update-status";

const reference = {
  tracker: "jira",
  issueId: "10001",
  installationId: "installation_1",
} as const;

/**
 * A Tracker with Jira's two-state mapping that records its writes. `answer`
 * scripts a write the workflow cannot make or an Issue that is gone.
 */
function fakeJiraWriter(answer?: "cannot_write" | "missing") {
  const writes: FeedbackStatus[] = [];
  const writer: TrackerWriter<"jira"> = {
    tracker: "jira",
    writeStatus({ issueState }, status) {
      if (
        isJiraStatusCategoryMirroring(issueState.issueStatusCategory, status)
      ) {
        return Promise.resolve<TrackerWrite<"jira">>("nothing_to_write");
      }
      if (answer) return Promise.resolve(answer);
      writes.push(status);
      const issueStatusCategory =
        resolveJiraStateToWrite(status) === "done" ? "done" : "indeterminate";
      return Promise.resolve({ state: { issueStatusCategory } });
    },
  };
  return { writer, writes };
}

function seed({
  status,
  mirroredStatus = status,
  issueStatusCategory,
}: {
  status: FeedbackStatus;
  mirroredStatus?: FeedbackStatus | null;
  issueStatusCategory: string;
}) {
  return inMemoryStatusConvergence({ feedback_1: status }, [
    {
      tracker: "jira",
      id: "link_1",
      feedbackId: "feedback_1",
      mirroredStatus,
      issueState: { issueStatusCategory },
      reference,
    },
  ]);
}

describe("convergeTracker", () => {
  it("writes the Status and records the convergence", async () => {
    const convergence = seed({
      status: "resolved",
      mirroredStatus: "in_progress",
      issueStatusCategory: "indeterminate",
    });
    const { writer, writes } = fakeJiraWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual(["resolved"]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "resolved",
      issueState: { issueStatusCategory: "done" },
    });
  });

  it("ends on the last of two quick changes, whatever order their events run in", async () => {
    const convergence = seed({
      status: "in_progress",
      issueStatusCategory: "indeterminate",
    });
    const { writer, writes } = fakeJiraWriter();

    for (const status of ["resolved", "closed"] as const) {
      await updateStatus(
        { feedbackIds: ["feedback_1"], status, actor: "user" },
        convergence,
      );
    }
    for (const event of [...convergence.events].reverse()) {
      await convergeTracker(event, writer, convergence);
    }

    expect(writes).toEqual(["closed"]);
    expect(convergence.links.get("link_1")?.mirroredStatus).toBe("closed");
  });

  it("does not push a change that came from Jira back to Jira", async () => {
    const convergence = seed({
      status: "resolved",
      mirroredStatus: "in_progress",
      issueStatusCategory: "indeterminate",
    });
    const { writer, writes } = fakeJiraWriter();

    const result = await convergeTracker(
      { feedbackId: "feedback_1", origin: "jira" },
      writer,
      convergence,
    );

    expect(result).toEqual({ skipped: "origin_tracker" });
    expect(writes).toEqual([]);
  });

  it("pushes a change that came from another Tracker", async () => {
    const convergence = seed({
      status: "resolved",
      mirroredStatus: "in_progress",
      issueStatusCategory: "indeterminate",
    });
    const { writer, writes } = fakeJiraWriter();

    await convergeTracker(
      { feedbackId: "feedback_1", origin: "github" },
      writer,
      convergence,
    );

    expect(writes).toEqual(["resolved"]);
  });

  it("records the convergence when the Issue state already mirrors the Status", async () => {
    const convergence = seed({
      status: "new",
      mirroredStatus: "in_progress",
      issueStatusCategory: "indeterminate",
    });
    const { writer, writes } = fakeJiraWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual([]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "new",
      issueState: { issueStatusCategory: "indeterminate" },
    });
  });

  it("leaves the link pending when the workflow has no path to the Status", async () => {
    const convergence = seed({
      status: "resolved",
      mirroredStatus: "in_progress",
      issueStatusCategory: "indeterminate",
    });
    const { writer } = fakeJiraWriter("cannot_write");

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "in_progress",
      issueState: { issueStatusCategory: "indeterminate" },
    });

    // Pending, so Jira cannot move the Feedback back.
    await applyObservedIssueState(
      { reference },
      jiraReader("new"),
      convergence,
    );
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
  });

  it("detaches the link of a missing Issue and leaves the Feedback alone", async () => {
    const convergence = seed({
      status: "resolved",
      mirroredStatus: "in_progress",
      issueStatusCategory: "indeterminate",
    });
    const { writer } = fakeJiraWriter("missing");

    const result = await convergeTracker(
      { feedbackId: "feedback_1" },
      writer,
      convergence,
    );

    expect(result).toEqual({ feedbackId: "feedback_1", detached: true });
    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.events).toEqual([]);
  });

  it("skips a Feedback with no Issue link on the Tracker", async () => {
    const convergence = inMemoryStatusConvergence({ feedback_1: "resolved" });
    const { writer, writes } = fakeJiraWriter();

    const result = await convergeTracker(
      { feedbackId: "feedback_1" },
      writer,
      convergence,
    );

    expect(result).toEqual({ skipped: "no_issue_link" });
    expect(writes).toEqual([]);
  });

  it("converges an Issue created open for an Archived Feedback", async () => {
    const convergence = seed({
      status: "closed",
      mirroredStatus: null,
      issueStatusCategory: "new",
    });
    const { writer, writes } = fakeJiraWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual(["closed"]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "closed",
      issueState: { issueStatusCategory: "done" },
    });

    // The echo of that write leaves the Feedback Archived.
    await applyObservedIssueState(
      { reference },
      jiraReader("done"),
      convergence,
    );
    expect(convergence.statuses.get("feedback_1")).toBe("closed");
  });

  it("pushes a Status the team sets again in the inbox to a drifted Issue", async () => {
    const convergence = seed({
      status: "resolved",
      mirroredStatus: null,
      issueStatusCategory: "indeterminate",
    });
    const { writer, writes } = fakeJiraWriter();

    await updateStatus(
      { feedbackIds: ["feedback_1"], status: "resolved", actor: "user" },
      convergence,
    );
    for (const event of convergence.events) {
      await convergeTracker(event, writer, convergence);
    }

    expect(convergence.events).toHaveLength(1);
    expect(writes).toEqual(["resolved"]);
  });
});

function jiraReader(issueStatusCategory: string) {
  return {
    tracker: "jira",
    readIssue: () => Promise.resolve({ state: { issueStatusCategory } }),
    isMirroring: (
      state: { issueStatusCategory: string },
      status: FeedbackStatus,
    ) => isJiraStatusCategoryMirroring(state.issueStatusCategory, status),
    getImpliedStatus: (state: { issueStatusCategory: string }) =>
      feedbackStatusFromJiraStatusCategory(state.issueStatusCategory),
  } as const;
}
