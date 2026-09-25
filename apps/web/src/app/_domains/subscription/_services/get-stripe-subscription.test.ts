import { NotFoundError } from "@/server/errors/domain-errors";
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFullOrganization = vi.fn();
const listActiveSubscriptions = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: { api: { getFullOrganization, listActiveSubscriptions } },
}));

const { getStripeSubscription } = await import("./get-stripe-subscription");

const headers = new Headers();

function stripeStub(retrieve: Stripe["subscriptions"]["retrieve"]) {
  return { subscriptions: { retrieve } } as unknown as Stripe;
}

function givenActiveSubscription(stripeSubscriptionId: string) {
  getFullOrganization.mockResolvedValue({ id: "org_1" });
  listActiveSubscriptions.mockResolvedValue([
    { status: "active", stripeSubscriptionId },
  ]);
}

describe("getStripeSubscription", () => {
  beforeEach(() => {
    getFullOrganization.mockReset();
    listActiveSubscriptions.mockReset();
  });

  it("reads the Subscription of the caller's active Organization", async () => {
    givenActiveSubscription("sub_123");
    const retrieve = vi.fn().mockResolvedValue({
      id: "sub_123",
      items: { data: [] },
    });

    await getStripeSubscription({ headers }, stripeStub(retrieve));

    expect(listActiveSubscriptions).toHaveBeenCalledWith({
      query: { referenceId: "org_1" },
      headers,
    });
    expect(retrieve).toHaveBeenCalledWith("sub_123");
  });

  it("returns nothing without asking Stripe when there is no active Organization", async () => {
    getFullOrganization.mockResolvedValue(null);
    const retrieve = vi.fn();

    await expect(
      getStripeSubscription({ headers }, stripeStub(retrieve)),
    ).resolves.toBeNull();
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("returns nothing without asking Stripe when the Organization has no Subscription", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    listActiveSubscriptions.mockResolvedValue([]);
    const retrieve = vi.fn();

    await expect(
      getStripeSubscription({ headers }, stripeStub(retrieve)),
    ).resolves.toBeNull();
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("reports an identifier Stripe does not know as a not found domain error", async () => {
    givenActiveSubscription("sub_gone");
    const retrieve = vi.fn().mockRejectedValue(
      Object.assign(new Error("No such subscription: 'sub_gone'"), {
        code: "resource_missing",
      }),
    );

    await expect(
      getStripeSubscription({ headers }, stripeStub(retrieve)),
    ).rejects.toThrow(new NotFoundError("Subscription not found."));
  });

  it("lets an unexpected Stripe failure propagate untranslated", async () => {
    givenActiveSubscription("sub_123");
    const outage = new Error("Stripe is unreachable");
    const retrieve = vi.fn().mockRejectedValue(outage);

    await expect(
      getStripeSubscription({ headers }, stripeStub(retrieve)),
    ).rejects.toBe(outage);
  });

  it("returns the identifier, the items and the price of the first item", async () => {
    givenActiveSubscription("sub_123");
    const retrieve = vi.fn().mockResolvedValue({
      id: "sub_123",
      items: { data: [{ price: { id: "price_monthly" } }] },
    });

    await expect(
      getStripeSubscription({ headers }, stripeStub(retrieve)),
    ).resolves.toEqual({
      id: "sub_123",
      items: [{ price: { id: "price_monthly" } }],
      currentPriceId: "price_monthly",
    });
  });

  it("returns no current price when the subscription carries no item", async () => {
    givenActiveSubscription("sub_empty");
    const retrieve = vi
      .fn()
      .mockResolvedValue({ id: "sub_empty", items: { data: [] } });

    await expect(
      getStripeSubscription({ headers }, stripeStub(retrieve)),
    ).resolves.toEqual({
      id: "sub_empty",
      items: [],
      currentPriceId: undefined,
    });
  });
});
