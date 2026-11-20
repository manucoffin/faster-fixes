import { describe, expect, it } from "vitest";
import type { FeedbackStatus } from "@/app/_domains/feedback";
import {
  feedbackStatusFromGitHubIssueState,
  isGitHubIssueStateMirroring,
  resolveGitHubStateToWrite,
  type GitHubStateToWrite,
} from "../_helpers/github/status-mapping";
import {
  feedbackStatusFromJiraStatusCategory,
  isJiraStatusCategoryMirroring,
  resolveJiraStateToWrite,
} from "../_helpers/jira/transition-mapping";
import {
  isLinearStateTypeMirroring,
  resolveLinearStateToWrite,
  type LinearTeamState,
} from "../_helpers/linear/state-mapping";
import {
  feedbackStatusFromTrelloCard,
  isTrelloCardMirroring,
  leavesTrelloCardInPlace,
  resolveTrelloCardWrites,
  type TrelloCardState,
  type TrelloCardWrites,
  type TrelloListMapping,
} from "../_helpers/trello/status-mapping";
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

/** A Tracker with GitHub's open or closed mapping that records its writes. */
function fakeGitHubWriter(answer?: "missing") {
  const writes: GitHubStateToWrite[] = [];
  const writer: TrackerWriter<"github"> = {
    tracker: "github",
    writeStatus({ issueState }, status) {
      const write = resolveGitHubStateToWrite(status);
      if (issueState.issueState === write.state) {
        return Promise.resolve<TrackerWrite<"github">>("nothing_to_write");
      }
      if (answer) return Promise.resolve(answer);
      writes.push(write);
      return Promise.resolve({ state: { issueState: write.state } });
    },
  };
  return { writer, writes };
}

const linearStates: LinearTeamState[] = [
  { id: "state_backlog", type: "backlog" },
  { id: "state_todo", type: "unstarted" },
  { id: "state_doing", type: "started" },
  { id: "state_done", type: "completed" },
];

/** A Linear team without a canceled state that records its writes. */
function fakeLinearWriter(answer?: "missing") {
  const writes: string[] = [];
  const writer: TrackerWriter<"linear"> = {
    tracker: "linear",
    writeStatus({ issueState }, status) {
      if (isLinearStateTypeMirroring(issueState.issueStateType, status)) {
        return Promise.resolve<TrackerWrite<"linear">>("nothing_to_write");
      }
      const resolved = resolveLinearStateToWrite({
        states: linearStates,
        defaultStateId: "state_todo",
        status,
      });
      if (!resolved) return Promise.resolve("cannot_write");
      if (resolved.stateId === issueState.issueStateId) {
        return Promise.resolve("nothing_to_write");
      }
      if (answer) return Promise.resolve(answer);
      writes.push(resolved.stateId);
      return Promise.resolve({
        state: {
          issueStateId: resolved.stateId,
          issueStateType: resolved.stateType,
        },
      });
    },
  };
  return { writer, writes };
}

const trelloLists: TrelloListMapping = {
  newListId: "list_new",
  inProgressListId: "list_doing",
  resolvedListId: "list_done",
};

/** A Trello board with a list mapping that moves the card on each write. */
function fakeTrelloWriter(
  mapping: TrelloListMapping = trelloLists,
  answer?: "missing",
) {
  const writes: TrelloCardWrites[] = [];
  const writer: TrackerWriter<"trello"> = {
    tracker: "trello",
    writeStatus({ issueState }, status) {
      if (leavesTrelloCardInPlace(status, mapping) && !issueState.archived) {
        return Promise.resolve<TrackerWrite<"trello">>("nothing_to_write");
      }
      if (answer) return Promise.resolve(answer);
      const write = resolveTrelloCardWrites(status, mapping);
      writes.push(write);
      return Promise.resolve({
        state: {
          listId: write.listId ?? issueState.listId,
          archived: write.closed,
        },
      });
    },
  };
  return { writer, writes };
}

function trelloReader(card: TrelloCardState, mapping: TrelloListMapping) {
  return {
    tracker: "trello",
    readIssue: () => Promise.resolve({ state: card }),
    isMirroring: (state: TrelloCardState, status: FeedbackStatus) =>
      isTrelloCardMirroring(state, status, mapping),
    getImpliedStatus: (state: TrelloCardState) =>
      feedbackStatusFromTrelloCard(state, mapping),
  } as const;
}

