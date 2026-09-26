import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { linkLinearTeam } from "./link-linear-team";

type FakeDb = NonNullable<Parameters<typeof linkLinearTeam>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
  installation: { id: string } | null = null,
  upsert = vi.fn().mockResolvedValue({ id: "link_1" }),
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    linearInstallation: {
      findUnique: vi.fn().mockResolvedValue(installation),
    },
    projectLinearLink: { upsert },
  } as unknown as FakeDb;
}

const project = { organizationId: "org_1" };
const member = { id: "member_1" };

const input = {
  projectId: "project_1",
  teamId: "team_1",
  teamKey: "ENG",
  teamName: "Engineering",
  defaultStateId: "state_1",
  defaultLabelIds: ["label_1"],
  defaultPriority: 2 as const,
  autoCreateIssues: true,
  userId: "user_1",
};

describe("linkLinearTeam", () => {
  it("reports an unknown project as not found", async () => {
    await expect(linkLinearTeam(input, fakeDb(null, null))).rejects.toThrow(
      new NotFoundError("Project not found."),
    );
  });

  it("refuses a caller who is not an owner or an admin", async () => {
    await expect(linkLinearTeam(input, fakeDb(project, null))).rejects.toThrow(
      new ForbiddenError("Only owners and admins can link Linear teams."),
    );
  });

  it("reports an organization with no installation as a bad request", async () => {
    await expect(
      linkLinearTeam(input, fakeDb(project, member)),
    ).rejects.toThrow(
      new BadRequestError(
        "No Linear installation found. Connect Linear first.",
      ),
    );
  });

  it("clears a stale health warning when an existing link changes team", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "link_1" });
    const db = fakeDb(project, member, { id: "installation_1" }, upsert);

    await expect(linkLinearTeam(input, db)).resolves.toEqual({ id: "link_1" });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          teamId: "team_1",
          linkHealthIssue: null,
        }),
      }),
    );
  });
});
