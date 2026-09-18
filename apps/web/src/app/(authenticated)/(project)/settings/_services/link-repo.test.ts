import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { linkRepo } from "./link-repo";

type FakeDb = NonNullable<Parameters<typeof linkRepo>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
  installation: { id: string } | null = null,
  upsert = vi.fn().mockResolvedValue({ id: "link_1" }),
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    gitHubInstallation: { findFirst: vi.fn().mockResolvedValue(installation) },
    projectGitHubLink: { upsert },
  } as unknown as FakeDb;
}

const project = { organizationId: "org_1" };
const member = { id: "member_1" };

const input = {
  projectId: "project_1",
  repoId: 42,
  repoOwner: "acme",
  repoName: "widget",
  repoFullName: "acme/widget",
  autoCreateIssues: true,
  defaultLabels: ["faster-fixes"],
  userId: "user_1",
};

describe("linkRepo", () => {
  it("reports an unknown project as not found", async () => {
    await expect(linkRepo(input, fakeDb(null, null))).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });

  it("refuses a caller who is not an owner or an admin", async () => {
    await expect(linkRepo(input, fakeDb(project, null))).rejects.toThrow(
      new ForbiddenError("Only owners and admins can link repositories."),
    );
  });

  it("refuses an organization with no GitHub installation", async () => {
    await expect(linkRepo(input, fakeDb(project, member))).rejects.toThrow(
      new BadRequestError(
        "No GitHub installation found. Connect GitHub first.",
      ),
    );
  });

  it("upserts the link against the organization's installation", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "link_1" });
    const db = fakeDb(project, member, { id: "installation_1" }, upsert);

    await expect(linkRepo(input, db)).resolves.toEqual({ id: "link_1" });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: "project_1" },
        create: expect.objectContaining({
          gitHubInstallationId: "installation_1",
          repoFullName: "acme/widget",
        }),
      }),
    );
  });
});
