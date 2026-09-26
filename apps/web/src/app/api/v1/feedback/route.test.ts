/**
 * Characterization tests: they pin what an installed widget observes today
 * (status, JSON body, headers) on `POST` and `GET /api/v1/feedback`, so the
 * step 5 move to services behind the route boundary can be proven
 * byte-compatible. They assert on responses only, never on how the handler
 * reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update:
 * widgets already installed on customer sites cannot be forced to update.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALLOWED_ORIGIN,
  blockRateLimit,
  createAssetDouble,
  feedbackFormData,
  getSignedAssetUrlDouble,
  inngestSendDouble,
  PROJECT_ID,
  putObjectDouble,
  resetWidgetApiDoubles,
  REVIEWER_ID,
  REVIEWER_NAME,
  screenshotFile,
  SCREENSHOT_ASSET_ID,
  SIGNED_ASSET_URL,
  STORAGE_BUCKET,
  validFeedbackPayload,
  widgetApiPrisma,
  widgetRequest,
} from "./_helpers/widget-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { widgetApiPrisma } =
    await import("./_helpers/widget-api-test-doubles");
  return { prisma: widgetApiPrisma };
});

vi.mock("@/server/storage", () => ({ s3Client: {} }));

vi.mock("@/server/storage/create-asset", async () => {
  const { createAssetDouble } =
    await import("./_helpers/widget-api-test-doubles");
  return { createAsset: createAssetDouble };
});

vi.mock("@/server/storage/get-signed-asset-url", async () => {
  const { getSignedAssetUrlDouble } =
    await import("./_helpers/widget-api-test-doubles");
  return { getSignedAssetUrl: getSignedAssetUrlDouble };
});

vi.mock("@/server/inngest", async () => {
  const { inngestSendDouble } =
    await import("./_helpers/widget-api-test-doubles");
  return { inngest: { send: inngestSendDouble } };
});

vi.mock("@better-upload/server/helpers", async () => {
  const { putObjectDouble } =
    await import("./_helpers/widget-api-test-doubles");
  return { putObject: putObjectDouble };
});

const { GET, POST } = await import("./route");

const ROUTE_URL = "https://app.test/api/v1/feedback";

const CREATED_AT = new Date("2026-01-02T03:04:05.000Z");

const createdFeedbackRow = {
  id: "feedback_1",
  status: "new",
  comment: validFeedbackPayload.comment,
  pageUrl: validFeedbackPayload.pageUrl,
  clickX: 12,
  clickY: 34,
  selector: "#submit",
  metadata: null,
  reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
  screenshot: null,
  createdAt: CREATED_AT,
};

const listedFeedbackRow = {
  ...createdFeedbackRow,
  screenshot: { key: "shot.png", provider: "r2", bucket: STORAGE_BUCKET },
};

function submitRequest(body: BodyInit, overrides = {}) {
  return widgetRequest(ROUTE_URL, { method: "POST", body, ...overrides });
}

beforeEach(() => {
  resetWidgetApiDoubles();
  vi.stubEnv("NEXT_PUBLIC_IS_CLOUD", "true");
  vi.stubEnv("STORAGE_BUCKET_NAME", STORAGE_BUCKET);
  widgetApiPrisma.feedback.create.mockResolvedValue(createdFeedbackRow);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/v1/feedback", () => {
  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await POST(submitRequest(feedbackFormData()));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(widgetApiPrisma.feedback.create).not.toHaveBeenCalled();
  });

  it("refuses a request with no project identifier at all", async () => {
    const response = await POST(
      submitRequest(feedbackFormData(), { apiKey: null }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const response = await POST(
      submitRequest(feedbackFormData(), { origin: "https://evil.test" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses an invalid reviewer token", async () => {
    widgetApiPrisma.reviewer.findFirst.mockResolvedValue(null);

    const response = await POST(submitRequest(feedbackFormData()));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid reviewer token",
    });
  });

  it("refuses a rate limited submitter", async () => {
    blockRateLimit();

    const response = await POST(submitRequest(feedbackFormData()));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Try again later.",
    });
  });

  it("refuses a submit that would cross the plan's feedback limit", async () => {
    widgetApiPrisma.feedback.count.mockResolvedValue(50);

    const response = await POST(submitRequest(feedbackFormData()));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback limit reached for this organization's plan.",
      code: "RESOURCE_LIMIT_EXCEEDED",
      current: 50,
      limit: 50,
    });
    expect(widgetApiPrisma.feedback.create).not.toHaveBeenCalled();
  });

  it("rejects a body that is not readable as form data", async () => {
    const response = await POST(
      submitRequest("not-a-multipart-body", {
        headers: { "content-type": "multipart/form-data; boundary=broken" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid form data",
    });
  });

  it("rejects a form with no data field", async () => {
    const response = await POST(
      submitRequest(feedbackFormData({ data: null })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing data field",
    });
  });

  it("rejects a data field that is not JSON", async () => {
    const response = await POST(
      submitRequest(feedbackFormData({ rawData: "{" })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON in data field",
    });
  });

  it("rejects a payload that does not match the schema", async () => {
    const response = await POST(
      submitRequest(
        feedbackFormData({ data: { comment: "", pageUrl: "not-a-url" } }),
      ),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Validation failed",
      details: {
        formErrors: [],
        fieldErrors: {
          comment: [expect.any(String)],
          pageUrl: [expect.any(String)],
        },
      },
    });
    expect(widgetApiPrisma.feedback.create).not.toHaveBeenCalled();
  });

  it("rejects a screenshot whose type is not an allowed image", async () => {
    const response = await POST(
      submitRequest(
        feedbackFormData({ screenshot: screenshotFile("application/pdf") }),
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid screenshot type. Allowed: PNG, JPEG, WebP",
    });
    expect(widgetApiPrisma.feedback.create).not.toHaveBeenCalled();
  });

  it("rejects a screenshot above the 5MB limit", async () => {
    const response = await POST(
      submitRequest(
        feedbackFormData({
          screenshot: screenshotFile("image/png", 5 * 1024 * 1024 + 1),
        }),
      ),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "Screenshot exceeds 5MB limit",
    });
  });

  it("creates the feedback and answers with its public shape", async () => {
    const response = await POST(submitRequest(feedbackFormData()));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "feedback_1",
      status: "new",
      comment: validFeedbackPayload.comment,
      pageUrl: validFeedbackPayload.pageUrl,
      clickX: 12,
      clickY: 34,
      selector: "#submit",
      screenshotUrl: null,
      metadata: null,
      reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
      createdAt: CREATED_AT.toISOString(),
    });
    expect(widgetApiPrisma.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: PROJECT_ID,
          reviewerId: REVIEWER_ID,
          comment: validFeedbackPayload.comment,
          pageUrl: validFeedbackPayload.pageUrl,
          screenshotId: undefined,
        }),
      }),
    );
  });

  it("announces the created feedback to the integrations", async () => {
    const response = await POST(submitRequest(feedbackFormData()));

    expect(response.status).toBe(201);
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "feedback/created",
      data: { feedbackId: "feedback_1" },
    });
  });

  it("stores an allowed screenshot and answers with its signed url", async () => {
    widgetApiPrisma.feedback.create.mockResolvedValue(listedFeedbackRow);

    const response = await POST(
      submitRequest(feedbackFormData({ screenshot: screenshotFile() })),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
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
    expect(widgetApiPrisma.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ screenshotId: SCREENSHOT_ASSET_ID }),
      }),
    );
  });

  it("still accepts the feedback when the screenshot upload fails", async () => {
    putObjectDouble.mockRejectedValue(new Error("storage is down"));

    const response = await POST(
      submitRequest(feedbackFormData({ screenshot: screenshotFile() })),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: "feedback_1",
      screenshotUrl: null,
    });
    expect(widgetApiPrisma.feedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ screenshotId: undefined }),
      }),
    );
  });

  it("accepts a localhost origin so the widget can be tested before deploy", async () => {
    const response = await POST(
      submitRequest(feedbackFormData(), { origin: "http://localhost:3000" }),
    );

    expect(response.status).toBe(201);
  });
});

describe("GET /api/v1/feedback", () => {
  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await GET(widgetRequest(ROUTE_URL));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(widgetApiPrisma.feedback.findMany).not.toHaveBeenCalled();
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const response = await GET(
      widgetRequest(ROUTE_URL, { origin: "https://acme.com.evil.test" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses a request with no origin and no referer", async () => {
    const response = await GET(widgetRequest(ROUTE_URL, { origin: null }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses an invalid reviewer token", async () => {
    widgetApiPrisma.reviewer.findFirst.mockResolvedValue(null);

    const response = await GET(widgetRequest(ROUTE_URL));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid reviewer token",
    });
  });

  it("refuses a rate limited reader", async () => {
    blockRateLimit();

    const response = await GET(widgetRequest(ROUTE_URL));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Try again later.",
    });
  });

  it("answers an empty project with an empty list", async () => {
    const response = await GET(widgetRequest(ROUTE_URL));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ feedback: [] });
  });

  it("lists the project's feedback with its signed screenshot url", async () => {
    widgetApiPrisma.feedback.findMany.mockResolvedValue([listedFeedbackRow]);

    const response = await GET(widgetRequest(ROUTE_URL));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      feedback: [
        {
          id: "feedback_1",
          status: "new",
          comment: validFeedbackPayload.comment,
          pageUrl: validFeedbackPayload.pageUrl,
          clickX: 12,
          clickY: 34,
          selector: "#submit",
          screenshotUrl: SIGNED_ASSET_URL,
          metadata: null,
          reviewer: { id: REVIEWER_ID, name: REVIEWER_NAME },
          createdAt: CREATED_AT.toISOString(),
        },
      ],
    });
    expect(getSignedAssetUrlDouble).toHaveBeenCalledWith({
      key: "shot.png",
      provider: "r2",
      bucket: STORAGE_BUCKET,
    });
  });

  it("narrows the list to one page when a url is given", async () => {
    await GET(widgetRequest(`${ROUTE_URL}?url=${ALLOWED_ORIGIN}/checkout`));

    expect(widgetApiPrisma.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId: PROJECT_ID,
          pageUrl: `${ALLOWED_ORIGIN}/checkout`,
        },
      }),
    );
  });
});
