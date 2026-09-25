/**
 * Characterization tests: they pin what an installed widget observes today
 * (status, JSON body, headers) on `PUT` and `DELETE /api/v1/feedback/:id`, so
 * the step 5 move to services behind the route boundary can be proven
 * byte-compatible. They assert on responses only, never on how the handler
 * reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update:
 * widgets already installed on customer sites cannot be forced to update.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockRateLimit,
  FEEDBACK_ID,
  feedbackRow,
  PROJECT_ID,
  resetWidgetApiDoubles,
  widgetApiPrisma,
  widgetRequest,
} from "../_helpers/widget-api-test-doubles";

vi.mock("@workspace/db", async () => {
  const { widgetApiPrisma } =
    await import("../_helpers/widget-api-test-doubles");
  return { prisma: widgetApiPrisma };
});

vi.mock("@/server/storage", () => ({ s3Client: {} }));

const { DELETE, PUT } = await import("./route");

const ROUTE_URL = `https://app.test/api/v1/feedback/${FEEDBACK_ID}`;

const UPDATED_AT = new Date("2026-01-02T03:04:05.000Z");

const NEW_COMMENT = "The submit button does nothing on Safari";

const routeParams = { params: Promise.resolve({ id: FEEDBACK_ID }) };

function editRequest(
  body: BodyInit = JSON.stringify({ comment: NEW_COMMENT }),
) {
  return widgetRequest(ROUTE_URL, {
    method: "PUT",
    body,
    headers: { "content-type": "application/json" },
  });
}

function deleteRequest() {
  return widgetRequest(ROUTE_URL, { method: "DELETE" });
}

beforeEach(() => {
  resetWidgetApiDoubles();
  widgetApiPrisma.feedback.update.mockResolvedValue({
    id: FEEDBACK_ID,
    comment: NEW_COMMENT,
    updatedAt: UPDATED_AT,
  });
  widgetApiPrisma.feedback.delete.mockResolvedValue(feedbackRow());
});

describe("PUT /api/v1/feedback/:id", () => {
  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await PUT(editRequest(), routeParams);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(widgetApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  it("refuses a request with no project identifier at all", async () => {
    const request = widgetRequest(ROUTE_URL, {
      method: "PUT",
      apiKey: null,
      body: JSON.stringify({ comment: NEW_COMMENT }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, routeParams);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const request = widgetRequest(ROUTE_URL, {
      method: "PUT",
      origin: "https://evil.test",
      body: JSON.stringify({ comment: NEW_COMMENT }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses an invalid reviewer token", async () => {
    widgetApiPrisma.reviewer.findFirst.mockResolvedValue(null);

    const response = await PUT(editRequest(), routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid reviewer token",
    });
    expect(widgetApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  it("refuses a rate limited editor", async () => {
    blockRateLimit();

    const response = await PUT(editRequest(), routeParams);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Try again later.",
    });
  });

  it("answers not found for a feedback outside the project", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(null);

    const response = await PUT(editRequest(), routeParams);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
    });
    expect(widgetApiPrisma.feedback.findFirst).toHaveBeenCalledWith({
      where: { id: FEEDBACK_ID, projectId: PROJECT_ID },
    });
    expect(widgetApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  // The existence check runs before the body is read, so an unknown feedback
  // with a broken body answers 404 rather than 400.
  it("prefers not found over an unreadable body", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(null);

    const response = await PUT(editRequest("{"), routeParams);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
    });
  });

  it("rejects a body that is not readable as JSON", async () => {
    const response = await PUT(editRequest("{"), routeParams);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body",
    });
    expect(widgetApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  it("rejects a payload that does not match the schema", async () => {
    const response = await PUT(
      editRequest(JSON.stringify({ comment: "   " })),
      routeParams,
    );

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toEqual({
      formErrors: [],
      fieldErrors: { comment: [expect.any(String)] },
    });
    expect(widgetApiPrisma.feedback.update).not.toHaveBeenCalled();
  });

  it("edits the comment and answers with the updated feedback", async () => {
    const response = await PUT(editRequest(), routeParams);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: FEEDBACK_ID,
      comment: NEW_COMMENT,
      updatedAt: UPDATED_AT.toISOString(),
    });
    expect(widgetApiPrisma.feedback.update).toHaveBeenCalledWith({
      where: { id: FEEDBACK_ID },
      data: { comment: NEW_COMMENT },
    });
  });

  // Any active Reviewer of the Project may edit any of its Feedback: the
  // handler scopes the lookup to the Project, not to the submitter.
  it("edits a feedback submitted by another reviewer of the project", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(
      feedbackRow({ reviewerId: "reviewer_2" }),
    );

    const response = await PUT(editRequest(), routeParams);

    expect(response.status).toBe(200);
    expect(widgetApiPrisma.feedback.update).toHaveBeenCalled();
  });

  it("accepts a localhost origin so the widget can be tested before deploy", async () => {
    const request = widgetRequest(ROUTE_URL, {
      method: "PUT",
      origin: "http://localhost:3000",
      body: JSON.stringify({ comment: NEW_COMMENT }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, routeParams);

    expect(response.status).toBe(200);
  });
});

describe("DELETE /api/v1/feedback/:id", () => {
  it("refuses an unknown project identifier", async () => {
    widgetApiPrisma.project.findFirst.mockResolvedValue(null);

    const response = await DELETE(deleteRequest(), routeParams);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(widgetApiPrisma.feedback.delete).not.toHaveBeenCalled();
  });

  it("refuses an origin outside the project's registered domain", async () => {
    const request = widgetRequest(ROUTE_URL, {
      method: "DELETE",
      origin: "https://client.test.evil.test",
    });

    const response = await DELETE(request, routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses a request with no origin and no referer", async () => {
    const request = widgetRequest(ROUTE_URL, {
      method: "DELETE",
      origin: null,
    });

    const response = await DELETE(request, routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin not allowed",
    });
  });

  it("refuses an invalid reviewer token", async () => {
    widgetApiPrisma.reviewer.findFirst.mockResolvedValue(null);

    const response = await DELETE(deleteRequest(), routeParams);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid reviewer token",
    });
    expect(widgetApiPrisma.feedback.delete).not.toHaveBeenCalled();
  });

  it("refuses a rate limited deleter", async () => {
    blockRateLimit();

    const response = await DELETE(deleteRequest(), routeParams);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded. Try again later.",
    });
  });

  it("answers not found for a feedback outside the project", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(null);

    const response = await DELETE(deleteRequest(), routeParams);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Feedback not found",
    });
    expect(widgetApiPrisma.feedback.delete).not.toHaveBeenCalled();
  });

  it("deletes the feedback and answers with an empty no content response", async () => {
    const response = await DELETE(deleteRequest(), routeParams);

    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe("");
    expect(response.headers.get("content-type")).toBeNull();
    expect(widgetApiPrisma.feedback.delete).toHaveBeenCalledWith({
      where: { id: FEEDBACK_ID },
    });
  });

  // Any active Reviewer of the Project may delete any of its Feedback: the
  // handler scopes the lookup to the Project, not to the submitter.
  it("deletes a feedback submitted by another reviewer of the project", async () => {
    widgetApiPrisma.feedback.findFirst.mockResolvedValue(
      feedbackRow({ reviewerId: "reviewer_2" }),
    );

    const response = await DELETE(deleteRequest(), routeParams);

    expect(response.status).toBe(204);
    expect(widgetApiPrisma.feedback.delete).toHaveBeenCalled();
  });
});
