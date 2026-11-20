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
  feedbackStatusFromLinearStateType,
  isLinearStateTypeMirroring,
  type LinearStateType,
} from "../_helpers/linear/state-mapping";
import {
  feedbackStatusFromTrelloCard,
  isTrelloCardMirroring,
  type TrelloCardState,
  type TrelloListMapping,
} from "../_helpers/trello/status-mapping";
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

const linearReference = {
  tracker: "linear",
  issueId: "issue_1",
  installationId: "installation_1",
} as const;

// One workflow state per type, named after it.
function linearState(issueStateType: LinearStateType) {
  return { issueStateId: `state_${issueStateType}`, issueStateType };
}

/** A Tracker with Linear's state-type mapping and a scripted re-read. */
function fakeLinearAdapter(
  observed: LinearStateType | "missing",
): TrackerAdapter<"linear"> {
  return {
    tracker: "linear",
    readIssue: () =>
      Promise.resolve(
        observed === "missing" ? observed : { state: linearState(observed) },
      ),
    isMirroring: (state, status) =>
      isLinearStateTypeMirroring(state.issueStateType, status),
    getImpliedStatus: (state) =>
      feedbackStatusFromLinearStateType(state.issueStateType),
  };
}

function seedLinear({
  status,
  mirroredStatus = status,
  issueStateType,
}: {
  status: FeedbackStatus;
  mirroredStatus?: FeedbackStatus | null;
  issueStateType: LinearStateType;
}) {
  const link: InMemoryIssueLink = {
    tracker: "linear",
    id: "link_1",
    feedbackId: "feedback_1",
    mirroredStatus,
    issueState: linearState(issueStateType),
    reference: linearReference,
  };
  return inMemoryStatusConvergence({ feedback_1: status }, [link]);
}

describe("applyObservedIssueState on Linear", () => {
  it.each([
    { from: "unstarted", to: "started", status: "in_progress" },
    { from: "started", to: "completed", status: "resolved" },
    { from: "started", to: "canceled", status: "closed" },
    { from: "completed", to: "backlog", status: "new" },
  ] as const)(
    "sets the Feedback $status when its issue moves from $from to $to",
    async ({ from, to, status }) => {
      const convergence = seedLinear({
        status: feedbackStatusFromLinearStateType(from),
        issueStateType: from,
      });

      await applyObservedIssueState(
        { reference: linearReference },
        fakeLinearAdapter(to),
        convergence,
      );

      expect(convergence.statuses.get("feedback_1")).toBe(status);
      expect(convergence.links.get("link_1")).toMatchObject({
        mirroredStatus: status,
        issueState: linearState(to),
      });
      expect(convergence.events).toEqual([
        {
          feedbackId: "feedback_1",
          newStatus: status,
          origin: "linear",
          actor: "tracker",
        },
      ]);
    },
  );

  it("changes nothing on an edit that leaves the state as it was", async () => {
    const convergence = seedLinear({
      status: "in_progress",
      issueStateType: "started",
    });

    await expect(
      applyObservedIssueState(
        { reference: linearReference },
        fakeLinearAdapter("started"),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "issue_state_unchanged" });

    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
    expect(convergence.events).toEqual([]);
  });

  it("leaves a new Feedback new when its issue moves between not-started states", async () => {
    const convergence = seedLinear({ status: "new", issueStateType: "triage" });

    await applyObservedIssueState(
      { reference: linearReference },
      fakeLinearAdapter("backlog"),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("new");
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "new",
      issueState: linearState("backlog"),
    });
    expect(convergence.events).toEqual([]);
  });

  it("keeps a Status the team just set while its push to Linear is pending", async () => {
    // The team resolved the Feedback; the webhook of an earlier move arrives first.
    const convergence = seedLinear({
      status: "resolved",
      mirroredStatus: "new",
      issueStateType: "unstarted",
    });

    await applyObservedIssueState(
      { reference: linearReference },
      fakeLinearAdapter("started"),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.events).toEqual([]);
  });

  it("detaches the link of a deleted issue and leaves the Feedback alone", async () => {
    const convergence = seedLinear({
      status: "in_progress",
      issueStateType: "started",
    });

    await expect(
      applyObservedIssueState(
        { reference: linearReference, deleted: true },
        fakeLinearAdapter("missing"),
        convergence,
      ),
    ).resolves.toEqual({ feedbackId: "feedback_1", detached: true });

    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
    expect(convergence.events).toEqual([]);
  });

  it("keeps the link when Linear still has an issue the delivery says was removed", async () => {
    const convergence = seedLinear({
      status: "in_progress",
      issueStateType: "started",
    });

    await expect(
      applyObservedIssueState(
        { reference: linearReference, deleted: true },
        fakeLinearAdapter("started"),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "deletion_not_confirmed" });

    expect(convergence.links.has("link_1")).toBe(true);
  });

  it("finds no link for an issue of another Installation", async () => {
    const convergence = seedLinear({
      status: "new",
      issueStateType: "unstarted",
    });

    await expect(
      applyObservedIssueState(
        {
          reference: { ...linearReference, installationId: "installation_2" },
        },
        fakeLinearAdapter("completed"),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "no_matching_issue_link" });

    expect(convergence.statuses.get("feedback_1")).toBe("new");
  });
});

const trelloReference = {
  tracker: "trello",
  cardId: "card_1",
  projectTrelloLinkId: "project_link_1",
} as const;

const trelloLists: TrelloListMapping = {
  newListId: "list_new",
  inProgressListId: "list_in_progress",
  resolvedListId: "list_resolved",
};

const openIn = (listId: string): TrelloCardState => ({
  listId,
  archived: false,
});
const archivedIn = (listId: string): TrelloCardState => ({
  listId,
  archived: true,
});

