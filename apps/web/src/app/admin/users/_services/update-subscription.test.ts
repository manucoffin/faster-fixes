import { NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import {
  SubscriptionPlanName,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";

const { updateSubscription } = await import("./update-subscription");

const input: Parameters<typeof updateSubscription>[0] = {
  id: "sub_1",
  organizationId: "org_1",
  plan: SubscriptionPlanName.Pro,
  status: SubscriptionStatus.Active,
};

function fakeDb(subscription: { id: string } | null) {
  return {
    subscription: {
      findUnique: vi.fn().mockResolvedValue(subscription),
      update: vi.fn().mockResolvedValue({ id: "sub_1", plan: "Pro" }),
    },
  } as unknown as NonNullable<Parameters<typeof updateSubscription>[1]>;
}

describe("updateSubscription", () => {
  it("reports an unknown Subscription as a not found domain error", async () => {
    await expect(updateSubscription(input, fakeDb(null))).rejects.toThrow(
      new NotFoundError("Subscription not found"),
    );
  });

  it("returns the updated Subscription", async () => {
    await expect(
      updateSubscription(input, fakeDb({ id: "sub_1" })),
    ).resolves.toEqual({ id: "sub_1", plan: "Pro" });
  });
});
