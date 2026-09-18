import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { createGitHubIssueForFeedback } from "./create-github-issue-for-feedback";

const send = vi.fn().mockResolvedValue(undefined);

vi.mock("@/server/inngest", () => ({
  inngest: { send: (...args: unknown[]) => send(...args) },
}));

type FakeDb = NonNullable<Parameters<typeof createGitHubIssueForFeedback>[1]>;

type FakeFeedback = {
  project: { organizationId: string; gitHubLink: { id: string } | null };
  issueLink: { id: string } | null;
};

function fakeDb(
  feedback: FakeFeedback | null,
  membership: { id: string } | null,
) {
  return {
    feedback: { findUnique: vi.fn().mockResolvedValue(feedback) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

const linked: FakeFeedback = {
  project: { organizationId: "org_1", gitHubLink: { id: "link_1" } },
  issueLink: null,
};

const member = { id: "member_1" };
const input = { feedbackId: "feedback_1", userId: "user_1" };

describe("createGitHubIssueForFeedback", () => {
  it("reports an unknown feedback as not found", async () => {
    await expect(
      createGitHubIssueForFeedback(input, fakeDb(null, null)),
    ).rejects.toThrow(new NotFoundError("Feedback not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(
      createGitHubIssueForFeedback(input, fakeDb(linked, null)),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("refuses a feedback that already has a GitHub issue", async () => {
    const db = fakeDb({ ...linked, issueLink: { id: "issue_1" } }, member);

    await expect(createGitHubIssueForFeedback(input, db)).rejects.toThrow(
      new ConflictError("A GitHub issue already exists for this feedback."),
    );
  });

  it("refuses a project with no linked repository", async () => {
    const db = fakeDb(
      { ...linked, project: { organizationId: "org_1", gitHubLink: null } },
      member,
    );

    await expect(createGitHubIssueForFeedback(input, db)).rejects.toThrow(
      new BadRequestError("No GitHub repository linked to this project."),
    );
  });

  it("queues the issue creation for a member caller", async () => {
    send.mockClear();

    await expect(
      createGitHubIssueForFeedback(input, fakeDb(linked, member)),
    ).resolves.toEqual({ queued: true });
    expect(send).toHaveBeenCalledWith({
      name: "feedback/integration-issue-requested",
      data: { feedbackId: "feedback_1", target: "github" },
    });
  });
});
