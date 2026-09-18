import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { getJiraAccess } from "./get-jira-access";

type FakeDb = NonNullable<Parameters<typeof getJiraAccess>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
  installation: {
    id: string;
    cloudId: string;
    siteUrl: string;
    healthState: string;
  } | null = null,
  memberFindFirst = vi.fn().mockResolvedValue(membership),
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: memberFindFirst },
    jiraInstallation: { findUnique: vi.fn().mockResolvedValue(installation) },
  } as unknown as FakeDb;
}

const project = { organizationId: "org_1" };
const member = { id: "member_1" };
const installation = {
  id: "installation_1",
  cloudId: "cloud_1",
  siteUrl: "https://acme.atlassian.net",
  healthState: "healthy",
};

const args = { userId: "user_1", projectId: "project_1", requireAdmin: false };

describe("getJiraAccess", () => {
  it("reports an unknown project as not found", async () => {
    await expect(getJiraAccess(args, fakeDb(null, null))).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(getJiraAccess(args, fakeDb(project, null))).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
  });

  it("refuses a non-privileged caller with the write wording when admin is required", async () => {
    await expect(
      getJiraAccess(
        {
          ...args,
          requireAdmin: true,
          adminDeniedMessage: "Only owners and admins can link Jira projects.",
        },
        fakeDb(project, null),
      ),
    ).rejects.toThrow(
      new ForbiddenError("Only owners and admins can link Jira projects."),
    );
  });

  it("requires the owner or admin role only when asked", async () => {
    const memberFindFirst = vi.fn().mockResolvedValue(member);
    await getJiraAccess(
      { ...args, requireAdmin: true },
      fakeDb(project, member, installation, memberFindFirst),
    );

    expect(memberFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        userId: "user_1",
        role: { in: ["owner", "admin"] },
      },
    });
  });

  it("refuses an organization with no Jira installation", async () => {
    await expect(getJiraAccess(args, fakeDb(project, member))).rejects.toThrow(
      new BadRequestError("Jira is not connected. Connect a Jira site first."),
    );
  });

  it("refuses an installation that needs re-authorization", async () => {
    const db = fakeDb(project, member, {
      ...installation,
      healthState: "reconnect_required",
    });

    await expect(getJiraAccess(args, db)).rejects.toThrow(
      new BadRequestError("The Jira connection needs to be re-authorized."),
    );
  });

  it("returns the project's organization and its installation", async () => {
    await expect(
      getJiraAccess(args, fakeDb(project, member, installation)),
    ).resolves.toEqual({ organizationId: "org_1", installation });
  });
});
