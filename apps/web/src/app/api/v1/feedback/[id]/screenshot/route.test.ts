/**
 * Characterization tests: they pin what an installed widget observes today
 * (status, JSON body, headers) on `PUT /api/v1/feedback/:id/screenshot`, so the
 * step 5 move to services behind the route boundary can be proven
 * byte-compatible. They assert on responses only, never on how the handler
 * reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update:
 * widgets already installed on customer sites cannot be forced to update.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  createAssetDouble,
  FEEDBACK_ID,
  feedbackRow,
  getSignedAssetUrlDouble,
  PROJECT_ID,
  putObjectDouble,
  resetWidgetApiDoubles,
  SCREENSHOT_ASSET_ID,
  screenshotFile,
  SIGNED_ASSET_URL,
  STORAGE_BUCKET,
  widgetApiPrisma,
  widgetRequest,
} from "../../_helpers/widget-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { widgetApiPrisma } =
    await import("../../_helpers/widget-api-test-doubles");
  return { prisma: widgetApiPrisma };
});

vi.mock("@/server/storage", () => ({ s3Client: {} }));

vi.mock("@/server/storage/create-asset", async () => {
  const { createAssetDouble } =
    await import("../../_helpers/widget-api-test-doubles");
  return { createAsset: createAssetDouble };
});

vi.mock("@/server/storage/get-signed-asset-url", async () => {
  const { getSignedAssetUrlDouble } =
    await import("../../_helpers/widget-api-test-doubles");
  return { getSignedAssetUrl: getSignedAssetUrlDouble };
});

vi.mock("@better-upload/server/helpers", async () => {
  const { putObjectDouble } =
    await import("../../_helpers/widget-api-test-doubles");
  return { putObject: putObjectDouble };
});

const { PUT } = await import("./route");

const ROUTE_URL = `https://app.test/api/v1/feedback/${FEEDBACK_ID}/screenshot`;

const routeParams = { params: Promise.resolve({ id: FEEDBACK_ID }) };

const storedScreenshot = {
  key: "shot.png",
  provider: "r2",
  bucket: STORAGE_BUCKET,
};

function screenshotForm(file = screenshotFile()) {
  const formData = new FormData();
  formData.set("screenshot", file);
  return formData;
}

function attachRequest(body: BodyInit = screenshotForm(), overrides = {}) {
  return widgetRequest(ROUTE_URL, { method: "PUT", body, ...overrides });
}

beforeEach(() => {
  resetWidgetApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  vi.stubEnv("STORAGE_BUCKET_NAME", STORAGE_BUCKET);
  widgetApiPrisma.feedback.update.mockResolvedValue({
    id: FEEDBACK_ID,
    screenshotId: SCREENSHOT_ASSET_ID,
    screenshot: storedScreenshot,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("PUT /api/v1/feedback/:id/screenshot", () => {
  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses a request with no project identifier at all", async () => {
    const response = await PUT(
      attachRequest(screenshotForm(), { apiKey: null }),
      routeParams,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const response = await PUT(
      attachRequest(screenshotForm(), { origin: "https://evil.test" }),
      routeParams,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses a request with no origin and no referer", async () => {
    const response = await PUT(
      attachRequest(screenshotForm(), { origin: null }),
      routeParams,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses an invalid reviewer token", async () => {
    widgetApiPrisma.reviewer.findFirst.mockResolvedValue(null);

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid reviewer token",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses a rate limited uploader", async () => {
    blockRateLimit();

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Try again later.",
    });
  });

  it("answers not found for a feedback outside the project", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(null);

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
    });
    expect(widgetApiPrisma.feedback.findFirst).toHaveBeenCalledWith({
      where: { id: FEEDBACK_ID, projectId: PROJECT_ID },
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("refuses to overwrite a screenshot that is already attached", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(
      feedbackRow({ screenshotId: "asset_already_there" }),
    );

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Screenshot already attached",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
    expect(widgetApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  // The existence and conflict checks both run before the body is read, so a
  // request that is wrong on two counts answers on the earlier one.
  it("prefers not found over an unreadable body", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(null);

    const response = await PUT(
      attachRequest("not-a-multipart-body", {
        headers: { "content-type": "multipart/form-data; boundary=broken" },
      }),
      routeParams,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
    });
  });

  it("rejects a body that is not readable as form data", async () => {
    const response = await PUT(
      attachRequest("not-a-multipart-body", {
        headers: { "content-type": "multipart/form-data; boundary=broken" },
      }),
      routeParams,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid form data",
    });
  });

  it("rejects a form with no screenshot field", async () => {
    const response = await PUT(attachRequest(new FormData()), routeParams);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing screenshot file",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("rejects a screenshot field that is not a file", async () => {
    const formData = new FormData();
    formData.set("screenshot", "https://client.test/shot.png");

    const response = await PUT(attachRequest(formData), routeParams);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing screenshot file",
    });
  });

  it("rejects a screenshot whose type is not an allowed image", async () => {
    const response = await PUT(
      attachRequest(screenshotForm(screenshotFile("application/pdf"))),
      routeParams,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid screenshot type. Allowed: PNG, JPEG, WebP",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("rejects a screenshot above the 5MB limit", async () => {
    const response = await PUT(
      attachRequest(
        screenshotForm(screenshotFile("image/png", 5 * 1024 * 1024 + 1)),
      ),
      routeParams,
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "Screenshot exceeds 5MB limit",
    });
    expect(putObjectDouble).not.toHaveBeenCalled();
  });

  it("stores the screenshot and answers with its signed url", async () => {
    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      screenshotUrl: SIGNED_ASSET_URL,
    });
    expect(putObjectDouble).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        bucket: STORAGE_BUCKET,
        contentType: "image/png",
      }),
    );
    expect(createAssetDouble).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: STORAGE_BUCKET,
        provider: "r2",
        filename: "screenshot.png",
        mimeType: "image/png",
        size: 8,
      }),
    );
    expect(widgetApiPrisma.feedback.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FEEDBACK_ID },
        data: { screenshotId: SCREENSHOT_ASSET_ID },
      }),
    );
    expect(getSignedAssetUrlDouble).toHaveBeenCalledWith(storedScreenshot);
  });

  it("names the stored object after the screenshot's image type", async () => {
    await PUT(
      attachRequest(screenshotForm(screenshotFile("image/webp"))),
      routeParams,
    );

    expect(putObjectDouble).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        key: expect.stringMatching(
          new RegExp(`^feedback-screenshots/${PROJECT_ID}/.+\\.webp$`),
        ),
        contentType: "image/webp",
      }),
    );
    expect(createAssetDouble).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "screenshot.webp",
        mimeType: "image/webp",
      }),
    );
  });

  // The signed url is read from the row the update returns, so a feedback that
  // comes back without its asset answers with a null url rather than failing.
  it("answers with a null url when the updated feedback carries no asset", async () => {
    widgetApiPrisma.feedback.update.mockResolvedValue({
      id: FEEDBACK_ID,
      screenshotId: SCREENSHOT_ASSET_ID,
      screenshot: null,
    });

    const response = await PUT(attachRequest(), routeParams);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ screenshotUrl: null });
    expect(getSignedAssetUrlDouble).not.toHaveBeenCalled();
  });

  it("accepts a localhost origin so the widget can be tested before deploy", async () => {
    const response = await PUT(
      attachRequest(screenshotForm(), { origin: "http://localhost:3000" }),
      routeParams,
    );

    expect(response.status).toBe(200);
  });
});