const githubReference = {
  tracker: "github",
  repoFullName: "acme/web",
  issueNumber: 42,
} as const;

const linearReference = {
  tracker: "linear",
  issueId: "issue_1",
  installationId: "installation_1",
} as const;

const trelloReference = {
  tracker: "trello",
  cardId: "card_1",
  projectTrelloLinkId: "trello_link_1",
} as const;

describe("convergeTracker on GitHub", () => {
  function seedGitHub(
    status: FeedbackStatus,
    issueState: "open" | "closed",
    mirroredStatus: FeedbackStatus | null = status,
  ) {
    return inMemoryStatusConvergence({ feedback_1: status }, [
      {
        tracker: "github",
        id: "link_1",
        feedbackId: "feedback_1",
        mirroredStatus,
        issueState: { issueState },
        reference: githubReference,
      },
    ]);
  }

  it("closes the Issue as not planned for an Archived Feedback", async () => {
    const convergence = seedGitHub("closed", "open", "in_progress");
    const { writer, writes } = fakeGitHubWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual([{ state: "closed", stateReason: "not_planned" }]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "closed",
      issueState: { issueState: "closed" },
    });

    // The late webhook of that close leaves the Feedback Archived.
    await applyObservedIssueState(
      { reference: githubReference },
      {
        tracker: "github",
        readIssue: () => Promise.resolve({ state: { issueState: "closed" } }),
        isMirroring: (state, status) =>
          isGitHubIssueStateMirroring(state.issueState, status),
        getImpliedStatus: (state) =>
          feedbackStatusFromGitHubIssueState(state.issueState),
      },
      convergence,
    );
    expect(convergence.statuses.get("feedback_1")).toBe("closed");
  });

  it("records a closed Issue as converged when Resolved becomes Archived", async () => {
    const convergence = seedGitHub("closed", "closed", "resolved");
    const { writer, writes } = fakeGitHubWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual([]);
    expect(convergence.links.get("link_1")?.mirroredStatus).toBe("closed");
  });

  it("detaches the link when the Issue is gone", async () => {
    const convergence = seedGitHub("resolved", "open", "in_progress");
    const { writer } = fakeGitHubWriter("missing");

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
  });
});

describe("convergeTracker on Linear", () => {
  function seedLinear(
    status: FeedbackStatus,
    issueStateId: string,
    mirroredStatus: FeedbackStatus | null = status,
  ) {
    const issueStateType =
      linearStates.find((state) => state.id === issueStateId)?.type ?? "";
    return inMemoryStatusConvergence({ feedback_1: status }, [
      {
        tracker: "linear",
        id: "link_1",
        feedbackId: "feedback_1",
        mirroredStatus,
        issueState: { issueStateId, issueStateType },
        reference: linearReference,
      },
    ]);
  }

  it("moves the issue to the state type of the Status", async () => {
    const convergence = seedLinear("resolved", "state_doing", "in_progress");
    const { writer, writes } = fakeLinearWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual(["state_done"]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "resolved",
      issueState: { issueStateId: "state_done", issueStateType: "completed" },
    });
  });

  it("moves a restored Feedback's issue to the Project link's default state", async () => {
    const convergence = seedLinear("new", "state_done", "closed");
    const { writer, writes } = fakeLinearWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual(["state_todo"]);
  });

  it("leaves an issue in backlog for a `new` Feedback", async () => {
    const convergence = seedLinear("new", "state_backlog", null);
    const { writer, writes } = fakeLinearWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual([]);
    expect(convergence.links.get("link_1")?.mirroredStatus).toBe("new");
  });

  it("records the fallback state as converged on a team with no canceled state", async () => {
    const convergence = seedLinear("closed", "state_done", "resolved");
    const { writer, writes } = fakeLinearWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual([]);
    expect(convergence.links.get("link_1")?.mirroredStatus).toBe("closed");
  });

  it("detaches the link when the issue is gone", async () => {
    const convergence = seedLinear("resolved", "state_doing", "in_progress");
    const { writer } = fakeLinearWriter("missing");

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
  });
});

