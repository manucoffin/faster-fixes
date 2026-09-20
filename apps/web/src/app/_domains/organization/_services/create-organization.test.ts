import { ForbiddenError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkOrganizationLimitApi = vi.fn();
// The slug service is a sibling, so it is not mocked: it reaches the Prisma
// singleton instead of taking the `db` parameter, and the boundary that drives
// it is the database package. The real slug generation runs here.
const organizationFindFirst = vi.fn();

vi.mock("@/server/auth/subscription", () => ({
  checkOrganizationLimit: checkOrganizationLimitApi,
}));

vi.mock("@workspace/db", () => ({
  prisma: { organization: { findFirst: organizationFindFirst } },
}));

const { createOrganization } = await import("./create-organization");

type FakeDb = NonNullable<Parameters<typeof createOrganization>[1]>;

function fakeDb() {
  return {
    organization: {
      create: vi.fn().mockResolvedValue({
        id: "org_1",
        name: "Acme",
        slug: "acme",
      }),
    },
  } as unknown as FakeDb;
}

const input = { name: "Acme", ownerId: "user_1" };

describe("createOrganization", () => {
  beforeEach(() => {
    checkOrganizationLimitApi.mockReset();
    organizationFindFirst.mockReset().mockResolvedValue(null);
  });

  it("refuses an owner who reached the organization limit of their plan", async () => {
    checkOrganizationLimitApi.mockResolvedValue({
      allowed: false,
      denial: {
        reason: "RESOURCE_LIMIT_EXCEEDED",
        metadata: { resource: "organizations", current: 1, limit: 1 },
      },
    });
    const db = fakeDb();

    await expect(createOrganization(input, db)).rejects.toThrow(
      new ForbiddenError(
        "You've reached the organizations limit for your plan (1/1). Upgrade to get more.",
      ),
    );
    await expect(createOrganization(input, db)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(db.organization.create).not.toHaveBeenCalled();
    expect(organizationFindFirst).not.toHaveBeenCalled();
  });

  it("creates the organization with its owner when the plan allows it", async () => {
    checkOrganizationLimitApi.mockResolvedValue({ allowed: true });
    const db = fakeDb();

    await expect(createOrganization(input, db)).resolves.toEqual({
      id: "org_1",
      name: "Acme",
      slug: "acme",
    });
    expect(checkOrganizationLimitApi).toHaveBeenCalledWith("user_1", db);
    expect(db.organization.create).toHaveBeenCalledWith({
      data: {
        name: "Acme",
        slug: "acme",
        members: { create: [{ userId: "user_1", role: "owner" }] },
      },
    });
  });
});
