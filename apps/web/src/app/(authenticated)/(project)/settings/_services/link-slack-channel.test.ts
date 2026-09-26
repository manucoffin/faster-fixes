import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { linkSlackChannel } from "./link-slack-channel";

type FakeDb = NonNullable<Parameters<typeof linkSlackChannel>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
  installation: { id: string } | null = null,
  upsert = vi.fn().mockResolvedValue({ id: "link_1" }),
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    slackInstallation: { findUnique: vi.fn().mockResolvedValue(installation) },
    projectSlackLink: { upsert },
  } as unknown as FakeDb;
}

const project = { organizationId: "org_1" };
const member = { id: "member_1" };

const input = {
  projectId: "project_1",
  channelId: "C123",
  channelName: "feedback",
  userId: "user_1",
};

describe("linkSlackChannel", () => {
  it("reports an unknown project as not found", async () => {
    await expect(linkSlackChannel(input, fakeDb(null, null))).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });

  it("refuses a caller who is not an owner or an admin", async () => {
    await expect(
      linkSlackChannel(input, fakeDb(project, null)),
    ).rejects.toThrow(
      new ForbiddenError("Only owners and admins can set the Slack channel."),
    );
  });

  it("reports an organization with no connected workspace as not found", async () => {
    await expect(
      linkSlackChannel(input, fakeDb(project, member)),
    ).rejects.toThrow(new NotFoundError("No Slack workspace connected."));
  });

  it("clears a stale health failure when the channel changes", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "link_1" });
    const db = fakeDb(project, member, { id: "installation_1" }, upsert);

    await expect(linkSlackChannel(input, db)).resolves.toEqual({
      success: true,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          channelId: "C123",
          channelName: "feedback",
          linkHealthy: true,
          healthIssue: null,
        },
      }),
    );
  });
});
