import { describe, expect, it, vi } from "vitest";
import { authorizeBillingReference } from "./authorize-billing-reference";

type FakeDb = NonNullable<Parameters<typeof authorizeBillingReference>[1]>;

function fakeDb(membership: { role: string } | null) {
  return {
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
  } as unknown as FakeDb;
}

const reference = { userId: "user_1", organizationId: "org_1" };

describe("authorizeBillingReference", () => {
  it("refuses every action on an Organization the caller is not a member of", async () => {
    for (const action of ["list-subscription", "billing-portal"]) {
      await expect(
        authorizeBillingReference({ ...reference, action }, fakeDb(null)),
      ).resolves.toBe(false);
    }
  });

  it("looks the membership up for the caller in the given Organization", async () => {
    const db = fakeDb({ role: "owner" });

    await authorizeBillingReference(
      { ...reference, action: "list-subscription" },
      db,
    );

    expect(db.member.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org_1", userId: "user_1" },
      }),
    );
  });

  it("lets any member read the Subscription", async () => {
    await expect(
      authorizeBillingReference(
        { ...reference, action: "list-subscription" },
        fakeDb({ role: "member" }),
      ),
    ).resolves.toBe(true);
  });

  it("keeps the billing portal and subscription changes to the owner", async () => {
    for (const action of [
      "billing-portal",
      "upgrade-subscription",
      "cancel-subscription",
      "restore-subscription",
    ]) {
      await expect(
        authorizeBillingReference(
          { ...reference, action },
          fakeDb({ role: "admin" }),
        ),
      ).resolves.toBe(false);
      await expect(
        authorizeBillingReference(
          { ...reference, action },
          fakeDb({ role: "owner" }),
        ),
      ).resolves.toBe(true);
    }
  });

  it("keeps an action it does not know to the owner", async () => {
    await expect(
      authorizeBillingReference(
        { ...reference, action: "some-future-action" },
        fakeDb({ role: "member" }),
      ),
    ).resolves.toBe(false);
  });
});
