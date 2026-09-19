import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";

const decryptToken = vi.fn((payload: string) => `plain:${payload}`);
const getLinearClient = vi.fn((accessToken: string) => ({ accessToken }));

vi.mock("@/app/_domains/integration/_services/linear/token-crypto", () => ({
  decryptToken,
}));
vi.mock("@/app/_domains/integration/_services/linear/linear-client", () => ({
  getLinearClient,
}));

const { getLinearAccess } = await import("./get-linear-access");

type FakeDb = NonNullable<Parameters<typeof getLinearAccess>[1]>;

function fakeDb(
  member: { organizationId: string } | null,
  installation: { accessToken: string } | null = null,
) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(member) },
    linearInstallation: {
      findUnique: vi.fn().mockResolvedValue(installation),
    },
  } as unknown as FakeDb;
}

const input = { userId: "user_1" };

describe("getLinearAccess", () => {
  it("refuses a caller who is not an owner or an admin", async () => {
    await expect(getLinearAccess(input, fakeDb(null))).rejects.toThrow(
      new ForbiddenError("Access denied."),
    );
  });

  it("reports an organization with no installation as a bad request", async () => {
    await expect(
      getLinearAccess(input, fakeDb({ organizationId: "org_1" })),
    ).rejects.toThrow(new BadRequestError("Linear is not connected."));
  });

  it("only accepts an owner or admin membership", async () => {
    const db = fakeDb({ organizationId: "org_1" }, { accessToken: "cipher" });

    await getLinearAccess(input, db);

    expect(db.member.findFirst).toHaveBeenCalledWith({
      where: { userId: "user_1", role: { in: ["owner", "admin"] } },
      select: { organizationId: true },
    });
  });

  it("returns a client built from the decrypted installation token", async () => {
    const db = fakeDb({ organizationId: "org_1" }, { accessToken: "cipher" });

    await expect(getLinearAccess(input, db)).resolves.toEqual({
      organizationId: "org_1",
      client: { accessToken: "plain:cipher" },
    });
  });
});
