import { describe, expect, it } from "vitest";
import type { FeedbackStatus } from "@/app/_domains/feedback";
import {
  feedbackStatusFromGitHubIssueState,
  isGitHubIssueStateMirroring,
  type GitHubIssueState,
} from "../_helpers/github/status-mapping";
import {
  feedbackStatusFromJiraStatusCategory,
  isJiraStatusCategoryMirroring,
} from "../_helpers/jira/transition-mapping";
import {
  inMemoryStatusConvergence,
  type InMemoryIssueLink,
} from "./_in-memory-status-convergence";
import {
  applyObservedIssueState,
  type ObservedIssue,
  type TrackerAdapter,
} from "./apply-observed-issue-state";

const reference = {
  tracker: "jira",
  issueId: "10001",
  installationId: "installation_1",
} as const;

/** A Tracker with Jira's two-state mapping and a scripted re-read. */
function fakeJiraAdapter(
  observed: ObservedIssue<"jira">,
): TrackerAdapter<"jira"> {
  return {
    tracker: "jira",
    readIssue: () => Promise.resolve(observed),
    isMirroring: (state, status) =>
      isJiraStatusCategoryMirroring(state.issueStatusCategory, status),
    getImpliedStatus: (state) =>
      feedbackStatusFromJiraStatusCategory(state.issueStatusCategory),
  };
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
  const link: InMemoryIssueLink = {
    tracker: "jira",
    id: "link_1",
    feedbackId: "feedback_1",
    mirroredStatus,
    issueState: { issueStatusCategory },
    reference,
  };
  return inMemoryStatusConvergence({ feedback_1: status }, [link]);
}

function found(issueStatusCategory: string): ObservedIssue<"jira"> {
  return { state: { issueStatusCategory } };
}

describe("applyObservedIssueState", () => {
  it("leaves a new Feedback new on a comment on a Jira issue in To Do", async () => {
    const convergence = seed({ status: "new", issueStatusCategory: "new" });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("new")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("new");
    expect(convergence.events).toEqual([]);
  });

  it("leaves an Archived Feedback Archived on an edit on a Jira issue in Done", async () => {
    const convergence = seed({ status: "closed", issueStatusCategory: "done" });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("done")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("closed");
    expect(convergence.events).toEqual([]);
  });

  it("resolves the Feedback when its Jira issue moves into Done", async () => {
    const convergence = seed({
      status: "in_progress",
      issueStatusCategory: "indeterminate",
    });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("done")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "resolved",
      issueState: { issueStatusCategory: "done" },
    });
    expect(convergence.events).toEqual([
      {
        feedbackId: "feedback_1",
        newStatus: "resolved",
        origin: "jira",
        actor: "tracker",
      },
    ]);
  });

  it("sets the Feedback In progress when its Jira issue moves out of Done", async () => {
    const convergence = seed({
      status: "resolved",
      issueStatusCategory: "done",
    });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("new")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "in_progress",
      issueState: { issueStatusCategory: "new" },
    });
  });

  it("ignores the Tracker while the Issue link is pending", async () => {
    // The team just resolved the Feedback; Jira has not been converged yet.
    const convergence = seed({
      status: "resolved",
      mirroredStatus: "in_progress",
      issueStatusCategory: "indeterminate",
    });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("new")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "in_progress",
      issueState: { issueStatusCategory: "indeterminate" },
    });
    expect(convergence.events).toEqual([]);
  });

  it("ignores a link that never converged", async () => {
    const convergence = seed({
      status: "closed",
      mirroredStatus: null,
      issueStatusCategory: "new",
    });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("done")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("closed");
    expect(convergence.events).toEqual([]);
  });

  it("ignores a state that mirrors the current Status and records it", async () => {
    const convergence = seed({ status: "new", issueStatusCategory: "new" });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("indeterminate")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("new");
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "new",
      issueState: { issueStatusCategory: "indeterminate" },
    });
    expect(convergence.events).toEqual([]);
  });

  it("applies a real change to a converged link whatever its age", async () => {
    // Converged seconds ago by the team's own change: a genuine move in Jira
    // right after it is still applied.
    const convergence = seed({
      status: "resolved",
      issueStatusCategory: "done",
    });

    await applyObservedIssueState(
      { reference },
      fakeJiraAdapter(found("indeterminate")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
  });

  it("ignores an unmapped state", async () => {
    const convergence = seed({ status: "new", issueStatusCategory: "new" });
    const adapter = {
      ...fakeJiraAdapter(found("unknown")),
      isMirroring: () => false,
      getImpliedStatus: () => null,
    };

    await applyObservedIssueState({ reference }, adapter, convergence);

    expect(convergence.statuses.get("feedback_1")).toBe("new");
    expect(convergence.events).toEqual([]);
  });

  it("detaches the link of a missing Issue and leaves the Feedback alone", async () => {
    const convergence = seed({
      status: "resolved",
      issueStatusCategory: "done",
    });

    await expect(
      applyObservedIssueState(
        { reference },
        fakeJiraAdapter("missing"),
        convergence,
      ),
    ).resolves.toEqual({ feedbackId: "feedback_1", detached: true });

    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.events).toEqual([]);
  });

  it("ignores a deletion the re-read does not confirm", async () => {
    const convergence = seed({ status: "new", issueStatusCategory: "new" });

    await expect(
      applyObservedIssueState(
        { reference, deleted: true },
        fakeJiraAdapter(found("done")),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "deletion_not_confirmed" });

    expect(convergence.links.has("link_1")).toBe(true);
    expect(convergence.statuses.get("feedback_1")).toBe("new");
  });

  it("finds no link for an Issue of another Installation", async () => {
    const convergence = seed({ status: "new", issueStatusCategory: "new" });

    await expect(
      applyObservedIssueState(
        { reference: { ...reference, installationId: "installation_2" } },
        fakeJiraAdapter("missing"),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "no_matching_issue_link" });

    expect(convergence.links.has("link_1")).toBe(true);
  });
});