describe("convergeTracker on Trello", () => {
  const withoutInProgress = { ...trelloLists, inProgressListId: null };

  function seedTrello(
    status: FeedbackStatus,
    card: TrelloCardState,
    mirroredStatus: FeedbackStatus | null = status,
  ) {
    return inMemoryStatusConvergence({ feedback_1: status }, [
      {
        tracker: "trello",
        id: "link_1",
        feedbackId: "feedback_1",
        mirroredStatus,
        issueState: card,
        reference: trelloReference,
      },
    ]);
  }

  it("moves the card to the resolved list", async () => {
    const convergence = seedTrello(
      "resolved",
      { listId: "list_new", archived: false },
      "new",
    );
    const { writer, writes } = fakeTrelloWriter();

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual([
      { listId: "list_done", closed: false, dueComplete: true },
    ]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "resolved",
      issueState: { listId: "list_done", archived: false },
    });
  });

  it("leaves the card in place for In progress on a board with no In progress list, and later moves still apply", async () => {
    const convergence = seedTrello(
      "in_progress",
      { listId: "list_new", archived: false },
      "new",
    );
    const { writer, writes } = fakeTrelloWriter(withoutInProgress);

    const result = await convergeTracker(
      { feedbackId: "feedback_1" },
      writer,
      convergence,
    );

    expect(result).toEqual({
      feedbackId: "feedback_1",
      skipped: "nothing_to_write",
    });
    expect(writes).toEqual([]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "in_progress",
      issueState: { listId: "list_new", archived: false },
    });

    await applyObservedIssueState(
      { reference: trelloReference },
      trelloReader({ listId: "list_done", archived: false }, withoutInProgress),
      convergence,
    );
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
  });

  it("brings an archived card back for In progress on a board with no In progress list", async () => {
    const convergence = seedTrello(
      "in_progress",
      { listId: "list_new", archived: true },
      "closed",
    );
    const { writer, writes } = fakeTrelloWriter(withoutInProgress);

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(writes).toEqual([{ closed: false, dueComplete: false }]);
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "in_progress",
      issueState: { listId: "list_new", archived: false },
    });
  });

  it("detaches the link when the card is gone", async () => {
    const convergence = seedTrello(
      "resolved",
      { listId: "list_new", archived: false },
      "new",
    );
    const { writer } = fakeTrelloWriter(trelloLists, "missing");

    await convergeTracker({ feedbackId: "feedback_1" }, writer, convergence);

    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
  });
});

describe("convergeTracker across Trackers", () => {
  it("converges every other Tracker linked to the Feedback, and not the origin", async () => {
    const convergence = inMemoryStatusConvergence({ feedback_1: "new" }, [
      {
        tracker: "github",
        id: "github_link",
        feedbackId: "feedback_1",
        mirroredStatus: "new",
        issueState: { issueState: "open" },
        reference: githubReference,
      },
      {
        tracker: "linear",
        id: "linear_link",
        feedbackId: "feedback_1",
        mirroredStatus: "new",
        issueState: { issueStateId: "state_todo", issueStateType: "unstarted" },
        reference: linearReference,
      },
      {
        tracker: "trello",
        id: "trello_link",
        feedbackId: "feedback_1",
        mirroredStatus: "new",
        issueState: { listId: "list_new", archived: false },
        reference: trelloReference,
      },
      {
        tracker: "jira",
        id: "jira_link",
        feedbackId: "feedback_1",
        mirroredStatus: "new",
        issueState: { issueStatusCategory: "new" },
        reference,
      },
    ]);
    const github = fakeGitHubWriter();
    const linear = fakeLinearWriter();
    const trello = fakeTrelloWriter();
    const jira = fakeJiraWriter();

    // GitHub closed its Issue.
    await updateStatus(
      { feedbackIds: ["feedback_1"], status: "resolved", actor: "github" },
      convergence,
    );
    for (const event of convergence.events) {
      for (const { writer } of [github, linear, trello, jira]) {
        await convergeTracker(event, writer, convergence);
      }
    }

    expect(github.writes).toEqual([]);
    expect(linear.writes).toEqual(["state_done"]);
    expect(trello.writes).toEqual([
      { listId: "list_done", closed: false, dueComplete: true },
    ]);
    expect(jira.writes).toEqual(["resolved"]);
    for (const id of ["linear_link", "trello_link", "jira_link"]) {
      expect(convergence.links.get(id)?.mirroredStatus).toBe("resolved");
    }
  });
});
