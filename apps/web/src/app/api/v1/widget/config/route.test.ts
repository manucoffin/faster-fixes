/**
 * Characterization tests: they pin what an installed widget observes today
 * (status, JSON body, headers) on `GET /api/v1/widget/config`, so the step 5
 * move to services behind the route boundary can be proven byte-compatible.
 * They assert on responses only, never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update:
 * widgets already installed on customer sites cannot be forced to update.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  ORGANIZATION_ID,
  projectRow,
  resetWidgetApiDoubles,
  subscriptionRow,
  widgetApiPrisma,
  widgetRequest,
} from "../../feedback/_helpers/widget-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { widgetApiPrisma } =
    await import("../../feedback/_helpers/widget-api-test-doubles");
  return { prisma: widgetApiPrisma };
});

const { GET } = await import("./route");

const ROUTE_URL = "https://app.test/api/v1/widget/config";

function configRequest(overrides = {}) {
  return widgetRequest(ROUTE_URL, { method: "GET", ...overrides });
}

beforeEach(() => {
  resetWidgetApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/v1/widget/config", () => {
  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await GET(configRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("refuses a request with no project identifier at all", async () => {
    const response = await GET(configRequest({ apiKey: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(widgetApiPrisma.project.findFirst).not.toHaveBeenCalled();
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const response = await GET(configRequest({ origin: "https://evil.test" }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses a request with no origin and no referer", async () => {
    const response = await GET(configRequest({ origin: null }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses a rate limited reader", async () => {
    blockRateLimit();

    const response = await GET(configRequest());

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Try again later.",
    });
  });

  it("answers enabled with branding for a project on the free plan", async () => {
    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: true,
      branding: true,
    });
    expect(widgetApiPrisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { referenceId: ORGANIZATION_ID } }),
    );
  });

  // The config is public to the page that embeds the widget: it is read before
  // a Reviewer has a token, so no reviewer token is required.
  it("answers without a reviewer token", async () => {
    const response = await GET(configRequest({ reviewerToken: null }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: true,
      branding: true,
    });
    expect(widgetApiPrisma.reviewer.findFirst).not.toHaveBeenCalled();
  });

  it("drops the branding for a project on a white label plan", async () => {
    widgetApiPrisma.subscription.findFirst.mockResolvedValue(subscriptionRow());

    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: true,
      branding: false,
    });
  });

  it("reports the widget as disabled when the project turned it off", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(
      projectRow({ widgetConfig: { enabled: false } }),
    );

    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: false,
      branding: true,
    });
  });

  it("defaults to enabled when the project has no widget config row", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(
      projectRow({ widgetConfig: null }),
    );

    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ enabled: true });
  });

  // Self-hosted instances get the full plan without billing, so the branding is
  // off and no subscription is read.
  it("drops the branding off cloud without reading a subscription", async () => {
    vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "false");

    const response = await GET(configRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      enabled: true,
      branding: false,
    });
    expect(widgetApiPrisma.subscription.findFirst).not.toHaveBeenCalled();
  });

  it("accepts a localhost origin so the widget can be tested before deploy", async () => {
    const response = await GET(
      configRequest({ origin: "http://localhost:3000" }),
    );

    expect(response.status).toBe(200);
  });
});