const gitHubReference = {
  tracker: "github",
  repoFullName: "acme/site",
  issueNumber: 7,
} as const;

/** A Tracker with GitHub's open or closed mapping and a scripted re-read. */
function fakeGitHubAdapter(
  observed: GitHubIssueState | "missing",
): TrackerAdapter<"github"> {
  return {
    tracker: "github",
    readIssue: () =>
      Promise.resolve(
        observed === "missing" ? observed : { state: { issueState: observed } },
      ),
    isMirroring: (state, status) =>
      isGitHubIssueStateMirroring(state.issueState, status),
    getImpliedStatus: (state) =>
      feedbackStatusFromGitHubIssueState(state.issueState),
  };
}

function seedGitHub({
  status,
  mirroredStatus = status,
  issueState,
}: {
  status: FeedbackStatus;
  mirroredStatus?: FeedbackStatus | null;
  issueState: GitHubIssueState;
}) {
  const link: InMemoryIssueLink = {
    tracker: "github",
    id: "link_1",
    feedbackId: "feedback_1",
    mirroredStatus,
    issueState: { issueState },
    reference: gitHubReference,
  };
  return inMemoryStatusConvergence({ feedback_1: status }, [link]);
}

describe("applyObservedIssueState on GitHub", () => {
  it("resolves the Feedback when its Issue is closed", async () => {
    const convergence = seedGitHub({ status: "new", issueState: "open" });

    await applyObservedIssueState(
      { reference: gitHubReference },
      fakeGitHubAdapter("closed"),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "resolved",
      issueState: { issueState: "closed" },
    });
    expect(convergence.events).toEqual([
      {
        feedbackId: "feedback_1",
        newStatus: "resolved",
        origin: "github",
        actor: "tracker",
      },
    ]);
  });

  it("sets the Feedback In progress when its Issue is reopened", async () => {
    const convergence = seedGitHub({
      status: "resolved",
      issueState: "closed",
    });

    await applyObservedIssueState(
      { reference: gitHubReference },
      fakeGitHubAdapter("open"),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
  });

  it("keeps an Archived Feedback Archived when the close webhook of its Issue arrives late", async () => {
    // The team archived the Feedback, the Issue was closed as not planned and
    // recorded, then GitHub delivered its own close.
    const convergence = seedGitHub({ status: "closed", issueState: "closed" });

    await applyObservedIssueState(
      { reference: gitHubReference },
      fakeGitHubAdapter("closed"),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("closed");
    expect(convergence.events).toEqual([]);
  });

  it("keeps an Archived Feedback Archived when the close webhook arrives before the push is recorded", async () => {
    const convergence = seedGitHub({
      status: "closed",
      mirroredStatus: "new",
      issueState: "open",
    });

    await applyObservedIssueState(
      { reference: gitHubReference },
      fakeGitHubAdapter("closed"),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("closed");
    expect(convergence.events).toEqual([]);
  });

  it("detaches the link of a deleted Issue and leaves the Feedback alone", async () => {
    const convergence = seedGitHub({
      status: "in_progress",
      issueState: "open",
    });

    await expect(
      applyObservedIssueState(
        { reference: gitHubReference, deleted: true },
        fakeGitHubAdapter("missing"),
        convergence,
      ),
    ).resolves.toEqual({ feedbackId: "feedback_1", detached: true });

    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
    expect(convergence.events).toEqual([]);
  });

  it("finds no link for an Issue of another repository", async () => {
    const convergence = seedGitHub({ status: "new", issueState: "open" });

    await expect(
      applyObservedIssueState(
        { reference: { ...gitHubReference, repoFullName: "acme/other" } },
        fakeGitHubAdapter("closed"),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "no_matching_issue_link" });

    expect(convergence.statuses.get("feedback_1")).toBe("new");
  });
});
