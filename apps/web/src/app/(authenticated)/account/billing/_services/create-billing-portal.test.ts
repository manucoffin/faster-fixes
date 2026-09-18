import { ForbiddenError } from "@/server/errors/domain-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFullOrganization = vi.fn();
const createBillingPortalSession = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getFullOrganization,
      createBillingPortal: createBillingPortalSession,
    },
  },
}));

const { createBillingPortal } = await import("./create-billing-portal");

const headers = new Headers();

describe("createBillingPortal", () => {
  beforeEach(() => {
    getFullOrganization.mockReset();
    createBillingPortalSession.mockReset();
  });

  it("refuses a session with no active organization", async () => {
    getFullOrganization.mockResolvedValue(null);

    await expect(createBillingPortal({ headers })).rejects.toThrow(
      new ForbiddenError("You do not have an active organization"),
    );
    expect(createBillingPortalSession).not.toHaveBeenCalled();
  });

  it("opens the portal for the active organization and returns back to billing", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    createBillingPortalSession.mockResolvedValue({
      url: "https://billing.stripe.com/session",
    });

    await expect(createBillingPortal({ headers })).resolves.toEqual({
      url: "https://billing.stripe.com/session",
    });
    expect(createBillingPortalSession).toHaveBeenCalledWith({
      body: {
        referenceId: "org_1",
        returnUrl: `${process.env.BASE_URL || "http://localhost:3000"}/account/billing`,
        customerType: "organization",
      },
      headers,
    });
  });

  it("lets an unexpected portal failure propagate untranslated", async () => {
    getFullOrganization.mockResolvedValue({ id: "org_1" });
    const outage = new Error("stripe is unreachable");
    createBillingPortalSession.mockRejectedValue(outage);

    await expect(createBillingPortal({ headers })).rejects.toBe(outage);
  });
});
