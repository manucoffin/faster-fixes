import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { getProject } from "./get-project";

type FakeDb = NonNullable<Parameters<typeof getProject>[1]>;

function fakeDb(
  project: Record<string, unknown> | null,
  membership: { id: string } | null,
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };
const createdAt = new Date("2026-01-01T00:00:00.000Z");
const project = {
  id: "project_1",
  publicId: "pub_1",
  name: "Acme",
  domain: "acme.test",
  apiKeyLastFour: "1234",
  apiKeyHash: "secret-hash",
  organizationId: "org_1",
  createdAt,
  widgetConfig: { enabled: true },
};

describe("getProject", () => {
  it("reports an unknown project as not found", async () => {
    await expect(
      getProject(input, fakeDb(null, { id: "member_1" })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    const db = fakeDb(project, null);

    await expect(getProject(input, db)).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
    // The read is open to any role, unlike the writes of this segment.
    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_1", userId: "user_1" },
    });
  });

  it("returns the project without its API key hash for a member caller", async () => {
    await expect(
      getProject(input, fakeDb(project, { id: "member_1" })),
    ).resolves.toEqual({
      id: "project_1",
      publicId: "pub_1",
      name: "Acme",
      domain: "acme.test",
      apiKeyLastFour: "1234",
      createdAt,
      widgetConfig: { enabled: true },
    });
  });

  it("returns a null widget config when the project has none", async () => {
    const result = await getProject(
      input,
      fakeDb({ ...project, widgetConfig: null }, { id: "member_1" }),
    );

    expect(result.widgetConfig).toBeNull();
  });
});