/** A Tracker with a Project link's list mapping and a scripted re-read. */
function fakeTrelloAdapter(
  observed: TrelloCardState | "missing",
  mapping: TrelloListMapping = trelloLists,
): TrackerAdapter<"trello"> {
  return {
    tracker: "trello",
    readIssue: () =>
      Promise.resolve(observed === "missing" ? observed : { state: observed }),
    isMirroring: (state, status) =>
      isTrelloCardMirroring(state, status, mapping),
    getImpliedStatus: (state) => feedbackStatusFromTrelloCard(state, mapping),
  };
}

function seedTrello({
  status,
  mirroredStatus = status,
  card,
}: {
  status: FeedbackStatus;
  mirroredStatus?: FeedbackStatus | null;
  card: TrelloCardState;
}) {
  const link: InMemoryIssueLink = {
    tracker: "trello",
    id: "link_1",
    feedbackId: "feedback_1",
    mirroredStatus,
    issueState: card,
    reference: trelloReference,
  };
  return inMemoryStatusConvergence({ feedback_1: status }, [link]);
}

describe("applyObservedIssueState on Trello", () => {
  it.each([
    { from: "new", to: openIn("list_in_progress"), status: "in_progress" },
    { from: "in_progress", to: openIn("list_resolved"), status: "resolved" },
    { from: "resolved", to: openIn("list_new"), status: "new" },
    {
      from: "in_progress",
      to: archivedIn("list_in_progress"),
      status: "closed",
    },
  ] as const)(
    "sets the Feedback $status when its card moves to $to.listId",
    async ({ from, to, status }) => {
      const convergence = seedTrello({
        status: from,
        card: openIn(`list_${from}`),
      });

      await applyObservedIssueState(
        { reference: trelloReference },
        fakeTrelloAdapter(to),
        convergence,
      );

      expect(convergence.statuses.get("feedback_1")).toBe(status);
      expect(convergence.links.get("link_1")).toMatchObject({
        mirroredStatus: status,
        issueState: to,
      });
      expect(convergence.events).toEqual([
        {
          feedbackId: "feedback_1",
          newStatus: status,
          origin: "trello",
          actor: "tracker",
        },
      ]);
    },
  );

  it("changes nothing for a card moved to an unmapped list, and records where it is", async () => {
    const convergence = seedTrello({
      status: "in_progress",
      card: openIn("list_in_progress"),
    });

    await applyObservedIssueState(
      { reference: trelloReference },
      fakeTrelloAdapter(openIn("list_qa")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
    expect(convergence.links.get("link_1")).toMatchObject({
      mirroredStatus: "in_progress",
      issueState: openIn("list_qa"),
    });
    expect(convergence.events).toEqual([]);
  });

  it("changes nothing for a card edited in place", async () => {
    const convergence = seedTrello({
      status: "new",
      card: openIn("list_new"),
    });

    await expect(
      applyObservedIssueState(
        { reference: trelloReference },
        fakeTrelloAdapter(openIn("list_new")),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "issue_state_unchanged" });

    expect(convergence.events).toEqual([]);
  });

  it("keeps a resolved Feedback resolved when its card is archived from the resolved list", async () => {
    const convergence = seedTrello({
      status: "resolved",
      card: openIn("list_resolved"),
    });

    await applyObservedIssueState(
      { reference: trelloReference },
      fakeTrelloAdapter(archivedIn("list_resolved")),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.events).toEqual([]);
  });

  it("applies a move to a mapped list after a card stayed put for In progress on a board with no In progress list", async () => {
    const withoutInProgress = { ...trelloLists, inProgressListId: null };
    // Outbound left the card in the new list and recorded the convergence.
    const convergence = seedTrello({
      status: "in_progress",
      card: openIn("list_new"),
    });

    await applyObservedIssueState(
      { reference: trelloReference },
      fakeTrelloAdapter(openIn("list_resolved"), withoutInProgress),
      convergence,
    );

    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
  });

  it("keeps a Status the team just set while its push to Trello is pending", async () => {
    const convergence = seedTrello({
      status: "resolved",
      mirroredStatus: "new",
      card: openIn("list_new"),
    });

    await expect(
      applyObservedIssueState(
        { reference: trelloReference },
        fakeTrelloAdapter(openIn("list_in_progress")),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "issue_link_pending" });

    expect(convergence.statuses.get("feedback_1")).toBe("resolved");
    expect(convergence.events).toEqual([]);
  });

  it("detaches the link of a card that is gone or left the board, and leaves the Feedback alone", async () => {
    const convergence = seedTrello({
      status: "in_progress",
      card: openIn("list_in_progress"),
    });

    await expect(
      applyObservedIssueState(
        { reference: trelloReference },
        fakeTrelloAdapter("missing"),
        convergence,
      ),
    ).resolves.toEqual({ feedbackId: "feedback_1", detached: true });

    expect(convergence.links.has("link_1")).toBe(false);
    expect(convergence.statuses.get("feedback_1")).toBe("in_progress");
    expect(convergence.events).toEqual([]);
  });

  it("finds no link for a card of another Project link", async () => {
    const convergence = seedTrello({ status: "new", card: openIn("list_new") });

    await expect(
      applyObservedIssueState(
        {
          reference: {
            ...trelloReference,
            projectTrelloLinkId: "project_link_2",
          },
        },
        fakeTrelloAdapter(openIn("list_resolved")),
        convergence,
      ),
    ).resolves.toEqual({ skipped: "no_matching_issue_link" });

    expect(convergence.statuses.get("feedback_1")).toBe("new");
  });
});
