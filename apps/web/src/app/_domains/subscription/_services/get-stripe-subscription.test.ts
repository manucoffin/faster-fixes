import { NotFoundError } from "@/server/errors/domain-errors";
import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

import { getStripeSubscription } from "./get-stripe-subscription";

function stripeStub(retrieve: Stripe["subscriptions"]["retrieve"]) {
  return { subscriptions: { retrieve } } as unknown as Stripe;
}

describe("getStripeSubscription", () => {
  it("reports an identifier Stripe does not know as a not found domain error", async () => {
    const retrieve = vi.fn().mockRejectedValue(
      Object.assign(new Error("No such subscription: 'sub_gone'"), {
        code: "resource_missing",
      }),
    );

    await expect(
      getStripeSubscription(
        { stripeSubscriptionId: "sub_gone" },
        stripeStub(retrieve),
      ),
    ).rejects.toThrow(new NotFoundError("Subscription not found."));
  });

  it("lets an unexpected Stripe failure propagate untranslated", async () => {
    const outage = new Error("Stripe is unreachable");
    const retrieve = vi.fn().mockRejectedValue(outage);

    await expect(
      getStripeSubscription(
        { stripeSubscriptionId: "sub_123" },
        stripeStub(retrieve),
      ),
    ).rejects.toBe(outage);
  });

  it("returns the identifier, the items and the price of the first item", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: "sub_123",
      items: { data: [{ price: { id: "price_monthly" } }] },
    });

    await expect(
      getStripeSubscription(
        { stripeSubscriptionId: "sub_123" },
        stripeStub(retrieve),
      ),
    ).resolves.toEqual({
      id: "sub_123",
      items: [{ price: { id: "price_monthly" } }],
      currentPriceId: "price_monthly",
    });
    expect(retrieve).toHaveBeenCalledWith("sub_123");
  });

  it("returns no current price when the subscription carries no item", async () => {
    const retrieve = vi
      .fn()
      .mockResolvedValue({ id: "sub_empty", items: { data: [] } });

    await expect(
      getStripeSubscription(
        { stripeSubscriptionId: "sub_empty" },
        stripeStub(retrieve),
      ),
    ).resolves.toEqual({
      id: "sub_empty",
      items: [],
      currentPriceId: undefined,
    });
  });
});
